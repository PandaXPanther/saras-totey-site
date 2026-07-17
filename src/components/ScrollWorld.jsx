import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';

const sections = [
  { id: 'intro', label: 'Introduction', eyebrow: 'Independent builder', title: 'I build systems that have to explain themselves.', body: 'Trading software, public experiments, and small companies, connected by evidence instead of theater.', tags: ['Saras Totey', '16 years old'], accent: '#c85668', scroll: 1.55, linger: 0.42 },
  { id: 'countersnipe', label: 'CounterSnipe', eyebrow: 'Live capital', title: 'A pricing mistake becomes a measured trade.', body: 'CounterSnipe watches skin markets, buys verified discounts, and re-lists them with hard safety limits.', tags: ['$1,424 live', '14.1% avg. return'], accent: '#bf4d5d', scroll: 1.8, linger: 0.5 },
  { id: 'prediction', label: 'Prediction Lab', eyebrow: 'Paper systems', title: 'Forecast first. Copy nobody blindly.', body: 'The prediction bot tests timing and market bias. copy-trader tests whether top wallets show repeatable skill.', tags: ['Kalshi + Polymarket', 'Hyperliquid'], accent: '#555177', scroll: 1.7, linger: 0.48 },
  { id: 'ventures', label: 'Other Work', eyebrow: 'Products and clients', title: 'The same discipline, outside trading.', body: 'econ.mom and local-ledger make economics legible. ATT Agency turns careful technical work into client outcomes.', tags: ['econ.mom', 'local-ledger', 'ATT Agency'], accent: '#c76c24', scroll: 1.55, linger: 0.42 },
  { id: 'contact', label: 'Contact', eyebrow: 'Open notebook', title: 'Read the work. Check the numbers. Say hello.', body: 'The repositories, live metrics, citations, and contact links are all below.', tags: ['GitHub', 'LinkedIn', 'Buy me a coffee'], accent: '#a42765', scroll: 1.65, linger: 0.5, cta: true },
];

const connectors = ['intro-countersnipe', 'countersnipe-prediction', 'prediction-ventures', 'ventures-contact'];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => { const x = clamp(value); return x * x * (3 - 2 * x); };
const lingerEase = (value, linger) => (1 - linger) * value + linger * (4 * (value - 0.5) ** 3 + 0.5);

export default function ScrollWorld() {
  const root = useRef(null);
  const videoRefs = useRef([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [reduceMotion, setReduceMotion] = useState(false);
  const segments = useMemo(() => sections.flatMap((section, index) => {
    const items = [{ kind: 'scene', section: index, id: section.id, weight: section.scroll, linger: section.linger }];
    if (connectors[index]) items.push({ kind: 'connector', section: index, id: connectors[index], weight: 0.78, linger: 0 });
    return items;
  }), []);

  useEffect(() => setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);

  const jumpTo = (sectionIndex) => {
    const node = root.current;
    if (!node) return;
    const segmentIndex = segments.findIndex((segment) => segment.kind === 'scene' && segment.section === sectionIndex);
    const weightBefore = segments.slice(0, segmentIndex).reduce((sum, segment) => sum + segment.weight, 0);
    window.scrollTo({ top: node.offsetTop + weightBefore * window.innerHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (reduceMotion) return undefined;
    const urls = segments.map((segment) => `/world/flight/${segment.id}.mp4`);
    let cancelled = false;
    Promise.all(urls.map(async (url, index) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${url}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      if (!cancelled) setLoaded((current) => ({ ...current, [index]: objectUrl }));
      return objectUrl;
    })).catch((error) => console.error(error));
    return () => { cancelled = true; };
  }, [reduceMotion, segments]);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    let frame = 0;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const y = clamp(-rect.top, 0, node.offsetHeight - window.innerHeight);
      const viewport = window.innerHeight;
      let offset = 0;
      let currentSegment = 0;
      segments.forEach((segment, index) => {
        const start = offset * viewport;
        const end = (offset + segment.weight) * viewport;
        if (y >= start) currentSegment = index;
        const local = clamp((y - start) / (end - start));
        const video = videoRefs.current[index];
        if (video?.duration && !video.seeking) {
          const target = lingerEase(local, segment.linger) * video.duration;
          if (Math.abs(video.currentTime - target) > 0.025) video.currentTime = target;
        }
        const distance = y < start ? start - y : y > end ? y - end : 0;
        const opacity = smooth(1 - distance / (0.12 * viewport));
        const layer = node.querySelector(`[data-segment="${index}"]`);
        if (layer) layer.style.opacity = String(opacity);
        offset += segment.weight;
      });
      const segment = segments[currentSegment];
      const nextActive = segment.kind === 'connector' && y > (segments.slice(0, currentSegment + 1).reduce((sum, item) => sum + item.weight, 0) - segment.weight / 2) * viewport ? segment.section + 1 : segment.section;
      setActive(clamp(nextActive, 0, sections.length - 1));
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [segments]);

  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);
  return (
    <section ref={root} className="scroll-world" style={{ '--world-height': `${totalWeight * 100 + 100}vh`, '--chapter-accent': sections[active].accent }} aria-label="Saras Totey portfolio world">
      <div className="scroll-world__sticky">
        <div className="scroll-world__stage" aria-hidden="true">
          {segments.map((segment, index) => (
            <div className="scroll-world__scene" data-segment={index} key={segment.id}>
              <img src={`/world/flight/${segment.kind === 'scene' ? segment.id : sections[segment.section + 1].id}.webp`} alt="" />
              {!reduceMotion && loaded[index] && <video ref={(element) => { videoRefs.current[index] = element; }} src={loaded[index]} muted playsInline preload="auto" />}
            </div>
          ))}
        </div>
        <div className="scroll-world__chapters">
          {sections.map((section, index) => (
            <article className={active === index ? 'world-copy is-active' : 'world-copy'} key={section.id}>
              <span className="world-copy__count">{String(index + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}</span>
              <span className="world-copy__eyebrow">{section.eyebrow}</span>
              <h1>{section.title}</h1>
              <p>{section.body}</p>
              <ul>{section.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              {section.cta && <div className="world-copy__links"><a href={IDENTITY.linkedin}>LinkedIn</a><a href={`https://github.com/${IDENTITY.github_user}`}>GitHub</a><a href={IDENTITY.bmc}>Coffee</a></div>}
            </article>
          ))}
        </div>
        <nav className="world-route" aria-label="World chapters">
          {sections.map((section, index) => <button type="button" className={active === index ? 'is-active' : ''} key={section.id} onClick={() => jumpTo(index)}><span>{section.label}</span><i /></button>)}
        </nav>
        <div className="world-scroll-hint">SCROLL TO FLY <i /></div>
      </div>
      <div className="scroll-world__track" />
    </section>
  );
}
