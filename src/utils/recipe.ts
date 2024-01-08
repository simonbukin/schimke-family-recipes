const RECIPE_PARTS = ["Ingredients", "Steps", "Cookware"];

type MarkdownRecipe = {
  cookware?: Cookware[];
  ingredients: Ingredient[];
  steps: string[];
};

type Ingredient = {
  name: string;
  quantity: string | "to taste";
  unit?: string;
};

type Cookware = {
  name: string;
  quantity: string;
};

export const processMarkdownRecipe = (recipe: string) => {
  const recipeLines = recipe.split("\n");
  const markdownRecipe = getMarkdownRecipe(recipeLines, RECIPE_PARTS);
  return markdownRecipe;
};

export const getMarkdownRecipe = (
  lines: string[],
  headers: string[]
): MarkdownRecipe => {
  const blocks = [];
  let block = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const [lineName] = line.split(":");
    if (line.includes(":") && headers.includes(lineName)) {
      if (block.length > 0) {
        blocks.push(block);
        block = [];
      }
    }
    block.push(line);
  }
  blocks.push(block);

  const markdownRecipe = {
    steps: [],
    ingredients: [],
    cookware: [],
  };
  for (const block of blocks) {
    const [blockName] = block[0].split(":");
    const blockContent = block
      .slice(1)
      .filter((line) => line !== "")
      .map((line) => line.split("- ")[1]);
    markdownRecipe[blockName.toLowerCase()] = blockContent;
  }

  if (markdownRecipe.ingredients) {
    markdownRecipe.ingredients = markdownRecipe.ingredients.map((ingredient) =>
      processItem(ingredient, "ingredient")
    );
  }

  if (markdownRecipe.cookware) {
    markdownRecipe.cookware = markdownRecipe.cookware.map((cookware) =>
      processItem(cookware, "cookware")
    );
  }
  return markdownRecipe as MarkdownRecipe;
};

const processItem = (
  item: string,
  type: "ingredient" | "cookware"
): Ingredient | Cookware => {
  const [name, partial] = item.split(", ");
  const [quantity, ...unit] = partial.split(" ");
  if (type === "ingredient") {
    return {
      name,
      quantity,
      unit: unit.join(" "),
    } as Ingredient;
  } else if (type === "cookware") {
    return {
      name,
      quantity,
    } as Cookware;
  } else {
    throw new Error("Unknown item type");
  }
};
