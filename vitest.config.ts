import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "astro:env/server": fileURLToPath(
        new URL("./test/astro-env-stub.ts", import.meta.url)
      ),
    },
  },
});
