<script lang="ts">
  import { pickRandom } from "../utils/generic";
  import { convertDurationToMinutes } from "../utils/time";
  import type { SearchEntry } from '../utils/search';
  import { fade } from "svelte/transition";
  import Fuse from "fuse.js";

  type RecipeEntry = SearchEntry;

  interface Props {
    searchContent?: RecipeEntry[];
    funMode?: boolean;
    children?: import('svelte').Snippet;
  }

  let { searchContent = [], funMode = false, children }: Props = $props();

  let searchValue = $state('');
  let audio = $state<HTMLAudioElement | null>(null);
  let inputFocused = $state(false);

  const fuse = new Fuse(searchContent, {
    keys: [
      { name: "data.name", weight: 1.0 },
      { name: "data.author", weight: 0.7 },
      // Recipe content lives in the frontmatter, so index it directly rather
      // than the (now empty) markdown body.
      { name: "data.ingredients.name", weight: 0.5 },
      { name: "data.steps", weight: 0.3 },
    ],
    threshold: 0.3,
  });

  let filteredRecipes = $derived(
    searchValue.length > 0
      ? fuse.search(searchValue).map((result) => result.item)
      : []
  );

  let isSearching = $derived(searchValue.length > 0);
  let hasResults = $derived(filteredRecipes.length > 0);

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

  /** Times are free text, so fall back to showing them verbatim. */
  function formatTime(time: string): string {
    const minutes = convertDurationToMinutes(time);
    return minutes === null ? time : `${minutes}m`;
  }

  function clearSearch() {
    searchValue = '';
  }
</script>

<div class="search-layout">
  <!-- Top: categories fade out on search -->
  <div class="categories" class:categories-hidden={isSearching}>
    {@render children?.()}
  </div>

  <!-- Middle: results stack from bottom of gap, right above the search bar -->
  <div class="results-gap">
    {#each filteredRecipes.slice(0, 5) as recipe (recipe.id)}
      <a href={`/recipe/${recipe.id}`} class="result-item">
        <span class="result-time">{formatTime(recipe.data.time)}</span>
        <span class="result-emoji">{recipe.data.emoji}</span>
        <span class="result-name">{recipe.data.name}</span>
      </a>
    {/each}
    {#if isSearching && !hasResults}
      <p class="no-results">No recipes found</p>
    {/if}
  </div>

  <!-- Bottom: search bar + fun buttons -->
  <div class="bottom">
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

    <div class="fun-buttons">
      <button onclick={playAudio} class="btn-poggers">
        I'm feeling poggers
      </button>
      <a href={`/recipe/${pickRandom(searchContent)?.id ?? ''}`} class="btn-hungry">
        I'm hungry
      </a>
    </div>
  </div>
</div>

<audio id="audio" src="https://www.myinstants.com/media/sounds/taco-bell-bong-sfx.mp3"></audio>

<style>
  .search-layout {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .categories {
    transition: opacity 0.2s ease;
  }

  .categories-hidden {
    opacity: 0;
    pointer-events: none;
  }

  /* Fills the gap between categories and bottom; results align to the end */
  .results-gap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0.5rem 0;
  }

  .bottom {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
    min-width: 3.25rem;
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
