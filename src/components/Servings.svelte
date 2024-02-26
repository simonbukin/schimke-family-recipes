<script lang="ts">
  import { onMount } from "svelte";
  import { servings } from '../stores/servings'

  export let servingsNum: number;
  onMount(() => {
    servings.set(servingsNum)
  })
</script>

<div class="my-2 max-w-full flex flex-row align-center items-center gap-2">
  <button class="flex-shrink-0 font-bold border-2 border-red-300 rounded-md w-[40px] h-[40px]" on:click={() => servings.set($servings * 0.5)}>1/2x</button>
  <button class="flex-shrink-0 font-bold border-2  border-orange-300 rounded-md w-[40px] h-[40px]" on:click={() => servings.set($servings - ($servings > 0 ? 1 : 0))}>-</button>
  <div class="h-[40px] px-2 border-2 border-slate-300 rounded-md gap-2 flex flex-row justify-center items-center">
    <input class="w-1/3 flex-1 bg-inherit text-right" bind:value={$servings} type="text">
    <p class="flex-shrink-1">serving{$servings > 1 ? "s" : ""}</p>
  </div>
  <button class="flex-shrink-0 font-bold border-2 border-blue-300  rounded-md w-[40px] h-[40px]" on:click={() => servings.set($servings + 1)}>+</button>
  <button class="flex-shrink-0 font-bold border-2 border-green-300 rounded-md w-[40px] h-[40px]" on:click={() => servings.set($servings * 2)}>2x</button>
</div>