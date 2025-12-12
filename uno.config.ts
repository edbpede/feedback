import { defineConfig, presetWind, presetIcons } from "unocss";

export default defineConfig({
  presets: [
    presetWind({ dark: "class" }),
    presetIcons({ scale: 1.2, cdn: "https://esm.sh/" }),
  ],
  shortcuts: [
    { btn: "px-4 py-2 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" },
    { "btn-primary": "btn bg-blue-600 hover:bg-blue-700 text-white" },
    { "btn-secondary": "btn bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" },
    { "input-base": "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200" },
    { card: "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200" },
  ],
  theme: {
    colors: {
      brand: "#3B82F6",
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
