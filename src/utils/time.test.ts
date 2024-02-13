import { describe, expect, it } from "vitest";
import { convertDurationToMinutes } from "./time";

describe("convertDurationToMinutes", () => {
  it("should convert a single number to minutes", () => {
    expect(convertDurationToMinutes("5")).toBe(5);
  });

  it("should convert a single number followed by hour(s) unit to minutes", () => {
    expect(convertDurationToMinutes("5 hours")).toBe(300);
    expect(convertDurationToMinutes("2 hours")).toBe(120);
  });

  it("should throw an error for invalid duration string", () => {
    expect(() => convertDurationToMinutes("invalid duration")).toThrowError();
  });
});
