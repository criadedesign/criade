import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

if (!existsSync(distDir)) {
  console.error('[sync-hostinger-root] Pasta dist/ não encontrada.');
  process.exit(1);
}

const filesToCopy = [
  'index.html',
  '404.html',
  'favicon.svg',
  'robots.txt',
  'llms.txt',
  'llms-full.txt',
  'sitemap-index.xml',
  'sitemap-0.xml',
  '.htaccess',
];

const dirsToCopy = [
  '_astro',
  'sobre',
  'privacidade',
  'images',
  'models',
];

for (const file of filesToCopy) {
  const src = path.join(distDir, file);
  const dest = path.join(rootDir, file);
  if (existsSync(src)) {
    cpSync(src, dest, { force: true });
  }
}

for (const dir of dirsToCopy) {
  const src = path.join(distDir, dir);
  const dest = path.join(rootDir, dir);
  if (existsSync(src)) {
    if (existsSync(dest)) {
      rmSync(dest, { recursive: true, force: true });
    }
    cpSync(src, dest, { recursive: true, force: true });
  }
}

console.log('[sync-hostinger-root] Artefatos estáticos sincronizados na raiz para Hostinger public_html.');
