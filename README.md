# Schimke Family Recipes

A recipe website built with Astro and Svelte.

Recipes live as Markdown files in `src/content/recipes/`, one per recipe, with
all the structure in the frontmatter. They can be edited by hand in an editor or
through the built-in `/admin` editor, which commits back to this repo.

## Editing on the web

Sign in at `/login`, then use `/admin` to add, edit and delete recipes. Saving
commits to `main` via the GitHub API, which triggers a Vercel redeploy — changes
go live about a minute later. Every edit is an ordinary commit, so `git revert`
is the undo button.

## Configuration

Four environment variables, set in the Vercel project settings (and in a local
`.env` for development):

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Signs the editor session cookie. Any long random string — `openssl rand -base64 32`. Changing it signs everyone out. |
| `EDITORS` | Who may edit, as `name:password` pairs: `simon:xxx,kayla:yyy`. The name becomes the commit author. |
| `GITHUB_TOKEN` | A [fine-grained personal access token](https://github.com/settings/personal-access-tokens) scoped to **this repository only**, with **Contents: Read and write**. Nothing else. |
| `GITHUB_REPO` | Defaults to `simonbukin/schimke-family-recipes`. |

Without `AUTH_SECRET` and `EDITORS`, `/admin` is simply inaccessible — the safe
default. Without `GITHUB_TOKEN`, the editor loads but saving reports that it
isn't configured.

## Development

```sh
npm install
npm run dev     # http://localhost:4321
npm test        # vitest
npm run build   # astro check && astro build
```

`scripts/migrate-to-structured.mjs` converted the original prose-style recipe
bodies to structured frontmatter. It is kept for reference; it has already run.
