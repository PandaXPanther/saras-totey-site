import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import Diagram from '../components/Diagram.jsx';

const ACCENTS = {
  countersnipe: '#6d7fa0',
  'prediction-bot': '#6d7fa0',
  'copy-trader': '#6d7fa0',
};

const STATUS_TAG = {
  countersnipe: { tone: 'live', label: 'live money · real capital' },
  'prediction-bot': { tone: 'paper', label: 'paper mode · Chicago VPS' },
  'copy-trader': { tone: 'research', label: 'research only · read-only' },
};

export default function System({ system }) {
  const accent = ACCENTS[system.slug] || '#9db5ff';
  const status = STATUS_TAG[system.slug];

  return (
    <section id={system.slug} style={{ position: 'relative', overflow: 'hidden' }}>
      <Aurora color={accent} size={560} top="20%" left={system.order % 2 ? '85%' : '15%'} opacity={0.12} />

      <div className="wrap">
        <Reveal>
          <div className="eyebrow">system {String(system.order).padStart(2, '0')} · {system.tag}</div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'end', marginBottom: 40 }}>
          <Reveal i={1}>
            <h2 style={{ maxWidth: '14ch' }}>
              {system.name}
            </h2>
          </Reveal>
          <Reveal i={2}>
            <span className={`pill ${status.tone}`}>
              <span className="dot" />
              {status.label}
            </span>
          </Reveal>
        </div>

        {/* KPIs grid */}
        <Reveal i={2}>
          <div className="grid grid-3 mt-4">
            {system.kpis.map((k, i) => (
              <div key={i} className="kpi">
                <div className="kpi-k">{k.k}</div>
                <div className="kpi-v num">{k.v}</div>
                <div className="kpi-foot">{k.foot}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Description block */}
        <div className="grid grid-2 mt-16" style={{ alignItems: 'start' }}>
          <div>
            {system.what_it_is.map((p, i) => (
              <Reveal key={i} i={i}>
                <p className="lede" style={{ maxWidth: '52ch', marginBottom: 20 }}>{p}</p>
              </Reveal>
            ))}
          </div>

          <div>
            <Reveal>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {system.stack.map((s, i) => (
                  <span key={i} className="chip">{s}</span>
                ))}
              </div>
            </Reveal>

            {system.strategies && (
              <Reveal i={1}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {system.strategies.map((s, i) => (
                    <div key={i} style={{ padding: '14px 18px', border: '1px solid var(--line)', borderRadius: 8, background: 'rgba(10,14,24,0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span className="mono small" style={{ color: 'var(--text)', fontWeight: 500 }}>{s.name}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>strategy {i + 1}</span>
                      </div>
                      <div className="small text-dim">{s.summary}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            <Reveal i={2}>
              <div style={{ marginTop: 24 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Receipts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {system.receipts.map((r, i) => (
                    <a key={i} href={r.href} target="_blank" rel="noreferrer" className="link-out">
                      <span>{r.label}</span>
                      <span style={{ opacity: 0.5 }}>↗</span>
                    </a>
                  ))}
                  <a href={system.repo} target="_blank" rel="noreferrer" className="link-out">
                    <span>{system.repo_label}{system.private ? ' · private' : ''}</span>
                    <span style={{ opacity: 0.5 }}>↗</span>
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Architecture diagram */}
        <Reveal>
          <div className="card mt-16" style={{ padding: 32, overflowX: 'auto' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>Architecture · {system.name}</div>
            <div style={{ minWidth: 780 }}>
              <Diagram spec={system.architecture} accent={accent} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
