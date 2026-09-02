import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
// Astro parses frontmatter with js-yaml. The `yaml` package disagrees with it
// on malformed input -- it throws where js-yaml silently folds -- so tests must
// use the same parser production does or they validate the wrong thing.
import { load } from "js-yaml";
import { serializeRecipe, slugify, type RecipeFile } from "./recipeFile";

/**
 * Pull the frontmatter block out of a recipe file. Splitting on "---" would
 * also split on an escaped "---" inside a step, so match the fences instead.
 */
function frontmatter(source: string): any {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error("no frontmatter found");
  return load(match[1]);
}

const RECIPE_DIR = "src/content/recipes";

const base: RecipeFile = {
  name: "Test",
  emoji: "🥧",
  type: "entree",
  time: "10 minutes",
  ingredients: [{ name: "Butter", qty: "3", unit: "tbsp" }],
  steps: ["Melt it"],
};

describe("serializeRecipe", () => {
  it("omits empty optional fields", () => {
    const output = serializeRecipe(base);
    expect(output).not.toContain("author:");
    expect(output).not.toContain("cookware:");
    expect(output).not.toContain("servings:");
  });

  it("writes servings as a number", () => {
    expect(serializeRecipe({ ...base, servings: 4 })).toContain("servings: 4");
  });

  it("escapes quotes and backslashes so the YAML stays valid", () => {
    const output = serializeRecipe({
      ...base,
      name: 'The "Best" Pie',
      steps: ['Say "go"', "A back\\slash"],
    });
    expect(frontmatter(output).name).toBe('The "Best" Pie');
    expect(frontmatter(output).steps).toEqual([
      'Say "go"',
      "A back\\slash",
    ]);
  });

  it("survives colons, emoji and leading numbers without ambiguity", () => {
    const output = serializeRecipe({
      ...base,
      name: "Note: a recipe",
      steps: ["12 minutes: rest"],
    });
    const data = frontmatter(output);
    expect(data.name).toBe("Note: a recipe");
    expect(data.steps[0]).toBe("12 minutes: rest");
    expect(data.emoji).toBe("🥧");
  });

  it("writes recipe links as a slug reference", () => {
    const output = serializeRecipe({
      ...base,
      ingredients: [{ recipe: "botan-rice" }],
    });
    expect(frontmatter(output).ingredients).toEqual([
      { recipe: "botan-rice" },
    ]);
  });

  it("escapes newlines typed into a step", () => {
    // Steps are entered in a textarea, so pressing Enter is expected. A raw
    // newline in the file would fold the break away and lose the author's text.
    const output = serializeRecipe({
      ...base,
      steps: ["Mix well.\nThen bake until golden."],
    });
    expect(frontmatter(output).steps).toEqual([
      "Mix well.\nThen bake until golden.",
    ]);
  });

  it("survives a step whose line looks like a frontmatter fence", () => {
    // This is the input that made the file unparseable and broke every
    // subsequent build until someone fixed the repo by hand.
    const output = serializeRecipe({ ...base, steps: ["before\n---\nafter"] });
    expect(frontmatter(output).steps).toEqual([
      "before\n---\nafter",
    ]);
  });

  it("escapes control characters that arrive by pasting from a PDF", () => {
    const output = serializeRecipe({
      ...base,
      steps: ["a\u0000b\u000bc\u000cd\re"],
      ingredients: [{ name: "Butter\u0085softened", qty: "3", unit: "tbsp" }],
    });
    const data = frontmatter(output);
    expect(data.steps).toEqual(["a\u0000b\u000bc\u000cd\re"]);
    expect(data.ingredients[0].name).toBe("Butter\u0085softened");
  });

  it("round-trips carriage returns and tabs", () => {
    const output = serializeRecipe({ ...base, steps: ["a\tb", "c\r\nd"] });
    expect(frontmatter(output).steps).toEqual(["a\tb", "c\r\nd"]);
  });
});

describe("slugify", () => {
  it("matches the filenames already in the collection", () => {
    expect(slugify("Shepherd's Pie")).toBe("shepherds-pie");
    expect(slugify("Sweet n' Sour Stir Fry")).toBe("sweet-n-sour-stir-fry");
    expect(slugify("Spam 'n' Eggs")).toBe("spam-n-eggs");
  });
});

describe("round-trip against the real collection", () => {
  const files = readdirSync(RECIPE_DIR).filter((file) => file.endsWith(".md"));

  it("has recipes to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  // Saving an untouched recipe from the editor must not rewrite the file.
  it.each(files)("%s serializes back to itself", (file) => {
    const source = readFileSync(join(RECIPE_DIR, file), "utf8");
    const data = frontmatter(source) as RecipeFile;
    expect(serializeRecipe(data)).toBe(source);
  });
});
