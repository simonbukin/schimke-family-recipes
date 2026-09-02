import { describe, it, expect } from "vitest";
import {
  parseIngredientBlock,
  parseIngredientLine,
  splitQuantityAndUnit,
} from "./ingredientText";

describe("splitQuantityAndUnit", () => {
  it("keeps the unit on a mixed fraction", () => {
    // The original parser split on the first space and lost "teaspoons".
    expect(splitQuantityAndUnit("1 1/2 teaspoons")).toEqual({
      qty: "1 1/2",
      unit: "teaspoons",
    });
    expect(splitQuantityAndUnit("2 3/4 cups")).toEqual({
      qty: "2 3/4",
      unit: "cups",
    });
  });

  it("handles simple fractions, integers and decimals", () => {
    expect(splitQuantityAndUnit("1/2 cup")).toEqual({ qty: "1/2", unit: "cup" });
    expect(splitQuantityAndUnit("3 tbsp")).toEqual({ qty: "3", unit: "tbsp" });
    expect(splitQuantityAndUnit("0.5 l")).toEqual({ qty: "0.5", unit: "l" });
  });

  it("keeps multi-word units intact", () => {
    expect(splitQuantityAndUnit("14 oz can")).toEqual({
      qty: "14",
      unit: "oz can",
    });
  });

  it("treats a bare count as having no unit", () => {
    expect(splitQuantityAndUnit("2")).toEqual({ qty: "2", unit: "" });
  });

  it("recognizes 'to taste'", () => {
    expect(splitQuantityAndUnit("to taste")).toEqual({
      qty: "to taste",
      unit: "",
    });
  });

  it("reports no quantity for non-numeric text", () => {
    expect(splitQuantityAndUnit("softened")).toEqual({ qty: "", unit: "" });
  });
});

describe("parseIngredientLine", () => {
  it("splits on the last comma so names may contain commas", () => {
    expect(parseIngredientLine("Cream cheese, softened, 8 oz")).toEqual({
      name: "Cream cheese, softened",
      qty: "8",
      unit: "oz",
    });
  });

  it("strips list markers", () => {
    expect(parseIngredientLine("- Butter, 3 tbsp")).toEqual({
      name: "Butter",
      qty: "3",
      unit: "tbsp",
    });
  });

  it("keeps a trailing non-quantity phrase in the name", () => {
    expect(parseIngredientLine("Cream cheese, softened")).toEqual({
      name: "Cream cheese, softened",
      qty: "",
      unit: "",
    });
  });

  it("handles a name with no comma at all", () => {
    expect(parseIngredientLine("Salt")).toEqual({
      name: "Salt",
      qty: "",
      unit: "",
    });
  });

  it("ignores blank lines", () => {
    expect(parseIngredientLine("   ")).toBeNull();
  });
});

describe("parseIngredientBlock", () => {
  it("parses a pasted list and skips blanks", () => {
    expect(parseIngredientBlock("Butter, 3 tbsp\n\nSalt, to taste")).toEqual([
      { name: "Butter", qty: "3", unit: "tbsp" },
      { name: "Salt", qty: "to taste", unit: "" },
    ]);
  });
});
