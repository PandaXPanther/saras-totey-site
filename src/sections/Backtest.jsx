import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { BACKTEST, SYSTEMS } from '../data/content.js';
import { formatStamp, paperMetrics, signedMoney } from '../data/tradingFormat.js';

export default function Backtest({ dashboard }) {
  return (
    <section id="backtest" style={{ position: 'relative', overflow: 'hidden' }}>
      <Aurora color="#3a5878" size={520} top="30%" left="85%" opacity={0.12} />
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">{BACKTEST.eyebrow}</div>
        </Reveal>
        <Reveal i={1}>
          <h2 style={{ maxWidth: '18ch', marginBottom: 24 }}>
            The <span className="grad">receipts</span> table.
          </h2>
        </Reveal>
        <Reveal i={2}>
          <p className="lede" style={{ maxWidth: '58ch', marginBottom: 48 }}>Historical results come from repository files and trading logs. Paper results below come from the same simulation feed as the system cards.</p>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {BACKTEST.rows.map((row, i) => (
            <Reveal key={i} i={i}>
              <div className="card" style={{ padding: 24 }}>
                <div className="bt-row">
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{row.window}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: 8 }}>{row.system}</div>
                    <div className="mono small text-faint">n = {row.trades}</div>
                  </div>
                  <Metric m={row.metric1} />
                  <Metric m={row.metric2} />
                  <Metric m={row.metric3} />
                </div>
                <div className="small text-dim" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)', lineHeight: 1.6 }}>{row.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="trade-log mt-12">
          <div className="trade-log-head">
            <div>
              <h3 id="paper-receipts" tabIndex={-1}>Generated paper receipts</h3>
              <p>Simulated fills and outcomes across the three systems.</p>
            </div>
            <p className="mono small text-faint">{dashboard.totals.generated_trades.toLocaleString('en-US')} fills · {signedMoney(dashboard.totals.generated_profit_usd)} net</p>
          </div>
          <div className="trade-table-wrap" tabIndex={0} role="region" aria-label="Paper results by system">
            <table className="trade-table">
              <thead><tr><th scope="col">System</th><th scope="col">Fills</th><th scope="col">Net P&amp;L</th><th scope="col">Win rate</th><th scope="col">Avg. return</th></tr></thead>
              <tbody>
                {SYSTEMS.map(({ slug, name }) => (
                  <tr key={slug}>
                    <th scope="row">{name}</th>
                    {paperMetrics(dashboard.systems[slug].generated).map(({ k, v }) => <td key={k}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="paper-fills">
            <summary>Recent fills ({dashboard.trades.length})</summary>
            <div className="trade-table-wrap" tabIndex={0} role="region" aria-label="Recent generated paper fills">
              <table className="trade-table">
                <thead><tr>
                  {['Time (UTC)', 'System', 'Instrument', 'Side', 'Entry', 'Exit', 'P&L', 'Return', 'Strategy'].map((label) => <th scope="col" key={label}>{label}</th>)}
                </tr></thead>
                <tbody>
                  {!dashboard.trades.length && <tr><td colSpan="9">No generated trades yet.</td></tr>}
                  {dashboard.trades.map((trade) => (
                    <tr key={trade.id}>
                      <td>{formatStamp(trade.timestamp)}</td>
                      <td>{trade.system}</td>
                      <td>{trade.instrument}<span className="trade-asset">{trade.asset_type}</span></td>
                      <td>{trade.side}</td>
                      <td>${Number(trade.entry_price).toLocaleString('en-US', { maximumFractionDigits: 8 })}</td>
                      <td>${Number(trade.exit_price).toLocaleString('en-US', { maximumFractionDigits: 8 })}</td>
                      <td className={trade.profit_loss_usd < 0 ? 'trade-profit loss' : 'trade-profit gain'}>{signedMoney(trade.profit_loss_usd)}</td>
                      <td>{trade.profit_loss_pct.toFixed(2)}%</td>
                      <td>{trade.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function Metric({ m }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{m.k}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 26, color: 'var(--text)', fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{m.v}</div>
    </div>
  );
}
