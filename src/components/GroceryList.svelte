<script lang="ts">
  import { groceryList, clearGroceryList, removeFromGroceryList } from '../stores/groceryList';
  import { onMount } from 'svelte';
  
  let isOpen = false;
  let isMobile = false;

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  function copyToClipboard() {
    const text = $groceryList
      .map(recipe => {
        return `${recipe.recipeName}:\n${recipe.ingredients
          .map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
          .join('\n')}`;
      })
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
  }
</script>

{#if $groceryList.length > 0}
  <button
    class="fixed bottom-4 right-4 bg-orange-500 text-white rounded-full p-4 shadow-lg hover:bg-orange-600 transition-colors z-50 flex items-center gap-2"
    on:click={() => (isOpen = true)}
  >
  {#if $groceryList.length > 0}
      <span class="bg-white text-orange-500 rounded-full h-5 w-5 flex items-center justify-center text-sm font-bold">
        {$groceryList.length}
      </span>
    {/if}
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  </button>
{/if}

{#if isOpen}
  <button
    class="fixed inset-0 bg-black bg-opacity-50 z-50"
    on:click={() => (isOpen = false)}
    on:keydown={e => e.key === 'Escape' && (isOpen = false)}
  />
  <div class={`fixed z-50 bg-white ${isMobile ? 'inset-x-0 bottom-0 rounded-t-xl' : 'right-0 top-0 bottom-0 w-96'} transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : isMobile ? 'translate-y-full' : 'translate-x-full'}`}>
    <div class="p-4 flex flex-col h-full">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Grocery List</h2>
        <button 
          class="text-gray-500 hover:text-gray-700"
          on:click={() => (isOpen = false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        {#if $groceryList.length === 0}
          <p class="text-gray-500 text-center">No items in grocery list</p>
        {:else}
          {#each $groceryList as recipe}
            <div class="mb-4 p-4 bg-orange-50 rounded-lg">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold">{recipe.recipeName}</h3>
                <button
                  class="text-red-500 hover:text-red-700"
                  on:click={() => removeFromGroceryList(recipe.recipeId)}
                >
                  Remove
                </button>
              </div>
              <ul class="list-disc list-inside">
                {#each recipe.ingredients as ingredient}
                  {#if ingredient.type === 'ingredient'}
                    <li>{ingredient.quantity} {ingredient.unit} {ingredient.name}</li>
                  {/if}
                {/each}
              </ul>
            </div>
          {/each}
        {/if}
      </div>

      <div class="border-t pt-4 flex gap-2">
        <button
          class="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          on:click={copyToClipboard}
        >
          Copy to Clipboard
        </button>
        <button
          class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          on:click={clearGroceryList}
        >
          Clear All
        </button>
      </div>
    </div>
  </div>
{/if} 