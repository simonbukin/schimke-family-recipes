import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

export enum RecipeTypes {
  Breakfast = "breakfast",
  Entree = "entree",
  Drink = "drink",
  Dessert = "dessert",
  Sauce = "sauce",
  Snack = "snack",
  Epicure = "epicure",
}

const recipeSchema = z
  .object({
    author: z.string().optional(),
    link: z.string().url().optional(),
    time: z.string(),
    servings: z.string().optional(),
    type: z.nativeEnum(RecipeTypes),
    name: z.string(),
    emoji: z.string().min(1),
  })
  .refine((data) => data.author || data.link, {
    message: "At least one of 'author' or 'link' must be provided",
  });

export type Recipe = {
  author?: string;
  link?: string;
  time: string;
  servings?: string;
  type: RecipeTypes;
  name: string;
  emoji: string;
};

const recipesCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/recipes" }),
  schema: recipeSchema,
});

export const collections = {
  recipes: recipesCollection,
};
