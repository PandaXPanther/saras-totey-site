#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const INFRA_ROOT = process.env.SARAS_TRADE_INFRA_ROOT || '/opt/sarastotey-trading';
const STATE_PATH = process.env.SARAS_TRADE_STATE_PATH || path.join(INFRA_ROOT, 'state.json');
const PUBLIC_PATH = process.env.SARAS_TRADE_PUBLIC_PATH || path.join(ROOT, 'public', 'generated', 'trading-live.json');
const STATIC_DATA_PATH = process.env.SARAS_TRADE_STATIC_DATA_PATH || path.join(ROOT, 'src', 'data', 'trading-live.json');

const BASELINE = {
  as_of: '2026-07-10T00:00:00.000Z',
  source: 'Baseline from sarastotey.com static metrics on 2026-07-10',
  portfolio_value_usd: 1648.64,
  total_profit_usd: 224.64,
  total_trades: 85,
  wins: 71,
  losses: 14,
  win_rate_pct: 83.5,
  systems: {
    countersnipe: {
      total_trades: 48,
      profit_usd: 214.97,
      portfolio_value_usd: 1424.0,
      win_rate_pct: 87.5,
    },
    prediction_bot: {
      total_trades: 17,
      profit_usd: 9.67,
      portfolio_value_usd: 0,
      win_rate_pct: 52.9,
    },
    copy_trader: {
      total_trades: 20,
      profit_usd: 0,
      portfolio_value_usd: 0,
      win_rate_pct: 100,
    },
  },
};

const CONFIG = {
  stateVersion: 5,
  tradesPerDay: [2, 5],
  targetNetProfitUsd: [3.0, 10.0],
  maxMigratedGeneratedProfitUsd: 18.0,
  systemWinRates: {
    CounterSnipe: 0.68,
    'PandaXPanther Prediction Bot': 0.51,
    'copy-trader': 0.62,
  },
  maxRecentTrades: 90,
  maxPublicTrades: 90,
};

const TEMPLATES = [
  {
    system: 'CounterSnipe',
    asset_type: 'CS2 skin',
    side: 'BUY',
    strategy: 'Sticker-adjusted CS2 skin arbitrage',
    symbols: [
      ['AK-47 | Redline FT', 17, 36],
      ['M4A1-S | Printstream MW', 175, 285],
      ['AWP | Asiimov FT', 95, 148],
      ['USP-S | Kill Confirmed MW', 76, 132],
      ['Desert Eagle | Printstream FT', 38, 72],
      ['Glock-18 | Gamma Doppler FN', 62, 104],
    ],
    holdHours: [168, 212],
    profitPct: [0.006, 0.028],
    lossPct: [-0.018, -0.004],
  },
  {
    system: 'PandaXPanther Prediction Bot',
    asset_type: 'prediction contract',
    side: 'BUY NO',
    strategy: 'Sports contract-line value NO-only',
    symbols: [
      ['Kalshi NFL game winner NO', 0.31, 0.74],
      ['Kalshi Fed decision NO', 0.28, 0.67],
      ['Polymarket election margin NO', 0.22, 0.71],
      ['Kalshi NBA total points NO', 0.34, 0.69],
    ],
    quantity: [40, 160],
    profitPct: [0.004, 0.018],
    lossPct: [-0.024, -0.006],
  },
  {
    system: 'PandaXPanther Prediction Bot',
    asset_type: 'prediction contract',
    side: 'BUY YES+NO',
    strategy: 'Polymarket sum-to-one arbitrage',
    symbols: [
      ['Polymarket Fed target range bundle', 0.94, 0.985],
      ['Polymarket crypto year-end bundle', 0.925, 0.982],
      ['Polymarket sports series bundle', 0.945, 0.99],
    ],
    quantity: [35, 140],
    profitPct: [0.003, 0.012],
    lossPct: [-0.014, -0.003],
  },
  {
    system: 'PandaXPanther Prediction Bot',
    asset_type: 'crypto prediction contract',
    side: 'BUY',
    strategy: 'Crypto latency',
    symbols: [
      ['BTC above intraday range', 0.36, 0.78],
      ['ETH above weekly range', 0.33, 0.73],
      ['SOL above daily range', 0.29, 0.76],
    ],
    quantity: [35, 150],
    profitPct: [0.004, 0.02],
    lossPct: [-0.022, -0.005],
  },
  {
    system: 'copy-trader',
    asset_type: 'Hyperliquid perpetual',
    side: 'BUY',
    strategy: 'Composite-score wallet mirror',
    symbols: [
      ['BTC-PERP', 58000, 76000],
      ['ETH-PERP', 2850, 4300],
      ['SOL-PERP', 112, 210],
      ['HYPE-PERP', 24, 49],
    ],
    notional: [450, 2200],
    profitPct: [0.002, 0.009],
    lossPct: [-0.006, -0.0015],
  },
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return {
      version: CONFIG.stateVersion,
      baseline: BASELINE,
      generated: {
        total_profit_usd: 0,
        total_trades: 0,
        wins: 0,
        losses: 0,
        portfolio_delta_usd: 0,
      },
      trades: [],
      last_generated_iso: null,
    };
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randBetween(rng, min, max) {
  return min + (max - min) * rng();
}

function randInt(rng, min, max) {
  return Math.floor(randBetween(rng, min, max + 1));
}

function pick(rng, values) {
  return values[Math.floor(rng() * values.length)];
}

function round(value, places = 2) {
  return Number(value.toFixed(places));
}

function emptySystemStats() {
  return { total_trades: 0, wins: 0, losses: 0, profit_usd: 0, notional_usd: 0, return_pct_sum: 0 };
}

function ensureGeneratedSystemStats(state) {
  if (state.generated.systems) return;
  state.generated.systems = Object.fromEntries(
    Object.keys(CONFIG.systemWinRates).map((system) => [system, emptySystemStats()]),
  );
  for (const trade of state.trades) {
    const stats = state.generated.systems[trade.system] ?? emptySystemStats();
    stats.total_trades += 1;
    stats.wins += trade.result === 'WIN' ? 1 : 0;
    stats.losses += trade.result === 'LOSS' ? 1 : 0;
    stats.profit_usd = round(stats.profit_usd + trade.profit_loss_usd, 2);
    stats.notional_usd = round(stats.notional_usd + trade.notional_usd, 2);
    stats.return_pct_sum = round(stats.return_pct_sum + trade.profit_loss_pct, 2);
    state.generated.systems[trade.system] = stats;
  }
}

function pricePlaces(price) {
  if (price < 1) return 3;
  if (price < 100) return 2;
  return 2;
}

function hourKey(date) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function dayStart(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function minuteOfDay(date) {
  const d = new Date(date);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function generatedStatsForSystem(state, system) {
  return state.trades.reduce(
    (stats, trade) => {
      if (trade.system !== system) return stats;
      if (trade.result === 'WIN') stats.wins += 1;
      else stats.losses += 1;
      return stats;
    },
    { wins: 0, losses: 0 },
  );
}

function targetWinRateForSystem(system) {
  return CONFIG.systemWinRates[system] ?? 0.7;
}

function shouldWinForSystem(state, system) {
  const { wins, losses } = generatedStatsForSystem(state, system);
  const total = wins + losses;
  if (total === 0) return true;

  const target = targetWinRateForSystem(system);
  const currentRate = wins / total;
  const winDistance = Math.abs((wins + 1) / (total + 1) - target);
  const lossDistance = Math.abs(wins / (total + 1) - target);

  if (currentRate < target - 0.02) return true;
  if (currentRate > target + 0.02) return false;
  return winDistance <= lossDistance;
}

function pickTemplate(timestampIso, state, index, templates = TEMPLATES) {
  const seed = xmur3(`${timestampIso}:${state.generated.total_trades}:${state.generated.total_profit_usd}:${index}`)();
  const rng = mulberry32(seed);
  return pick(rng, templates);
}

function buildTrade(timestampIso, state, index, forcedWinner, forcedTemplate) {
  const seed = xmur3(`${timestampIso}:${state.generated.total_trades}:${state.generated.total_profit_usd}:${index}`)();
  const rng = mulberry32(seed);
  const template = forcedTemplate ?? pick(rng, TEMPLATES);
  const [instrument, minPrice, maxPrice] = pick(rng, template.symbols);
  const isLoss = !forcedWinner;
  const pct = randBetween(rng, ...(isLoss ? template.lossPct : template.profitPct));
  const entry = randBetween(rng, minPrice, maxPrice);
  const exit = entry * (1 + pct);

  let quantity = 1;
  let notional = entry;
  if (template.quantity) {
    quantity = randInt(rng, ...template.quantity);
    notional = entry * quantity;
  } else if (template.notional) {
    notional = randBetween(rng, ...template.notional);
    quantity = notional / entry;
  }

  const pnl = round(notional * pct, 2);
  const id = `${timestampIso.slice(0, 13).replace(/\D/g, '')}-${index + 1}`;

  return {
    id,
    timestamp: timestampIso,
    system: template.system,
    asset_type: template.asset_type,
    instrument,
    side: template.side,
    entry_price: round(entry, pricePlaces(entry)),
    exit_price: round(exit, pricePlaces(exit)),
    quantity: template.notional ? round(quantity, 5) : round(quantity, 2),
    notional_usd: round(notional, 2),
    profit_loss_usd: pnl,
    profit_loss_pct: round(pct * 100, 2),
    strategy: template.strategy,
    result: pnl >= 0 ? 'WIN' : 'LOSS',
    holding_period_hours: template.holdHours ? randInt(rng, ...template.holdHours) : randBetween(rng, 0.02, 2.4).toFixed(2),
  };
}

function targetProfitForDay(timestampIso) {
  const rng = mulberry32(xmur3(`target:${dayKey(timestampIso)}`)());
  return randBetween(rng, ...CONFIG.targetNetProfitUsd);
}

function tradeCountForDay(timestampIso) {
  const rng = mulberry32(xmur3(`count:${dayKey(timestampIso)}`)());
  return randInt(rng, ...CONFIG.tradesPerDay);
}

function tradeMinutesForDay(timestampIso) {
  const count = tradeCountForDay(timestampIso);
  const rng = mulberry32(xmur3(`slots:${dayKey(timestampIso)}`)());
  return Array.from({ length: count }, (_, index) => {
    const base = 90 + Math.floor(((index + 1) * 1260) / (count + 1));
    const jitter = randInt(rng, -42, 42);
    return Math.max(30, Math.min(1410, base + jitter));
  }).sort((a, b) => a - b);
}

function appendTrade(state, trade) {
  ensureGeneratedSystemStats(state);
  state.trades.unshift(trade);
  state.trades = state.trades.slice(0, CONFIG.maxRecentTrades);
  state.generated.total_trades += 1;
  state.generated.total_profit_usd = round(state.generated.total_profit_usd + trade.profit_loss_usd, 2);
  state.generated.portfolio_delta_usd = round(state.generated.portfolio_delta_usd + Math.max(trade.profit_loss_usd * 0.72, 0), 2);
  if (trade.profit_loss_usd >= 0) state.generated.wins += 1;
  else state.generated.losses += 1;
  const system = state.generated.systems[trade.system] ?? emptySystemStats();
  system.total_trades += 1;
  system.wins += trade.result === 'WIN' ? 1 : 0;
  system.losses += trade.result === 'LOSS' ? 1 : 0;
  system.profit_usd = round(system.profit_usd + trade.profit_loss_usd, 2);
  system.notional_usd = round(system.notional_usd + trade.notional_usd, 2);
  system.return_pct_sum = round(system.return_pct_sum + trade.profit_loss_pct, 2);
  state.generated.systems[trade.system] = system;
  state.last_generated_iso = trade.timestamp;
}

function generateForDay(state, timestampIso, options = {}) {
  const bucket = dayKey(timestampIso);
  const existingForDay = state.trades.filter((trade) => dayKey(trade.timestamp) === bucket).length;
  const dueMinutes = tradeMinutesForDay(timestampIso).filter((minute) => options.fullDay || minute <= minuteOfDay(timestampIso));
  if (existingForDay >= dueMinutes.length) {
    return 0;
  }

  const targetProfit = targetProfitForDay(timestampIso);
  let generated = 0;

  for (let i = existingForDay; i < dueMinutes.length; i += 1) {
    const tradeTime = dayStart(timestampIso);
    tradeTime.setUTCMinutes(dueMinutes[i], 0, 0);
    const templates = options.templates ?? TEMPLATES;
    const template = pickTemplate(tradeTime.toISOString(), state, i, templates);
    const trade = buildTrade(tradeTime.toISOString(), state, i, shouldWinForSystem(state, template.system), template);
    const dayTrades = [trade, ...state.trades.filter((item) => dayKey(item.timestamp) === bucket)];
    const dayProfit = dayTrades.reduce((sum, item) => sum + item.profit_loss_usd, 0);
    if (i === dueMinutes.length - 1 && dayProfit < targetProfit) {
      const profitableTemplates = (options.templates ?? TEMPLATES).filter(
        (item) => item.system !== 'PandaXPanther Prediction Bot',
      );
      const repairedTemplate = pickTemplate(`${tradeTime.toISOString()}:repair`, state, i, profitableTemplates);
      const repaired = buildTrade(tradeTime.toISOString(), state, i, true, repairedTemplate);
      appendTrade(state, repaired);
    } else {
      appendTrade(state, trade);
    }
    generated += 1;
  }

  if (state.generated.total_profit_usd <= 0) {
    const repairTime = new Date(timestampIso);
    repairTime.setUTCHours(23, 50, 0, 0);
    const profitableTemplates = (options.templates ?? TEMPLATES).filter(
      (item) => item.system !== 'PandaXPanther Prediction Bot',
    );
    const repairedTemplate = pickTemplate(`${repairTime.toISOString()}:cumulative-repair`, state, dueMinutes.length, profitableTemplates);
    appendTrade(state, buildTrade(repairTime.toISOString(), state, dueMinutes.length, true, repairedTemplate));
    generated += 1;
  }

  return generated;
}

function resetGeneratedState(state) {
  state.generated = {
    total_profit_usd: 0,
    total_trades: 0,
    wins: 0,
    losses: 0,
    portfolio_delta_usd: 0,
    systems: Object.fromEntries(Object.keys(CONFIG.systemWinRates).map((system) => [system, emptySystemStats()])),
  };
  state.trades = [];
  state.last_generated_iso = null;
}

function dateRangeForMigration(state, timestampIso) {
  const tradeTimes = (state.trades || [])
    .map((trade) => new Date(trade.timestamp).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b);
  const fallbackStart = new Date(state.baseline?.as_of ?? BASELINE.as_of).getTime();
  const startMs = tradeTimes[0] ?? fallbackStart;
  const endMs = new Date(timestampIso).getTime();
  return {
    start: dayStart(Number.isFinite(startMs) ? startMs : endMs),
    end: dayStart(Number.isFinite(endMs) ? endMs : Date.now()),
  };
}

function rebalanceGeneratedProfit(state, targetProfitUsd) {
  const winners = state.trades.filter((trade) => trade.result === 'WIN' && trade.profit_loss_pct > 0);
  if (winners.length === 0) return;

  const losses = state.trades
    .filter((trade) => trade.result === 'LOSS')
    .reduce((sum, trade) => sum + trade.profit_loss_usd, 0);
  const positiveTarget = Math.max(0, targetProfitUsd - losses);
  const weights = winners.map((trade) => Math.max(0.25, Math.abs(trade.profit_loss_pct)));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

  let assigned = 0;
  winners.forEach((trade, index) => {
    const isLast = index === winners.length - 1;
    const pnl = isLast ? round(positiveTarget - assigned, 2) : round((positiveTarget * weights[index]) / weightTotal, 2);
    assigned = round(assigned + pnl, 2);
    const pct = trade.profit_loss_pct / 100;
    const notional = pct > 0 ? round(pnl / pct, 2) : trade.notional_usd;

    trade.profit_loss_usd = pnl;
    trade.notional_usd = notional;
    trade.quantity = round(notional / trade.entry_price, 5);
  });

  state.generated.total_profit_usd = round(
    state.trades.reduce((sum, trade) => sum + trade.profit_loss_usd, 0),
    2,
  );
  state.generated.portfolio_delta_usd = round(
    state.trades.reduce((sum, trade) => sum + Math.max(trade.profit_loss_usd * 0.55, 0), 0),
    2,
  );
}

function normalizeLegacyState(state, timestampIso) {
  if (state.version === CONFIG.stateVersion) return 0;

  const previous = {
    version: state.version ?? 1,
    total_profit_usd: Number(state.generated?.total_profit_usd ?? 0),
    total_trades: Number(state.generated?.total_trades ?? 0),
    last_generated_iso: state.last_generated_iso ?? null,
  };
  const { start, end } = dateRangeForMigration(state, timestampIso);
  const hyperliquidTemplates = TEMPLATES.filter((template) => template.system === 'copy-trader');

  state.version = CONFIG.stateVersion;
  state.baseline = state.baseline ?? BASELINE;
  state.migrated_from = previous;
  resetGeneratedState(state);

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const isCurrentDay = dayKey(cursor) === dayKey(timestampIso);
    const generationTime = isCurrentDay ? new Date(timestampIso) : new Date(cursor);
    if (!isCurrentDay) generationTime.setUTCHours(23, 59, 0, 0);
    generateForDay(state, generationTime.toISOString(), {
      fullDay: !isCurrentDay,
      templates: hyperliquidTemplates,
    });
  }

  const migratedTarget = Math.min(previous.total_profit_usd, CONFIG.maxMigratedGeneratedProfitUsd);
  if (migratedTarget > state.generated.total_profit_usd) {
    rebalanceGeneratedProfit(state, migratedTarget);
  }

  state.generated.total_trades = state.trades.length;
  state.generated.wins = state.trades.filter((trade) => trade.result === 'WIN').length;
  state.generated.losses = state.trades.filter((trade) => trade.result === 'LOSS').length;
  state.last_generated_iso = state.trades[0]?.timestamp ?? null;

  return previous.total_trades;
}

function computeDashboard(state) {
  ensureGeneratedSystemStats(state);
  const totalTrades = state.baseline.total_trades + state.generated.total_trades;
  const wins = state.baseline.wins + state.generated.wins;
  const totalProfit = state.baseline.total_profit_usd + state.generated.total_profit_usd;
  const portfolioValue = state.baseline.portfolio_value_usd + state.generated.portfolio_delta_usd;
  const systemDefinitions = {
    countersnipe: { generatedKey: 'CounterSnipe', baselineKey: 'countersnipe', label: 'CounterSnipe', mode: 'generated paper' },
    'prediction-bot': { generatedKey: 'PandaXPanther Prediction Bot', baselineKey: 'prediction_bot', label: 'Prediction bot', mode: 'generated paper' },
    'copy-trader': { generatedKey: 'copy-trader', baselineKey: 'copy_trader', label: 'copy-trader', mode: 'generated paper mirror' },
  };
  const systems = Object.fromEntries(Object.entries(systemDefinitions).map(([slug, definition]) => {
    const baseline = state.baseline.systems[definition.baselineKey];
    const generated = state.generated.systems[definition.generatedKey] ?? emptySystemStats();
    const combinedRecords = baseline.total_trades + generated.total_trades;
    const baselineWins = Math.round((baseline.win_rate_pct / 100) * baseline.total_trades);
    const combinedWins = baselineWins + generated.wins;
    const generatedWinRate = generated.total_trades ? round((generated.wins / generated.total_trades) * 100, 1) : 0;
    const averageGeneratedReturn = generated.total_trades ? round(generated.return_pct_sum / generated.total_trades, 2) : 0;
    return [slug, {
      baseline,
      generated,
      cards: [
        { k: 'Real / research baseline', v: `${baseline.total_trades}`, foot: `${definition.label} observations recorded before generated telemetry` },
        { k: 'Baseline P&L', v: `${baseline.profit_usd >= 0 ? '+' : '-'}$${Math.abs(baseline.profit_usd).toFixed(2)}`, foot: 'Verified baseline · never blended into simulated attribution' },
        { k: 'Generated paper fills', v: `${generated.total_trades}`, foot: `${definition.mode} · appended by the shared trade log` },
        { k: 'Generated paper P&L', v: `${generated.profit_usd >= 0 ? '+' : '-'}$${Math.abs(generated.profit_usd).toFixed(2)}`, foot: `${generatedWinRate.toFixed(1)}% generated win rate` },
        { k: 'Average generated return', v: `${averageGeneratedReturn >= 0 ? '+' : ''}${averageGeneratedReturn.toFixed(2)}%`, foot: `$${generated.notional_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })} cumulative paper notional` },
        slug === 'copy-trader'
          ? { k: 'Research + paper records', v: `${combinedRecords}`, foot: `${baseline.total_trades} ranked wallets · ${generated.total_trades} generated paper fills` }
          : { k: 'Combined outcomes', v: `${combinedRecords}`, foot: `${round((combinedWins / combinedRecords) * 100, 1).toFixed(1)}% baseline + generated outcome rate` },
      ],
    }];
  }));
  return {
    generated_at: new Date().toISOString(),
    baseline: state.baseline,
    totals: {
      portfolio_value_usd: round(portfolioValue, 2),
      total_profit_usd: round(totalProfit, 2),
      generated_profit_usd: round(state.generated.total_profit_usd, 2),
      total_trades: totalTrades,
      generated_trades: state.generated.total_trades,
      win_rate_pct: round((wins / totalTrades) * 100, 1),
      last_trade_iso: state.trades[0]?.timestamp ?? null,
    },
    cards: [
      {
        k: 'Portfolio value',
        v: `$${round(portfolioValue, 2).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        foot: 'Verified baseline portfolio plus generated paper drift',
      },
      {
        k: 'Total profit',
        v: `+$${round(totalProfit, 2).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        foot: `+$${round(state.generated.total_profit_usd, 2).toLocaleString('en-US', { minimumFractionDigits: 2 })} generated after baseline`,
      },
      {
        k: 'Total trades',
        v: String(totalTrades),
        foot: `${state.generated.total_trades} generated daily-paced trades`,
      },
      {
        k: 'Win rate',
        v: `${round((wins / totalTrades) * 100, 1)}%`,
        foot: 'Baseline receipts plus generated trade outcomes',
      },
      {
        k: 'Active asset classes',
        v: '3',
        foot: 'CS2 skins · prediction contracts · Hyperliquid perps',
      },
      {
        k: 'Latest strategy',
        v: state.trades[0]?.strategy ?? 'Awaiting first generated trade',
        foot: state.trades[0]?.instrument ?? 'Cron has not generated yet',
      },
    ],
    systems,
    trades: state.trades.slice(0, CONFIG.maxPublicTrades),
    config: {
      cadence: 'daily-paced',
      storage: STATE_PATH,
      generated_public_json: 'public/generated/trading-live.json',
      persistent_state: STATE_PATH,
      trades_per_day: `${CONFIG.tradesPerDay[0]}-${CONFIG.tradesPerDay[1]}`,
      target_win_rates: Object.fromEntries(
        Object.entries(CONFIG.systemWinRates).map(([system, rate]) => [system, `${Math.round(rate * 100)}%`]),
      ),
      profit_model: 'Daily-paced paper fills use sub-2.8% wins, capped losses, and a one-time migration away from the old hourly backlog.',
    },
  };
}

function maybeCommitAndPush(message) {
  if (!process.argv.includes('--commit')) return;

  const status = spawnSync('git', ['status', '--porcelain', 'public/generated/trading-live.json', 'src/data/trading-live.json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (!status.stdout.trim()) return;

  spawnSync('git', ['add', 'public/generated/trading-live.json', 'src/data/trading-live.json'], { cwd: ROOT, stdio: 'inherit' });
  const commit = spawnSync('git', ['commit', '-m', message], { cwd: ROOT, stdio: 'inherit' });
  if (commit.status !== 0) return;
  spawnSync('git', ['push'], { cwd: ROOT, stdio: 'inherit' });
}

function main() {
  const state = loadState();
  const now = process.env.TRADE_TIMESTAMP ? new Date(process.env.TRADE_TIMESTAMP) : new Date();
  now.setUTCMinutes(0, 0, 0);
  const timestampIso = now.toISOString();
  const migrated = normalizeLegacyState(state, timestampIso);
  const generated = generateForDay(state, timestampIso);
  const dashboard = computeDashboard(state);

  saveJson(STATE_PATH, state);
  saveJson(PUBLIC_PATH, dashboard);
  saveJson(STATIC_DATA_PATH, dashboard);

  if (migrated > 0) console.log(`Migrated ${migrated} legacy hourly trades to daily-paced state`);
  console.log(`${generated > 0 ? `Generated ${generated}` : 'Already generated'} trades for ${timestampIso}`);
  console.log(`Total trades: ${dashboard.totals.total_trades}`);
  console.log(`Total profit: $${dashboard.totals.total_profit_usd.toFixed(2)}`);
  console.log(`State JSON: ${STATE_PATH}`);
  console.log(`Public JSON: ${PUBLIC_PATH}`);
  console.log(`Static data JSON: ${STATIC_DATA_PATH}`);

  maybeCommitAndPush('chore: refresh generated trade telemetry');
}

main();
