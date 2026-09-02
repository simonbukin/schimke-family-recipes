<script lang="ts">
  import { actions, isInputError } from 'astro:actions';
  import { RECIPE_TYPES, type RecipeFile } from '../utils/recipeFile';
  import { parseIngredientBlock } from '../utils/ingredientText';

  interface Props {
    /** Existing slug when editing; undefined when creating. */
    slug?: string;
    /** Blob SHA this edit started from, for conflict detection on save. */
    baseSha?: string;
    recipe?: RecipeFile;
    /** Slugs available to cross-link as an ingredient. */
    recipeOptions: { slug: string; name: string }[];
  }

  let { slug, baseSha = '', recipe, recipeOptions }: Props = $props();

  /*
   * Every row carries a stable id. Keying the {#each} blocks on the array index
   * instead would make reordering patch values into the existing inputs, so the
   * caret would stay put while the text moved out from under it.
   */
  let nextId = 0;
  const withId = <T,>(row: T) => ({ id: nextId++, ...row });

  type IngredientRow = {
    id: number;
    name: string;
    qty: string;
    unit: string;
    recipe: string;
  };
  type CookwareRow = { id: number; name: string; qty: string };
  type StepRow = { id: number; text: string };

  const blankIngredient = (recipeSlug = '') =>
    withId({ name: '', qty: '', unit: '', recipe: recipeSlug });

  function toRows(source?: RecipeFile): IngredientRow[] {
    const rows = (source?.ingredients ?? []).map((entry) =>
      'recipe' in entry
        ? withId({ name: '', qty: '', unit: '', recipe: entry.recipe })
        : withId({
            name: entry.name,
            qty: entry.qty ?? '',
            unit: entry.unit ?? '',
            recipe: ''
          })
    );
    return rows.length ? rows : [blankIngredient()];
  }

  let name = $state(recipe?.name ?? '');
  let emoji = $state(recipe?.emoji ?? '');
  let type = $state<string>(recipe?.type ?? 'entree');
  let author = $state(recipe?.author ?? '');
  let link = $state(recipe?.link ?? '');
  let time = $state(recipe?.time ?? '');
  let servings = $state(recipe?.servings ? String(recipe.servings) : '');
  let ingredients = $state<IngredientRow[]>(toRows(recipe));
  let cookware = $state<CookwareRow[]>(
    (recipe?.cookware ?? []).map((entry) =>
      withId({ name: entry.name, qty: entry.qty ?? '' })
    )
  );
  let steps = $state<StepRow[]>(
    recipe?.steps.length
      ? recipe.steps.map((text) => withId({ text }))
      : [withId({ text: '' })]
  );

  let saving = $state(false);
  let error = $state('');
  let pasteOpen = $state(false);
  let pasteText = $state('');

  const isNew = !slug;

  // `time` beside it is deliberately free text, so silently coercing "6-8" to 6
  // (or dropping "about 4" entirely) would be a trap. Say so instead.
  let servingsError = $derived(
    servings.trim() && !/^\d+$/.test(servings.trim())
      ? 'Servings must be a whole number, or leave it blank.'
      : ''
  );

  function addIngredient() {
    ingredients = [...ingredients, blankIngredient()];
  }
  function addLink() {
    ingredients = [...ingredients, blankIngredient(recipeOptions[0]?.slug ?? '')];
  }
  function removeAt<T>(list: T[], index: number): T[] {
    return list.filter((_, i) => i !== index);
  }
  function move<T>(list: T[], index: number, delta: number): T[] {
    const target = index + delta;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }

  /**
   * Bulk entry: paste "Butter, 3 tbsp" lines straight off a recipe card
   * instead of tapping through three fields per ingredient on a phone.
   */
  function applyPaste() {
    const parsed = parseIngredientBlock(pasteText);
    if (parsed.length === 0) return;
    // Keep any row the editor has started filling in, not just named ones.
    const existing = ingredients.filter(
      (row) => row.name || row.recipe || row.qty || row.unit
    );
    ingredients = [...existing, ...parsed.map((row) => withId({ ...row, recipe: '' }))];
    pasteText = '';
    pasteOpen = false;
  }

  /**
   * Pasting a multi-line list into a step splits it across steps, inserted at
   * that position. Single-line pastes fall through to the browser.
   */
  function applyStepPaste(event: ClipboardEvent, index: number) {
    const lines = (event.clipboardData?.getData('text') ?? '')
      .split('\n')
      .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
    if (lines.length < 2) return;

    event.preventDefault();
    // Replace the step being pasted into when it was still empty.
    const current = steps[index].text.trim() ? [steps[index]] : [];
    steps = [
      ...steps.slice(0, index),
      ...current,
      ...lines.map((text) => withId({ text })),
      ...steps.slice(index + 1)
    ];
  }

  /**
   * Validation failures arrive as field issues with no top-level message, so
   * they have to be unpacked or the error banner renders empty.
   */
  function describe(actionError: { message?: string }): string {
    if (isInputError(actionError as never)) {
      const fields = (actionError as never as { fields: Record<string, string[]> }).fields;
      const messages = Object.values(fields).flat();
      if (messages.length) return messages.join(' ');
    }
    return actionError.message || 'Something went wrong. Please try again.';
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    error = '';

    if (servingsError) {
      error = servingsError;
      saving = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const parsedServings = parseInt(servings, 10);
    const { data, error: actionError } = await actions.saveRecipe({
      slug,
      baseSha,
      name,
      emoji,
      type: type as RecipeFile['type'],
      author,
      link,
      time,
      servings: Number.isFinite(parsedServings) && parsedServings > 0 ? parsedServings : null,
      ingredients,
      cookware,
      steps: steps.map((step) => step.text)
    });

    saving = false;

    if (actionError) {
      error = describe(actionError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.location.href = `/admin/saved?slug=${encodeURIComponent(data.slug)}&created=${data.created}`;
  }

  async function confirmDelete() {
    if (!slug) return;
    if (!window.confirm(`Delete "${name}"? This commits a deletion to the repo.`)) return;
    saving = true;
    const { error: actionError } = await actions.deleteRecipe({ slug });
    saving = false;
    if (actionError) {
      error = describe(actionError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.location.href = '/admin?deleted=1';
  }
</script>

<form onsubmit={submit} class="form">
  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <section class="card">
    <div class="row">
      <label class="field emoji-field">
        <span>Emoji</span>
        <input bind:value={emoji} required maxlength="8" placeholder="🥧" />
      </label>
      <label class="field grow">
        <span>Name</span>
        <input bind:value={name} required placeholder="Shepherd's Pie" />
      </label>
    </div>

    <label class="field">
      <span>Category</span>
      <select bind:value={type}>
        {#each RECIPE_TYPES as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>

    <div class="row">
      <label class="field grow">
        <span>Time</span>
        <input bind:value={time} required placeholder="30 minutes" />
      </label>
      <label class="field servings-field">
        <span>Servings</span>
        <input
          bind:value={servings}
          inputmode="numeric"
          placeholder="4"
          aria-invalid={Boolean(servingsError)}
          class:invalid={servingsError}
        />
      </label>
    </div>

    {#if servingsError}
      <p class="field-error">{servingsError}</p>
    {/if}

    <label class="field">
      <span>Author</span>
      <input bind:value={author} placeholder="Grandma" />
    </label>
    <label class="field">
      <span>Source link</span>
      <input bind:value={link} type="url" inputmode="url" placeholder="https://..." />
    </label>
    <p class="hint">Fill in an author, a source link, or both.</p>
  </section>

  <section class="card">
    <div class="section-head">
      <h2>Ingredients</h2>
      <button type="button" class="ghost" onclick={() => (pasteOpen = !pasteOpen)}>
        {pasteOpen ? 'Close' : 'Paste a list'}
      </button>
    </div>

    {#if pasteOpen}
      <div class="paste">
        <textarea
          bind:value={pasteText}
          rows="5"
          placeholder={'Butter, 3 tbsp\nMilk, 1/2 cup\nSalt, to taste'}
        ></textarea>
        <button type="button" class="secondary" onclick={applyPaste}>Add these</button>
      </div>
    {/if}

    {#each ingredients as ingredient, i (ingredient.id)}
      <div class="entry">
        {#if ingredient.recipe}
          <select bind:value={ingredients[i].recipe} class="name">
            {#each recipeOptions as option}
              <option value={option.slug}>{option.name}</option>
            {/each}
          </select>
        {:else}
          <input class="name" bind:value={ingredients[i].name} placeholder="Ingredient" />
          <input class="qty" bind:value={ingredients[i].qty} placeholder="1 1/2" />
          <input class="unit" bind:value={ingredients[i].unit} placeholder="cups" />
        {/if}
        <div class="entry-actions">
          <button type="button" onclick={() => (ingredients = move(ingredients, i, -1))} aria-label="Move up">↑</button>
          <button type="button" onclick={() => (ingredients = move(ingredients, i, 1))} aria-label="Move down">↓</button>
          <button type="button" class="danger" onclick={() => (ingredients = removeAt(ingredients, i))} aria-label="Remove">✕</button>
        </div>
      </div>
    {/each}

    <div class="row">
      <button type="button" class="secondary grow" onclick={addIngredient}>+ Ingredient</button>
      {#if recipeOptions.length}
        <button type="button" class="secondary grow" onclick={addLink}>+ Recipe link</button>
      {/if}
    </div>
    <p class="hint">Leave the quantity blank, or write “to taste”.</p>
  </section>

  <section class="card">
    <h2>Cookware</h2>
    {#each cookware as row, i (row.id)}
      <div class="entry">
        <input class="name" bind:value={cookware[i].name} placeholder="Mixing bowl" />
        <input class="qty" bind:value={cookware[i].qty} inputmode="numeric" placeholder="1" />
        <div class="entry-actions">
          <button type="button" class="danger" onclick={() => (cookware = removeAt(cookware, i))} aria-label="Remove">✕</button>
        </div>
      </div>
    {/each}
    <button type="button" class="secondary" onclick={() => (cookware = [...cookware, withId({ name: '', qty: '' })])}>
      + Cookware
    </button>
  </section>

  <section class="card">
    <h2>Steps</h2>
    {#each steps as step, i (step.id)}
      <div class="entry step">
        <span class="step-number">{i + 1}</span>
        <textarea
          bind:value={steps[i].text}
          rows="3"
          placeholder="What happens next?"
          onpaste={(event) => applyStepPaste(event, i)}
        ></textarea>
        <div class="entry-actions">
          <button type="button" onclick={() => (steps = move(steps, i, -1))} aria-label="Move step up">↑</button>
          <button type="button" onclick={() => (steps = move(steps, i, 1))} aria-label="Move step down">↓</button>
          <button type="button" class="danger" onclick={() => (steps = removeAt(steps, i))} aria-label="Remove step">✕</button>
        </div>
      </div>
    {/each}
    <button type="button" class="secondary" onclick={() => (steps = [...steps, withId({ text: '' })])}>+ Step</button>
    <p class="hint">Pasting a numbered list into a step splits it into separate steps.</p>
  </section>

  {#if !isNew}
    <button type="button" class="danger-outline" onclick={confirmDelete} disabled={saving}>
      Delete this recipe
    </button>
  {/if}

  <div class="actions">
    <button type="submit" class="primary" disabled={saving}>
      {saving ? 'Saving…' : isNew ? 'Add recipe' : 'Save changes'}
    </button>
  </div>
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    /* Room for the sticky action bar on phones. */
    padding-bottom: 5rem;
  }

  .card {
    background: var(--color-surface);
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-ink);
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field > span {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-ink-muted);
  }

  .grow {
    flex: 1;
    min-width: 0;
  }

  .servings-field {
    flex: 0 0 5.5rem;
  }

  .emoji-field {
    flex: 0 0 auto;
  }

  .emoji-field input {
    width: 4rem;
    text-align: center;
    font-size: 1.25rem;
  }

  input,
  select,
  textarea {
    /* 16px keeps iOS Safari from zooming when a field is focused. */
    font-size: 16px;
    padding: 0.625rem;
    min-height: 44px;
    border: 2px solid var(--color-edge);
    border-radius: 0.5rem;
    background: var(--color-surface);
    width: 100%;
  }

  textarea {
    resize: vertical;
    line-height: 1.5;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-brand);
  }

  /*
   * On a phone the name gets a row to itself, with quantity, unit and the row
   * controls underneath. Wide screens collapse it back to a single line.
   */
  .entry {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    grid-template-areas:
      "name name name"
      "qty  unit actions";
    gap: 0.375rem;
    align-items: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-edge);
  }

  .entry:last-of-type {
    border-bottom: none;
  }

  .entry .name {
    grid-area: name;
  }
  .entry .qty {
    grid-area: qty;
  }
  .entry .unit {
    grid-area: unit;
  }
  .entry .entry-actions {
    grid-area: actions;
  }

  /* Steps: the number sits beside the text, the controls tuck underneath. */
  .entry.step {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      "num  text"
      "num  actions";
    align-items: start;
  }

  .entry.step .step-number {
    grid-area: num;
  }

  .entry.step textarea {
    grid-area: text;
  }

  .step-number {
    width: 1.75rem;
    height: 1.75rem;
    margin-top: 0.5rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-marker);
    color: white;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .entry-actions {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
  }

  .entry-actions button {
    width: 40px;
    height: 40px;
    border: 2px solid var(--color-edge);
    border-radius: 0.5rem;
    background: var(--color-surface);
    color: var(--color-ink-muted);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .entry-actions button.danger {
    color: var(--color-danger);
    border-color: var(--color-danger-line);
  }

  @media (min-width: 560px) {
    .entry {
      grid-template-columns: 1fr 5rem 5.5rem auto;
      grid-template-areas: "name qty unit actions";
      border-bottom: none;
      padding-bottom: 0;
    }

    .entry.step {
      grid-template-columns: auto 1fr auto;
      grid-template-areas: "num text actions";
    }
  }

  .paste {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  button.primary,
  button.secondary,
  button.ghost,
  button.danger-outline {
    min-height: 44px;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0 1rem;
  }

  button.primary {
    background: var(--color-brand);
    color: white;
    border: none;
    flex: 1;
  }

  button.primary:disabled {
    opacity: 0.6;
  }

  button.secondary {
    background: var(--color-accent-soft);
    border: 2px solid var(--color-accent-line);
    color: var(--color-accent);
  }

  button.ghost {
    background: transparent;
    border: none;
    color: var(--color-accent);
    font-size: 0.875rem;
  }

  button.danger-outline {
    background: var(--color-surface);
    border: 2px solid var(--color-danger-line);
    color: var(--color-danger);
  }

  .actions {
    position: sticky;
    bottom: 0;
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 0;
    background: linear-gradient(to top, var(--color-page) 70%, transparent);
  }

  .error {
    background: var(--color-danger-soft);
    border: 1px solid var(--color-danger-line);
    color: var(--color-danger-ink);
    padding: 0.75rem;
    border-radius: 0.5rem;
  }

  .field-error {
    font-size: 0.8125rem;
    color: var(--color-danger-ink);
  }

  input.invalid {
    border-color: var(--color-danger-line);
  }

  .hint {
    font-size: 0.8125rem;
    color: var(--color-ink-subtle);
  }
</style>
