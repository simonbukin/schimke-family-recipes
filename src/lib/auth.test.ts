import { describe, it, expect } from "vitest";
import {
  createSessionToken,
  findEditor,
  parseEditors,
  safeRedirectPath,
  verifySessionToken,
} from "./auth";

const SECRET = "a-test-secret";

describe("parseEditors", () => {
  it("reads name:password pairs", () => {
    expect([...parseEditors("simon:one,kayla:two")]).toEqual([
      ["simon", "one"],
      ["kayla", "two"],
    ]);
  });

  it("keeps colons inside a password", () => {
    expect(parseEditors("simon:a:b:c").get("simon")).toBe("a:b:c");
  });

  it("ignores blanks and malformed entries", () => {
    expect(parseEditors("simon:one,,garbage,:x,y:").size).toBe(1);
  });

  it("treats an unset variable as no editors", () => {
    expect(parseEditors(undefined).size).toBe(0);
  });

  it("keeps a password containing a comma whole", () => {
    // Splitting naively would accept the 9-character prefix and silently
    // discard the rest, so the deployed password would not be the one set.
    const editors = parseEditors("simon:Tr0ub4dor,&3-horse,kayla:pw2");
    expect(editors.get("simon")).toBe("Tr0ub4dor,&3-horse");
    expect(editors.get("kayla")).toBe("pw2");
  });
});

describe("findEditor", () => {
  const editors = parseEditors("simon:one,kayla:two");

  it("matches the right editor", () => {
    expect(findEditor(editors, "two")).toBe("kayla");
  });

  it("rejects a wrong password", () => {
    expect(findEditor(editors, "three")).toBeNull();
  });

  it("rejects an empty password even with no editors configured", () => {
    expect(findEditor(parseEditors(""), "")).toBeNull();
  });
});

describe("safeRedirectPath", () => {
  it("allows a path on this site", () => {
    expect(safeRedirectPath("/admin/new")).toBe("/admin/new");
    expect(safeRedirectPath("/recipe/pancakes?x=1")).toBe("/recipe/pancakes?x=1");
  });

  it("rejects protocol-relative URLs that leave the site", () => {
    // Browsers resolve these against the current scheme, so they navigate off
    // site even though they start with "/".
    expect(safeRedirectPath("//evil.tld")).toBe("/admin");
    expect(safeRedirectPath("/\\evil.tld")).toBe("/admin");
    expect(safeRedirectPath("//evil.tld/login")).toBe("/admin");
  });

  it("rejects absolute URLs and junk", () => {
    expect(safeRedirectPath("https://evil.tld")).toBe("/admin");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/admin");
    expect(safeRedirectPath("")).toBe("/admin");
    expect(safeRedirectPath(undefined)).toBe("/admin");
  });
});

describe("session tokens", () => {
  it("round-trips the editor name", async () => {
    const token = await createSessionToken("simon", SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe("simon");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken("simon", SECRET);
    expect(await verifySessionToken(token, "other-secret")).toBeNull();
  });

  it("rejects a tampered editor name", async () => {
    const token = await createSessionToken("simon", SECRET);
    const forged = token.replace("simon", "admin");
    expect(await verifySessionToken(forged, SECRET)).toBeNull();
  });

  it("rejects an extended expiry", async () => {
    const token = await createSessionToken("simon", SECRET);
    const [name, expiry, signature] = token.split(".");
    const forged = `${name}.${Number(expiry) + 1000}.${signature}`;
    expect(await verifySessionToken(forged, SECRET)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const issued = Date.UTC(2020, 0, 1);
    const token = await createSessionToken("simon", SECRET, issued);
    const twoYearsLater = issued + 2 * 365 * 24 * 60 * 60 * 1000;
    expect(await verifySessionToken(token, SECRET, twoYearsLater)).toBeNull();
  });

  it("rejects missing and malformed tokens", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
    expect(await verifySessionToken("", SECRET)).toBeNull();
    expect(await verifySessionToken("garbage", SECRET)).toBeNull();
    expect(await verifySessionToken("a.b.c", SECRET)).toBeNull();
  });
});
