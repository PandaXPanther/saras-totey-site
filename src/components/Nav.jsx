import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LINKS = [
  { id: 'thesis', label: 'Thesis' },
  { id: 'countersnipe', label: 'CounterSnipe' },
  { id: 'prediction-bot', label: 'Prediction bot' },
  { id: 'copy-trader', label: 'copy-trader' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'live', label: 'Live' },
  { id: 'roadmap', label: 'Next' },
  { id: 'awards', label: 'Record' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        padding: '18px 0',
        background: scrolled ? 'rgba(5, 7, 13, 0.75)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        transition: 'background 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease',
      }}
    >
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <a href="#top" onClick={jump('top')} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <span className="mono small" style={{ letterSpacing: '0.06em' }}>saras totey</span>
        </a>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={jump(l.id)}
              className="mono small nav-link"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}

function Logo() {
  // Custom mark: an aurora-lit orderbook glyph.
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-label="Saras Totey" role="img">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7ce7c1" />
          <stop offset="0.5" stopColor="#9db5ff" />
          <stop offset="1" stopColor="#b998ff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="24" height="24" rx="6" stroke="url(#lg)" strokeWidth="1.2" opacity="0.6" />
      <rect x="6" y="14" width="3" height="7" fill="url(#lg)" opacity="0.85" />
      <rect x="11" y="9" width="3" height="12" fill="url(#lg)" opacity="0.95" />
      <rect x="16" y="12" width="3" height="9" fill="url(#lg)" opacity="0.7" />
      <line x1="5" y1="6" x2="21" y2="6" stroke="url(#lg)" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}
