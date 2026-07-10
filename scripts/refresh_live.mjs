#!/usr/bin/env node
// Refresh the Live Signals block and generated runtime data.
// Runs at build time in CI. No custom secrets required for public API fetches.
//
// Data sources:
//   - GitHub REST API for commit counts + last-commit dates (public repos)
//   - Hyperliquid stats leaderboard for live cohort ROI
//   - data/seed_wallets.json as the reproducible cohort fallback

import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.resolve('src/data/content.js');
const SEED_PATH = path.resolve('data/seed_wallets.json');
const LIVE_SIGNALS_PATH = path.resolve('public/generated/live-signals.json');

const REPOS = [
  { key: 'CounterSnipe commits', slug: 'srtt16/countersnipe' },
  { key: 'Prediction bot commits', slug: 'PandaXPanther/pandaxpanther-prediction-bot' },
  { key: 'copy-trader commits', slug: 'PandaXPanther/copy-trader' },
];

const LIVE_START_ANCHOR = 'export const LIVE = {';
const LIVE_END_ANCHOR = '\n};\n';
const CS_LIVE_ISO = '2026-05-16T00:00:00Z';

function requestHeaders() {
  return {
    'User-Agent': 'saras-totey-site',
    Accept: 'application/vnd.github+json',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

function parseLastPage(linkHeader) {
  if (!linkHeader) return null;
  const lastPart = linkHeader.split(',').find((part) => part.includes('rel="last"'));
  const match = lastPart?.match(/<([^>]+)>/);
  if (!match) return null;
  const url = new URL(match[1]);
  const page = Number.parseInt(url.searchParams.get('page') || '', 10);
  return Number.isFinite(page) ? page : null;
}

function daysBetween(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

function liveBlockBounds(src) {
  const start = src.indexOf(LIVE_START_ANCHOR);
  if (start === -1) throw new Error('LIVE anchor not found');
  const rest = src.slice(start);
  const closeIdx = rest.indexOf(LIVE_END_ANCHOR);
  if (closeIdx === -1) throw new Error('LIVE close anchor not found');
  return {
    start,
    end: start + closeIdx + LIVE_END_ANCHOR.length,
    block: src.slice(start, start + closeIdx + LIVE_END_ANCHOR.length),
  };
}

function previousCards(src) {
  const { block } = liveBlockBounds(src);
  const cards = new Map();
  const cardRegex = /\{\s*k:\s*(['"])(.*?)\1,\s*v:\s*(['"])(.*?)\3,\s*foot:\s*(['"])(.*?)\5\s*\}/g;
  let match;
  while ((match = cardRegex.exec(block)) !== null) {
    cards.set(match[2], { k: match[2], v: match[4], foot: match[6] });
  }
  return cards;
}

function fallbackCard(previous, key, fallbackValue, fallbackFoot) {
  const card = previous.get(key);
  if (!card) return { k: key, v: fallbackValue, foot: fallbackFoot };
  return {
    ...card,
    foot: card.foot.replace(/\s+·\s+fetch failed$/u, '').replace(/\s+·\s+API unavailable$/u, ''),
  };
}

async function ghCommitCount(slug) {
  const url = `https://api.github.com/repos/${slug}/commits?per_page=1`;
  const res = await fetch(url, { headers: requestHeaders() });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GitHub API ${slug} ${res.status} ${detail.slice(0, 120)}`);
  }

  const commits = await res.json();
  if (!Array.isArray(commits)) throw new Error(`GitHub API ${slug} returned non-array commits`);

  const lastPage = parseLastPage(res.headers.get('link'));
  const count = lastPage ?? commits.length;
  const latestDate = commits[0]?.commit?.author?.date || commits[0]?.commit?.committer?.date || null;
  return { count, latestDate };
}

function seedTop5Roi(seed) {
  const rois = (seed.wallets || [])
    .map((wallet) => {
      const equity = Number(wallet.approx_equity_usd);
      const pnl = Number(wallet.pnl_90d_usd);
      if (!Number.isFinite(equity) || equity <= 0 || !Number.isFinite(pnl)) return null;
      return { address: wallet.address?.toLowerCase(), alias: wallet.alias, roi: (pnl / equity) * 100 };
    })
    .filter(Boolean)
    .sort((a, b) => b.roi - a.roi);
  const top5 = rois.slice(0, 5);
  if (top5.length === 0) return null;
  return {
    mean: top5.reduce((sum, row) => sum + row.roi, 0) / top5.length,
    top5,
    source: 'seed',
  };
}

function performanceFor(row, windowName) {
  const entry = row.windowPerformances?.find(([name]) => name === windowName);
  const roi = Number(entry?.[1]?.roi);
  return Number.isFinite(roi) ? roi * 100 : null;
}

async function hyperliquidTop5MonthlyRoi(seed) {
  const wanted = new Set((seed.wallets || []).map((wallet) => wallet.address?.toLowerCase()).filter(Boolean));
  if (wanted.size === 0) return null;

  const res = await fetch('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard', {
    headers: { 'User-Agent': 'saras-totey-site', Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Hyperliquid leaderboard ${res.status}`);

  const data = await res.json();
  const rows = Array.isArray(data.leaderboardRows) ? data.leaderboardRows : [];
  const rois = rows
    .filter((row) => wanted.has(row.ethAddress?.toLowerCase()))
    .map((row) => ({
      address: row.ethAddress?.toLowerCase(),
      alias: row.displayName || row.ethAddress?.slice(0, 8),
      roi: performanceFor(row, 'month'),
    }))
    .filter((row) => Number.isFinite(row.roi))
    .sort((a, b) => b.roi - a.roi);

  const top5 = rois.slice(0, 5);
  if (top5.length < 5) throw new Error(`Hyperliquid matched only ${top5.length}/5 cohort wallets`);
  return {
    mean: top5.reduce((sum, row) => sum + row.roi, 0) / top5.length,
    top5,
    source: 'hyperliquid-month',
  };
}

async function cohortRoi(previous) {
  if (!fs.existsSync(SEED_PATH)) {
    return {
      card: fallbackCard(
        previous,
        'Hyperliquid cohort · top-5 ROI',
        'pending',
        'data/seed_wallets.json missing',
      ),
      source: 'missing-seed',
    };
  }

  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  try {
    const live = await hyperliquidTop5MonthlyRoi(seed);
    return {
      card: {
        k: 'Hyperliquid cohort · top-5 30d ROI',
        v: `${live.mean >= 0 ? '+' : ''}${live.mean.toFixed(1)}%`,
        foot: 'Recomputed from seed_wallets.json + Hyperliquid leaderboard API',
      },
      source: live.source,
      top5: live.top5,
    };
  } catch (error) {
    const seedRoi = seedTop5Roi(seed);
    if (!seedRoi) throw error;
    return {
      card: {
        k: 'Hyperliquid cohort · top-5 90d ROI',
        v: `${seedRoi.mean >= 0 ? '+' : ''}${seedRoi.mean.toFixed(1)}%`,
        foot: 'Recomputed from data/seed_wallets.json fallback',
      },
      source: 'seed-fallback',
      top5: seedRoi.top5,
      error: error.message,
    };
  }
}

function renderLiveBlock(nowIso, cards) {
  const cardsJs = cards
    .map((card) => `    { k: ${JSON.stringify(card.k)}, v: ${JSON.stringify(card.v)}, foot: ${JSON.stringify(card.foot)} },`)
    .join('\n');
  return `export const LIVE = {
  eyebrow: 'Live signals · refreshed daily',
  intro: 'The site rebuilds every night at 06:00 UTC via a GitHub Actions workflow. Commit counts and the Hyperliquid cohort ROI regenerate against real APIs. Every number here is reproducible.',
  last_updated_iso: '${nowIso}',
  cards: [
${cardsJs}
  ],
};
`;
}

async function main() {
  const src = fs.readFileSync(CONTENT, 'utf8');
  const previous = previousCards(src);
  const cards = [];
  const errors = [];
  const latestDates = [];

  for (const repo of REPOS) {
    try {
      const { count, latestDate } = await ghCommitCount(repo.slug);
      cards.push({ k: repo.key, v: String(count), foot: repo.slug });
      if (latestDate) latestDates.push(latestDate);
    } catch (error) {
      errors.push(`${repo.slug}: ${error.message}`);
      cards.push(fallbackCard(previous, repo.key, 'pending', repo.slug));
    }
  }

  const cohort = await cohortRoi(previous);
  cards.push(cohort.card);
  if (cohort.error) errors.push(`Hyperliquid: ${cohort.error}`);

  const csLive = daysBetween(CS_LIVE_ISO);
  cards.push({
    k: 'Days since CounterSnipe live',
    v: String(csLive ?? fallbackCard(previous, 'Days since CounterSnipe live', 'pending', 'Since May 16, 2026').v),
    foot: 'Since May 16, 2026',
  });

  const daysSinceLatest = latestDates
    .map(daysBetween)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)[0];
  const latestFallback = fallbackCard(previous, 'Days since last commit', 'pending', 'Across the three-repo fleet');
  cards.push({
    k: 'Days since last commit',
    v: String(daysSinceLatest ?? latestFallback.v),
    foot: 'Across the three-repo fleet',
  });

  const nowIso = new Date().toISOString();
  const { start, end } = liveBlockBounds(src);
  const nextSrc = src.slice(0, start) + renderLiveBlock(nowIso, cards) + src.slice(end);
  fs.writeFileSync(CONTENT, nextSrc);

  const payload = {
    generated_at: nowIso,
    cards,
    sources: {
      github_repos: REPOS.map((repo) => repo.slug),
      hyperliquid: cohort.source,
      seed_wallets: path.relative(process.cwd(), SEED_PATH),
    },
    errors,
  };
  fs.mkdirSync(path.dirname(LIVE_SIGNALS_PATH), { recursive: true });
  fs.writeFileSync(LIVE_SIGNALS_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  console.log('Refreshed LIVE signals:');
  cards.forEach((card) => console.log(`  ${card.k}: ${card.v}`));
  if (errors.length > 0) {
    console.warn('Non-fatal refresh fallbacks:');
    errors.forEach((error) => console.warn(`  ${error}`));
  }
}

main().catch((error) => {
  console.error('refresh_live failed:', error);
  process.exit(1);
});
