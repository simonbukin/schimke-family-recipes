<script lang="ts">
  import { onMount } from 'svelte';
  import { groceryList, addToGroceryList, removeFromGroceryList } from '../stores/groceryList';
  import type { Ingredient } from '../utils/recipe';

  export let recipeId: string;
  export let recipeName: string;
  export let ingredients: Ingredient[];

  let isInList = false;

  $: isInList = $groceryList.some(item => item.recipeId === recipeId);

  function toggleGroceryList() {
    if (isInList) {
      removeFromGroceryList(recipeId);
    } else {
      addToGroceryList(recipeId, recipeName, ingredients);
    }
  }
</script>

<button 
  class="text-orange-500 hover:text-orange-600 transition-colors"
  on:click={toggleGroceryList}
>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill={isInList ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
</button>