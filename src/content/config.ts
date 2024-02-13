import { defineCollection, z } from "astro:content";

export enum RecipeTypes {
  Breakfast = "breakfast",
  Entree = "entree",
  Drink = "drink",
  Dessert = "dessert",
  Snack = "snack",
  Epicure = "epicure",
}

const recipeSchema = z.object({
  author: z.string().default("Anonymous Chef"),
  time: z.string(),
  servings: z.string().optional(),
  type: z.nativeEnum(RecipeTypes),
  name: z.string(),
  emoji: z.string().emoji(),
});

export type Recipe = z.infer<typeof recipeSchema>;

const recipesCollection = defineCollection({
  type: "content",
  schema: recipeSchema,
});

export const collections = {
  recipes: recipesCollection,
};
