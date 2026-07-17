import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const distIndexPath = resolve(root, 'dist/index.html');

async function inlineGlobalStyles(template) {
  const stylesheetMatch = template.match(
    /<link rel="stylesheet" crossorigin href="(\/assets\/[^\"]+\.css)">/
  );

  if (!stylesheetMatch) {
    throw new Error('Could not find Vite global stylesheet in dist/index.html');
  }

  const [stylesheetTag, stylesheetPath] = stylesheetMatch;
  const stylesheet = await readFile(resolve(root, 'dist', `.${stylesheetPath}`), 'utf8');

  // Keep the initial render independent of an immutable, hashed edge asset.
  // Cloudflare Pages serves this document atomically with every route, so a
  // stale HTML cache or a delayed asset fetch can no longer expose raw markup.
  return template.replace(stylesheetTag, `<style data-source="global.css">${stylesheet}</style>`);
}

const server = await createServer({
  root,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

try {
  const template = await inlineGlobalStyles(await readFile(distIndexPath, 'utf8'));
  const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
  const appHtml = render();

  if (!template.includes('<div id="root"></div>')) {
    throw new Error('Could not find empty root div in dist/index.html');
  }

  await writeFile(
    distIndexPath,
    template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  );
} finally {
  await server.close();
}
