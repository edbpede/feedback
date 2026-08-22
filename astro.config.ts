import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";
import { defineConfig, envField } from "astro/config";
import UnoCSS from "unocss/astro";

export default defineConfig({
  integrations: [UnoCSS({ injectReset: true }), svelte()],
  output: "server",
  adapter: vercel(),
  env: {
    schema: {
      PASSWORD_HASH: envField.string({
        context: "server",
        access: "secret",
      }),
      SESSION_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      NANO_GPT_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      NANO_GPT_MODEL: envField.string({
        context: "server",
        access: "secret",
        default: "TEE/deepseek-v3.2",
      }),
      API_BASE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "https://nano-gpt.com/api/v1",
      }),
      ENHANCED_QUALITY_PASSWORD_HASH: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
    validateSecrets: true,
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // File processing libraries (dynamically imported in fileParser.ts)
            if (id.includes("pdfjs-dist")) return "pdf";
            if (id.includes("mammoth")) return "docx";

            // UI component library
            // Must be checked BEFORE svelte: id.includes("svelte") also matches
            // bits-ui's svelte-toolbelt dependency and every *.svelte module id,
            // which would silently pull bits-ui into the svelte chunk.
            if (id.includes("bits-ui")) return "bits-ui";

            // Core framework.
            // The node_modules guard is load-bearing. Under Solid this branch matched
            // "solid-js", which only ever appeared in a dependency path. Under Svelte a
            // bare id.includes("svelte") also matches every one of this app's own
            // *.svelte module ids, which sweeps all 52 components into this chunk and
            // destroys the lazy-loaded ChatWindow split.
            if (id.includes("node_modules") && id.includes("svelte")) return "svelte";

            // Markdown rendering (used in chat messages)
            if (id.includes("highlight.js")) return "highlight";
            if (id.includes("marked")) return "markdown";

            // Fonts
            if (id.includes("@fontsource")) return "fonts";
          },
        },
      },
    },
  },
});
