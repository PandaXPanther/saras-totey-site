import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const distIndexPath = resolve(root, 'dist/index.html');

const server = await createServer({
  root,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

try {
  const template = await readFile(distIndexPath, 'utf8');
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
