import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { LIVE } from '../data/content.js';

export default function Live() {
  const date = new Date(LIVE.last_updated_iso);
  const stamp = date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  });
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
              These numbers <span className="grad">refresh nightly.</span>
            </h2>
          </Reveal>
          <Reveal i={2}>
            <div className="mono small text-faint" style={{ letterSpacing: '0.08em' }}>Last update · {stamp}</div>
          </Reveal>
        </div>
        <Reveal i={3}>
          <p className="lede" style={{ maxWidth: '58ch', marginBottom: 40 }}>{LIVE.intro}</p>
        </Reveal>
        <Reveal i={4}>
          <div className="grid grid-3">
            {LIVE.cards.map((c, i) => (
              <div key={i} className="kpi">
                <div className="kpi-k">{c.k}</div>
                <div className="kpi-v">{c.v}</div>
                <div className="kpi-foot">{c.foot}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
