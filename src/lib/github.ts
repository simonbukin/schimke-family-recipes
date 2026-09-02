/**
 * Writes recipes back to the GitHub repository.
 *
 * Vercel's filesystem is read-only and content collections are built at build
 * time, so the only durable write path is a commit -- which then triggers a
 * redeploy. Git doubles as the edit history and the undo button.
 */

import { GITHUB_BRANCH, GITHUB_REPO, GITHUB_TOKEN } from "astro:env/server";

const API = "https://api.github.com";
const RECIPE_DIR = "src/content/recipes";

interface RepoConfig {
  repo: string; // "owner/name"
  token: string;
  branch: string;
}

export function getRepoConfig(): RepoConfig {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured, so recipes cannot be saved");
  }
  return { repo: GITHUB_REPO, token: GITHUB_TOKEN, branch: GITHUB_BRANCH };
}

async function request(
  config: RepoConfig,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${API}/repos/${config.repo}/${path}`, {
    ...init,
    // A hung GitHub request would otherwise become a function timeout, which
    // the UI can't turn into a useful message.
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

function contentPath(slug: string): string {
  return `contents/${RECIPE_DIR}/${slug}.md`;
}

/**
 * The blob SHA of an existing recipe, or null if it doesn't exist yet.
 *
 * This is the version token for optimistic concurrency: it is read when the
 * editor opens a recipe and sent back on save, so GitHub rejects the write if
 * anyone committed in between. Reading it at save time instead would defeat
 * the purpose -- it would just pick up the other person's commit and overwrite it.
 */
export async function getRecipeSha(
  config: RepoConfig,
  slug: string
): Promise<string | null> {
  const response = await request(
    config,
    `${contentPath(slug)}?ref=${encodeURIComponent(config.branch)}`
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub read failed (${response.status})`);
  }
  const body = (await response.json()) as { sha: string };
  return body.sha;
}

/** UTF-8 safe base64, which `btoa` alone is not. */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function commitRecipe(options: {
  slug: string;
  contents: string;
  message: string;
  editor: string;
  sha?: string | null;
}): Promise<void> {
  const config = getRepoConfig();
  const response = await request(config, contentPath(options.slug), {
    method: "PUT",
    body: JSON.stringify({
      message: options.message,
      content: toBase64(options.contents),
      branch: config.branch,
      sha: options.sha ?? undefined,
      committer: {
        name: options.editor,
        email: `${options.editor}@users.noreply.github.com`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await describeFailure(response));
  }
}

export async function deleteRecipe(options: {
  slug: string;
  sha: string;
  message: string;
  editor: string;
}): Promise<void> {
  const config = getRepoConfig();
  const response = await request(config, contentPath(options.slug), {
    method: "DELETE",
    body: JSON.stringify({
      message: options.message,
      sha: options.sha,
      branch: config.branch,
      committer: {
        name: options.editor,
        email: `${options.editor}@users.noreply.github.com`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await describeFailure(response));
  }
}

async function describeFailure(response: Response): Promise<string> {
  // 409 (and 422 on a stale sha) mean someone else committed first.
  if (response.status === 409 || response.status === 422) {
    return "This recipe changed on the server. Reload the page and try again.";
  }
  if (response.status === 401 || response.status === 403) {
    return "GitHub rejected the token. It may have expired.";
  }
  // The raw body can carry request detail, so log it rather than returning it.
  console.error("GitHub write failed", response.status, await response.text());
  return `Saving failed (${response.status}). Please try again.`;
}
