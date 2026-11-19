# Generated Trade Telemetry

The site has a daily-paced generated paper-trade feed served as static JSON:

- `scripts/generate_trades.mjs` schedules 2–5 simulated trades per UTC day and appends those due when the hourly job runs.
- `/opt/sarastotey-trading/state.json` stores durable state and survives VPS restarts.
- `public/generated/trading-live.json` is the frontend-facing JSON copied into `dist/`.
- `src/data/trading-live.json` is the build-time copy used for prerendered receipts before the browser fetch completes.
- `systems.*` in both generated JSON files contains per-system cards derived from the same durable baseline and generated trade counters as the aggregate totals.
- A VPS cron job runs the generator hourly, commits both JSON files, and pushes to `main`.

## Architecture

The Vite site serves the snapshots through Cloudflare Pages. The generator pushes its updated JSON to GitHub so the published snapshots follow the same deployment path as the site.

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

The generator balances win rates by system. CounterSnipe and copy-trader can stay meaningfully profitable, while PandaXPanther Prediction Bot targets a marginal 53% generated win rate to reflect thin prediction-market edges. Individual losses are allowed for realism; non-prediction trades protect positive cumulative generated P&L.

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

- `targetNetProfitUsd`: target simulated profit range per day.
- `tradesPerDay`: minimum and maximum simulated fills per day.
- `systemWinRates`: per-system generated win-rate targets. Prediction markets are intentionally marginal at 53%.
- `maxRecentTrades`: retained durable history.
- `maxPublicTrades`: rows exposed to the frontend receipts table.

Edit `TEMPLATES` in the same file to add instruments, price ranges, sides, quantities, or strategy labels.

The infrastructure wrapper lives at `/opt/sarastotey-trading/generate-trades.js`; it changes into `/root/projects/saras-totey-site` and runs this repo script with `SARAS_TRADE_STATE_PATH=/opt/sarastotey-trading/state.json`.

The trading page starts with its prerendered snapshot. While the page is visible, it checks the generated JSON every minute and checks again when the tab regains visibility. The dashboard, visible trade activity, and per-system paper results use the same snapshot. Dashboard totals sum the paper results across systems, and the dashboard timestamps show when the feed was generated and when the newest fill occurred. Historical receipts retain their own measurement windows. A failed or older response leaves the most recent valid snapshot on screen.

## Combined performance

The chart starts with the same illustrative $1,424 on both lines, before the first model fill. The bot line sums model-generated P&L across the three systems. Its seed history was rebuilt from overlapping Git snapshots of the current model generation and reconciled against both the cumulative fill count and P&L. Each refresh extends the stored daily archive using the all-time totals and recent fills.

The S&P 500 comparison uses [State Street’s SPY daily NAV](https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy). It values the same starting balance at each published close using the ratio to the starting NAV. Distributions are excluded.

The hourly VPS feed drives bot updates and the nightly GitHub Actions workflow preserves the updated archive and fetches the fund NAV. Run `node scripts/refresh_trading_performance.mjs` to refresh the chart data locally with Python 3 installed. The last successful benchmark data remains available if the source is unavailable.
