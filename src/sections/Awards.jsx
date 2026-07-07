import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { AWARDS } from '../data/content.js';

export default function Awards() {
  return (
    <section id="awards" style={{ position: 'relative', overflow: 'hidden' }}>
      <Aurora color="#3a5878" size={520} top="20%" left="82%" opacity={0.1} />
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">{AWARDS.eyebrow}</div>
        </Reveal>
        <Reveal i={1}>
          <h2 style={{ maxWidth: '18ch', marginBottom: 48 }}>
            Everything below has a certificate, a bracket, or a roster.
          </h2>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {AWARDS.groups.map((g, gi) => (
            <Reveal key={g.title} i={gi}>
              <div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--line-strong)' }}>
                  {g.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {g.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, padding: '18px 0', borderBottom: '1px solid var(--line)', alignItems: 'baseline' }}>
                      <div>
                        <div style={{ color: 'var(--text)', fontWeight: 500, marginBottom: item.foot ? 4 : 0 }}>{item.k}</div>
                        {item.foot && <div className="text-dim small">{item.foot}</div>}
                      </div>
                      {item.v && <div className="mono small text-dim" style={{ textAlign: 'right' }}>{item.v}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
