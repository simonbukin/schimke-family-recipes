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
  /** Total duration in seconds. For a range, the upper bound. */
  seconds: number;
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

/*
 * "20 minutes", "1 1/2 hours", "2-3 min", "30 secs".
 * The number may be a range. A trailing "." is only consumed as part of an
 * abbreviation ("20 min."), never off the end of a sentence ("20 minutes.").
 */
const DURATION =
  /(\d+(?:\s+\d+\/\d+)?(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)?)\s*(seconds?\b|secs?\b\.?|minutes?\b|mins?\b\.?|hours?\b|hrs?\b\.?|[hms]\b)/gi;

function normalizeUnit(raw: string): number | null {
  // Strip the abbreviation's period before the plural "s": "mins." -> "min".
  const unit = raw.toLowerCase().replace(/\.$/, "").replace(/s$/, "");
  // Bare "m" is ambiguous but overwhelmingly means minutes in recipes.
  if (unit === "m") return 60;
  return UNIT_SECONDS[unit] ?? null;
}

/** "2-3" -> 3, "1 1/2" -> 1.5, "0.5" -> 0.5. Ranges use the upper bound. */
function parseAmount(raw: string): number {
  const text = raw.trim();

  const range = text.match(/^([\d.]+)\s*[-–—]\s*([\d.]+)$/);
  if (range) return Number(range[2]);

  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    return denominator ? Number(mixed[1]) + Number(mixed[2]) / denominator : NaN;
  }

  return Number(text);
}

export function findDurations(text: string): DurationMatch[] {
  const matches: DurationMatch[] = [];

  for (const match of text.matchAll(DURATION)) {
    const unitSeconds = normalizeUnit(match[2]);
    if (unitSeconds === null) continue;

    const amount = parseAmount(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const seconds = Math.round(amount * unitSeconds);
    // Guard against nonsense like "350 F" slipping through as 350 seconds, and
    // against timers nobody would set.
    if (seconds < 5 || seconds > 24 * 3600) continue;

    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      seconds,
    });
  }

  return matches;
}

/** Split a step into plain text and timer-able durations, in order. */
export type Segment =
  | { type: "text"; text: string }
  | { type: "duration"; text: string; seconds: number };

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
