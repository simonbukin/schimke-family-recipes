import { defineMiddleware } from "astro:middleware";
import { AUTH_SECRET, EDITORS } from "astro:env/server";
import { parseEditors, sessionCookie, verifySessionToken } from "./lib/auth";

/**
 * Resolve the signed-in editor for every request, and gate /admin behind it.
 * Public recipe pages stay public.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get(sessionCookie.name)?.value;

  const editor =
    (AUTH_SECRET && (await verifySessionToken(token, AUTH_SECRET))) || null;

  // Re-check membership on every request. A signed cookie stays valid for a
  // year, so without this, removing someone from EDITORS or changing their
  // password would not actually revoke their access.
  context.locals.editor =
    editor && parseEditors(EDITORS).has(editor) ? editor : undefined;

  const isAdminRoute = context.url.pathname.startsWith("/admin");
  if (isAdminRoute && !context.locals.editor) {
    const destination = `${context.url.pathname}${context.url.search}`;
    return context.redirect(`/login?next=${encodeURIComponent(destination)}`);
  }

  return next();
});
