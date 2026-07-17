import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';

const getAge = (now = new Date()) => {
  const birthdayThisYear = new Date(now.getFullYear(), 5, 25);
  return now.getFullYear() - 2009 - (now < birthdayThisYear ? 1 : 0);
};

const chapters = [
  { id: 'intro', media: 'intro', label: 'Home', eyebrow: 'Boulder, Colorado', title: 'My name is Saras Totey.', body: `I’m a ${getAge()}-year-old full-stack developer who grew up in Boulder. I build trading bots, research markets, and make other cool projects.`, note: 'Pronounced “sahr-iss.” Age updates automatically every June 25.', side: 'left' },
  { id: 'trading', media: 'countersnipe', label: 'Trading bots', eyebrow: 'Markets, then code', title: 'I like finding the moment a market disagrees with itself.', body: 'That puzzle is why I build trading bots. What began with Roblox items became live CS2 arbitrage, prediction-market research, and systems where the logs and mistakes are as interesting as the wins.', href: '/', side: 'left' },
  { id: 'econ-mom', media: 'prediction', label: 'econ.mom', eyebrow: 'Twelve tools, every source shown', title: 'I wanted economics to feel touchable.', body: 'I built econ.mom because changing an assumption and seeing the result makes a model click faster than memorizing one. Its free tools keep every formula and dataset visible.', href: '/econ-mom', side: 'left' },
  { id: 'local-ledger', media: 'ventures', label: 'Local Ledger', eyebrow: 'A public-data observatory', title: 'I wanted to see a place as a living system.', body: 'That curiosity became Local Ledger: jobs, income, housing, schools, and public spending on one research desk, plus a simulator for asking what might change next.', href: '/local-ledger', side: 'right' },
  { id: 'att', media: 'att', label: 'ATT Agency', eyebrow: 'Want a site like this?', title: 'I co-founded the studio that builds them.', body: 'At ATT Agency, I help turn a business into a brand, website, campaign, and measurement system without passing the work between disconnected vendors.', href: '/att-agency', side: 'right' },
  { id: 'contact', media: 'contact', label: 'Contact', eyebrow: 'Boulder to anywhere', title: 'Contact me.', body: 'Discord: PandaXPanther · sarastotey@icloud.com · 720-415-9085', side: 'center', cta: true },
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const flightDurations = [6.041667, 6.041667, 6.041667, 4.041667, 6.041667, 6.041667];
const flightDuration = flightDurations.reduce((sum, duration) => sum + duration, 0);
const scrollDuration = 9.4;
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function ScrollWorld() {
  const root = useRef(null);
  const videoRef = useRef(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const chain = useMemo(() => chapters.map((chapter, index) => ({
    id: chapter.media,
    chapter: index,
    kind: 'scene',
    scroll: (flightDurations[index] / flightDuration) * scrollDuration,
  })), []);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useBrowserLayoutEffect(() => {
    history.scrollRestoration = 'manual';
    const restore = () => {
      let snapshot = history.state?.worldSnapshot;
      if (!snapshot) {
        try { snapshot = JSON.parse(sessionStorage.getItem('saras-world-snapshot')); } catch { snapshot = null; }
      }
      if (!snapshot || !Number.isFinite(snapshot.scrollY)) return;
      window.scrollTo(0, snapshot.scrollY);
      const video = videoRef.current;
      if (!video || !Number.isFinite(snapshot.videoTime)) return;
      const seek = () => { video.currentTime = Math.min(snapshot.videoTime, Math.max(0, video.duration - 0.04)); };
      if (video.readyState >= 1 && video.duration) seek();
      else video.addEventListener('loadedmetadata', seek, { once: true });
    };
    restore();
    addEventListener('pageshow', restore);
    return () => removeEventListener('pageshow', restore);
  }, []);

  const rememberPosition = () => {
    const node = root.current;
    if (!node) return;
    const max = Math.max(1, node.offsetHeight - innerHeight);
    const position = clamp((scrollY - node.offsetTop) / max);
    const snapshot = { scrollY, videoTime: videoRef.current?.currentTime ?? position * flightDuration, position };
    sessionStorage.setItem('saras-world-snapshot', JSON.stringify(snapshot));
    sessionStorage.setItem('saras-world-position', String(position));
    history.replaceState({ ...history.state, worldSnapshot: snapshot }, '');
  };

  const jumpTo = (chapterIndex) => {
    const chainIndex = chain.findIndex((segment) => segment.chapter === chapterIndex && segment.kind === 'scene');
    const before = chain.slice(0, chainIndex).reduce((sum, segment) => sum + segment.scroll, 0);
    window.scrollTo({ top: root.current.offsetTop + before * innerHeight + 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const starts = chain.map((_, index) => chain.slice(0, index).reduce((sum, segment) => sum + segment.scroll, 0));
    let ticking = false;
    const update = () => {
      const y = clamp(scrollY - node.offsetTop, 0, node.offsetHeight - innerHeight);
      let currentIndex = chain.length - 1;
      chain.forEach((segment, index) => {
        const start = starts[index] * innerHeight;
        const end = (starts[index] + segment.scroll) * innerHeight;
        if (y >= start && y <= end) currentIndex = index;
      });
      const segment = chain[currentIndex];
      const local = clamp((y - starts[currentIndex] * innerHeight) / (segment.scroll * innerHeight));
      const video = videoRef.current;
      if (video?.readyState >= 2 && video.duration && !video.seeking) {
        const target = clamp(y / Math.max(1, node.offsetHeight - innerHeight)) * Math.max(0, video.duration - 0.04);
        if (Math.abs(video.currentTime - target) > 0.035) video.currentTime = target;
      }
      const chapter = segment.kind === 'connector' && local > 0.58 ? segment.nextChapter : segment.chapter;
      if (chapter !== activeRef.current) { activeRef.current = chapter; setActive(chapter); }
      ticking = false;
    };
    const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const dismissHint = () => setHasScrolled(true);
    update();
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('scroll', dismissHint, { passive: true, once: true });
    addEventListener('pagehide', rememberPosition);
    addEventListener('resize', requestUpdate, { passive: true });
    return () => { rememberPosition(); removeEventListener('scroll', requestUpdate); removeEventListener('scroll', dismissHint); removeEventListener('pagehide', rememberPosition); removeEventListener('resize', requestUpdate); };
  }, [chain]);

  const total = chain.reduce((sum, segment) => sum + segment.scroll, 0);
  return (
    <main ref={root} className="scroll-world" style={{ '--world-height': `${total * 100 + 100}vh` }}>
      <div className="scroll-world__sticky">
        <div className="scroll-world__stage" aria-hidden="true">
          <div className="scroll-world__scene"><img src={reduceMotion ? `/world/flight/${chapters[active].media}.webp` : '/world/flight/intro-4k.webp'} alt="" />{!reduceMotion && <video ref={videoRef} src="/world/flight/continuous-flight.mp4" muted playsInline preload="auto" />}</div>
        </div>
        <div className="world-wash" aria-hidden="true" />
        {chapters.map((chapter, index) => <article key={chapter.id} className={`world-copy world-copy--${chapter.side} ${active === index ? 'is-active' : ''}`}><span className="world-copy__count">{String(index + 1).padStart(2, '0')} / {chapters.length}</span><span className="world-copy__eyebrow">{chapter.eyebrow}</span><h1>{chapter.title}</h1><p>{chapter.body}</p>{chapter.note && <small className="world-copy__note">{chapter.note}</small>}{chapter.href && <a className="glass-button" href={chapter.href} data-world-cta="true" onClick={rememberPosition}>Take me there</a>}{chapter.cta && <div className="world-copy__contact"><a href="mailto:sarastotey@icloud.com">Email</a><a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={`https://github.com/${IDENTITY.github_user}`} target="_blank" rel="noreferrer">GitHub</a><a href={IDENTITY.instagram} target="_blank" rel="noreferrer">Instagram</a></div>}</article>)}
        <div className={`world-controls ${hasScrolled ? 'is-dismissed' : ''}`}><button type="button" onClick={() => jumpTo(Math.max(0, active - 1))} aria-label="Back to previous section">↑</button><span>scroll to explore <i aria-hidden="true">⌄</i></span></div>
        <nav className="world-route" aria-label="World chapters">{chapters.map((chapter, index) => <button key={chapter.id} className={active === index ? 'is-active' : ''} onClick={() => jumpTo(index)} aria-label={`Go to ${chapter.label}`}><i aria-hidden="true" /></button>)}</nav>
      </div>
    </main>
  );
}
