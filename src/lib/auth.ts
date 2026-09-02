/**
 * Stateless cookie auth for the two people who edit this site.
 *
 * A successful login sets a cookie holding `name.expiry.HMAC(name.expiry)`,
 * signed with AUTH_SECRET. Because the signature carries all the state, there
 * is no session store to run -- which matters on Vercel, where serverless
 * instances share no memory.
 */

const COOKIE_NAME = "recipes_auth";
const SESSION_DAYS = 365;

const encoder = new TextEncoder();

/**
 * Editors are configured as `EDITORS="simon:password1,kayla:password2"`.
 *
 * A segment with no colon is treated as the continuation of the previous
 * password rather than discarded, so a password containing a comma is kept
 * whole instead of being silently truncated at the comma.
 */
export function parseEditors(raw: string | undefined): Map<string, string> {
  const editors = new Map<string, string>();
  let current: string | null = null;

  for (const segment of (raw ?? "").split(",")) {
    const at = segment.indexOf(":");
    if (at === -1) {
      if (current) editors.set(current, `${editors.get(current)},${segment}`);
      continue;
    }
    const name = segment.slice(0, at).trim();
    const password = segment.slice(at + 1);
    if (!name || !password.trim()) {
      current = null;
      continue;
    }
    editors.set(name, password.trim());
    current = name;
  }
  return editors;
}

/**
 * Where a login may send the browser afterwards: a path on this site only.
 *
 * `startsWith("/")` is not enough -- "//evil.tld" and "/\evil.tld" are both
 * protocol-relative URLs that browsers resolve to another origin, which would
 * turn the real login page into a credential-phishing hop.
 */
export function safeRedirectPath(next: string | undefined, fallback = "/admin"): string {
  if (!next || next[0] !== "/") return fallback;
  if (next[1] === "/" || next[1] === "\\") return fallback;
  return next;
}

/** Compare without leaking how many leading characters matched. */
function constantTimeEquals(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  // Compare the lengths too, but always walk the same number of bytes.
  let mismatch = left.length ^ right.length;
  for (let i = 0; i < left.length; i++) {
    mismatch |= left[i] ^ (right[i] ?? 0);
  }
  return mismatch === 0;
}

/** Find the editor whose password matches, checking every entry either way. */
export function findEditor(
  editors: Map<string, string>,
  password: string
): string | null {
  let matched: string | null = null;
  for (const [name, expected] of editors) {
    if (constantTimeEquals(expected, password)) matched = name;
  }
  return matched;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

export async function createSessionToken(
  editor: string,
  secret: string,
  now = Date.now()
): Promise<string> {
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${editor}.${expiresAt}`;
  return `${payload}.${await sign(payload, secret)}`;
}

/** Returns the editor's name, or null if the token is absent, forged or expired. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now()
): Promise<string | null> {
  if (!token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!constantTimeEquals(await sign(payload, secret), signature)) return null;

  const separator = payload.lastIndexOf(".");
  const editor = payload.slice(0, separator);
  const expiresAt = Number(payload.slice(separator + 1));
  if (!editor || !Number.isFinite(expiresAt) || expiresAt < now) return null;

  return editor;
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  },
};
