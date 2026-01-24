<script lang="ts">
  import { pickRandom } from "../utils/generic";
  import { convertDurationToMinutes } from "../utils/time";
  import type { Recipe } from '../content/config';
  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  type RecipeEntry = {
    id: string;
    slug: string;
    body: string;
    data: Recipe;
  };

  interface Props {
    searchContent?: RecipeEntry[];
    funMode?: boolean;
  }

  let { searchContent = [], funMode = false }: Props = $props();

  let searchValue = $state('');
  let audio = $state<HTMLAudioElement | null>(null);
  let inputFocused = $state(false);

  let filteredRecipes = $derived(
    searchContent
      .filter((recipe) => filterFunc(searchValue, recipe))
      .sort((a, b) => {
        const aMinutes = convertDurationToMinutes(a.data.time);
        const bMinutes = convertDurationToMinutes(b.data.time);
        return aMinutes - bMinutes;
      })
  );

  let isSearching = $derived(searchValue.length > 0);
  let hasResults = $derived(filteredRecipes.length > 0);

  function filterFunc(value: string, recipe: RecipeEntry): boolean {
    const search = value.toLowerCase();
    return JSON.stringify(recipe).toLowerCase().includes(search);
  }

  $effect(() => {
    const audioElement = document.getElementById('audio') as HTMLAudioElement;
    if (audioElement) {
      audio = audioElement;
    }
  });

  $effect(() => {
    searchValue;
    if (funMode && audio) {
      playAudio();
    }
  });

  const playAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0.1;
      audio.play();
    }
  };

  function clearSearch() {
    searchValue = '';
  }
</script>

<div class="search-container">
  <!-- Search input with results overlay -->
  <div class="search-wrapper">
    <!-- Results appear above -->
    {#if isSearching}
      <div class="results-area">
        {#if hasResults}
          {#each filteredRecipes.slice(0, 5) as recipe (recipe.id)}
            <a
              href={`/recipe/${recipe.slug}`}
              class="result-item"
              in:fly={{ y: 8, duration: 150 }}
              out:fade={{ duration: 100 }}
            >
              <span class="result-time">{convertDurationToMinutes(recipe.data.time)}m</span>
              <span class="result-emoji">{recipe.data.emoji}</span>
              <span class="result-name">{recipe.data.name}</span>
            </a>
          {/each}
        {:else}
          <p class="no-results" in:fade={{ duration: 150 }}>No recipes found</p>
        {/if}
      </div>
    {/if}

    <div class="search-input-wrapper">
      <input
        class="search-input"
        type="text"
        name="search"
        placeholder="Search recipes..."
        bind:value={searchValue}
        onfocus={() => inputFocused = true}
        onblur={() => inputFocused = false}
      />
      {#if searchValue}
        <button
          class="clear-btn"
          onclick={clearSearch}
          transition:fade={{ duration: 150 }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Fun buttons -->
  <div class="fun-buttons">
    <button onclick={playAudio} class="btn-poggers">
      I'm feeling poggers
    </button>
    <a href={`/recipe/${pickRandom(searchContent)?.slug ?? ''}`} class="btn-hungry">
      I'm hungry
    </a>
  </div>
</div>

<audio id="audio" src="https://www.myinstants.com/media/sounds/taco-bell-bong-sfx.mp3"></audio>

<style>
  .search-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-wrapper {
    position: relative;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: 2.5rem;
    border: 3px solid #cbd5e1;
    border-radius: 0.75rem;
    font-size: 1rem;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
  }

  .search-input::placeholder {
    color: #9ca3af;
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }

  .clear-btn:hover {
    color: #6b7280;
  }

  .clear-btn svg {
    width: 20px;
    height: 20px;
  }

  .results-area {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    padding-bottom: 0.5rem;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    text-decoration: none;
    color: #1f2937;
  }

  .result-item:hover .result-name {
    color: #f97316;
  }

  .result-emoji {
    font-size: 1.25rem;
  }

  .result-name {
    flex: 1;
    font-weight: 500;
    transition: color 0.15s;
  }

  .result-time {
    font-weight: 600;
    color: #f97316;
    font-size: 0.875rem;
    min-width: 2.5rem;
  }

  .no-results {
    padding: 0.5rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .fun-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .btn-poggers,
  .btn-hungry {
    flex: 1;
    padding: 0.875rem 1rem;
    min-height: 52px;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.9375rem;
    color: white;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .btn-poggers {
    background: linear-gradient(135deg, #a78bfa, #e879f9);
  }

  .btn-hungry {
    background: linear-gradient(135deg, #22d3ee, #3b82f6);
  }

  .btn-poggers:hover,
  .btn-hungry:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .btn-poggers:active,
  .btn-hungry:active {
    transform: translateY(0);
  }
</style>
