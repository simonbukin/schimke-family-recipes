import { describe, it, expect } from "vitest";
import { findDurations, formatCountdown, segmentStep } from "./timers";

const secondsFor = (text: string) => findDurations(text).map((d) => d.seconds);

describe("findDurations", () => {
  it("finds the common cooking phrasings", () => {
    expect(secondsFor("Bake for 20 minutes")).toEqual([1200]);
    expect(secondsFor("Rest 30 seconds")).toEqual([30]);
    expect(secondsFor("Simmer for 1 hour")).toEqual([3600]);
    expect(secondsFor("Whisk 45 secs")).toEqual([45]);
    expect(secondsFor("Chill 2 hrs")).toEqual([7200]);
    expect(secondsFor("Knead 10 min")).toEqual([600]);
  });

  it("uses the midpoint of a range", () => {
    expect(secondsFor("Bake 25-30 minutes")).toEqual([28 * 60]);
    expect(secondsFor("Rest 2–3 min")).toEqual([3 * 60]);
    expect(secondsFor("Bake 5-10 minutes")).toEqual([8 * 60]);
  });

  it("snaps a range midpoint to whole minutes, or whole seconds", () => {
    // 7.5 minutes is an artefact of averaging, so it rounds to 8.
    expect(secondsFor("Cook 5-10 minutes")).toEqual([480]);
    // Seconds keep second precision: the midpoint of 60-90 really is 75.
    expect(secondsFor("Saute 60-90 seconds")).toEqual([75]);
  });

  it("leaves an explicitly written fractional duration exact", () => {
    // Only manufactured midpoints get rounded.
    expect(secondsFor("Wait 2.5 minutes")).toEqual([150]);
  });

  it("reads a range written in words", () => {
    // Real recipes phrase it both ways: "2-3 minutes" and "55 to 65 minutes".
    expect(secondsFor("Bake for 55 to 65 minutes")).toEqual([60 * 60]);
    expect(secondsFor("Beat until light, 3 to 4 minutes")).toEqual([4 * 60]);
    expect(secondsFor("Rest 1 or 2 minutes")).toEqual([2 * 60]);
  });

  it("keeps the whole range in the label", () => {
    // Labelling this "65 minutes" would look like the range had been mangled.
    expect(findDurations("Bake for 55 to 65 minutes")[0].text).toBe(
      "55 to 65 minutes"
    );
  });

  it("does not treat a bare 'to' as a duration", () => {
    expect(secondsFor("Heat the oven to 400 F")).toEqual([]);
    expect(secondsFor("Add 2 to 3 cups of flour")).toEqual([]);
  });

  it("handles mixed fractions and decimals", () => {
    expect(secondsFor("Rise for 1 1/2 hours")).toEqual([5400]);
  });

  it("adjusts hours by the minute, not by the hour", () => {
    expect(findDurations("Chill 1 to 2 hours")[0]).toMatchObject({
      seconds: 90 * 60,
      stepSeconds: 60,
    });
    expect(findDurations("Rest 30 seconds")[0].stepSeconds).toBe(1);
    expect(findDurations("Bake 20 minutes")[0].stepSeconds).toBe(60);
  });

  it("finds several durations in one step", () => {
    expect(secondsFor("Sear 2 minutes, then rest 30 seconds")).toEqual([120, 30]);
  });

  it("ignores things that are not durations", () => {
    // The temperature is the classic false positive.
    expect(secondsFor("Preheat the oven to 350 F")).toEqual([]);
    expect(secondsFor("Add 2 cups of flour")).toEqual([]);
    expect(secondsFor("Serves 4 people")).toEqual([]);
    expect(secondsFor("Use a 9x13 pan")).toEqual([]);
  });

  it("rejects durations outside a plausible range", () => {
    expect(secondsFor("Wait 1 second")).toEqual([]);
    expect(secondsFor("Cure for 40 hours")).toEqual([]);
  });

  it("leaves a sentence's full stop out of the label", () => {
    const [match] = findDurations("Simmer for 20 minutes.");
    expect(match.text).toBe("20 minutes");
    expect(segmentStep("Simmer for 20 minutes.").at(-1)).toEqual({
      type: "text",
      text: ".",
    });
  });

  it("still absorbs the period of an abbreviation", () => {
    expect(findDurations("Rest 20 min. before slicing")[0].text).toBe("20 min.");
  });

  it("reads a bare 'm' as minutes", () => {
    expect(secondsFor("Boil 8 m")).toEqual([480]);
  });
});

describe("segmentStep", () => {
  it("returns the whole step when there is no duration", () => {
    expect(segmentStep("Chop the onion")).toEqual([
      { type: "text", text: "Chop the onion" },
    ]);
  });

  it("splits around the duration without losing any text", () => {
    const segments = segmentStep("Bake for 20 minutes until golden");
    expect(segments).toEqual([
      { type: "text", text: "Bake for " },
      { type: "duration", text: "20 minutes", seconds: 1200, stepSeconds: 60 },
      { type: "text", text: " until golden" },
    ]);
    expect(segments.map((s) => s.text).join("")).toBe(
      "Bake for 20 minutes until golden"
    );
  });

  it("preserves the full text with several durations", () => {
    const original = "Sear 2 minutes, flip, then rest 30 seconds before slicing";
    expect(segmentStep(original).map((s) => s.text).join("")).toBe(original);
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds", () => {
    expect(formatCountdown(90)).toBe("1:30");
    expect(formatCountdown(5)).toBe("0:05");
    expect(formatCountdown(0)).toBe("0:00");
  });

  it("adds an hours field only when needed", () => {
    expect(formatCountdown(3700)).toBe("1:01:40");
    expect(formatCountdown(3599)).toBe("59:59");
  });

  it("never renders a negative countdown", () => {
    expect(formatCountdown(-5)).toBe("0:00");
  });
});
