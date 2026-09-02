import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";
import { RECIPE_TYPES } from "./utils/recipeFile";

export const recipeTypes = RECIPE_TYPES;

/** A measured ingredient, or a cross-link to another recipe by slug. */
const ingredientSchema = z.union([
  z.object({ recipe: z.string() }),
  z.object({
    name: z.string(),
    qty: z.string().optional(),
    unit: z.string().optional(),
  }),
]);

const recipeSchema = z
  .object({
    name: z.string(),
    emoji: z.string().min(1),
    type: z.enum(RECIPE_TYPES),
    author: z.string().optional(),
    link: z.string().url().optional(),
    time: z.string(),
    servings: z.number().int().positive().optional(),
    ingredients: z.array(ingredientSchema).default([]),
    cookware: z
      .array(z.object({ name: z.string(), qty: z.string().optional() }))
      .default([]),
    steps: z.array(z.string()).default([]),
  })
  .refine((data) => data.author || data.link, {
    message: "At least one of 'author' or 'link' must be provided",
  });

const recipesCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/recipes" }),
  schema: recipeSchema,
});

export const collections = {
  recipes: recipesCollection,
};
