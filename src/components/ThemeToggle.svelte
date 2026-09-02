<script lang="ts">
  /**
   * Light is the default; dark is opt-in and remembered per device.
   * The <head> script has already applied the stored theme before first paint,
   * so this only mirrors and updates it.
   */
  let isDark = $state(false);

  $effect(() => {
    isDark = document.documentElement.dataset.theme === 'dark';
  });

  function toggle() {
    const next = isDark ? 'light' : 'dark';
    isDark = !isDark;

    const root = document.documentElement;
    // Suppress hover/colour transitions for the swap itself, so the whole page
    // changes at once instead of shimmering element by element.
    root.classList.add('theme-switching');
    root.dataset.theme = next;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove('theme-switching'))
    );

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next === 'dark' ? '#17120e' : '#f59e0b');

    try {
      localStorage.setItem('theme', next);
    } catch {
      // Blocked storage: the choice just won't persist.
    }
  }
</script>

<button
  type="button"
  class="toggle"
  onclick={toggle}
  aria-pressed={isDark}
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if isDark}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Zm0-18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1ZM1 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1Zm18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1ZM4.22 4.22a1 1 0 0 1 1.41 0l1.42 1.42a1 1 0 0 1-1.42 1.41L4.22 5.64a1 1 0 0 1 0-1.42Zm12.73 12.73a1 1 0 0 1 1.41 0l1.42 1.41a1 1 0 0 1-1.42 1.42l-1.41-1.42a1 1 0 0 1 0-1.41ZM19.78 4.22a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0ZM7.05 16.95a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 0 1-1.41-1.42l1.41-1.41a1 1 0 0 1 1.42 0Z"
      />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.6 8.6 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69 1 1 0 0 0-.36-1.05Z"
      />
    </svg>
  {/if}
</button>

<style>
  .toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 9999px;
    background: rgb(255 255 255 / 0.18);
    color: white;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .toggle:hover {
    background: rgb(255 255 255 / 0.3);
  }

  .toggle:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }

  .toggle svg {
    width: 20px;
    height: 20px;
  }
</style>
