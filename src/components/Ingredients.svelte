<script lang="ts">
  import type { Ingredient, Link } from '../utils/recipe';
  import { servings } from '../stores/servings' 
  import { adjustIngredientQuantity} from '../utils/recipe'
  export let ingredients: (Ingredient | Link)[];
  ingredients.sort((a,) => a.type === 'link' ? -1 : 1)
  export let initialServings: number;
</script>

<details open>
  <summary class="text-lg my-4">Ingredients</summary>
  <ul>
    {#each ingredients as ingredient }
      <li class="my-2 flex flex-row gap-4">
        <input
          type="checkbox"
          class="aspect-square w-[20px] shrink-0"
        />
        <section class="flex flex-row items-center gap-2">
          {#if ingredient.type === 'link'}
            <a class="cool-text" href={`/recipe/${ingredient.slug}`}>{ingredient.name}</a>
          {:else}
            <strong>{adjustIngredientQuantity($servings, ingredient.quantity, initialServings)}</strong> {ingredient.unit}{" "}
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