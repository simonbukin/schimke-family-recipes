import type { CollectionEntry } from "astro:content";

/**
 * The trimmed shape the search box receives. The full collection is far more
 * than Fuse needs, and all of it ships to the browser.
 */
export interface SearchEntry {
  id: string;
  data: {
    name: string;
    author?: string;
    emoji: string;
    time: string;
    ingredients: { name: string }[];
    steps: string[];
  };
}

export function toSearchEntry(recipe: CollectionEntry<"recipes">): SearchEntry {
  return {
    id: recipe.id,
    data: {
      name: recipe.data.name,
      author: recipe.data.author,
      emoji: recipe.data.emoji,
      time: recipe.data.time,
      ingredients: recipe.data.ingredients.flatMap((entry) =>
        "recipe" in entry ? [] : [{ name: entry.name }]
      ),
      steps: recipe.data.steps,
    },
  };
}
