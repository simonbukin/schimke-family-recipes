# Getting this live with auth

Four steps, about ten minutes. Do them in order.

## 1. Make a secret for signing sessions

```sh
openssl rand -base64 32
```

Copy the output. This is your `AUTH_SECRET`. It signs the login cookie — it is
not a password anyone types. Changing it later signs everyone out, which is the
emergency "log out all devices" button.

## 2. Make a GitHub token

The site saves recipes by committing to this repo, so it needs write access to
it — and to nothing else.

1. Go to <https://github.com/settings/personal-access-tokens> → **Generate new token**.
2. **Resource owner:** your account. **Repository access:** *Only select
   repositories* → `schimke-family-recipes`.
3. **Permissions** → *Repository permissions* → **Contents: Read and write**.
   Leave every other permission at *No access*.
4. **Expiration:** pick a date you'll accept. When it expires, saving stops
   working and you generate a new one — nothing else breaks, and the site keeps
   serving recipes normally.
5. Generate, then copy the token. GitHub shows it once.

## 3. Put the four values in Vercel

Vercel dashboard → your project → **Settings** → **Environment Variables**. Add
each one to **Production, Preview, and Development**:

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | the string from step 1 |
| `EDITORS` | `simon:PICK-A-PASSWORD,kayla:PICK-ANOTHER` |
| `GITHUB_TOKEN` | the token from step 2 |
| `GITHUB_REPO` | `simonbukin/schimke-family-recipes` |

`EDITORS` is a comma-separated list of `name:password`. The name shows up as the
commit author, so you can tell in `git log` who changed what. Passwords may
contain colons; the name is everything before the *first* colon. Avoid commas in
passwords, since commas separate the entries.

## 4. Deploy

```sh
git push
```

Vercel builds and deploys. Then:

1. Open the site, click **Sign in to edit** in the header.
2. Enter your password from `EDITORS`.
3. You land on `/admin`.

On your phone, use **Share → Add to Home Screen** — it opens standalone, and the
login cookie lasts a year, so you sign in once per device.

## How saving works

Saving commits the recipe to `main`, which triggers a Vercel deploy. The live
site updates roughly a minute later — the confirmation screen says so, so nobody
sits there refreshing. Every edit is a normal commit, so `git revert` undoes
anything, and `git log` shows who did it.

If you and Kayla edit the same recipe at the same time, the second save is
rejected with "This recipe changed on the server" rather than overwriting.

## Local development

```sh
npm install
npm run dev
```

There's a `.env` with throwaway credentials (password `localpass`). It is
gitignored. Saving locally will not work unless you also put a real
`GITHUB_TOKEN` in it — and note that it commits to the **real repo**, so
generally don't.

## If something goes wrong

**"Sign-in is not configured on this deployment."** — `AUTH_SECRET` or `EDITORS`
is missing in Vercel. Add it and redeploy; env var changes need a new deploy to
take effect.

**`/login` accepts nothing.** — Check `EDITORS` is formatted `name:password`
with no spaces around the colon.

**Saving says "GITHUB_TOKEN is not configured".** — Missing or expired token.
Regenerate it at step 2.

**Saving works but the site doesn't change.** — Check the Vercel deployments tab.
A failed build leaves the previous version live. The commit still landed, so
nothing is lost.

**You want to remove one person's access.** — Delete their entry from `EDITORS`
and redeploy. Their existing session stops working immediately; membership is
re-checked on every request, not just at login.

**You want to lock everyone out right now.** — Change `AUTH_SECRET` in Vercel and
redeploy. Every existing session becomes invalid immediately.

## One thing to know about hand-editing

The editor writes the whole recipe file from the form. Anything not in the form
&mdash; markdown text below the frontmatter, or a frontmatter key the site
doesn't know about &mdash; is dropped the next time that recipe is saved from the
web. Hand-edit freely; just don't expect extra fields to survive a web save.
