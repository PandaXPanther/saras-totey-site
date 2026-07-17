import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';

const getAge = (now = new Date()) => {
  const birthdayThisYear = new Date(now.getFullYear(), 5, 25);
  return now.getFullYear() - 2009 - (now < birthdayThisYear ? 1 : 0);
};

const chapters = [
  { id: 'intro', media: 'intro', label: 'Home', eyebrow: 'Boulder, Colorado', title: 'My name is Saras (sahr-iss) Totey.', body: `I’m a ${getAge()}-year-old full-stack developer who grew up in Boulder, Colorado. I build trading bots, research markets, and make other cool projects.`, note: 'Age updates automatically every June 25.', side: 'left' },
  { id: 'trading', media: 'countersnipe', label: 'Trading bots', eyebrow: 'Markets, then code', title: 'My first bot lost forty dollars. I kept building.', body: 'What started with Roblox items became live CS2 arbitrage, prediction-market research, and a wallet-scoring system. The interesting part is the logs, safeguards, and mistakes underneath it.', href: '/', side: 'right' },
  { id: 'econ-mom', media: 'prediction', label: 'econ.mom', eyebrow: 'Twelve tools, every source shown', title: 'Economics should let you touch the assumptions.', body: 'econ.mom turns AP Economics and policy questions into free interactive tools with cited datasets, visible formulas, and explanations that do not hide behind the output.', href: '/econ-mom', side: 'left' },
  { id: 'local-ledger', media: 'ventures', label: 'Local Ledger', eyebrow: 'A public-data observatory', title: 'Put every county on the same research desk.', body: 'Local Ledger maps jobs, income, housing, schools, and public spending across the country, then lets you stress-test a local economy in its simulator.', href: '/local-ledger', side: 'right' },
  { id: 'att', media: 'ventures', label: 'ATT Agency', eyebrow: 'Want a site like this?', title: 'I co-founded the studio that builds them.', body: 'At ATT Agency, I help turn a business into a brand, website, campaign, and measurement system without passing the work between disconnected vendors.', href: '/att-agency', side: 'left' },
  { id: 'contact', media: 'contact', label: 'Contact', eyebrow: 'Boulder → anywhere', title: 'Contact me.', body: 'Discord: PandaXPanther · sarastotey@icloud.com · 720-415-9085', side: 'center', cta: true },
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function ScrollWorld() {
  const root = useRef(null);
  const videoRefs = useRef([]);
  const layerRefs = useRef([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState({});
  const [reduceMotion, setReduceMotion] = useState(false);
  const segments = useMemo(() => chapters.map((chapter, index) => ({ chapter: index, media: chapter.media, weight: index === 0 || index === chapters.length - 1 ? 1.35 : 1.6 })), []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const media = segments[active]?.media;
    if (!media || ready[media]) return undefined;
    const controller = new AbortController();
    let objectUrl;
    fetch(`/world/flight/${media}.mp4`, { signal: controller.signal })
      .then((response) => response.ok ? response.blob() : Promise.reject(new Error(`Could not load ${media}`)))
      .then((blob) => { objectUrl = URL.createObjectURL(blob); setReady((current) => ({ ...current, [media]: objectUrl })); })
      .catch((error) => { if (error.name !== 'AbortError') console.error(error); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [active, ready, reduceMotion, segments]);

  useEffect(() => { window.dispatchEvent(new Event('scroll')); }, [active, ready]);

  useEffect(() => {
    const saved = Number(localStorage.getItem('saras-world-position'));
    if (!Number.isFinite(saved) || saved <= 0) return;
    requestAnimationFrame(() => window.scrollTo(0, saved * Math.max(0, root.current.offsetHeight - innerHeight)));
  }, []);

  const jumpTo = (index) => {
    const node = root.current;
    if (!node) return;
    const before = segments.slice(0, index).reduce((sum, segment) => sum + segment.weight, 0);
    window.scrollTo({ top: node.offsetTop + before * window.innerHeight + 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const rememberPosition = () => {
    const max = Math.max(1, root.current.offsetHeight - innerHeight);
    localStorage.setItem('saras-world-position', String(scrollY / max));
  };

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    let ticking = false;
    const lastTargets = new Map();
    const starts = segments.map((_, index) => segments.slice(0, index).reduce((sum, segment) => sum + segment.weight, 0));
    const update = () => {
      const viewport = window.innerHeight;
      const y = clamp(window.scrollY - node.offsetTop, 0, node.offsetHeight - viewport);
      let current = segments.length - 1;
      for (let index = 0; index < segments.length; index += 1) {
        const start = starts[index] * viewport;
        const end = (starts[index] + segments[index].weight) * viewport;
        const local = clamp((y - start) / (end - start));
        const distance = y < start ? start - y : y > end ? y - end : 0;
        const opacity = clamp(1 - distance / (viewport * 0.32));
        if (layerRefs.current[index]) layerRefs.current[index].style.opacity = opacity.toFixed(3);
        if (y >= start && y <= end) {
          current = index;
          const video = videoRefs.current[index];
          const target = video?.duration ? local * Math.max(0, video.duration - 0.04) : 0;
          if (video?.readyState >= 2 && !video.seeking && Math.abs(target - (lastTargets.get(index) ?? -1)) > 0.045) {
            video.currentTime = target;
            lastTargets.set(index, target);
          }
        }
      }
      if (current !== activeRef.current) { activeRef.current = current; setActive(current); }
      ticking = false;
    };
    const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    return () => { window.removeEventListener('scroll', requestUpdate); window.removeEventListener('resize', requestUpdate); };
  }, [segments]);

  const total = segments.reduce((sum, segment) => sum + segment.weight, 0);
  return (
    <main ref={root} className="scroll-world" style={{ '--world-height': `${total * 100 + 100}vh` }}>
      <div className="scroll-world__sticky">
        <div className="scroll-world__stage" aria-hidden="true">
          {segments.map((segment, index) => <div ref={(element) => { layerRefs.current[index] = element; }} className="scroll-world__scene" key={`${segment.media}-${index}`}><img src={`/world/flight/${segment.media}.webp`} alt="" width="1800" height="1208" fetchPriority={index === 0 ? 'high' : 'auto'} />{!reduceMotion && ready[segment.media] && active === index && <video ref={(element) => { videoRefs.current[index] = element; }} src={ready[segment.media]} muted playsInline preload="auto" onLoadedMetadata={() => window.dispatchEvent(new Event('scroll'))} />}</div>)}
        </div>
        <div className="world-wash" aria-hidden="true" />
        {chapters.map((chapter, index) => <article key={chapter.id} className={`world-copy world-copy--${chapter.side} ${active === index ? 'is-active' : ''}`}><span className="world-copy__count">{String(index + 1).padStart(2, '0')} / {chapters.length}</span><span className="world-copy__eyebrow">{chapter.eyebrow}</span><h1>{chapter.title}</h1><p>{chapter.body}</p>{chapter.note && <small className="world-copy__note">{chapter.note}</small>}{chapter.href && <a className="glass-button" href={chapter.href} onClick={rememberPosition}>Take me there <span aria-hidden="true">↗</span></a>}{chapter.cta && <div className="world-copy__contact"><a href="mailto:sarastotey@icloud.com">Email</a><a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={`https://github.com/${IDENTITY.github_user}`} target="_blank" rel="noreferrer">GitHub</a><a href={IDENTITY.instagram} target="_blank" rel="noreferrer">Instagram</a></div>}</article>)}
        <div className="world-controls"><button type="button" onClick={() => jumpTo(Math.max(0, active - 1))} aria-label="Back to previous section">↑</button><span>scroll to explore <i aria-hidden="true">⌄</i></span></div>
        <div className="world-progress"><i style={{ transform: `scaleX(${(active + 1) / chapters.length})` }} /></div>
      </div>
    </main>
  );
}
