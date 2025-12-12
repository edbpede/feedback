// @ts-check
import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import UnoCSS from 'unocss/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [
    solidJs(),
    UnoCSS({
      injectReset: true,
    }),
  ],
});