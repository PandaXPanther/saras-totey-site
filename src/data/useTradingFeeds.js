import { useEffect, useState } from 'react';
import { LIVE, SYSTEMS } from './content.js';
import snapshot from './trading-live.json';

const refreshIntervalMs = 60_000;
const initialSignals = { generated_at: LIVE.last_updated_iso, cards: LIVE.cards };
const systemFields = ['total_trades', 'wins', 'profit_usd', 'return_pct_sum'];
const validCards = (cards) => Array.isArray(cards) && cards.length > 0
  && cards.every((card) => typeof card?.k === 'string' && typeof card.v === 'string');

function validDashboard(data) {
  return validCards(data?.cards)
    && Number.isFinite(data.totals?.generated_trades)
    && Number.isFinite(data.totals?.generated_profit_usd)
    && SYSTEMS.every(({ slug }) => systemFields.every((field) => Number.isFinite(data.systems?.[slug]?.generated?.[field])))
    && Array.isArray(data.trades)
    && data.trades.every((trade) => trade?.id && Number.isFinite(Date.parse(trade.timestamp))
      && Number.isFinite(trade.profit_loss_usd) && Number.isFinite(trade.profit_loss_pct));
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

  useEffect(() => {
    let request;
    const update = () => {
      if (document.visibilityState === 'hidden') return;
      request?.abort();
      request = new AbortController();
      refresh('trading-live', validDashboard, setDashboard, request.signal);
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

  return { dashboard, signals };
}
