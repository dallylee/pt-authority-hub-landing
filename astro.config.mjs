import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare({
    routes: {
      extend: {
        include: [{ pattern: '/quiz' }, { pattern: '/thanks' }, { pattern: '/upload' }]
      }
    }
  }),
});