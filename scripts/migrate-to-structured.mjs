/**
 * One-time migration: "Ingredients:/Cookware:/Steps:" markdown bodies ->
 * structured frontmatter.
 *
 *   node scripts/migrate-to-structured.mjs --dry   # print, change nothing
 *   node scripts/migrate-to-structured.mjs         # rewrite in place
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const { parseIngredientLine, splitQuantityAndUnit } = await import("../src/utils/ingredientText.ts");
const { serializeRecipe } = await import("../src/utils/recipeFile.ts");

const DIR = "src/content/recipes";
const dry = process.argv.includes("--dry");

/** Split a file into its raw frontmatter block and its body. */
function splitFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("no frontmatter");
  return { frontmatter: match[1], body: match[2] };
}

/** These files only ever use flat `key: value` frontmatter. */
function parseFrontmatter(block) {
  const data = {};
  for (const line of block.split("\n")) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    data[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return data;
}

/** Walk the body's "Ingredients:/Cookware:/Steps:" sections. */
function parseBody(body) {
  const out = { ingredients: [], cookware: [], steps: [], notes: [] };
  let section = "notes";

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (/^Ingredients:$/i.test(line)) { section = "ingredients"; continue; }
    if (/^Cookware:$/i.test(line)) { section = "cookware"; continue; }
    if (/^Steps:$/i.test(line)) { section = "steps"; continue; }
    if (!line) continue;

    if (section === "ingredients") {
      const link = line.match(/^-?\s*\[\[(.+)\]\]$/);
      if (link) {
        out.ingredients.push({
          recipe: link[1].toLowerCase().split(" ").join("-"),
        });
        continue;
      }
      const parsed = parseIngredientLine(line);
      if (parsed) out.ingredients.push(parsed);
    } else if (section === "cookware") {
      const parsed = parseIngredientLine(line);
      if (parsed) {
        // Cookware quantities are bare counts; the "unit" half is never used.
        out.cookware.push({ name: parsed.name, qty: parsed.qty || undefined });
      }
    } else if (section === "steps") {
      out.steps.push(line.replace(/^[-*]\s*/, "").trim());
    } else {
      out.notes.push(line);
    }
  }
  return out;
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".md")).sort();
const warnings = [];

for (const file of files) {
  const path = join(DIR, file);
  const { frontmatter, body } = splitFrontmatter(await readFile(path, "utf8"));
  const meta = parseFrontmatter(frontmatter);
  const parsed = parseBody(body);

  // "4 servings" -> 4. A missing or unparseable value stays undefined so the
  // recipe page can hide the servings scaler rather than divide by zero.
  const servings = Number.parseInt(meta.servings ?? "", 10);

  const recipe = {
    name: meta.name,
    emoji: meta.emoji,
    type: meta.type,
    author: meta.author,
    link: meta.link,
    time: meta.time,
    servings: Number.isFinite(servings) && servings > 0 ? servings : undefined,
    ingredients: parsed.ingredients,
    cookware: parsed.cookware,
    steps: parsed.steps,
  };

  if (!recipe.name || !recipe.emoji || !recipe.type || !recipe.time) {
    warnings.push(`${file}: missing a required frontmatter field`);
  }
  if (recipe.ingredients.length === 0) warnings.push(`${file}: no ingredients`);
  if (recipe.steps.length === 0) warnings.push(`${file}: no steps`);
  for (const entry of recipe.ingredients) {
    if (!("recipe" in entry) && !entry.qty) {
      warnings.push(`${file}: no quantity for "${entry.name}"`);
    }
  }

  const output = serializeRecipe(recipe);
  if (dry) {
    console.log(`\n===== ${file} =====\n${output}`);
  } else {
    await writeFile(path, output);
  }
}

console.log(`\n${dry ? "Would migrate" : "Migrated"} ${files.length} recipes.`);
if (warnings.length) console.log(`\nWarnings:\n${warnings.map((w) => `  - ${w}`).join("\n")}`);
