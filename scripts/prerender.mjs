import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('Could not find empty root div in dist/index.html');
  }
  const routes = new Map([
    ['/', ['Trading systems · Saras Totey', 'Independent trading systems built by Saras Totey: live CS2 arbitrage, prediction-market research, and transparent quantitative experiments.']],
    ['/home', ['Home · Saras Totey', 'Meet Saras Totey, a Boulder full-stack developer building trading bots, economics tools, public-data products, and websites.']],
    ['/econ-mom', ['Econ.mom · Saras Totey', 'Twelve free, interactive economics tools with formulas, explanations, and every dataset cited.']],
    ['/local-ledger', ['local-ledger.net · Saras Totey', 'A nationwide economic observatory and simulator covering every state, 3,143 counties, and 120 metro areas.']],
    ['/att-agency', ['ATT Agency · Saras Totey', 'Saras Totey’s work co-founding ATT Agency and shipping brands, websites, video, ads, and analytics.']],
  ]);
  for (const [route, [title, description]] of routes) {
    const appHtml = render(route);
    const canonical = `https://sarastotey.com${route}`;
    const html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${description}`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${description}`)
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${canonical}`)
      .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${description}`)
      .replace(/(<link rel="canonical" href=")[^"]*/, `$1${canonical}`)
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    const output = route === '/' ? distIndexPath : resolve(root, 'dist', route.slice(1), 'index.html');
    await mkdir(resolve(output, '..'), { recursive: true });
    await writeFile(output, html);
  }
} finally {
  await server.close();
}
