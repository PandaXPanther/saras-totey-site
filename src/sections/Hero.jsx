import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import OrderbookField from '../components/OrderbookField.jsx';
import Aurora from '../components/Aurora.jsx';
import { HERO, IDENTITY } from '../data/content.js';

export default function Hero() {
  return (
    <section id="top" style={{ paddingTop: 140, paddingBottom: 80, position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Aurora color="#3a5878" size={720} top="30%" left="25%" opacity={0.22} />
      <Aurora color="#4a3d6e" size={800} top="70%" left="75%" opacity={0.18} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.7 }}>
        <Suspense fallback={null}>
          <OrderbookField />
        </Suspense>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, var(--bg) 85%)', pointerEvents: 'none' }} />

      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}>
          <div className="eyebrow">{HERO.eyebrow}</div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.9, 0.2, 1] }}
          style={{ maxWidth: '20ch' }}
        >
          {HERO.headline_line1}<br />
          <span className="grad">{HERO.headline_grad}</span>{' '}
          <span style={{ color: 'var(--text-dim)' }}>{HERO.headline_rest}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.35, ease: [0.2, 0.9, 0.2, 1] }}
          className="lede mt-8"
          style={{ maxWidth: '58ch' }}
        >
          {HERO.subhead}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 40 }}
        >
          {HERO.live_pills.map((p) => (
            <span key={p.label} className={`pill ${p.tone}`}>
              <span className="dot" />
              <span style={{ fontWeight: 600 }}>{p.label}</span>
              <span style={{ opacity: 0.6 }}>· {p.status}</span>
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 56, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em' }}
        >
          <span>{IDENTITY.location.toUpperCase()}</span>
          <span>{IDENTITY.school.toUpperCase()}</span>
          <span>github.com/{IDENTITY.github_user.toLowerCase()}</span>
          <span>github.com/{IDENTITY.github_org}</span>
        </motion.div>
      </div>

      <div className="scroll-cue">scroll</div>
    </section>
  );
}
