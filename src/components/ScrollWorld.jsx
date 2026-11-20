import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';
import { createFlightFrames, visibleFlightFrame } from './flightFrames.js';
import pacing from '../data/flight-pacing.json';

const flightPath = '/world/flight/';
const flightPoster = `${flightPath}continuous-flight-poster.webp`;
const chapterStarts = [0, 145, 290, 435, 532, 605, 682, 721, 757];
const scrollScreens = 1.175 * chapterStarts.length;
const beamStart = 336;
const beamEnd = 348;
const chapterTravel = [...chapterStarts.map((frame) => pacing[frame]), pacing.at(-1)];

function chapterAt(progress) {
  return Math.min(chapterStarts.length - 1, Math.floor(progress * chapterStarts.length));
}

function progressAtFrame(frame) {
  const chapter = chapterStarts.findLastIndex((start) => frame >= start);
  const [start, end] = [chapterTravel[chapter], chapterTravel[chapter + 1]];
  return (chapter + (pacing[frame] - start) / (end - start)) / chapterStarts.length;
}

const clamp = (value) => Math.min(1, Math.max(0, value));
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const isInAppWebView = () => typeof navigator !== 'undefined'
  && /Instagram|FBAN|FBAV|Discord|;\s*wv\)|\bwv\b|WebView/i.test(navigator.userAgent);

function mediaFrame(progress, settled) {
  const chapter = chapterAt(progress);
  const [start, end] = [chapterTravel[chapter], chapterTravel[chapter + 1]];
  // Equal scroll distance per chapter, with the original camera pacing inside each one.
  const travel = start + (end - start) * (progress * chapterStarts.length - chapter);
  let first = 0;
  let last = pacing.length - 1;
  while (first < last) {
    const middle = Math.floor((first + last) / 2);
    if (pacing[middle] < travel) first = middle + 1;
    else last = middle;
  }
  const frame = first > 0 && travel - pacing[first - 1] < pacing[first] - travel ? first - 1 : first;
  if (settled && frame > beamStart && frame < beamEnd) return frame < (beamStart + beamEnd) / 2 ? beamStart : beamEnd;
  return visibleFlightFrame(frame);
}

function getAge(now = new Date()) {
  const birthday = new Date(now.getFullYear(), 5, 25);
  return now.getFullYear() - 2009 - (now < birthday ? 1 : 0);
}

const portraitFlight = '(max-width: 760px) and (orientation: portrait)';

const chapters = [
  { id: 'intro', media: 'continuous-flight-poster', label: 'Home', eyebrow: 'Boulder, Colorado', title: 'Saras Totey.', body: `I’m a ${getAge()}-year-old full-stack developer who grew up in Boulder. I build trading bots, research markets, and make other cool projects.`, note: 'Pronounced “sahr-iss.” Age updates automatically every June 25.', side: 'left' },
  { id: 'trading', media: 'countersnipe', label: 'Trading systems', eyebrow: 'Markets, then code', title: 'I like finding the moment a market disagrees with itself.', body: 'That puzzle is why I build trading bots. What began with Roblox items became live CS2 arbitrage, prediction-market research, and systems where the logs and mistakes are as interesting as the wins.', href: '/quant', side: 'left' },
  { id: 'econ-mom', media: 'prediction', label: 'Econ.mom', eyebrow: 'Twelve tools, every source shown', title: 'I wanted economics to feel touchable.', body: 'I built Econ.mom because changing an assumption and seeing the result makes a model click faster than memorizing one. Its free tools keep every formula and dataset visible.', href: '/economics#econ-mom', side: 'left' },
  { id: 'local-ledger', media: 'ventures', label: 'Local Ledger', eyebrow: 'A public-data observatory', title: 'I wanted to see a place as a living system.', body: 'That curiosity became Local Ledger: jobs, income, housing, schools, and public spending on one research desk, plus a simulator for asking what might change next.', href: '/economics#local-ledger', side: 'right' },
  { id: 'att', media: 'att', label: 'ATT Agency', eyebrow: 'attagency.co', title: 'Want a site that looks like this? I co-founded the studio that builds them.', body: 'At ATT Agency, I help turn a business into a brand, website, campaign, and measurement system without passing the work between disconnected vendors.', href: '/att-agency', side: 'right' },
  { id: 'roblox', media: 'roblox', label: 'Roblox games', eyebrow: 'Roblox game development', title: 'I build games with Ryder.', body: 'I write the gameplay and systems. Ryder designs the worlds, models, and interfaces. You can play our latest releases on Roblox.', href: '/roblox', side: 'left' },
  { id: 'misc', media: 'misc', label: 'Bots', eyebrow: 'Games I build', title: 'Play against my bots.', body: 'Play chess or battle in Gen 6 Pokémon against bots based on my own games. Take on my heads-up poker bot in Texas Hold’em, too.', href: '/misc', cta: 'See the bots', side: 'right' },
  { id: 'other-projects', media: 'stills-v4/wide/243', label: 'Other Projects', eyebrow: 'Other Projects', title: 'Discord history and extemp standings.', body: 'Kodama helps Discord servers search their own history. The Extemp National Points Race tracks high school speakers across the country.', href: '/other-projects', cta: 'Explore the projects', side: 'right' },
  { id: 'contact', media: 'contact', label: 'Contact', eyebrow: 'Boulder to anywhere', title: 'Contact me.', body: 'Discord: PandaXPanther · sarastotey@icloud.com · 720-415-9085', side: 'center' },
];

function WorldChapter({ chapter, index, active }) {
  const Heading = index === 0 ? 'h1' : 'h2';
  return <article data-chapter={chapter.id} aria-hidden={!active} className={`world-copy world-copy--${chapter.side} world-copy--${chapter.id}${active ? ' is-active' : ''}`}>
    <span className="world-copy__count">{String(index + 1).padStart(2, '0')} / {chapters.length}</span>
    <span className="world-copy__eyebrow">{chapter.eyebrow}</span>
    {index === 0 ? (
      <div className="world-copy__identity">
        <Heading className="world-copy__title">{chapter.title}</Heading>
        <img src="/saras-headshot.jpg" width="200" height="200" alt="Saras Totey" />
      </div>
    ) : <Heading className="world-copy__title">{chapter.title}</Heading>}
    <p>{chapter.body}</p>
    {chapter.note && <small className="world-copy__note">{chapter.note}</small>}
    {chapter.href && <a className="glass-button" href={chapter.href} data-work-link="true">{chapter.cta || 'Take me there'}</a>}
    {chapter.id === 'contact' && <div className="world-copy__contact">
      <a href="mailto:sarastotey@icloud.com">Email</a>
      <a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
      <a href={`https://github.com/${IDENTITY.github_user}`} target="_blank" rel="noreferrer">GitHub</a>
      <a href={IDENTITY.instagram} target="_blank" rel="noreferrer">Instagram</a>
    </div>}
  </article>;
}

export default function ScrollWorld() {
  const root = useRef(null);
  const canvas = useRef(null);
  const chapterJump = useRef(0);
  const dimensions = useRef({ top: 0, distance: 1, height: 0, width: 0 });
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [reduced, setReduced] = useState(null);
  const [variant, setVariant] = useState('wide');
  const [hasView, setHasView] = useState(false);
  const playFlight = reduced === false;

  function stopChapterJump() {
    if (!chapterJump.current) return;
    cancelAnimationFrame(chapterJump.current);
    chapterJump.current = 0;
  }

  useBrowserLayoutEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(motion.matches);
    sync();
    const portrait = matchMedia(portraitFlight);
    const orient = () => setVariant(portrait.matches ? 'portrait' : 'wide');
    orient();
    motion.addEventListener('change', sync);
    portrait.addEventListener('change', orient);
    return () => {
      motion.removeEventListener('change', sync);
      portrait.removeEventListener('change', orient);
    };
  }, []);

  useBrowserLayoutEffect(() => {
    const node = root.current;
    const viewport = window.visualViewport;
    delete node.dataset.flightReady;
    delete node.dataset.renderedFrame;
    delete node.dataset.flightQuality;
    setHasView(false);
    let paint = 0;
    let resize = 0;
    let settleTimer = 0;
    let settled = true;
    let hintHidden = window.scrollY > 6;
    let camera = null;
    let lastPaint = 0;
    const phone = matchMedia('(pointer: coarse)').matches;
    let frames;
    let viewing = false;

    if (playFlight) {
      try {
        frames = createFlightFrames(canvas.current, variant, (frame, quality) => {
          if (!viewing) setHasView(true);
          viewing = true;
          node.dataset.renderedFrame = frame;
          node.dataset.flightQuality = quality;
          if (frame) node.dataset.flightReady = '';
          else delete node.dataset.flightReady;
        }, () => {
          if (!viewing) return;
          viewing = false;
          delete node.dataset.flightReady;
          delete node.dataset.renderedFrame;
          delete node.dataset.flightQuality;
          setHasView(false);
        });
      } catch {
        // The chapter stills remain usable if the WebView cannot create a canvas.
      }
    }

    function update(now) {
      paint = 0;
      const { top, distance } = dimensions.current;
      const y = window.scrollY - top;
      const progress = clamp(y / distance);
      if (camera === null || !frames) camera = progress;
      else {
        const elapsed = Math.min(phone && !settled ? 24 : 16, now - lastPaint);
        camera += (progress - camera) * (1 - Math.exp(-elapsed / (phone ? 23 : 32)));
        if (Math.abs(progress - camera) < .0004) camera = progress;
      }
      lastPaint = now;
      const chapter = chapterAt(progress);
      if (chapter !== activeRef.current) {
        activeRef.current = chapter;
        setActive(chapter);
      }
      frames?.show(mediaFrame(camera, settled && camera === progress), mediaFrame(progress, settled), settled && camera === progress);
      if (!hintHidden && y > 6) {
        hintHidden = true;
        setHasScrolled(true);
      }
      if (camera !== progress) queue();
    }

    function queue() {
      if (!paint) paint = requestAnimationFrame(update);
    }

    function scroll() {
      settled = false;
      queue();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => { settled = true; queue(); }, 120);
    }

    function measure() {
      resize = 0;
      if (viewport && Math.abs(viewport.scale - 1) > .02) return;
      const old = dimensions.current;
      const { clientWidth: width, clientHeight } = document.documentElement;
      const height = Math.round(viewport?.height ?? window.innerHeight);
      const reflow = old.width !== width;
      const stableHeight = reflow ? height : old.height || height;
      const distance = stableHeight * scrollScreens;
      const top = node.getBoundingClientRect().top + window.scrollY;
      dimensions.current = { top, width, height: stableHeight, distance };
      node.style.setProperty('--world-scroll-distance', `${distance}px`);
      node.style.setProperty('--world-height', `${distance + Math.max(clientHeight, height)}px`);
      node.style.setProperty('--world-viewport-height', `${height}px`);
      if (reflow && old.width && window.scrollY > old.top) {
        window.scrollTo(0, top + clamp((window.scrollY - old.top) / old.distance) * distance);
      }
      queue();
    }

    function queueMeasure() {
      if (!resize) resize = requestAnimationFrame(measure);
    }

    function keyScroll(event) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stopChapterJump();
    }

    measure();
    if (hintHidden) setHasScrolled(true);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('wheel', stopChapterJump, { passive: true });
    window.addEventListener('touchstart', stopChapterJump, { passive: true });
    window.addEventListener('keydown', keyScroll);
    window.addEventListener('resize', queueMeasure, { passive: true });
    viewport?.addEventListener('resize', queueMeasure, { passive: true });
    return () => {
      cancelAnimationFrame(paint);
      cancelAnimationFrame(resize);
      frames?.dispose();
      clearTimeout(settleTimer);
      stopChapterJump();
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('wheel', stopChapterJump);
      window.removeEventListener('touchstart', stopChapterJump);
      window.removeEventListener('keydown', keyScroll);
      window.removeEventListener('resize', queueMeasure);
      viewport?.removeEventListener('resize', queueMeasure);
    };
  }, [playFlight, variant]);

  function jumpTo(index) {
    const { top, distance } = dimensions.current;
    const frame = index === 0 ? 0 : chapterStarts[index] + 8;
    const offset = progressAtFrame(frame) * distance;
    stopChapterJump();
    const from = window.scrollY;
    const to = top + offset;
    if (reduced || Math.abs(to - from) < 1) {
      window.scrollTo({ top: to, behavior: 'instant' });
      return;
    }

    // Keep chapter navigation interruptible without intercepting wheel or touch scrolling.
    const started = performance.now();
    const duration = Math.min(620, 300 + Math.abs(to - from) * .11);
    function move(now) {
      const progress = clamp((now - started) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      window.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
      chapterJump.current = progress < 1 ? requestAnimationFrame(move) : 0;
    }
    chapterJump.current = requestAnimationFrame(move);
  }

  return <main ref={root} className="scroll-world" style={{ '--world-scroll-screens': scrollScreens }} data-marker={active} data-flight-renderer={playFlight ? 'frames' : undefined} data-scroll-mode="free" data-in-app-webview={isInAppWebView() || undefined}>
    <span className="world-contact-anchor" id="contact" style={{ '--contact-position': progressAtFrame(chapterStarts.at(-1)) }} />
    <div className="scroll-world__sticky">
      <div className="scroll-world__stage" aria-hidden="true">
        <div className="scroll-world__scene">
          <img src={!hasView && active ? `${flightPath}${chapters[active].media}.webp` : flightPoster} alt="" fetchpriority="high" />
          {playFlight && <canvas ref={canvas} />}
        </div>
      </div>
      <div className="world-wash" aria-hidden="true" />
      {chapters.map((chapter, index) => <WorldChapter key={chapter.id} chapter={chapter} index={index} active={active === index} />)}
      <div className={`world-controls${hasScrolled ? ' is-dismissed' : ''}`}>
        <button type="button" onClick={() => jumpTo(0)} aria-label="Back to the first chapter">↑</button>
        <span>scroll to explore <i aria-hidden="true">⌄</i></span>
      </div>
      <nav className="world-route" aria-label="World chapters">
        {chapters.map((chapter, index) => <button
          key={chapter.id}
          data-chapter={chapter.id}
          type="button"
          className={active === index ? 'is-active' : ''}
          aria-current={active === index ? 'step' : undefined}
          onClick={() => jumpTo(index)}
          aria-label={`Go to ${chapter.label}`}
        ><i aria-hidden="true" /></button>)}
      </nav>
    </div>
  </main>;
}
