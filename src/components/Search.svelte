<script lang="ts">
  import { onMount } from "svelte";
  import { pickRandom } from "../utils/generic";
  import { convertDurationToMinutes } from "../utils/time";

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

  const playAudio = () => {
    if (audio) {
      audio.pause();
      audio.fastSeek(0.25);
      audio.play();
    }
  }

  $: {
    searchValue;
    if (funMode) {
      playAudio();
    }
  }
</script>

<form class="flex gap-2 flex-row justify-between items-center">
  <input
    class="grow py-2 px-4 rounded-md border-slate-300 border-4"
    type="text"
    name="search"
    placeholder="Search recipes"
    bind:value={searchValue}
  />
</form>
<section class="mt-4 flex flex-row items-center gap-4">
  <button on:click={playAudio} class="grow p-2 rounded-md bg-gradient-to-tr text-white  from-violet-400 to-fuchsia-600">I'm feeling poggers</button>
  <a href={`/recipe/${pickRandom(searchContent).slug}`} class="grow p-2 text-center rounded-md bg-gradient-to-tr text-white  from-cyan-400  to-sky-600">I'm hungry 😭</a>
</section>

<audio id="audio" src="https://www.myinstants.com/media/sounds/taco-bell-bong-sfx.mp3"></audio>

<section class="relative flex flex-col mt-4 gap-2">
  {#if searchValue !== ''}
  <div class="absolute top-0 justify-between items-center w-full">
    {#each searchContent.filter((recipe) => filterFunc(searchValue, recipe)).sort((a, b) => {
      const aMinutes = convertDurationToMinutes(a.data.time);
      const bMinutes = convertDurationToMinutes(b.data.time);
      return aMinutes - bMinutes;
    }) as recipe (recipe.id)}
      <div class="flex flex-row justify-between" >
        <a href={`/recipe/${recipe.slug}`}><h1 class="text-xl">{recipe.data.emoji} {recipe.data.name}</h1></a>
        <h2 class="font-bold text-2xl">{convertDurationToMinutes(recipe.data.time)} minutes</h2>
      </div>
    {/each}
  </div>
  {/if}
</section>