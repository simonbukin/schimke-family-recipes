import { writable } from "svelte/store";
import type { Ingredient } from "../utils/recipe";

interface GroceryItem {
  recipeId: string;
  recipeName: string;
  ingredients: Ingredient[];
}

// Load initial state from localStorage
const storedItems =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("groceryList") || "[]")
    : [];

export const groceryList = writable<GroceryItem[]>(storedItems);

// Subscribe to changes and update localStorage
if (typeof window !== "undefined") {
  groceryList.subscribe((items) => {
    localStorage.setItem("groceryList", JSON.stringify(items));
  });
}

export function addToGroceryList(
  recipeId: string,
  recipeName: string,
  ingredients: Ingredient[]
) {
  groceryList.update((items) => {
    const exists = items.find((item) => item.recipeId === recipeId);
    if (exists) return items;
    return [...items, { recipeId, recipeName, ingredients }];
  });
}

export function removeFromGroceryList(recipeId: string) {
  groceryList.update((items) =>
    items.filter((item) => item.recipeId !== recipeId)
  );
}

export function clearGroceryList() {
  groceryList.set([]);
}
