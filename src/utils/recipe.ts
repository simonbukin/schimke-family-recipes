import { convertUnit } from "./units";

export interface Ingredient {
  type: "ingredient";
  name: string;
  quantity: string;
  unit: string;
}

export interface Link {
  type: "link";
  name: string;
  slug: string;
}

interface Cookware {
  name: string;
  quantity: string;
}

interface Recipe {
  steps: string[];
  ingredients: (Ingredient | Link)[];
  cookware: Cookware[];
}

export function parseRecipe(lines: string[]): Recipe {
  const recipe: Recipe = {
    steps: [],
    ingredients: [],
    cookware: [],
  };

  let section = "";

  lines.forEach((line) => {
    if (line.startsWith("Ingredients:")) {
      section = "ingredients";
    } else if (line.startsWith("Cookware:")) {
      section = "cookware";
    } else if (line.startsWith("Steps:")) {
      section = "steps";
    } else if (line.trim() !== "") {
      line = trimLine(line);
      switch (section) {
        case "ingredients":
          if (line.indexOf("[[") != -1 && line.indexOf("]]") != -1) {
            console.log("special af");
            console.log(line);
            const noBrackets = line.substring(2, line.length - 2);
            recipe.ingredients.push({
              type: "link",
              name: noBrackets,
              slug: noBrackets.toLowerCase().split(" ").join("-"),
            });
            break;
          }
          const [name, quantityAndUnit] = line
            .split(",")
            .map((part) => part.trim());
          if (quantityAndUnit === "to taste") {
            recipe.ingredients.push({
              type: "ingredient",
              name,
              quantity: quantityAndUnit,
              unit: "",
            });
          } else {
            const [quantity, unit] = quantityAndUnit
              .split(" ")
              .map((part) => part.trim());
            recipe.ingredients.push({
              type: "ingredient",
              name,
              quantity,
              unit: unit || "",
            });
          }
          break;
        case "cookware":
          const [cookwareName, cookwareQuantity] = line
            .split(",")
            .map((part) => part.trim());
          recipe.cookware.push({
            name: cookwareName,
            quantity: cookwareQuantity,
          });
          break;
        case "steps":
          recipe.steps.push(line);
          break;
      }
    }
  });
  return recipe;
}

export const trimLine = (line: string) => {
  return line.replace(/^-/, "").trim();
};

// Define a proper type for quantities
export type Quantity =
  | { type: "measured"; value: number }
  | { type: "toTaste" };

// Helper functions to work with quantities
export const parseQuantity = (raw: string | number): Quantity => {
  if (raw === "to taste") return { type: "toTaste" };
  const value = typeof raw === "string" ? eval(raw) : raw;
  return { type: "measured", value };
};

export const getBaseQuantity = (ingredient: Ingredient): Quantity => {
  try {
    return parseQuantity(ingredient.quantity);
  } catch (e) {
    console.error("Error parsing quantity:", e);
    return { type: "measured", value: NaN };
  }
};

export const calculateServingsAdjustedQuantity = (
  quantity: Quantity,
  currentServings: number,
  initialServings: number
): Quantity => {
  if (quantity.type === "toTaste") return quantity;
  return {
    type: "measured",
    value: (quantity.value * currentServings) / initialServings,
  };
};

export const convertToDisplayUnit = (
  quantity: Quantity,
  fromUnit: string,
  toUnit: string
): Quantity => {
  if (quantity.type === "toTaste") return quantity;
  if (fromUnit === toUnit) return quantity;
  return {
    type: "measured",
    value: convertUnit(quantity.value, fromUnit, toUnit),
  };
};

export const formatQuantity = (quantity: Quantity): string => {
  if (quantity.type === "toTaste") return "to taste";
  if (isNaN(quantity.value)) return quantity.value.toString();
  const fraction = findMatchingFraction(quantity.value);
  return fraction || quantity.value.toFixed(2).replace(/\.?0+$/, "");
};

// TODO: test
export const adjustIngredientQuantity = (
  currentServings: number,
  quantity: string,
  initialServings: number
) => {
  const percentAdjusted = currentServings / initialServings;
  const quantityValue = quantity.split(" ")[0];
  try {
    const evaledQuantity = eval(quantityValue);
    if (!isNaN(parseFloat(evaledQuantity))) {
      const decimal = percentAdjusted * evaledQuantity;
      const fraction = findMatchingFraction(decimal);
      return fraction ? fraction : decimal;
    }
  } catch (e) {
    return quantity;
  }
  return quantityValue;
};

// TODO: clean up this and test
type Fractions = {
  [key: number]: string[];
};

export function findMatchingFraction(decimal: number) {
  const fractions: Fractions = {
    2: ["1/2"],
    3: ["1/3", "2/3"],
    4: ["1/4", "2/4", "3/4"],
    8: ["1/8", "3/8", "5/8", "7/8"],
    16: ["1/16", "3/16", "5/16", "7/16", "9/16", "11/16", "13/16", "15/16"],
  };

  // Handle whole numbers
  if (Number.isInteger(decimal)) {
    return decimal.toString();
  }

  // Split into whole and decimal parts
  const wholePart = Math.floor(decimal);
  const decimalPart = decimal - wholePart;

  for (let denominator of [2, 3, 4, 8, 16]) {
    const fractionValues = fractions[denominator];
    for (const fractionValue of fractionValues) {
      const [numeratorStr] = fractionValue.split("/");
      const numerator = parseInt(numeratorStr);
      const fraction = numerator / denominator;
      const diff = Math.abs(fraction - decimalPart);
      if (diff < 0.0001) {
        return wholePart > 0 ? `${wholePart} ${fractionValue}` : fractionValue;
      }
    }
  }

  // If no matching fraction found, return decimal with up to 3 decimal places
  return decimal.toFixed(3).replace(/\.?0+$/, "");
}
