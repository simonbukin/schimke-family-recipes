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

  const handleToggleClick = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    isEnabled = target.checked;

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

  const stopTimer = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    timer = 0;
  };
</script>

{#if isSupported}
  <div class="my-4 flex flex-row items-center flex-wrap gap-2">
    <label class="font-bold flex items-center gap-2 cursor-pointer" for="wake-lock-toggle">
      <input
        class="aspect-square w-[20px] shrink-0"
        type="checkbox"
        id="wake-lock-toggle"
        checked={isEnabled}
        onchange={handleToggleClick}
      />
      {toggleLabel}
    </label>
    {#if isEnabled && wakeLock}
      <p class="text-sm text-gray-600">cookin' for {timer}s 👨‍🍳</p>
    {/if}
    {#if error}
      <p class="text-sm text-red-500">{error}</p>
    {/if}
  </div>
{/if}