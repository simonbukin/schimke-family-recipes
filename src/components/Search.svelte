<script lang="ts">
  import { onMount } from "svelte";
  import { pickRandom } from "../utils/generic";

  export let searchContent: any[] = [];
  export let funMode: boolean = false;
  let searchValue: string = '';

  export const filterFunc = (value: string, recipe: any) => {
    const search = value.toLowerCase();
    return (JSON.stringify(recipe).toLowerCase()).includes(search);
  }

  let audio: HTMLAudioElement;

  onMount(() => {
    const testElement = document.getElementById('audio') as HTMLAudioElement;
    if (testElement) {
      audio = testElement;
    }
  })

  $: {
    searchValue;
    if (audio && funMode) {
      audio.pause();
      audio.fastSeek(0.25);
      audio.play();
    }
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
<section class="flex flex-row gap-4">
  <a href="/" class="p-2 rounded-md bg-gradient-to-tr text-white  from-violet-400 to-fuchsia-600">I'm feeling poggers</a>
  <a href={`/recipe/${pickRandom(searchContent).slug}`} class="p-2 rounded-md bg-gradient-to-tr text-white  from-cyan-400  to-sky-600">I'm hungry 😭</a>
</section>

<audio id="audio" src="https://www.myinstants.com/media/sounds/taco-bell-bong-sfx.mp3"></audio>

<section class="flex flex-col mt-4 gap-2">
  {#if searchValue !== ''}
    {#each searchContent.filter((recipe) => filterFunc(searchValue, recipe)) as recipe (recipe.id)}
      <div class="justify-between items-center">
        <h1 class="text-xl">{recipe.data.name}</h1>
        <a class="underline" href={`/recipe/${recipe.slug}`}>Link</a>
      </div>
    {/each}
  {/if}
</section>