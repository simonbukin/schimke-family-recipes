export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Cookware {
  name: string;
  quantity: string;
}

interface Recipe {
  steps: string[];
  ingredients: Ingredient[];
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
          const [name, quantityAndUnit] = line
            .split(",")
            .map((part) => part.trim());
          if (quantityAndUnit === "to taste") {
            recipe.ingredients.push({
              name,
              quantity: quantityAndUnit,
              unit: "",
            });
          } else {
            const [quantity, unit] = quantityAndUnit
              .split(" ")
              .map((part) => part.trim());
            recipe.ingredients.push({
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
    5: ["1/5", "2/5", "3/5", "4/5"],
    6: ["1/6", "2/6", "3/6", "4/6", "5/6"],
    7: ["1/7", "2/7", "3/7", "4/7", "5/7", "6/7"],
    8: ["1/8", "2/8", "3/8", "4/8", "5/8", "6/8", "7/8"],
  };

  for (let denominator = 2; denominator <= 8; denominator++) {
    const fractionValues = fractions[denominator];
    for (const fractionValue of fractionValues) {
      const [numeratorStr] = fractionValue.split("/");
      const numerator = parseInt(numeratorStr);
      const fraction = numerator / denominator;
      const diff = Math.abs(fraction - decimal);
      if (diff < 0.0001) {
        return `${numerator}/${denominator}`;
      }
    }
  }

  return null;
}
