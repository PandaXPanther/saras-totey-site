import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';

const chapters = [
  { id: 'intro', media: 'intro', label: 'Intro', eyebrow: 'Independent builder', title: 'I build systems that have to explain themselves.', body: 'Trading software, public experiments, and small companies, connected by evidence instead of theater.', tags: ['Saras Totey', '17 years old'], side: 'left' },
  { id: 'countersnipe', media: 'countersnipe', label: 'CounterSnipe', eyebrow: 'Live capital', title: 'A pricing mistake becomes a measured trade.', body: 'CounterSnipe watches skin markets, buys verified discounts, and re-lists them with hard safety limits.', tags: ['$1,424 live', '14.1% avg. return'], side: 'right' },
  { id: 'prediction', media: 'prediction', label: 'Prediction bot', eyebrow: 'Paper system', title: 'Forecast first. Copy nobody blindly.', body: 'The prediction bot tests timing and market bias across Kalshi and Polymarket.', tags: ['17-trade NO-only slice', '0 rule breaches'], side: 'left' },
  { id: 'copy-trader', media: 'prediction', label: 'Copy trader', eyebrow: 'Research system', title: 'Rank discipline, not screenshots.', body: 'copy-trader scores public Hyperliquid wallets by Sharpe ratio, drawdown, win rate, and profit factor.', tags: ['38,125 accounts filtered', '20 wallets ranked'], side: 'right' },
  { id: 'econ-mom', media: 'ventures', label: 'econ.mom', eyebrow: 'The Mother of Econ', title: 'Economics tools that show their work.', body: 'Twelve free tools, cited formulas, and public datasets for students, debaters, and policy desks.', tags: ['12 tools', 'Marginal Revolution'], href: '/econ-mom', side: 'left' },
  { id: 'local-ledger', media: 'ventures', label: 'Local Ledger', eyebrow: 'Nationwide observatory', title: 'Every county. Zero invented evidence.', body: 'Jobs, housing, income, schools, and spending across 50 states, 3,143 counties, and 120 metros.', tags: ['3,143 counties', '0 fabricated'], href: '/local-ledger', side: 'right' },
  { id: 'att', media: 'ventures', label: 'ATT Agency', eyebrow: 'Boulder studio', title: 'One team from brand to measurement.', body: 'ATT Agency builds brands, custom sites, video, ads, and analytics for small businesses.', tags: ['Brand + web', 'Video + analytics'], href: '/att-agency', side: 'left' },
  { id: 'record', media: 'contact', label: 'Record', eyebrow: 'On the record', title: 'Certificates, brackets, rosters, and receipts.', body: 'Economics, debate, cybersecurity, and science, with a record that can be checked.', tags: ['NEC finalist, 2×', 'Science Olympiad state champion'], side: 'right' },
  { id: 'links', media: 'contact', label: 'Links', eyebrow: 'Open notebook', title: 'Read the work. Check the numbers.', body: 'The repositories, live metrics, citations, and project sites stay open for inspection.', tags: ['GitHub', 'LinkedIn'], side: 'left' },
  { id: 'contact', media: 'contact', label: 'Contact', eyebrow: 'Say hello', title: 'If anything looks too neat, ask me.', body: 'I will show you the log.', tags: [], side: 'center', cta: true },
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
  const segments = useMemo(() => chapters.map((chapter, index) => ({ chapter: index, media: chapter.media, weight: index === 0 || index === chapters.length - 1 ? 1.25 : 1.5 })), []);

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
    return () => controller.abort();
  }, [active, ready, reduceMotion, segments]);

  const jumpTo = (index) => {
    const node = root.current;
    if (!node) return;
    const before = segments.slice(0, index).reduce((sum, segment) => sum + segment.weight, 0);
    window.scrollTo({ top: node.offsetTop + before * window.innerHeight + 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    let ticking = false;
    let lastTarget = -1;
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
        const opacity = clamp(1 - distance / (viewport * 0.18));
        if (layerRefs.current[index]) layerRefs.current[index].style.opacity = opacity.toFixed(3);
        if (y >= start && y <= end) {
          current = index;
          const video = videoRefs.current[index];
          if (video?.duration && video.readyState >= 2 && !video.seeking) {
            const target = local * Math.max(0, video.duration - 0.04);
            if (Math.abs(target - lastTarget) > 0.035) {
              video.currentTime = target;
              lastTarget = target;
            }
          }
        }
      }
      if (current !== activeRef.current) {
        activeRef.current = current;
        setActive(current);
      }
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
          {segments.map((segment, index) => <div ref={(element) => { layerRefs.current[index] = element; }} className="scroll-world__scene" key={`${segment.media}-${index}`}><img src={`/world/flight/${segment.media}.webp`} alt="" />{!reduceMotion && ready[segment.media] && active === index && <video ref={(element) => { videoRefs.current[index] = element; }} src={ready[segment.media]} muted playsInline preload="auto" />}</div>)}
        </div>
        <div className="world-wash" aria-hidden="true" />
        {chapters.map((chapter, index) => <article key={chapter.id} className={`world-copy world-copy--${chapter.side} ${active === index ? 'is-active' : ''}`}><span className="world-copy__count">{String(index + 1).padStart(2, '0')} / {chapters.length}</span><span className="world-copy__eyebrow">{chapter.eyebrow}</span><h1>{chapter.title}</h1><p>{chapter.body}</p><ul>{chapter.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>{chapter.href && <a className="glass-button" href={chapter.href}>Explore project</a>}{chapter.cta && <div className="world-copy__links"><a href={IDENTITY.linkedin}>LinkedIn</a><a href={`https://github.com/${IDENTITY.github_user}`}>GitHub</a><a href={IDENTITY.bmc}>Coffee</a></div>}</article>)}
        <nav className="world-jump" aria-label="Skip to chapter"><button type="button" onClick={() => jumpTo(Math.max(0, active - 1))} aria-label="Previous chapter">↑</button><button type="button" className="world-jump__label" onClick={() => jumpTo((active + 1) % chapters.length)}><span>{chapters[active].label}</span><small>skip chapter</small></button><button type="button" onClick={() => jumpTo(Math.min(chapters.length - 1, active + 1))} aria-label="Next chapter">↓</button></nav>
        <div className="world-progress"><i style={{ transform: `scaleX(${(active + 1) / chapters.length})` }} /></div>
      </div>
    </main>
  );
}
