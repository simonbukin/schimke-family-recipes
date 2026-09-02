/**
 * The on-disk shape of a recipe and the serializer that writes it back out.
 *
 * Both the one-time migration script and the admin editor go through
 * `serializeRecipe`, so there is exactly one definition of what a recipe file
 * looks like.
 */

export const RECIPE_TYPES = [
  "breakfast",
  "entree",
  "drink",
  "dessert",
  "sauce",
  "snack",
  "epicure",
] as const;

export type RecipeType = (typeof RECIPE_TYPES)[number];

/** A measured ingredient, or a cross-link to another recipe in the collection. */
export type IngredientEntry =
  | { name: string; qty?: string; unit?: string }
  | { recipe: string };

export interface CookwareEntry {
  name: string;
  qty?: string;
}

export interface RecipeFile {
  name: string;
  emoji: string;
  type: RecipeType;
  author?: string;
  link?: string;
  time: string;
  servings?: number;
  ingredients: IngredientEntry[];
  cookware?: CookwareEntry[];
  steps: string[];
}

/**
 * Escapes that a YAML double-quoted scalar requires. Line breaks are the
 * important ones: steps are entered in a textarea, so a raw newline reaching
 * the file either folds away silently (losing the author's break) or, for
 * text like a lone "---", makes the file unparseable and breaks every
 * subsequent build.
 */
const ESCAPES: Record<string, string> = {
  "\\": "\\\\",
  '"': '\\"',
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};

/**
 * Quote every string. Emoji, colons, leading digits and `#` all survive this
 * unambiguously, so we never have to reason about when YAML needs quoting.
 */
function quote(value: string): string {
  const escaped = value.replace(
    // Backslash, quote, and every character YAML may treat as a line break or
    // control code, including U+0085, U+2028 and U+2029.
    /[\\"\u0000-\u001f\u007f\u0085\u2028\u2029]/g,
    (character) => {
      const known = ESCAPES[character];
      if (known) return known;
      const code = character.codePointAt(0) ?? 0;
      return code <= 0xff
        ? `\\x${code.toString(16).padStart(2, "0")}`
        : `\\u${code.toString(16).padStart(4, "0")}`;
    }
  );
  return `"${escaped}"`;
}

function scalar(key: string, value: string | number | undefined): string[] {
  if (value === undefined || value === "") return [];
  return [`${key}: ${typeof value === "number" ? value : quote(value)}`];
}

/**
 * Render a list of objects as a YAML sequence of mappings:
 *
 *   ingredients:
 *     - name: "Water"
 *       qty: "1 1/4"
 */
function mappingList(
  key: string,
  entries: Array<Array<[string, string | undefined]>>
): string[] {
  if (entries.length === 0) return [];
  const lines = [`${key}:`];
  for (const entry of entries) {
    const pairs = entry.filter(
      (pair): pair is [string, string] => pair[1] !== undefined && pair[1] !== ""
    );
    if (pairs.length === 0) continue;
    lines.push(`  - ${pairs[0][0]}: ${quote(pairs[0][1])}`);
    for (const [k, v] of pairs.slice(1)) lines.push(`    ${k}: ${quote(v)}`);
  }
  return lines;
}

export function isRecipeLink(
  entry: IngredientEntry
): entry is { recipe: string } {
  return "recipe" in entry;
}

export function serializeRecipe(recipe: RecipeFile): string {
  const lines: string[] = ["---"];

  lines.push(...scalar("name", recipe.name));
  lines.push(...scalar("emoji", recipe.emoji));
  lines.push(...scalar("type", recipe.type));
  lines.push(...scalar("author", recipe.author));
  lines.push(...scalar("link", recipe.link));
  lines.push(...scalar("time", recipe.time));
  lines.push(...scalar("servings", recipe.servings));

  lines.push(
    ...mappingList(
      "ingredients",
      recipe.ingredients.map((entry) =>
        isRecipeLink(entry)
          ? ([["recipe", entry.recipe]] as Array<[string, string | undefined]>)
          : ([
              ["name", entry.name],
              ["qty", entry.qty],
              ["unit", entry.unit],
            ] as Array<[string, string | undefined]>)
      )
    )
  );

  lines.push(
    ...mappingList(
      "cookware",
      (recipe.cookware ?? []).map((entry) => [
        ["name", entry.name],
        ["qty", entry.qty],
      ])
    )
  );

  if (recipe.steps.length > 0) {
    lines.push("steps:");
    for (const step of recipe.steps) lines.push(`  - ${quote(step)}`);
  }

  lines.push("---");
  return `${lines.join("\n")}\n`;
}

/** Turn a recipe name into the filename/URL slug, e.g. "Miso Soup" -> "miso-soup". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
