# Generated Trade Telemetry

The site now has an hourly generated paper-trade feed. It is intentionally static infrastructure:

- `scripts/generate_trades.mjs` creates 3-8 realistic paper trades for the current UTC hour.
- `/opt/sarastotey-trading/state.json` stores durable state and survives VPS restarts.
- `public/generated/trading-live.json` is the frontend-facing JSON copied into `dist/`.
- A VPS cron job runs the generator hourly, commits both JSON files, and pushes to `main`.

## Architecture

This uses Option A: cron plus static JSON.

The site is a Vite/React static site behind Cloudflare. A long-running API would add process monitoring, TLS/routing, and cache invalidation without much benefit for one hourly append-only feed. Pushing static JSON through the existing GitHub/Cloudflare Pages deployment path keeps the runtime surface small and makes the generated history auditable in git.

## Baseline Values

The generator starts from the live site values observed on 2026-07-10:

- CounterSnipe capital deployed: `$1,424`
- CounterSnipe unrealized gain: `+$214.97`
- CounterSnipe attempts: `48`
- Prediction bot v3.6 paper trades: `17`
- Prediction bot net gain: `+$9.67`
- Prediction bot win rate: `52.9%`
- copy-trader ranked wallets: `20`
- copy-trader top-5 mean 90d ROI: `+396.0%`

Aggregate dashboard baseline:

- Portfolio value: `$1,648.64`
- Total profit: `+$224.64`
- Total trades: `85`
- Win rate: `83.5%`

## Trade Model

Generated trades use only instruments and strategies already present on the site:

- CS2 skins: sticker-adjusted arbitrage and mid-float mispricing.
- Kalshi/Polymarket contracts: sports contract-line value NO-only, sum-to-one arbitrage, crypto latency.
- Hyperliquid perpetuals: BTC, ETH, SOL, and HYPE copy-trader paper mirrors.

The generator targets roughly a 75% generated win rate. Some individual generated trades may lose money for realism, but cumulative generated P&L is protected so the feed trends positive.

## Manual Commands

Generate or refresh the current hour without committing:

```bash
/opt/sarastotey-trading/generate-trades.js
```

Generate, commit, and push:

```bash
cd /root/projects/saras-totey-site
npm run generate-trade:commit
```

Generate a specific hour for testing:

```bash
cd /root/projects/saras-totey-site
TRADE_TIMESTAMP=2026-07-10T20:00:00Z npm run generate-trade
```

View cron logs:

```bash
tail -f /var/log/saras-totey-trades.log
```

Current cron entry:

```cron
7 * * * * /opt/sarastotey-trading/generate-trades.js --commit >> /var/log/saras-totey-trades.log 2>&1
```

## Profitability Parameters

Edit `CONFIG` in `scripts/generate_trades.mjs`:

- `targetNetProfitUsd`: expected positive drift range per generated hour.
- `tradesPerHour`: min/max generated fills per hourly batch.
- `targetWinRate`: generated win-rate target, currently 75%.
- `maxRecentTrades`: retained durable history.
- `maxPublicTrades`: rows exposed to the frontend.

Edit `TEMPLATES` in the same file to add instruments, price ranges, sides, quantities, or strategy labels.

The infrastructure wrapper lives at `/opt/sarastotey-trading/generate-trades.js`; it changes into `/root/projects/saras-totey-site` and runs this repo script with `SARAS_TRADE_STATE_PATH=/opt/sarastotey-trading/state.json`.
