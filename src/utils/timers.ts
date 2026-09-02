/**
 * Finds cooking durations inside step text so they can be offered as timers.
 *
 * Steps are prose written by whoever added the recipe, so this is deliberately
 * conservative: it matches a number followed by a time word, and nothing else.
 * A false positive starts a wrong timer, which is worse than missing one.
 */

export interface DurationMatch {
  /** Index into the original string. */
  start: number;
  end: number;
  /** The matched text, e.g. "20 minutes". */
  text: string;
  /** Total duration in seconds. For a range, the rounded midpoint. */
  seconds: number;
  /**
   * How much one tap of the +/- control moves the timer: a second for
   * durations written in seconds, a minute for minutes *and* hours. Nobody
   * adjusts a two hour braise an hour at a time.
   */
  stepSeconds: number;
}

const UNIT_SECONDS: Record<string, number> = {
  second: 1,
  sec: 1,
  s: 1,
  minute: 60,
  min: 60,
  hour: 3600,
  hr: 3600,
  h: 3600,
};

/** Ranges are written both ways: "2-3 minutes" and "55 to 65 minutes". */
const RANGE_SEPARATOR = String.raw`(?:\s*[-–—]\s*|\s+(?:to|or)\s+)`;

/*
 * "20 minutes", "1 1/2 hours", "2-3 min", "55 to 65 minutes", "30 secs".
 * A trailing "." is only consumed as part of an abbreviation ("20 min."),
 * never off the end of a sentence ("20 minutes.").
 */
const DURATION = new RegExp(
  String.raw`(\d+(?:\s+\d+\/\d+)?(?:\.\d+)?(?:` +
    RANGE_SEPARATOR +
    String.raw`\d+(?:\.\d+)?)?)\s*` +
    String.raw`(seconds?\b|secs?\b\.?|minutes?\b|mins?\b\.?|hours?\b|hrs?\b\.?|[hms]\b)`,
  "gi"
);

function normalizeUnit(raw: string): number | null {
  // Strip the abbreviation's period before the plural "s": "mins." -> "min".
  const unit = raw.toLowerCase().replace(/\.$/, "").replace(/s$/, "");
  // Bare "m" is ambiguous but overwhelmingly means minutes in recipes.
  if (unit === "m") return 60;
  return UNIT_SECONDS[unit] ?? null;
}

interface Amount {
  value: number;
  /** Ranges produce a manufactured value, so only those get rounded. */
  isRange: boolean;
}

/** "2-3" -> 2.5, "1 1/2" -> 1.5, "0.5" -> 0.5. Ranges use the midpoint. */
function parseAmount(raw: string): Amount {
  const text = raw.trim();

  const range = text.match(
    /^([\d.]+)(?:\s*[-–—]\s*|\s+(?:to|or)\s+)([\d.]+)$/i
  );
  if (range) {
    return {
      value: (Number(range[1]) + Number(range[2])) / 2,
      isRange: true,
    };
  }

  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    return {
      value: denominator
        ? Number(mixed[1]) + Number(mixed[2]) / denominator
        : NaN,
      isRange: false,
    };
  }

  return { value: Number(text), isRange: false };
}

/** A minute for anything written in minutes or hours, a second otherwise. */
function stepFor(unitSeconds: number): number {
  return unitSeconds >= 60 ? 60 : 1;
}

export function findDurations(text: string): DurationMatch[] {
  const matches: DurationMatch[] = [];

  for (const match of text.matchAll(DURATION)) {
    const unitSeconds = normalizeUnit(match[2]);
    if (unitSeconds === null) continue;

    const amount = parseAmount(match[1]);
    if (!Number.isFinite(amount.value) || amount.value <= 0) continue;

    const stepSeconds = stepFor(unitSeconds);
    const exact = amount.value * unitSeconds;
    // A midpoint like 7.5 minutes is an artefact of averaging, so snap it to
    // the step. An explicitly written "2.5 minutes" is left exactly alone.
    const seconds = amount.isRange
      ? Math.max(stepSeconds, Math.round(exact / stepSeconds) * stepSeconds)
      : Math.round(exact);
    // Guard against nonsense like "350 F" slipping through as 350 seconds, and
    // against timers nobody would set.
    if (seconds < 5 || seconds > 24 * 3600) continue;

    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      seconds,
      stepSeconds,
    });
  }

  return matches;
}

/** Split a step into plain text and timer-able durations, in order. */
export type Segment =
  | { type: "text"; text: string }
  | { type: "duration"; text: string; seconds: number; stepSeconds: number };

export function segmentStep(text: string): Segment[] {
  const durations = findDurations(text);
  if (durations.length === 0) return [{ type: "text", text }];

  const segments: Segment[] = [];
  let cursor = 0;

  for (const duration of durations) {
    if (duration.start > cursor) {
      segments.push({ type: "text", text: text.slice(cursor, duration.start) });
    }
    segments.push({
      type: "duration",
      text: duration.text,
      seconds: duration.seconds,
      stepSeconds: duration.stepSeconds,
    });
    cursor = duration.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", text: text.slice(cursor) });
  }
  return segments;
}

/** Countdown display: 90 -> "1:30", 3700 -> "1:01:40". */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds % 60)}`
    : `${minutes}:${pad(seconds % 60)}`;
}
