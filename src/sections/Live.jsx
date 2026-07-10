import React, { useEffect, useState } from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { LIVE } from '../data/content.js';
import STATIC_DASHBOARD from '../data/trading-live.json';

const FALLBACK_SIGNALS = {
  generated_at: LIVE.last_updated_iso,
  cards: LIVE.cards,
};

const FALLBACK_DASHBOARD = {
  generated_at: LIVE.last_updated_iso,
  totals: {
    portfolio_value_usd: 1648.64,
    total_profit_usd: 224.64,
    generated_profit_usd: 0,
    total_trades: 85,
    generated_trades: 0,
    win_rate_pct: 83.5,
    last_trade_iso: null,
  },
  cards: [
    { k: 'Portfolio value', v: '$1,648.64', foot: 'Baseline from static site receipts' },
    { k: 'Total profit', v: '+$224.64', foot: 'CounterSnipe unrealized gain plus prediction-bot paper P&L' },
    { k: 'Total trades', v: '85', foot: '48 CS2 attempts · 17 prediction trades · 20 ranked wallets' },
    { k: 'Win rate', v: '83.5%', foot: 'Baseline weighted across current site metrics' },
    { k: 'Active asset classes', v: '3', foot: 'CS2 skins · prediction contracts · Hyperliquid perps' },
    { k: 'Latest strategy', v: 'Awaiting first generated trade', foot: 'Daily-paced cron writes the trade feed' },
  ],
  trades: [],
};

function formatStamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'pending';
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  });
}

export default function Live() {
  const [dashboard, setDashboard] = useState(STATIC_DASHBOARD ?? FALLBACK_DASHBOARD);
  const [signals, setSignals] = useState(FALLBACK_SIGNALS);
  const [status, setStatus] = useState({ trades: 'baseline', signals: 'baseline' });
  const newestStamp = [dashboard.generated_at, signals.generated_at, LIVE.last_updated_iso]
    .map((iso) => new Date(iso).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a)[0];
  const stamp = formatStamp(new Date(newestStamp).toISOString());
  const hasLiveData = status.trades === 'live' || status.signals === 'live';

  useEffect(() => {
    let cancelled = false;

    fetch(`/generated/trading-live.json?ts=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`trade feed ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
          setStatus((current) => ({ ...current, trades: 'live' }));
        }
      })
      .catch(() => {
        if (!cancelled) setStatus((current) => ({ ...current, trades: 'baseline' }));
      });

    fetch(`/generated/live-signals.json?ts=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`live signals ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data.cards)) {
          setSignals(data);
          setStatus((current) => ({ ...current, signals: 'live' }));
        }
      })
      .catch(() => {
        if (!cancelled) setStatus((current) => ({ ...current, signals: 'baseline' }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="live" style={{ position: 'relative', overflow: 'hidden' }}>
      <Aurora color="#3a5878" size={520} top="30%" left="15%" opacity={0.14} />
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">{LIVE.eyebrow}</div>
        </Reveal>
        <div className="live-header">
          <Reveal i={1}>
            <h2 style={{ maxWidth: '20ch' }}>
              These numbers <span className="grad">refresh hourly.</span>
            </h2>
          </Reveal>
          <Reveal i={2}>
            <div className="mono small text-faint" style={{ letterSpacing: '0.08em' }}>
              Last update · {stamp} · {hasLiveData ? 'generated feed' : 'baseline fallback'}
            </div>
          </Reveal>
        </div>
        <Reveal i={3}>
          <p className="lede" style={{ maxWidth: '62ch', marginBottom: 40 }}>
            {LIVE.intro} A VPS cron now appends only a handful of generated paper fills per day using small per-trade percentage moves.
          </p>
        </Reveal>
        <Reveal i={4}>
          <div className="grid grid-3">
            {dashboard.cards.map((c, i) => (
              <div key={i} className="kpi">
                <div className="kpi-k">{c.k}</div>
                <div className="kpi-v">{c.v}</div>
                <div className="kpi-foot">{c.foot}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal i={5}>
          <div className="mt-12">
            <div className="eyebrow" style={{ marginBottom: 18 }}>Repository + API signals</div>
            <div className="grid grid-3">
              {signals.cards.map((c, i) => (
                <div key={i} className="kpi">
                  <div className="kpi-k">{c.k}</div>
                  <div className="kpi-v">{c.v}</div>
                  <div className="kpi-foot">{c.foot}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal i={6}>
          <div className="trade-log mt-12">
            <div className="trade-log-head">
              <div>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Generated trade log</div>
                <h3>Generated paper fills</h3>
              </div>
              <div className="mono small text-faint">
                {dashboard.totals.generated_trades} generated · +${dashboard.totals.generated_profit_usd.toFixed(2)} since baseline
              </div>
            </div>
            <div className="trade-table-wrap">
              <table className="trade-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>System</th>
                    <th>Instrument</th>
                    <th>Side</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>P&L</th>
                    <th>%</th>
                    <th>Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.trades.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="trade-empty">No generated trades yet.</td>
                    </tr>
                  ) : (
                    dashboard.trades.map((trade) => (
                      <tr key={trade.id}>
                        <td>{formatStamp(trade.timestamp)}</td>
                        <td>{trade.system}</td>
                        <td>
                          <span>{trade.instrument}</span>
                          <span className="trade-asset">{trade.asset_type}</span>
                        </td>
                        <td>{trade.side}</td>
                        <td>${Number(trade.entry_price).toLocaleString('en-US')}</td>
                        <td>${Number(trade.exit_price).toLocaleString('en-US')}</td>
                        <td className={trade.profit_loss_usd >= 0 ? 'trade-profit gain' : 'trade-profit loss'}>
                          {trade.profit_loss_usd >= 0 ? '+' : ''}${trade.profit_loss_usd.toFixed(2)}
                        </td>
                        <td className={trade.profit_loss_pct >= 0 ? 'trade-profit gain' : 'trade-profit loss'}>
                          {trade.profit_loss_pct >= 0 ? '+' : ''}{trade.profit_loss_pct.toFixed(2)}%
                        </td>
                        <td>{trade.strategy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
