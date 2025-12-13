import { defineConfig, presetIcons } from "unocss";
import { presetWind } from "@unocss/preset-wind3";
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";

export default defineConfig({
  presets: [
    presetWind(),
    presetAnimations(),
    presetShadcn({
      color: false, // Using custom northern-lights theme
      darkSelector: '[data-kb-theme="dark"]',
    }),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  theme: {
    fontFamily: {
      sans: ["Plus Jakarta Sans Variable", "system-ui", "sans-serif"],
      mono: ["JetBrains Mono", "Consolas", "monospace"],
      serif: ["Source Serif 4 Variable", "Georgia", "serif"],
    },
  },
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro)($|\?)/,
        "src/**/*.{js,ts}",
      ],
    },
  },
});
