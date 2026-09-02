import { describe, it, expect } from "vitest";
import {
  parseFractionOrNumber,
  parseQuantity,
  adjustIngredientQuantity,
  findMatchingFraction,
} from "./recipe";

describe("parseFractionOrNumber", () => {
  it("should parse simple fractions", () => {
    expect(parseFractionOrNumber("1/2")).toBe(0.5);
    expect(parseFractionOrNumber("1/4")).toBe(0.25);
    expect(parseFractionOrNumber("3/4")).toBe(0.75);
    expect(parseFractionOrNumber("1/3")).toBeCloseTo(0.333, 2);
  });

  it("should parse mixed numbers", () => {
    expect(parseFractionOrNumber("1 1/2")).toBe(1.5);
    expect(parseFractionOrNumber("2 1/4")).toBe(2.25);
    expect(parseFractionOrNumber("3 3/4")).toBe(3.75);
  });

  it("should parse integers", () => {
    expect(parseFractionOrNumber("1")).toBe(1);
    expect(parseFractionOrNumber("10")).toBe(10);
    expect(parseFractionOrNumber("0")).toBe(0);
  });

  it("should parse decimals", () => {
    expect(parseFractionOrNumber("1.5")).toBe(1.5);
    expect(parseFractionOrNumber("0.25")).toBe(0.25);
  });

  it("should handle whitespace", () => {
    expect(parseFractionOrNumber("  1/2  ")).toBe(0.5);
    expect(parseFractionOrNumber(" 2 ")).toBe(2);
  });

  it("should return NaN for invalid input", () => {
    expect(parseFractionOrNumber("abc")).toBeNaN();
    expect(parseFractionOrNumber("")).toBeNaN();
  });

  it("should handle division by zero", () => {
    expect(parseFractionOrNumber("1/0")).toBeNaN();
  });
});

describe("parseQuantity", () => {
  it("should parse numeric quantities", () => {
    const result = parseQuantity("2");
    expect(result.type).toBe("measured");
    if (result.type === "measured") {
      expect(result.value).toBe(2);
    }
  });

  it("should parse fraction quantities", () => {
    const result = parseQuantity("1/2");
    expect(result.type).toBe("measured");
    if (result.type === "measured") {
      expect(result.value).toBe(0.5);
    }
  });

  it("should handle 'to taste'", () => {
    const result = parseQuantity("to taste");
    expect(result.type).toBe("toTaste");
  });

  it("should handle numeric input", () => {
    const result = parseQuantity(3);
    expect(result.type).toBe("measured");
    if (result.type === "measured") {
      expect(result.value).toBe(3);
    }
  });
});

describe("adjustIngredientQuantity", () => {
  it("should double the quantity", () => {
    const result = adjustIngredientQuantity(8, "2", 4);
    expect(result).toBe("4");
  });

  it("should halve the quantity", () => {
    const result = adjustIngredientQuantity(2, "2", 4);
    expect(result).toBe("1");
  });

  it("should handle fractions", () => {
    const result = adjustIngredientQuantity(8, "1/2", 4);
    expect(result).toBe("1");
  });

  it("should return fraction when result is fractional", () => {
    // 2 servings from 4 means halve the quantity: 1 * (2/4) = 0.5 = 1/2
    const result = adjustIngredientQuantity(2, "1", 4);
    expect(result).toBe("1/2");
  });

  it("should return quarter fraction", () => {
    // 1 serving from 4 means quarter the quantity: 1 * (1/4) = 0.25 = 1/4
    const result = adjustIngredientQuantity(1, "1", 4);
    expect(result).toBe("1/4");
  });
});

describe("findMatchingFraction", () => {
  it("should return whole numbers as strings", () => {
    expect(findMatchingFraction(1)).toBe("1");
    expect(findMatchingFraction(5)).toBe("5");
    expect(findMatchingFraction(0)).toBe("0");
  });

  it("should find common fractions", () => {
    expect(findMatchingFraction(0.5)).toBe("1/2");
    expect(findMatchingFraction(0.25)).toBe("1/4");
    expect(findMatchingFraction(0.75)).toBe("3/4");
  });

  it("should find mixed numbers", () => {
    expect(findMatchingFraction(1.5)).toBe("1 1/2");
    expect(findMatchingFraction(2.25)).toBe("2 1/4");
    expect(findMatchingFraction(3.75)).toBe("3 3/4");
  });

  it("should find thirds", () => {
    expect(findMatchingFraction(1 / 3)).toBe("1/3");
    expect(findMatchingFraction(2 / 3)).toBe("2/3");
  });

  it("should find eighths", () => {
    expect(findMatchingFraction(0.125)).toBe("1/8");
    expect(findMatchingFraction(0.375)).toBe("3/8");
  });

  it("should return decimal for non-standard fractions", () => {
    const result = findMatchingFraction(0.123);
    expect(result).toMatch(/0\.123/);
  });
});
