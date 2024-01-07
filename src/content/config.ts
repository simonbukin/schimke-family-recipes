import { defineCollection, z } from "astro:content";

const recipeSchema = z.object({
  author: z.string().default("Anonymous Chef"),
  time: z.string(),
  servings: z.string().optional(),
  type: z.string(),
  name: z.string(),
});

export type Recipe = z.infer<typeof recipeSchema>;

const recipesCollection = defineCollection({
  type: "content",
  schema: recipeSchema,
});

export const collections = {
  recipes: recipesCollection,
};
