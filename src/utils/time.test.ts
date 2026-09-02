import { describe, it, expect } from "vitest";
import { convertDurationToMinutes } from "./time";

describe("convertDurationToMinutes", () => {
  it("reads minutes", () => {
    expect(convertDurationToMinutes("30 minutes")).toBe(30);
    expect(convertDurationToMinutes("5 minutes")).toBe(5);
  });

  it("converts hours", () => {
    expect(convertDurationToMinutes("2 hours")).toBe(120);
    expect(convertDurationToMinutes("1 hour")).toBe(60);
  });

  it("returns null for free text rather than throwing", () => {
    // Reachable from the editor, where "time" is an unconstrained text field.
    expect(convertDurationToMinutes("half an hour")).toBeNull();
    expect(convertDurationToMinutes("")).toBeNull();
    expect(convertDurationToMinutes("overnight")).toBeNull();
  });
});
