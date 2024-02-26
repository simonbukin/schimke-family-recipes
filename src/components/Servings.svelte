<script>
  import { onMount } from "svelte";
  import { servingsMultiplier } from '../stores/servings'

  export let servingsString;
  let [quantity,] = servingsString.split(" ")
  onMount(() =>{
    servingsMultiplier.set(1)
  })
</script>

<div class="flex flex-row align-center items-center gap-2 w-32">
  <button class="font-bold" on:click={() => servingsMultiplier.set($servingsMultiplier * 0.5)}>-</button>
  <p class="flex-1 text-center">{$servingsMultiplier * quantity} serving{$servingsMultiplier * quantity > 1 ? 's' : ''}</p>
  <button class="font-bold" on:click={() => servingsMultiplier.set($servingsMultiplier * 2)}>+</button>
</div>
