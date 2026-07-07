import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { FOOTER, IDENTITY } from '../data/content.js';

export default function Footer() {
  return (
    <section id="contact" style={{ position: 'relative', overflow: 'hidden', paddingBottom: 80 }}>
      <Aurora color="#3a5878" size={640} top="30%" left="50%" opacity={0.14} />
      <div className="wrap-tight" style={{ position: 'relative', textAlign: 'center' }}>
        <Reveal>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>End of file</div>
        </Reveal>
        <Reveal i={1}>
          <h2 style={{ maxWidth: '20ch', margin: '0 auto 32px' }}>
            <span className="grad">If anything looks too neat,</span> ask me. I will show you the log.
          </h2>
        </Reveal>
        <Reveal i={2}>
          <p className="lede text-dim" style={{ margin: '0 auto 48px', maxWidth: '52ch' }}>
            Every metric on this page cites a file, a commit, or a live URL. I built this because a Common App activity slot can hold 150 characters and the story is longer than that.
          </p>
        </Reveal>
        <Reveal i={3}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 64 }}>
            {FOOTER.links.map((l, i) => (
              <a key={i} href={l.href} target="_blank" rel="noreferrer" className="pill" style={{ padding: '10px 16px' }}>
                <span>{l.k}</span>
                <span style={{ opacity: 0.5 }}>↗</span>
              </a>
            ))}
          </div>
        </Reveal>
        <Reveal i={4}>
          <div className="mono small text-faint" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {IDENTITY.name} · {IDENTITY.location} · {new Date().getFullYear()}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
