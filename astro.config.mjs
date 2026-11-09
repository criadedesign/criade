import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

const siteUrl = process.env.PUBLIC_SITE_URL || 'https://www.criade.art.br';
const buildTimestamp = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
  // Geração 100% estática (SSG) pronta para Hostinger (public_html / LiteSpeed / CDN)
  output: 'static',
  site: siteUrl,
  trailingSlash: 'ignore',
  compressHTML: true,
  build: {
    format: 'directory',
    assets: '_astro',
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: {
        defaultLocale: 'pt-BR',
        locales: {
          'pt-BR': 'pt-BR',
        },
      },
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        const base = siteUrl.replace(/\/$/, '');

        if (url === base || url === '') {
          return {
            ...item,
            changefreq: ChangeFreqEnum.WEEKLY,
            priority: 1.0,
            lastmod: buildTimestamp,
          };
        }

        if (url.endsWith('/sobre')) {
          return {
            ...item,
            changefreq: ChangeFreqEnum.MONTHLY,
            priority: 0.9,
            lastmod: buildTimestamp,
          };
        }

        if (url.endsWith('/privacidade')) {
          return {
            ...item,
            changefreq: ChangeFreqEnum.YEARLY,
            priority: 0.3,
            lastmod: buildTimestamp,
          };
        }

        return {
          ...item,
          changefreq: ChangeFreqEnum.MONTHLY,
          priority: 0.7,
          lastmod: buildTimestamp,
        };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Chunks sob demanda de WebGL (Three.js / @splinetool/runtime) são carregados de forma assíncrona pós-LCP
      chunkSizeWarningLimit: 1100,
    },
  },
});
