<script lang="ts">
  import { formatCountdown } from '../utils/timers';

  interface Props {
    /** The duration text as written in the step, e.g. "20 minutes". */
    label: string;
    seconds: number;
  }

  let { label, seconds }: Props = $props();

  type State = 'idle' | 'running' | 'paused' | 'done';

  let state = $state<State>('idle');
  let remaining = $state(seconds);
  let endsAt = 0;
  let ticker: ReturnType<typeof setInterval> | null = null;

  // Drive the countdown off a wall-clock deadline. Background tabs throttle
  // timers, so counting intervals would drift badly over a 40 minute bake.
  function tick() {
    remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
    if (remaining === 0) finish();
  }

  function stopTicker() {
    if (ticker) clearInterval(ticker);
    ticker = null;
  }

  function start() {
    endsAt = Date.now() + remaining * 1000;
    state = 'running';
    stopTicker();
    ticker = setInterval(tick, 250);
  }

  function pause() {
    stopTicker();
    state = 'paused';
  }

  function reset() {
    stopTicker();
    remaining = seconds;
    state = 'idle';
  }

  function finish() {
    stopTicker();
    state = 'done';
    alarm();
  }

  /**
   * A short chime built with Web Audio, so there's no asset to ship and it
   * works offline. Browsers only allow this because a tap started the timer.
   */
  function alarm() {
    try {
      navigator.vibrate?.([300, 150, 300, 150, 500]);
    } catch {
      // Vibration is unsupported or blocked; the sound and colour still fire.
    }

    try {
      const AudioCtx =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      [0, 0.45, 0.9].forEach((offset) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, context.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.35);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + offset);
        oscillator.stop(context.currentTime + offset + 0.4);
      });
      setTimeout(() => context.close(), 2000);
    } catch {
      // Audio blocked; the vibration and colour change still signal the end.
    }
  }

  $effect(() => stopTicker);
</script>

<span class="timer" class:running={state === 'running'} class:done={state === 'done'}>
  {#if state === 'idle'}
    <button type="button" onclick={start} title={`Start a ${label} timer`}>
      <span class="icon" aria-hidden="true">⏱</span>{label}
    </button>
  {:else if state === 'done'}
    <button type="button" onclick={reset} aria-live="polite">
      <span class="icon" aria-hidden="true">🔔</span>{label} — time's up
    </button>
  {:else}
    <button
      type="button"
      onclick={state === 'running' ? pause : start}
      title={state === 'running' ? 'Pause' : 'Resume'}
    >
      <span class="icon" aria-hidden="true">{state === 'running' ? '⏸' : '▶'}</span>
      {formatCountdown(remaining)}
    </button>
    <button type="button" class="cancel" onclick={reset} aria-label="Cancel timer">✕</button>
  {/if}
</span>

<style>
  .timer {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    vertical-align: baseline;
    margin: 0 1px;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    /* Tall enough to tap, but still sits inline in the sentence. */
    min-height: 32px;
    padding: 0.125rem 0.5rem;
    border: 1px solid var(--color-accent-line);
    border-radius: 0.5rem;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font: inherit;
    font-weight: 600;
    line-height: 1.3;
    cursor: pointer;
    white-space: nowrap;
  }

  button:hover {
    border-color: var(--color-marker);
  }

  .icon {
    font-size: 0.875em;
  }

  .running button {
    border-color: var(--color-marker);
    color: var(--color-marker);
    font-variant-numeric: tabular-nums;
  }

  .done button {
    border-color: var(--color-done);
    color: var(--color-done);
    animation: pulse 1s ease-in-out infinite;
  }

  .cancel {
    padding: 0.125rem 0.375rem;
    color: var(--color-ink-subtle);
  }

  @keyframes pulse {
    50% {
      opacity: 0.55;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .done button {
      animation: none;
    }
  }
</style>
