<script lang="ts">
  import type { Ingredient, Link } from '../utils/recipe';
  import { servings } from '../stores/servings';
  import {
    getBaseQuantity,
    calculateServingsAdjustedQuantity,
    convertToDisplayUnit,
    formatQuantity
  } from '../utils/recipe';
  import { getNextUnit, isConvertible, getUnitDisplay } from '../utils/units';
  import { pipe } from '../utils/generic';

  interface Props {
    ingredients: (Ingredient | Link)[];
    initialServings: number;
  }

  let { ingredients, initialServings }: Props = $props();

  // Ensure servings store has a value on mount
  $effect(() => {
    if ($servings === undefined) {
      servings.set(initialServings);
    }
  });

  let displayUnits = $state(
    ingredients.map(ing => ing.type === 'link' ? null : (ing as Ingredient).unit)
  );

  let checked = $state(ingredients.map(() => false));

  function handleUnitSwap(index: number) {
    displayUnits = displayUnits.map((unit, i) => {
      if (i !== index || !unit) return unit;
      return getNextUnit(unit);
    });
  }

  function toggleChecked(index: number) {
    checked = checked.map((c, i) => i === index ? !c : c);
  }

  function getDisplayQuantity(ingredient: Ingredient, displayUnit: string): string {
    try {
      const currentServings = $servings ?? initialServings;
      return pipe(
        ingredient,
        getBaseQuantity,
        (quantity: ReturnType<typeof getBaseQuantity>) => calculateServingsAdjustedQuantity(quantity, currentServings, initialServings),
        (quantity: ReturnType<typeof getBaseQuantity>) => convertToDisplayUnit(quantity, ingredient.unit, displayUnit),
        formatQuantity
      );
    } catch (error) {
      console.error('Error calculating quantity:', error);
      return ingredient.quantity.toString();
    }
  }
</script>

<section class="ingredients-section">
  <h3>Ingredients</h3>
  <ul>
    {#each ingredients as ingredient, i}
      <li class="ingredient-row" class:checked={checked[i]}>
        <!-- Checkbox -->
        <button
          class="checkbox"
          onclick={() => toggleChecked(i)}
          aria-label={checked[i] ? "Mark as needed" : "Mark as gathered"}
        >
          {#if checked[i]}
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>

        {#if ingredient.type === 'link'}
          <a class="ingredient-link" href={`/recipe/${ingredient.slug}`}>{ingredient.name}</a>
        {:else}
          {#key $servings}
            <span class="qty">{getDisplayQuantity(ingredient as Ingredient, displayUnits[i] ?? '')}</span>
          {/key}
          {#if displayUnits[i]}
            <span class="unit">{getUnitDisplay(displayUnits[i] ?? '')}</span>
          {/if}
          <span class="name">{ingredient.name}</span>
        {/if}

        <!-- Convert button always on far right -->
        {#if ingredient.type !== 'link' && isConvertible((ingredient as Ingredient).unit)}
          <button
            class="convert-btn"
            onclick={() => handleUnitSwap(i)}
            title="Convert unit"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </button>
        {:else}
          <span class="convert-spacer"></span>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .ingredients-section {
    margin-top: 1.5rem;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.75rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  /* Flexbox: left-aligned items, convert pushed right */
  .ingredient-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0;
    line-height: 1.4;
  }

  .ingredient-row.checked .qty,
  .ingredient-row.checked .unit,
  .ingredient-row.checked .name,
  .ingredient-row.checked .ingredient-link {
    text-decoration: line-through;
    color: #9ca3af;
  }

  /* Checkbox */
  .checkbox {
    width: 22px;
    height: 22px;
    min-width: 22px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    cursor: pointer;
    transition: all 0.15s;
    padding: 0;
    flex-shrink: 0;
  }

  .checkbox svg {
    width: 14px;
    height: 14px;
  }

  .checkbox:hover {
    border-color: #9ca3af;
  }

  .ingredient-row.checked .checkbox {
    background-color: #f97316;
    border-color: #f97316;
    color: white;
  }

  .qty {
    font-variant-numeric: tabular-nums;
    color: #ea580c;
    font-weight: 500;
    white-space: nowrap;
  }

  .unit {
    color: #6b7280;
    font-size: 0.875rem;
  }

  /* Ingredient name */
  .name {
    color: #1f2937;
    font-weight: 600;
  }

  /* Convert button - pushed to right */
  .convert-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    margin-left: auto;
    padding: 0;
    color: #d1d5db;
    border-radius: 6px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .convert-btn svg {
    width: 18px;
    height: 18px;
  }

  .convert-btn:hover {
    color: #f97316;
    background-color: rgba(249, 115, 22, 0.1);
  }

  .convert-btn:active {
    background-color: rgba(249, 115, 22, 0.2);
  }

  .convert-spacer {
    width: 28px;
    min-width: 28px;
    margin-left: auto;
  }

  /* Recipe links */
  .ingredient-link {
    color: #0369a1;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    flex: 1;
  }

  .ingredient-link:hover {
    color: #0284c7;
  }

  /* Mobile */
  @media (max-width: 480px) {
    .ingredient-row {
      gap: 0.375rem;
    }

    .qty {
      font-size: 0.9375rem;
    }

    .unit {
      font-size: 0.8125rem;
    }

    .name {
      font-size: 0.9375rem;
    }
  }
</style>
