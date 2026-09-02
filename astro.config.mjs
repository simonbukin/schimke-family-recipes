import { defineConfig, envField } from "astro/config";
import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [svelte()],
  adapter: vercel(),
  env: {
    schema: {
      // Signs the editor session cookie. Any long random string; rotating it
      // logs everyone out.
      AUTH_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // "simon:password1,kayla:password2"
      EDITORS: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Fine-grained token with Contents: read and write on this repo only.
      GITHUB_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GITHUB_REPO: envField.string({
        context: "server",
        access: "public",
        default: "simonbukin/schimke-family-recipes",
      }),
      GITHUB_BRANCH: envField.string({
        context: "server",
        access: "public",
        default: "main",
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
