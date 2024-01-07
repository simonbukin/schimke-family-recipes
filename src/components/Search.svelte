<script lang="ts">
  export let searchContent: any[] = [];
  let searchValue: string = '';

  export const filterFunc = (value: string, recipe: any) => {
    const search = value.toLowerCase();
    return (JSON.stringify(recipe).toLowerCase()).includes(search);
  }
</script>

<form class="flex gap-2 flex-row justify-between items-center">
  <input
    class="grow py-2 px-4"
    type="text"
    name="search"
    placeholder="Search recipes"
    bind:value={searchValue}
  />
  <button
  class="flex-shrink bg-orange-200 py-1 px-2 border-orange-400 border-4 text-lg rounded-md"
    >Search</button
  >
</form>

<section class="flex flex-col mt-4 gap-2">
  {#each searchContent.filter((recipe) => filterFunc(searchValue, recipe)) as recipe (recipe.id)}
    <div class=" justify-between items-center">
      <h1 class="text-xl">{recipe.data.name}</h1>
      <a class="underline" href={`/recipe/${recipe.slug}`}>Link</a>
    </div>
  {/each}
</section>