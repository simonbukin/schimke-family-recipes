import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";
import { AUTH_SECRET, EDITORS } from "astro:env/server";
import {
  createSessionToken,
  findEditor,
  parseEditors,
  safeRedirectPath,
  sessionCookie,
} from "../lib/auth";
import {
  commitRecipe,
  deleteRecipe,
  getRecipeSha,
  getRepoConfig,
} from "../lib/github";
import {
  RECIPE_TYPES,
  serializeRecipe,
  slugify,
  type RecipeFile,
} from "../utils/recipeFile";

const ingredientSchema = z.object({
  name: z.string().trim().default(""),
  qty: z.string().trim().default(""),
  unit: z.string().trim().default(""),
  recipe: z.string().trim().default(""),
});

const recipeInput = z.object({
  slug: z.string().trim().optional(),
  /** Blob SHA the editor loaded, so a concurrent save is rejected not clobbered. */
  baseSha: z.string().trim().default(""),
  name: z.string().trim().min(1, "Give the recipe a name"),
  emoji: z.string().trim().min(1, "Pick an emoji"),
  type: z.enum(RECIPE_TYPES),
  author: z.string().trim().default(""),
  // Must stay in sync with the content collection schema, which requires a
  // valid URL. An invalid one would commit fine and then fail the next build.
  link: z
    .union([z.literal(""), z.string().url("That doesn't look like a URL.")])
    .default(""),
  time: z.string().trim().min(1, "How long does it take?"),
  servings: z.number().int().positive().nullable().default(null),
  ingredients: z.array(ingredientSchema).default([]),
  cookware: z
    .array(z.object({ name: z.string().trim(), qty: z.string().trim() }))
    .default([]),
  steps: z.array(z.string()).default([]),
});

/**
 * The content collection requires an author or a link. Enforcing it here too
 * means a save can never commit a recipe that breaks the next build.
 */
const validatedRecipeInput = recipeInput.refine(
  (input) => input.author || input.link,
  { message: "Add an author or a source link.", path: ["author"] }
);

type RecipeInput = z.infer<typeof recipeInput>;

/** Drop the empty rows the editor leaves behind and shape the file contents. */
function toRecipeFile(input: RecipeInput): RecipeFile {
  return {
    name: input.name,
    emoji: input.emoji,
    type: input.type,
    author: input.author || undefined,
    link: input.link || undefined,
    time: input.time,
    servings: input.servings ?? undefined,
    ingredients: input.ingredients
      .filter((row) => row.recipe || row.name)
      .map((row) =>
        row.recipe
          ? { recipe: row.recipe }
          : { name: row.name, qty: row.qty, unit: row.unit }
      ),
    cookware: input.cookware.filter((row) => row.name),
    steps: input.steps.map((step) => step.trim()).filter(Boolean),
  };
}

function requireEditor(locals: App.Locals): string {
  if (!locals.editor) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "Please sign in." });
  }
  return locals.editor;
}

export const server = {
  login: defineAction({
    accept: "form",
    input: z.object({
      password: z.string(),
      next: z.string().default("/admin"),
    }),
    handler: async ({ password, next }, context) => {
      if (!AUTH_SECRET || !EDITORS) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Sign-in is not configured on this deployment.",
        });
      }

      const editor = findEditor(parseEditors(EDITORS), password);
      if (!editor) {
        // Slow down bulk guessing a little. This is not a substitute for a
        // real rate limiter, which would need shared state across instances.
        await new Promise((resolve) => setTimeout(resolve, 500));
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "That password doesn't match.",
        });
      }

      context.cookies.set(
        sessionCookie.name,
        await createSessionToken(editor, AUTH_SECRET),
        sessionCookie.options
      );

      return { redirectTo: safeRedirectPath(next) };
    },
  }),

  logout: defineAction({
    accept: "form",
    handler: async (_input, context) => {
      context.cookies.delete(sessionCookie.name, { path: "/" });
      return { ok: true };
    },
  }),

  saveRecipe: defineAction({
    input: validatedRecipeInput,
    handler: async (input, context) => {
      const editor = requireEditor(context.locals);

      const slug = input.slug || slugify(input.name);
      if (!slug) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "That name doesn't produce a usable URL.",
        });
      }

      const recipe = toRecipeFile(input);
      if (recipe.ingredients.length === 0) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Add at least one ingredient.",
        });
      }
      if (recipe.steps.length === 0) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Add at least one step.",
        });
      }

      const isUpdate = Boolean(input.slug);

      if (!isUpdate) {
        // Creating must not silently overwrite a recipe that already exists.
        const existing = await getRecipeSha(getRepoConfig(), slug);
        if (existing) {
          throw new ActionError({
            code: "CONFLICT",
            message: `A recipe already lives at /recipe/${slug}.`,
          });
        }
      } else if (!input.baseSha) {
        throw new ActionError({
          code: "CONFLICT",
          message:
            "Couldn't tell which version you started from. Reload the page and try again.",
        });
      }

      await commitRecipe({
        slug,
        contents: serializeRecipe(recipe),
        message: `${isUpdate ? "Update" : "Add"} ${recipe.name}`,
        editor,
        // GitHub rejects the write if this is no longer the current blob.
        sha: isUpdate ? input.baseSha : null,
      });

      return { slug, created: !isUpdate };
    },
  }),

  deleteRecipe: defineAction({
    input: z.object({ slug: z.string().min(1) }),
    handler: async ({ slug }, context) => {
      const editor = requireEditor(context.locals);

      const config = getRepoConfig();
      const sha = await getRecipeSha(config, slug);
      if (!sha) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "That recipe is already gone.",
        });
      }

      await deleteRecipe({ slug, sha, message: `Delete ${slug}`, editor });
      return { ok: true };
    },
  }),
};
