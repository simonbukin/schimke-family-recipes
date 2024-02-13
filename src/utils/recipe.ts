interface Ingredient {
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
          const [name, quantity, unit] = line
            .split(",")
            .map((part) => part.trim());
          recipe.ingredients.push({
            name,
            quantity,
            unit: unit || "",
          });
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
