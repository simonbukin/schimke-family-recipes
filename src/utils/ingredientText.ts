/**
 * Parsing for free-text ingredient lines like "Butter, 3 tbsp".
 *
 * This is the format every recipe was originally written in. It is still used
 * in two places: the one-time migration to structured frontmatter, and the
 * "paste a list" bulk entry box in the recipe editor.
 */

export interface ParsedIngredientLine {
  name: string;
  qty: string;
  unit: string;
}

const TO_TASTE = /^to\s+taste$/i;

// "1 1/2", "1/2", "2", "0.25" followed by an optional unit ("cups", "oz can").
const QUANTITY = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(.*)$/;

/**
 * Split "1 1/2 teaspoons" into a quantity and a unit.
 *
 * The old parser split on the first space, so mixed fractions lost their unit:
 * "1 1/2 teaspoons" became quantity "1", unit "1/2".
 */
export function splitQuantityAndUnit(raw: string): { qty: string; unit: string } {
  const text = raw.trim();
  if (!text) return { qty: "", unit: "" };
  if (TO_TASTE.test(text)) return { qty: "to taste", unit: "" };

  // No leading number and not "to taste" -- the caller folds this back into
  // the ingredient name rather than inventing a quantity out of it.
  const match = text.match(QUANTITY);
  if (!match) return { qty: "", unit: "" };

  const [, qty, rest] = match;
  // The unit is stored as the author wrote it ("cups", "teaspoons").
  // `units.ts` normalizes it at display and conversion time.
  return { qty, unit: rest.trim() };
}

/**
 * Parse one "Name, quantity unit" line. Only the *last* comma separates the
 * quantity, so names may contain commas ("Cream cheese, softened, 8 oz").
 */
export function parseIngredientLine(raw: string): ParsedIngredientLine | null {
  const line = raw.replace(/^[-*]\s*/, "").trim();
  if (!line) return null;

  const splitAt = line.lastIndexOf(",");
  if (splitAt === -1) return { name: line, qty: "", unit: "" };

  const name = line.slice(0, splitAt).trim();
  const { qty, unit } = splitQuantityAndUnit(line.slice(splitAt + 1));

  // A trailing comma-separated phrase that isn't a quantity is part of the name.
  if (!qty) return { name: line, qty: "", unit: "" };

  return { name, qty, unit };
}

/** Parse a pasted block of ingredient lines, skipping blanks. */
export function parseIngredientBlock(text: string): ParsedIngredientLine[] {
  return text
    .split("\n")
    .map(parseIngredientLine)
    .filter((line): line is ParsedIngredientLine => line !== null);
}
