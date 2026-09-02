<script lang="ts">
  let { toggleLabel }: { toggleLabel: string } = $props();

  let isSupported = $state(false);
  let isEnabled = $state(false);
  let wakeLock = $state<WakeLockSentinel | null>(null);
  let timer = $state(0);
  let interval = $state<ReturnType<typeof setInterval> | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    isSupported = "wakeLock" in navigator;

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isEnabled && !wakeLock) {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
      stopTimer();
    };
  });

  async function requestWakeLock() {
    try {
      error = null;
      wakeLock = await navigator.wakeLock.request("screen");

      // Listen for when the system releases the lock
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to enable";
      isEnabled = false;
      stopTimer();
    }
  }

  async function releaseWakeLock() {
    if (wakeLock) {
      try {
        await wakeLock.release();
      } catch {
        // Ignore release errors
      }
      wakeLock = null;
    }
  }

  const toggle = async () => {
    isEnabled = !isEnabled;

    if (isEnabled) {
      timer = 0;
      startTimer();
      await requestWakeLock();
    } else {
      stopTimer();
      await releaseWakeLock();
    }
  };

  const startTimer = () => {
    interval = setInterval(() => {
      timer++;
    }, 1000);
  };

  /** Raw seconds stop being readable after a minute or so. */
  const formatElapsed = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0
      ? `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`
      : `${seconds}s`;
  };

  const stopTimer = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    timer = 0;
  };
</script>

{#if isSupported}
  <div class="wake">
    <button
      type="button"
      class="switch"
      class:on={isEnabled}
      role="switch"
      aria-checked={isEnabled}
      onclick={toggle}
    >
      <span class="track"><span class="thumb"></span></span>
      <span class="label">Keep screen awake</span>
    </button>

    {#if isEnabled && wakeLock}
      <p class="status">cookin' for {formatElapsed(timer)} 👨‍🍳</p>
    {/if}
    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>
{/if}

<style>
  .wake {
    margin: 1rem 0;
  }

  /* Full-width and 44px tall: this gets tapped with messy hands. */
  .switch {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--color-edge);
    border-radius: 0.625rem;
    background: var(--color-surface);
    color: var(--color-ink);
    font-weight: 600;
    cursor: pointer;
  }

  .switch.on {
    border-color: var(--color-marker);
    background: var(--color-accent-soft);
  }

  .track {
    position: relative;
    flex-shrink: 0;
    width: 42px;
    height: 24px;
    border-radius: 9999px;
    background: var(--color-edge-strong);
    transition: background-color 0.15s;
  }

  .switch.on .track {
    background: var(--color-marker);
  }

  .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    background: #fff;
    transition: transform 0.15s;
  }

  .switch.on .thumb {
    transform: translateX(18px);
  }

  .status {
    margin-top: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-ink-muted);
  }

  .error {
    margin-top: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-danger);
  }
</style>