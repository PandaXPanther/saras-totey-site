import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { OTHER } from '../data/content.js';

export default function Other() {
  return (
    <section id="other" style={{ position: 'relative', overflow: 'hidden' }}>
      <Aurora color="#4a3d6e" size={480} top="30%" left="18%" opacity={0.1} />
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">{OTHER.eyebrow}</div>
        </Reveal>
        <Reveal i={1}>
          <h2 style={{ maxWidth: '20ch', marginBottom: 48 }}>
            The <span className="grad">non-trading</span> track record.
          </h2>
        </Reveal>
        <div className="grid grid-3">
          {OTHER.items.map((item, i) => (
            <Reveal key={i} i={i}>
              <a href={item.href} target="_blank" rel="noreferrer" style={{ display: 'block', height: '100%' }}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{item.tag}</div>
                  <h3 style={{ marginBottom: 16 }}>{item.name}</h3>
                  <p className="text-dim small" style={{ flexGrow: 1, lineHeight: 1.6 }}>{item.body}</p>
                  <div className="mono small mt-6" style={{ color: 'var(--text-dim)', paddingTop: 16, borderTop: '1px solid var(--line)' }}>{item.stat}</div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
