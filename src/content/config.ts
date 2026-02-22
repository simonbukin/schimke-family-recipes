import { defineCollection, z } from "astro:content";

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
    emoji: z.string().emoji(),
  })
  .refine((data) => data.author || data.link, {
    message: "At least one of 'author' or 'link' must be provided",
  });

export type Recipe = z.infer<typeof recipeSchema>;

const recipesCollection = defineCollection({
  type: "content",
  schema: recipeSchema,
});

export const collections = {
  recipes: recipesCollection,
};
