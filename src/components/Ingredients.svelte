<script lang="ts">
  import type { Ingredient } from '../utils/recipe';
  import { servings } from '../stores/servings' 
  import { adjustIngredientQuantity} from '../utils/recipe'
  export let ingredients: Ingredient[];
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
          <strong>{adjustIngredientQuantity($servings, ingredient.quantity, initialServings)}</strong> {ingredient.unit}{" "}
          {ingredient.name}
        </section>
      </li> 
    {/each}
  </ul>
</details>