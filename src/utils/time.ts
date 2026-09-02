/**
 * Best-effort "30 minutes" -> 30. Times are free text typed by whoever added
 * the recipe, so anything unparseable returns null for the caller to fall back on.
 */
export function convertDurationToMinutes(durationString: string): number | null {
  const [timeNumber, timeUnit] = durationString.trim().split(" ");
  // Number("") is 0, so an empty string has to be rejected explicitly.
  const value = timeNumber ? Number(timeNumber) : NaN;
  if (!Number.isFinite(value)) return null;
  return /^hours?$/i.test(timeUnit ?? "") ? value * 60 : value;
}
