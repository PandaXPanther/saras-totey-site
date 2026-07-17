import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const favicon = await readFile(`${root}/public/favicon.svg`, 'utf8');
const browser = await chromium.launch({ headless: true });

async function rasterizeSvg(path, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${favicon}`);
  await page.screenshot({ path, omitBackground: true });
  await page.close();
}

await rasterizeSvg(`${root}/public/favicon-16x16.png`, 16);
await rasterizeSvg(`${root}/public/favicon-32x32.png`, 32);
await rasterizeSvg(`${root}/public/apple-touch-icon.png`, 180);
await rasterizeSvg(`${root}/public/icon-192.png`, 192);
await rasterizeSvg(`${root}/public/icon-512.png`, 512);

const markData = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`;
const backdropBytes = await readFile(`${root}/public/world/flight/intro-4k.webp`);
const backdrop = `data:image/webp;base64,${backdropBytes.toString('base64')}`;
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.setContent(`<!doctype html><html><head><style>
  @import url('https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&f[]=boska@500&display=swap');
  *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#17182b}
  body{font-family:Switzer,sans-serif;color:#f7e8ed}
  .scene{position:absolute;inset:0;background:url('${backdrop}') center 48%/cover no-repeat;filter:saturate(.93) contrast(1.04)}
  .grade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(23,24,43,.97) 0%,rgba(23,24,43,.88) 34%,rgba(23,24,43,.18) 69%,rgba(23,24,43,.05) 100%)}
  .frame{position:absolute;inset:28px;border:1px solid rgba(247,232,237,.38)}
  .frame:before,.frame:after{content:'';position:absolute;background:#d64b83}.frame:before{width:130px;height:3px;left:-1px;top:-1px}.frame:after{width:3px;height:130px;left:-1px;top:-1px}
  .content{position:absolute;left:78px;top:70px;width:560px;height:490px;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:18px;font:500 19px/1 Switzer,sans-serif;letter-spacing:.02em}.brand img{width:68px;height:68px}
  h1{font:500 82px/.88 Boska,serif;letter-spacing:-.045em;margin:105px 0 22px;max-width:520px}
  .line{width:42px;height:3px;background:#d64b83;margin-bottom:22px}
  p{font:400 24px/1.35 Switzer,sans-serif;margin:0;color:#f7e8ed;max-width:470px}
  .footer{margin-top:auto;display:flex;gap:18px;align-items:center;font:500 13px/1 'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#e7a7b5}
  .dot{width:5px;height:5px;background:#d64b83;transform:rotate(45deg)}
</style></head><body><div class="scene"></div><div class="grade"></div><div class="frame"></div><main class="content"><div class="brand"><img src="${markData}" alt=""><span>SARAS TOTEY</span></div><h1>Systems with<br>skin in the game.</h1><div class="line"></div><p>Full-stack developer building trading systems, economic tools, and digital worlds.</p><div class="footer"><span>Boulder, Colorado</span><i class="dot"></i><span>sarastotey.com</span></div></main></body></html>`, { waitUntil: 'networkidle' });
await og.screenshot({ path: `${root}/public/og-saras-totey.png` });
await og.close();
await browser.close();
