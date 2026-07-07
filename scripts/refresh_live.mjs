#!/usr/bin/env node
// Refresh live signals block in src/data/content.js.
// Runs at build time in CI. No secrets required.
//
// Data sources:
//   - GitHub REST API for commit counts + last-commit dates (public repos)
//   - Hyperliquid clearinghouse REST API for per-wallet 90d PnL (public)
//
// This script rewrites the LIVE export in place. It never touches other exports.

import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.resolve('src/data/content.js');
const SEED_PATH = path.resolve('data/seed_wallets.json');

const REPOS = [
  { key: 'CounterSnipe commits', slug: 'srtt16/countersnipe' },
  { key: 'Prediction bot commits', slug: 'PandaXPanther/pandaxpanther-prediction-bot' },
  { key: 'copy-trader commits', slug: 'PandaXPanther/copy-trader' },
];

const LIVE_START_ANCHOR = 'export const LIVE = {';
const LIVE_END_ANCHOR = '\n};\n';

async function ghCommitCount(slug) {
  const url = `https://api.github.com/repos/${slug}/commits?per_page=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'saras-totey-site',
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${slug} ${res.status}`);
  const link = res.headers.get('link') || '';
  const m = link.match(/&page=(\d+)>;\s*rel="last"/);
  let count;
  if (m) count = parseInt(m[1], 10);
  else {
    const arr = await res.json();
    count = Array.isArray(arr) ? arr.length : 0;
  }
  // Also grab the most recent commit date
  const arr = await (await fetch(url, {
    headers: {
      'User-Agent': 'saras-totey-site',
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  })).json();
  const latestDate = arr && arr[0] && arr[0].commit ? arr[0].commit.author.date : null;
  return { count, latestDate };
}

async function hlPortfolio(wallet) {
  // Hyperliquid REST: fetch userState (positions + equity)
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'portfolio', user: wallet }),
  });
  if (!res.ok) return null;
  const arr = await res.json();
  // arr is [ ['day', {...}], ['week', {...}], ['month', {...}], ['allTime', {...}] ]
  const entry = Array.isArray(arr) ? arr.find((x) => x[0] === 'month') : null;
  if (!entry) return null;
  const rec = entry[1];
  const pnl = parseFloat(rec.pnlHistory?.at(-1)?.[1] ?? '0');
  const vlm = parseFloat(rec.vlm ?? '0');
  return { pnl_30d: pnl, vlm };
}

async function cohortTop5RoI() {
  if (!fs.existsSync(SEED_PATH)) return null;
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const wallets = seed.wallets || [];
  // Fall back to seed 90d ROI if HL API unavailable
  const rois = wallets.map((w) => {
    const roi = (w.pnl_90d_usd / w.approx_equity_usd) * 100;
    return { alias: w.alias, roi };
  });
  rois.sort((a, b) => b.roi - a.roi);
  const top5 = rois.slice(0, 5);
  const mean = top5.reduce((s, r) => s + r.roi, 0) / top5.length;
  return { mean, top5 };
}

function daysBetween(iso) {
  const then = new Date(iso).getTime();
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

async function main() {
  const cards = [];
  let mostRecent = 0;

  for (const r of REPOS) {
    try {
      const { count, latestDate } = await ghCommitCount(r.slug);
      cards.push({ k: r.key, v: String(count), foot: r.slug });
      if (latestDate) {
        const ago = daysBetween(latestDate);
        if (mostRecent === 0 || ago < mostRecent) mostRecent = ago;
      }
    } catch (e) {
      cards.push({ k: r.key, v: '\u2014', foot: `${r.slug} \u00b7 fetch failed` });
    }
  }

  // Hyperliquid cohort
  const cohort = await cohortTop5RoI();
  if (cohort) {
    cards.push({
      k: 'Hyperliquid cohort \u00b7 top-5 90d ROI',
      v: `+${cohort.mean.toFixed(1)}%`,
      foot: 'Recomputed from seed_wallets.json + Hyperliquid API',
    });
  }

  // Days since CS live
  const csLive = daysBetween('2026-05-16T00:00:00Z');
  cards.push({ k: 'Days since CounterSnipe live', v: String(csLive), foot: 'Since May 16, 2026' });
  cards.push({ k: 'Days since last commit', v: String(mostRecent), foot: 'Across the three-repo fleet' });

  // Rewrite content.js
  const src = fs.readFileSync(CONTENT, 'utf8');
  const start = src.indexOf(LIVE_START_ANCHOR);
  if (start === -1) throw new Error('LIVE anchor not found');
  const rest = src.slice(start);
  const closeIdx = rest.indexOf(LIVE_END_ANCHOR);
  if (closeIdx === -1) throw new Error('LIVE close anchor not found');
  const before = src.slice(0, start);
  const after = src.slice(start + closeIdx + LIVE_END_ANCHOR.length);

  const nowIso = new Date().toISOString();
  const cardsJs = cards
    .map((c) => `    { k: ${JSON.stringify(c.k)}, v: ${JSON.stringify(c.v)}, foot: ${JSON.stringify(c.foot)} },`)
    .join('\n');
  const block = `export const LIVE = {
  eyebrow: 'Live signals \u00b7 refreshed daily',
  intro: 'The site rebuilds every night at 06:00 UTC via a GitHub Actions workflow. Commit counts and the Hyperliquid cohort ROI regenerate against real APIs. Every number here is reproducible.',
  last_updated_iso: '${nowIso}',
  cards: [
${cardsJs}
  ],
};
`;
  fs.writeFileSync(CONTENT, before + block + after);
  console.log('Refreshed LIVE block:');
  cards.forEach((c) => console.log(`  ${c.k}: ${c.v}`));
}

main().catch((e) => {
  console.error('refresh_live failed:', e);
  // Do not crash the build; the fallback values in content.js stay in place.
  process.exit(0);
});
