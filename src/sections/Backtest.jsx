import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { BACKTEST } from '../data/content.js';

export default function Backtest() {
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
          <p className="lede" style={{ maxWidth: '58ch', marginBottom: 48 }}>{BACKTEST.intro}</p>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {BACKTEST.rows.map((row, i) => (
            <Reveal key={i} i={i}>
              <div className="card" style={{ padding: 28 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.4fr) repeat(3, minmax(120px, 1fr))', gap: 24, alignItems: 'baseline' }}>
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
