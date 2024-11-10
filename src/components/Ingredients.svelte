<script lang="ts">
  import type { Ingredient, Link } from '../utils/recipe';
  import { servings } from '../stores/servings';
  import { adjustIngredientQuantity } from '../utils/recipe';
  import { convertUnit, getNextUnit, isConvertible, getUnitDisplay } from '../utils/units';
  import { writable } from 'svelte/store';
  
  export let ingredients: (Ingredient | Link)[];
  export let initialServings: number;
  
  // Create a store for the display units, keeping original ingredients unchanged
  const displayUnits = writable(
    ingredients.map(ing => ing.type === 'link' ? null : (ing as Ingredient).unit)
  );
  
  function handleUnitSwap(index: number) {
    $displayUnits = $displayUnits.map((unit, i) => {
      if (i !== index || !unit) return unit;
      
      const nextUnit = getNextUnit(unit);
      return nextUnit;
    });
  }

  function getDisplayQuantity(ingredient: Ingredient, displayUnit: string): string {
    if (ingredient.unit === displayUnit) {
      return adjustIngredientQuantity($servings, ingredient.quantity, initialServings);
    }
    
    const adjustedQuantity = parseFloat(adjustIngredientQuantity($servings, ingredient.quantity, initialServings));
    const convertedQuantity = convertUnit(adjustedQuantity, ingredient.unit, displayUnit);
    return convertedQuantity.toString();
  }
</script>

<details open>
  <summary class="text-lg my-4">Ingredients</summary>
  <ul>
    {#each ingredients as ingredient, i}
      <li class="my-2 flex flex-row gap-4">
        <input
          type="checkbox"
          class="aspect-square w-[20px] shrink-0"
        />
        <section class="flex flex-row items-center gap-2">
          {#if ingredient.type === 'link'}
            <a class="cool-text" href={`/recipe/${ingredient.slug}`}>{ingredient.name}</a>
          {:else}
            <strong>
              {getDisplayQuantity(ingredient, $displayUnits[i])}
            </strong> 
            <span class="flex items-center gap-1">
              {getUnitDisplay($displayUnits[i])}
              {#if isConvertible(ingredient.unit)}
                <button 
                  class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  on:click={() => handleUnitSwap(i)}
                  title="Convert unit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  </svg>
                </button>
              {/if}
            </span>
            {ingredient.name}
          {/if}
        </section>
      </li>
    {/each}
  </ul>
</details>

<style>
  .cool-text {
    background: linear-gradient(45deg, 
      #EF4444,
      #F59E0B,
      #22C55E,
      #0EA5E9,
      #A855F7
    );
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    text-decoration: none;
  }
</style>