import { defineCollection, z } from "astro:content";

const recipesCollection = defineCollection({
  type: "content",
  schema: z.object({
    author: z.string().default("Anonymous Chef"),
    time: z.string(),
    servings: z.string().optional(),
    type: z.string(),
    name: z.string(),
  }),
});

export const collections = {
  recipes: recipesCollection,
};
