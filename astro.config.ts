import { defineConfig, envField } from "astro/config";
import solidJs from "@astrojs/solid-js";
import UnoCSS from "unocss/astro";
import vercel from "@astrojs/vercel";

export default defineConfig({
  integrations: [UnoCSS({ injectReset: true }), solidJs()],
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
        default: "TEE/deepseek-r1",
      }),
      API_BASE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "https://nano-gpt.com/api/v1",
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
            if (id.includes("pdfjs-dist")) return "pdf";
            if (id.includes("mammoth")) return "docx";
            if (id.includes("solid-js")) return "solid";
          },
        },
      },
    },
  },
});
