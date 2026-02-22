<script lang="ts">
  import { servings } from '../stores/servings';

  let { servingsNum }: { servingsNum: number } = $props();

  $effect(() => {
    if (servingsNum && servingsNum > 0) {
      servings.set(servingsNum);
    }
  });
</script>

<div class="mb-4 max-w-full">
  <h3 class="text-lg font-bold text-gray-800 mb-3">Servings</h3>
  <div class="flex flex-row align-center items-center gap-2">
    <button class="flex-shrink-0 font-bold border-2 border-red-300 rounded-md w-11 h-11 min-w-[44px] min-h-[44px]" onclick={() => servings.set(Math.max(1, Math.round($servings * 0.5)))}>1/2x</button>
    <button class="flex-shrink-0 font-bold border-2 border-orange-300 rounded-md w-11 h-11 min-w-[44px] min-h-[44px]" onclick={() => servings.set(Math.max(1, $servings - 1))}>-</button>
    <div class="h-11 px-2 border-2 border-slate-300 rounded-md flex flex-row justify-center items-center min-w-[3.5rem]">
      <input class="w-full bg-inherit text-center" bind:value={$servings} type="text" inputmode="numeric">
    </div>
    <button class="flex-shrink-0 font-bold border-2 border-blue-300 rounded-md w-11 h-11 min-w-[44px] min-h-[44px]" onclick={() => servings.set($servings + 1)}>+</button>
    <button class="flex-shrink-0 font-bold border-2 border-green-300 rounded-md w-11 h-11 min-w-[44px] min-h-[44px]" onclick={() => servings.set($servings * 2)}>2x</button>
  </div>
</div>