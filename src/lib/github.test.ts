import { describe, it, expect } from "vitest";
import { identityFromUser } from "./github";

describe("identityFromUser", () => {
  it("uses the id-prefixed noreply address GitHub links commits by", () => {
    // These are the exact identities already in this repo's history.
    expect(identityFromUser({ id: 8992420, login: "simonbukin", name: "Simon Bukin" }))
      .toEqual({
        name: "Simon Bukin",
        email: "8992420+simonbukin@users.noreply.github.com",
      });
    expect(identityFromUser({ id: 45776588, login: "kschimke", name: "Kayla Schimke" }))
      .toEqual({
        name: "Kayla Schimke",
        email: "45776588+kschimke@users.noreply.github.com",
      });
  });

  it("never produces the legacy address, which belongs to another account", () => {
    // "simon@users.noreply.github.com" is GitHub user 217886, an unrelated
    // person. Deriving the address from the login alone credited them.
    const identity = identityFromUser({ id: 8992420, login: "simonbukin", name: "Simon Bukin" });
    expect(identity.email).not.toBe("simonbukin@users.noreply.github.com");
    expect(identity.email).toMatch(/^\d+\+[^@]+@users\.noreply\.github\.com$/);
  });

  it("falls back to the login when the profile has no display name", () => {
    expect(identityFromUser({ id: 1, login: "someone", name: null }).name).toBe("someone");
  });
});
