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

  it("uses the upper bound of a range", () => {
    // Underestimating a bake is worse than overestimating it.
    expect(secondsFor("Bake 25-30 minutes")).toEqual([1800]);
    expect(secondsFor("Rest 2–3 min")).toEqual([180]);
  });

  it("handles mixed fractions and decimals", () => {
    expect(secondsFor("Rise for 1 1/2 hours")).toEqual([5400]);
    expect(secondsFor("Wait 2.5 minutes")).toEqual([150]);
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
      { type: "duration", text: "20 minutes", seconds: 1200 },
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
