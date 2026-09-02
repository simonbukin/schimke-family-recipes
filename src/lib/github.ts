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

function headers(config: RepoConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export interface GitIdentity {
  name: string;
  email: string;
}

/**
 * Build the identity from a GitHub user payload.
 *
 * The address must be the modern "<id>+<login>@users.noreply.github.com" form.
 * The legacy "<login>@users.noreply.github.com" form resolves to whoever owns
 * that username today, which is how a login label like "simon" ends up
 * crediting a stranger.
 */
export function identityFromUser(user: {
  id: number;
  login: string;
  name?: string | null;
}): GitIdentity {
  return {
    name: user.name || user.login,
    email: `${user.id}+${user.login}@users.noreply.github.com`,
  };
}

const identityCache = new Map<string, GitIdentity | null>();

/**
 * Resolve an editor's GitHub username to the identity GitHub links commits by.
 *
 * This must never be guessed. Constructing "<name>@users.noreply.github.com"
 * from the login looks right and is not: that is the *legacy* noreply form, and
 * it belongs to whoever actually owns that username. Attributing family recipe
 * edits to an unrelated stranger's GitHub account is the failure mode.
 *
 * An unresolvable username yields null, and the caller omits the author so the
 * commit falls back to the token's owner -- a real identity either way.
 */
export async function resolveEditorIdentity(
  login: string
): Promise<GitIdentity | null> {
  const cached = identityCache.get(login);
  if (cached !== undefined) return cached;

  let identity: GitIdentity | null = null;
  try {
    const config = getRepoConfig();
    const response = await fetch(`${API}/users/${encodeURIComponent(login)}`, {
      headers: headers(config),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const user = (await response.json()) as {
        id: number;
        login: string;
        name: string | null;
      };
      identity = identityFromUser(user);
    } else {
      console.error(
        `EDITORS name "${login}" is not a GitHub username (${response.status}).`,
        "Commits will be attributed to the token owner."
      );
    }
  } catch (error) {
    console.error(`Could not resolve GitHub identity for "${login}"`, error);
  }

  identityCache.set(login, identity);
  return identity;
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
    headers: { ...headers(config), ...init.headers },
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
  const identity = await resolveEditorIdentity(options.editor);
  const response = await request(config, contentPath(options.slug), {
    method: "PUT",
    body: JSON.stringify({
      message: options.message,
      content: toBase64(options.contents),
      branch: config.branch,
      sha: options.sha ?? undefined,
      author: identity ?? undefined,
      committer: identity ?? undefined,
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
  const identity = await resolveEditorIdentity(options.editor);
  const response = await request(config, contentPath(options.slug), {
    method: "DELETE",
    body: JSON.stringify({
      message: options.message,
      sha: options.sha,
      branch: config.branch,
      author: identity ?? undefined,
      committer: identity ?? undefined,
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
