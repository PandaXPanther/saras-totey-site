import { useEffect, useState } from 'react';
import { LIVE, SYSTEMS } from './content.js';
import snapshot from './trading-live.json';
import initialPerformance from './trading-performance.json';
import { validPerformance } from './tradingPerformance.js';

const refreshIntervalMs = 60_000;
const initialSignals = { generated_at: LIVE.last_updated_iso, cards: LIVE.cards };
const validCards = (cards) => Array.isArray(cards) && cards.length > 0
  && cards.every((card) => typeof card?.k === 'string' && typeof card.v === 'string');
const tradeLabels = ['id', 'system', 'asset_type', 'instrument', 'side', 'strategy'];
const tradeNumbers = ['entry_price', 'exit_price', 'profit_loss_usd', 'profit_loss_pct'];

function validPaperStats(stats) {
  return Number.isSafeInteger(stats?.total_trades) && stats.total_trades >= 0
    && Number.isSafeInteger(stats.wins) && stats.wins >= 0 && stats.wins <= stats.total_trades
    && Number.isFinite(stats.profit_usd) && Number.isFinite(stats.return_pct_sum)
    && Number.isFinite(stats.notional_usd) && stats.notional_usd >= 0;
}

function validDashboard(data) {
  const startingBalance = data?.baseline?.systems?.countersnipe?.portfolio_value_usd;
  return Number.isFinite(startingBalance) && startingBalance > 0
    && SYSTEMS.every(({ slug }) => validPaperStats(data?.systems?.[slug]?.generated))
    && Array.isArray(data.trades)
    && data.trades.every((trade) => Number.isFinite(Date.parse(trade?.timestamp))
      && tradeLabels.every((key) => typeof trade[key] === 'string')
      && tradeNumbers.every((key) => Number.isFinite(trade[key])))
    && new Set(data.trades.map(({ id }) => id)).size === data.trades.length;
}

async function refresh(path, validate, setter, signal) {
  try {
    const response = await fetch(`/generated/${path}.json?ts=${Date.now()}`, { cache: 'no-store', signal });
    if (!response.ok) return;
    const data = await response.json();
    const timestamp = Date.parse(data?.generated_at);
    if (signal.aborted || !Number.isFinite(timestamp) || !validate(data)) return;
    setter((previous) => timestamp > Date.parse(previous.generated_at) ? data : previous);
  } catch {
    // Keep the last complete snapshot during transient network or JSON errors.
  }
}

export function useTradingFeeds() {
  const [dashboard, setDashboard] = useState(snapshot);
  const [signals, setSignals] = useState(initialSignals);
  const [performance, setPerformance] = useState(initialPerformance);

  useEffect(() => {
    let request;
    const update = () => {
      if (document.visibilityState === 'hidden') return;
      request?.abort();
      request = new AbortController();
      refresh('trading-live', validDashboard, setDashboard, request.signal);
      refresh('trading-performance', validPerformance, setPerformance, request.signal);
      refresh('live-signals', (data) => validCards(data.cards), setSignals, request.signal);
    };
    update();
    const timer = setInterval(update, refreshIntervalMs);
    document.addEventListener('visibilitychange', update);
    return () => {
      request?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return { dashboard, signals, performance };
}
