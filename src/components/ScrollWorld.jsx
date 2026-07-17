import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';

const getAge = (now = new Date()) => {
  const birthdayThisYear = new Date(now.getFullYear(), 5, 25);
  return now.getFullYear() - 2009 - (now < birthdayThisYear ? 1 : 0);
};

const chapters = [
  { id: 'intro', media: 'intro', label: 'Home', eyebrow: 'Boulder, Colorado', title: 'My name is Saras (sahr-iss) Totey.', body: `I’m a ${getAge()}-year-old full-stack developer who grew up in Boulder. I build trading bots, research markets, and make other cool projects.`, note: 'Age updates automatically every June 25.', side: 'left' },
  { id: 'trading', media: 'countersnipe', label: 'Trading bots', eyebrow: 'Markets, then code', title: 'I like finding the moment a market disagrees with itself.', body: 'That puzzle is why I build trading bots. What began with Roblox items became live CS2 arbitrage, prediction-market research, and systems where the logs and mistakes are as interesting as the wins.', href: '/', side: 'left' },
  { id: 'econ-mom', media: 'prediction', label: 'econ.mom', eyebrow: 'Twelve tools, every source shown', title: 'I wanted economics to feel touchable.', body: 'I built econ.mom because changing an assumption and seeing the result makes a model click faster than memorizing one. Its free tools keep every formula and dataset visible.', href: '/econ-mom', side: 'left' },
  { id: 'local-ledger', media: 'ventures', label: 'Local Ledger', eyebrow: 'A public-data observatory', title: 'I wanted to see a place as a living system.', body: 'That curiosity became Local Ledger: jobs, income, housing, schools, and public spending on one research desk, plus a simulator for asking what might change next.', href: '/local-ledger', side: 'left' },
  { id: 'att', media: 'att', label: 'ATT Agency', eyebrow: 'Want a site like this?', title: 'I co-founded the studio that builds them.', body: 'At ATT Agency, I help turn a business into a brand, website, campaign, and measurement system without passing the work between disconnected vendors.', href: '/att-agency', side: 'right' },
  { id: 'contact', media: 'contact', label: 'Contact', eyebrow: 'Boulder to anywhere', title: 'Contact me.', body: 'Discord: PandaXPanther · sarastotey@icloud.com · 720-415-9085', side: 'center', cta: true },
];

const connectors = ['intro-countersnipe', 'countersnipe-prediction', 'prediction-ventures', 'ventures-att', 'att-contact'];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function ScrollWorld() {
  const root = useRef(null);
  const videoRefs = useRef([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [sources, setSources] = useState({});
  const [reduceMotion, setReduceMotion] = useState(false);
  const chain = useMemo(() => chapters.flatMap((chapter, index) => [
    { id: chapter.media, chapter: index, kind: 'scene', scroll: index === 0 || index === chapters.length - 1 ? 1.55 : 1.35 },
    ...(connectors[index] ? [{ id: connectors[index], chapter: index, nextChapter: index + 1, kind: 'connector', scroll: 0.95 }] : []),
  ]), []);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const controllers = [];
    const urls = [];
    chain.forEach((segment) => {
      const controller = new AbortController();
      controllers.push(controller);
      fetch(`/world/flight/${segment.id}.mp4`, { signal: controller.signal })
        .then((response) => response.ok ? response.blob() : Promise.reject(new Error(`Could not load ${segment.id}`)))
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          urls.push(url);
          setSources((current) => ({ ...current, [segment.id]: url }));
        })
        .catch((error) => { if (error.name !== 'AbortError') console.error(error); });
    });
    return () => { controllers.forEach((controller) => controller.abort()); urls.forEach(URL.revokeObjectURL); };
  }, [chain, reduceMotion]);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem('saras-world-position'));
    if (!Number.isFinite(saved) || saved <= 0) return;
    requestAnimationFrame(() => window.scrollTo(0, saved * Math.max(0, root.current.offsetHeight - innerHeight)));
  }, []);

  const rememberPosition = () => {
    const max = Math.max(1, root.current.offsetHeight - innerHeight);
    sessionStorage.setItem('saras-world-position', String(scrollY / max));
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
      videoRefs.current.forEach((video, index) => {
        const visible = index === currentIndex;
        if (video) video.parentElement.style.opacity = visible ? '1' : '0';
      });
      const video = videoRefs.current[currentIndex];
      if (video?.readyState >= 2 && video.duration && !video.seeking) {
        const target = local * Math.max(0, video.duration - 0.04);
        if (Math.abs(video.currentTime - target) > 0.035) video.currentTime = target;
      }
      const chapter = segment.kind === 'connector' && local > 0.58 ? segment.nextChapter : segment.chapter;
      if (chapter !== activeRef.current) { activeRef.current = chapter; setActive(chapter); }
      ticking = false;
    };
    const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate, { passive: true });
    return () => { removeEventListener('scroll', requestUpdate); removeEventListener('resize', requestUpdate); };
  }, [chain]);

  const total = chain.reduce((sum, segment) => sum + segment.scroll, 0);
  return (
    <main ref={root} className="scroll-world" style={{ '--world-height': `${total * 100 + 100}vh` }}>
      <div className="scroll-world__sticky">
        <div className="scroll-world__stage" aria-hidden="true">
          {chain.map((segment, index) => <div className="scroll-world__scene" key={segment.id}><img src={`/world/flight/${chapters[segment.chapter].media}.webp`} alt="" />{!reduceMotion && sources[segment.id] && <video ref={(element) => { videoRefs.current[index] = element; }} src={sources[segment.id]} muted playsInline preload="auto" />}</div>)}
        </div>
        <div className="world-wash" aria-hidden="true" />
        {chapters.map((chapter, index) => <article key={chapter.id} className={`world-copy world-copy--${chapter.side} ${active === index ? 'is-active' : ''}`}><span className="world-copy__count">{String(index + 1).padStart(2, '0')} / {chapters.length}</span><span className="world-copy__eyebrow">{chapter.eyebrow}</span><h1>{chapter.title}</h1><p>{chapter.body}</p>{chapter.note && <small className="world-copy__note">{chapter.note}</small>}{chapter.href && <a className="glass-button" href={chapter.href} onClick={rememberPosition}>Take me there <span aria-hidden="true">↗</span></a>}{chapter.cta && <div className="world-copy__contact"><a href="mailto:sarastotey@icloud.com">Email</a><a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={`https://github.com/${IDENTITY.github_user}`} target="_blank" rel="noreferrer">GitHub</a><a href={IDENTITY.instagram} target="_blank" rel="noreferrer">Instagram</a></div>}</article>)}
        <div className="world-controls"><button type="button" onClick={() => jumpTo(Math.max(0, active - 1))} aria-label="Back to previous section">↑</button><span>scroll to explore <i aria-hidden="true">⌄</i></span></div>
        <nav className="world-route" aria-label="World chapters">{chapters.map((chapter, index) => <button key={chapter.id} className={active === index ? 'is-active' : ''} onClick={() => jumpTo(index)} aria-label={`Go to ${chapter.label}`}><i aria-hidden="true" /></button>)}</nav>
      </div>
    </main>
  );
}
