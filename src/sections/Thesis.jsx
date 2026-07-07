import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { THESIS } from '../data/content.js';

export default function Thesis() {
  return (
    <section id="thesis" style={{ position: 'relative', overflow: 'hidden' }}>
      <Aurora color="#3a5878" size={520} top="30%" left="12%" opacity={0.1} />
      <div className="wrap-tight" style={{ position: 'relative' }}>
        <Reveal>
          <div className="eyebrow">{THESIS.eyebrow}</div>
        </Reveal>
        <Reveal i={1}>
          <h2 style={{ maxWidth: '20ch', marginBottom: 40 }}>
            Three years of building bots. <span className="grad">One year of learning why they matter.</span>
          </h2>
        </Reveal>
        {THESIS.paragraphs.map((p, i) => (
          <Reveal key={i} i={i + 2}>
            <p className="lede" style={{ marginBottom: 24 }}>{p}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
