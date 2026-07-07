import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { ROADMAP } from '../data/content.js';

export default function Roadmap() {
  return (
    <section id="roadmap" style={{ position: 'relative', overflow: 'hidden' }}>
      <Aurora color="#4a3d6e" size={520} top="25%" left="85%" opacity={0.14} />
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">{ROADMAP.eyebrow}</div>
        </Reveal>
        <Reveal i={1}>
          <h2 style={{ maxWidth: '18ch', marginBottom: 24 }}>
            The next <span className="grad">version</span> of every system.
          </h2>
        </Reveal>
        <Reveal i={2}>
          <p className="lede" style={{ maxWidth: '58ch', marginBottom: 48 }}>{ROADMAP.intro}</p>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ROADMAP.items.map((r, i) => (
            <Reveal key={i} i={i}>
              <div className="rm-row">
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: 4 }}>{r.system}</div>
                <p style={{ color: 'var(--text-dim)', maxWidth: '68ch', margin: 0, lineHeight: 1.65 }}>{r.next}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
