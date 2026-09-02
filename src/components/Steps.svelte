<script lang="ts">
  interface Props {
    steps: string[];
  }

  let { steps }: Props = $props();

  let completed = $state(steps.map(() => false));

  function toggleStep(index: number) {
    completed = completed.map((c, i) => i === index ? !c : c);
  }

  let completedCount = $derived(completed.filter(Boolean).length);
  let allCompleted = $derived(completedCount === steps.length);
</script>

<section class="mt-6 lg:mt-0">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg md:text-xl font-semibold text-gray-900">Steps</h2>
    {#if completedCount > 0}
      <span class="text-sm text-gray-500">
        {completedCount}/{steps.length} done
      </span>
    {/if}
  </div>

  {#if allCompleted}
    <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
      <span class="text-green-700 font-medium">All done! Enjoy your meal!</span>
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
        <p class="step-text">{step}</p>
      </li>
    {/each}
  </ol>
</section>

<style>
  .step-row {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    transition: all 0.2s;
  }

  .step-row:hover {
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
  }

  .step-row.completed {
    background: rgb(249 250 251);
  }

  .step-row.completed .step-text {
    color: #9ca3af;
    text-decoration: line-through;
  }

  .step-number {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f97316;
    color: white;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .step-number:hover {
    background: #ea580c;
    transform: scale(1.05);
  }

  .step-row.completed .step-number {
    background: #22c55e;
  }

  .step-text {
    flex: 1;
    color: #1f2937;
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
