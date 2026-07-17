import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { HERO, IDENTITY } from '../data/content.js';
import { readAmbientFrequencyData } from '../components/AudioControl.jsx';

const OrderbookField = lazy(() => import('../components/OrderbookField.jsx'));

function OriginalOrderbookBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Suspense fallback={null}><OrderbookField /></Suspense>;
}

const WAVE_BAR_COUNT = 32;

function AudioReactiveWave() {
  const waveRef = useRef(null);

  useEffect(() => {
    const wave = waveRef.current;
    if (!wave) return undefined;
    const bars = [...wave.querySelectorAll('i')];
    const frequencies = new Uint8Array(64);
    let frame = 0;

    const render = () => {
      const isReactive = readAmbientFrequencyData(frequencies);
      wave.dataset.reactive = String(isReactive);
      if (isReactive) {
        bars.forEach((bar, index) => {
          const mirroredIndex = index < WAVE_BAR_COUNT / 2 ? index : WAVE_BAR_COUNT - index - 1;
          const bin = 2 + Math.round(mirroredIndex * 1.7);
          const amplitude = frequencies[bin] / 255;
          bar.style.height = `${14 + Math.pow(amplitude, 0.72) * 142}px`;
        });
      } else {
        bars.forEach((bar) => bar.style.removeProperty('height'));
      }
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div ref={waveRef} className="quant-wave" data-reactive="false" aria-hidden="true">{Array.from({ length: WAVE_BAR_COUNT }, (_, index) => <i key={index} />)}</div>;
}

export default function Hero() {
  return (
    <section id="top" className="hero-world">
      <div className="quant-orderbook" aria-hidden="true"><OriginalOrderbookBackground /></div>
      <div className="quant-orderbook-vignette" aria-hidden="true" />
      <AudioReactiveWave />
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
          I build trading systems.
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
