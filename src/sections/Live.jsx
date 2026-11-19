import React, { useState } from 'react';
import Aurora from '../components/Aurora.jsx';
import { formatFillTime, formatStamp, paperMetrics, signedMoney, usdPrice, usdTotal } from '../data/tradingFormat.js';

const recentLimit = 12;
const columns = ['Time (UTC)', 'Instrument', 'P&L', 'Return', 'System', 'Side', 'Entry', 'Exit', 'Strategy'];

function Cards({ cards, className = '' }) {
  return <div className={`grid grid-3 ${className}`}>{cards.map(({ k, v, foot }) => (
    <div key={k} className="kpi">
      <div className="kpi-k">{k}</div>
      <div className="kpi-v">{v}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  ))}</div>;
}

function TradeActivity({ fills }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? fills : fills.slice(0, recentLimit);
  return (
    <section id="trade-activity" className="trade-log trade-log--activity" aria-labelledby="trade-activity-heading">
      <div className="trade-log-head">
        <div>
          <h3 id="trade-activity-heading">Filled trades</h3>
          <p className="small text-dim">Model feed · newest first</p>
        </div>
        <p className="mono small text-faint" aria-live="polite">
          {fills.length ? `Showing ${shown.length} of ${fills.length} recent fills` : 'No fills yet'}
        </p>
      </div>
      <div id="trade-activity-rows" className="trade-table-wrap" tabIndex={0} role="region" aria-label="Recent model-generated fills">
        <table className="trade-table trade-activity-table">
          <thead><tr>{columns.map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>
            {!shown.length && <tr><td colSpan={columns.length}>Waiting for the first fill.</td></tr>}
            {shown.map((trade) => (
              <tr key={trade.id}>
                <td><time dateTime={trade.timestamp} title={formatStamp(trade.timestamp)}>{formatFillTime(trade.timestamp)}</time></td>
                <th scope="row">{trade.instrument}<span className="trade-asset">{trade.asset_type}</span></th>
                <td className={trade.profit_loss_usd < 0 ? 'trade-profit loss' : 'trade-profit gain'}>{signedMoney(trade.profit_loss_usd)}</td>
                <td>{trade.profit_loss_pct.toFixed(2)}%</td>
                <td>{trade.system}</td>
                <td>{trade.side}</td>
                <td>{usdPrice(trade.entry_price)}</td>
                <td>{usdPrice(trade.exit_price)}</td>
                <td>{trade.strategy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fills.length > recentLimit && <div className="trade-log-actions">
        <button type="button" aria-expanded={expanded} aria-controls="trade-activity-rows" onClick={() => setExpanded(!expanded)}>
          {expanded ? `Show latest ${recentLimit}` : `Show all ${fills.length} recent fills`}
        </button>
      </div>}
    </section>
  );
}

export default function Live({ dashboard, paperTotals, signals }) {
  const fills = [...dashboard.trades].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const latest = fills[0];
  const cards = [
    ...paperMetrics(paperTotals),
    { k: 'Notional traded', v: usdTotal(paperTotals.notional_usd), foot: 'Sum of modeled order sizes' },
    { k: 'Latest strategy', v: latest?.strategy ?? 'Awaiting first fill', foot: latest?.instrument },
  ];
  return (
    <section id="live" className="trading-dashboard">
      <Aurora color="#3a5878" size={520} top="30%" left="15%" opacity={0.14} />
      <div className="wrap">
        <div className="dashboard-heading">
          <div>
            <h2>Trading <span className="grad">dashboard.</span></h2>
            <p className="lede dashboard-intro">Model-generated fills across three systems. This page checks the feed every minute.</p>
          </div>
          <dl className="dashboard-timestamps mono small">
            <div><dt>Latest fill</dt><dd>{latest ? <time dateTime={latest.timestamp}>{formatStamp(latest.timestamp)}</time> : 'Pending'}</dd></div>
            <div><dt>Feed refreshed</dt><dd><time dateTime={dashboard.generated_at}>{formatStamp(dashboard.generated_at)}</time></dd></div>
          </dl>
        </div>
        <Cards cards={cards} className="dashboard-metrics" />
        <TradeActivity fills={fills} />
        <section className="dashboard-signals" aria-labelledby="dashboard-signals-heading">
          <h3 id="dashboard-signals-heading" className="dashboard-subtitle">Repository and API signals</h3>
          <p className="mono small text-faint">Updated {formatStamp(signals.generated_at)}</p>
          <Cards cards={signals.cards} className="mt-4" />
        </section>
      </div>
    </section>
  );
}
