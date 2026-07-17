import React, { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HERO, IDENTITY } from '../data/content.js';

const OrderbookField = lazy(() => import('../components/OrderbookField.jsx'));

function OriginalOrderbookBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Suspense fallback={null}><OrderbookField /></Suspense>;
}

export default function Hero() {
  return (
    <section id="top" className="hero-world">
      <div className="quant-orderbook" aria-hidden="true"><OriginalOrderbookBackground /></div>
      <div className="quant-orderbook-vignette" aria-hidden="true" />
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}>
          <div className="hero-index">Boulder, Colorado / field notes 2023 to 2026</div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.9, 0.2, 1] }}
          className="hero-title"
        >
          Trading systems
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.35, ease: [0.2, 0.9, 0.2, 1] }}
          className="lede mt-8"
          style={{ maxWidth: '54ch' }}
        >
          {HERO.subhead}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 36, maxWidth: '100%' }}
        >
          {HERO.live_pills.map((p) => (
            <span key={p.label} className="system-line">
              <span style={{ fontWeight: 600 }}>{p.label}</span>
              <span>{p.status} / {p.note}</span>
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          style={{ display: 'flex', flexWrap: 'wrap', columnGap: 20, rowGap: 8, marginTop: 48, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.08em' }}
        >
          <span>{IDENTITY.location.toUpperCase()}</span>
          <span>{IDENTITY.school.toUpperCase()}</span>
          <a href={`https://github.com/${IDENTITY.github_user}`} target="_blank" rel="noreferrer">github.com/{IDENTITY.github_user.toLowerCase()}</a>
          <a href={`https://github.com/${IDENTITY.github_org}`} target="_blank" rel="noreferrer">github.com/{IDENTITY.github_org}</a>
        </motion.div>
      </div>

      <div className="scroll-cue">scroll to enter the ledger</div>
    </section>
  );
}
