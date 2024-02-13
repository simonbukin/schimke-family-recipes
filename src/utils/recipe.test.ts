import { describe, it, expect } from "vitest";
import { trimLine } from "./recipe";

describe("trimLine", () => {
  it("should remove leading hyphen and whitespace", () => {
    const input = "- Ingredient1, name: apple, quantity: 2, unit: piece";
    const expectedOutput = "Ingredient1, name: apple, quantity: 2, unit: piece";

    expect(trimLine(input)).toBe(expectedOutput);
  });

  it("should remove leading whitespace", () => {
    const input = " Ingredient2, name: banana, quantity: 3, unit: pound";
    const expectedOutput =
      "Ingredient2, name: banana, quantity: 3, unit: pound";

    expect(trimLine(input)).toBe(expectedOutput);
  });

  it("should remove leading hyphen when there is no whitespace before", () => {
    const input = "Ingredient3, name: carrot, quantity: 4, unit: kilogram";
    const expectedOutput =
      "Ingredient3, name: carrot, quantity: 4, unit: kilogram";

    expect(trimLine(input)).toBe(expectedOutput);
  });
});
