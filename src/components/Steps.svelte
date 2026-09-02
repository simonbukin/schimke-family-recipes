<script lang="ts">
  import StepTimer from './StepTimer.svelte';
  import { segmentStep } from '../utils/timers';

  interface Props {
    steps: string[];
  }

  let { steps }: Props = $props();

  // Durations written in a step ("bake 20 minutes") become tappable timers.
  let stepSegments = $derived(steps.map(segmentStep));

  let completed = $state(steps.map(() => false));

  function toggleStep(index: number) {
    completed = completed.map((c, i) => i === index ? !c : c);
  }

  let completedCount = $derived(completed.filter(Boolean).length);
  let allCompleted = $derived(completedCount === steps.length);
</script>

<section class="mt-6 lg:mt-0">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg md:text-xl font-semibold text-ink">Steps</h2>
    {#if completedCount > 0}
      <span class="text-sm text-ink-subtle">
        {completedCount}/{steps.length} done
      </span>
    {/if}
  </div>

  {#if allCompleted}
    <div class="mb-4 p-3 bg-accent-soft border border-edge rounded-lg text-center">
      <span class="text-done font-medium">All done! Enjoy your meal!</span>
    </div>
  {/if}

  <ol class="space-y-3">
    {#each steps as step, index}
      <li
        class="step-row"
        class:completed={completed[index]}
      >
        <button
          class="step-number"
          onclick={() => toggleStep(index)}
          aria-label={completed[index] ? "Mark as incomplete" : "Mark as complete"}
        >
          {#if completed[index]}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {:else}
            {index + 1}
          {/if}
        </button>
        <p class="step-text">{#each stepSegments[index] as segment}{#if segment.type === 'duration'}<StepTimer label={segment.text} seconds={segment.seconds} />{:else}{segment.text}{/if}{/each}</p>
      </li>
    {/each}
  </ol>
</section>

<style>
  .step-row {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--color-surface);
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    transition: all 0.2s;
  }

  .step-row:hover {
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
  }

  .step-row.completed {
    background: var(--color-surface-sunken);
  }

  .step-row.completed .step-text {
    color: var(--color-ink-subtle);
    text-decoration: line-through;
  }

  .step-number {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-marker);
    color: white;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .step-number:hover {
    background: var(--color-accent-strong);
    transform: scale(1.05);
  }

  .step-row.completed .step-number {
    background: var(--color-done);
  }

  .step-text {
    flex: 1;
    color: var(--color-ink);
    line-height: 1.6;
    /* Steps are written in a textarea, so keep the author's line breaks. */
    white-space: pre-line;
  }

  @media (min-width: 768px) {
    .step-text {
      font-size: 1.0625rem;
    }
  }
</style>
