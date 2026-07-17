import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LINKS = [
  { id: 'countersnipe', label: 'Trading work' },
  { id: 'other', label: 'Other builds' },
  { id: 'awards', label: 'Record' },
  { id: 'contact', label: 'Links' },
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
        background: scrolled ? 'rgba(23, 24, 43, 0.94)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        transition: 'background 300ms ease, border-color 300ms ease',
      }}
    >
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <a href="#top" onClick={jump('top')} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
