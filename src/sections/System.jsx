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

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'end', marginBottom: 24 }}>
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

        {/* TL;DR strip — plain English summary */}
        {system.tldr && (
          <Reveal>
            <div style={{
              padding: '20px 24px',
              borderLeft: '2px solid var(--line-strong)',
              background: 'rgba(15, 21, 36, 0.4)',
              borderRadius: 4,
              marginBottom: 40,
              maxWidth: '80ch',
            }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>In plain English</div>
              <p style={{ color: 'var(--text)', fontSize: 16, lineHeight: 1.65, margin: 0 }}>{system.tldr}</p>
            </div>
          </Reveal>
        )}

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

        {/* Origin + hardest lesson */}
        {system.origin && (
          <div className="grid grid-2 mt-16" style={{ alignItems: 'start', gap: 32 }}>
            <Reveal>
              <div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>How it started</div>
                <p className="lede" style={{ maxWidth: '52ch' }}>{system.origin.how_it_started}</p>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Hardest lesson</div>
                <p className="lede" style={{ maxWidth: '52ch' }}>{system.origin.hardest_lesson}</p>
              </div>
            </Reveal>
          </div>
        )}

        {/* Research finding */}
        {system.research_finding && (
          <Reveal>
            <div className="card mt-16" style={{ padding: '32px 36px', borderColor: 'var(--line-strong)' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>What I found</div>
              <h3 style={{ marginBottom: 16, maxWidth: '30ch' }}>{system.research_finding.title}</h3>
              <p className="lede" style={{ maxWidth: '68ch', marginBottom: 0 }}>{system.research_finding.body}</p>
            </div>
          </Reveal>
        )}

        {/* Code snippet */}
        {system.code_snippet && (
          <Reveal>
            <div className="mt-16">
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>The important part of the code</div>
              <p className="text-dim" style={{ maxWidth: '68ch', marginBottom: 14, fontSize: 15 }}>{system.code_snippet.caption}</p>
              <pre style={{
                margin: 0,
                padding: '20px 24px',
                background: '#0a0e18',
                border: '1px solid var(--line)',
                borderRadius: 8,
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 13.5,
                lineHeight: 1.65,
                color: '#c8d0dd',
              }}>
                <code>{system.code_snippet.code}</code>
              </pre>
            </div>
          </Reveal>
        )}

        {/* Citations */}
        {system.citations && system.citations.length > 0 && (
          <Reveal>
            <div className="mt-16">
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>References</div>
              <ol style={{ paddingLeft: 20, margin: 0, color: 'var(--text-dim)' }}>
                {system.citations.map((c, i) => (
                  <li key={i} style={{ marginBottom: 14, lineHeight: 1.55, maxWidth: '76ch' }}>
                    <a href={c.href} target="_blank" rel="noreferrer" style={{ color: 'var(--text)', borderBottom: '1px solid var(--line-strong)' }}>{c.title}</a>
                    {c.note && <span style={{ color: 'var(--text-dim)' }}> — {c.note}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
