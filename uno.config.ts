import { defineConfig, presetIcons, presetWind4 } from "unocss";
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";

export default defineConfig({
  presets: [
    presetWind4(),
    presetAnimations(),
    presetShadcn({
      color: false, // Using custom northern-lights theme
      // Inert: presetShadcn only reads darkSelector when `color` is set, so this
      // emits nothing. The dark palette is the hand-written .dark rule in
      // src/styles/globals.css. Kept so the two stay in sync if `color` is ever
      // enabled.
      darkSelector: ".dark",
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
    // presetWind4 renamed this key from `fontFamily`, and it only emits the
    // --font-* variables its utilities resolve against when the value is a
    // single string. An array here yields no variable at all, so `font-mono`
    // would silently resolve to var(--font-mono) with nothing behind it.
    font: {
      sans: '"Plus Jakarta Sans Variable", system-ui, sans-serif',
      mono: '"JetBrains Mono", Consolas, monospace',
      serif: '"Source Serif 4 Variable", Georgia, serif',
    },
    // The shadcn radius contract, restated for presetWind4.
    // unocss-preset-shadcn 1.0.1 still ships this scale under the presetWind3
    // key `borderRadius`, which presetWind4 ignores (it reads `radius`), so
    // without this block rounded-lg/md/xl silently stop tracking --radius from
    // src/styles/globals.css and fall back to presetWind4's own defaults.
    radius: {
      xl: "calc(var(--radius) + 4px)",
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
    },
  },
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]sx|mdx?|astro)($|\?)/, "src/**/*.{js,ts}"],
    },
  },
});
