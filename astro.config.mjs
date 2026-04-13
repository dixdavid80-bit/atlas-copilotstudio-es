// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [starlight({
			title: 'Atlas Copilot Studio ES',
			description: 'La referencia completa de Microsoft Copilot Studio en español',
			defaultLocale: 'root',
			locales: {
          root: { label: 'Español', lang: 'es' },
			},
			social: [
          { icon: 'github', label: 'GitHub', href: 'https://github.com/dixdavid80-bit/atlas-copilotstudio-es' },
			],
			sidebar: [
          {
              label: 'Empezar',
              autogenerate: { directory: 'empezar' },
          },
          {
              label: 'Construir',
              autogenerate: { directory: 'construir' },
          },
          {
              label: 'Conectar',
              autogenerate: { directory: 'conectar' },
          },
          {
              label: 'Publicar',
              autogenerate: { directory: 'publicar' },
          },
          {
              label: 'Escalar',
              autogenerate: { directory: 'escalar' },
          },
			],
			customCss: ['./src/styles/editorial.css'],
			head: [
          {
              tag: 'meta',
              attrs: { name: 'og:locale', content: 'es_ES' },
          },
			],
  }), react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
