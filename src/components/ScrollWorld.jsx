import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { IDENTITY } from '../data/content.js';

const getAge = (now = new Date()) => {
  const birthdayThisYear = new Date(now.getFullYear(), 5, 25);
  return now.getFullYear() - 2009 - (now < birthdayThisYear ? 1 : 0);
};

const chapters = [
  { id: 'intro', media: 'intro', label: 'Home', eyebrow: 'Boulder, Colorado', title: 'My name is Saras Totey.', body: `I’m a ${getAge()}-year-old full-stack developer who grew up in Boulder. I build trading bots, research markets, and make other cool projects.`, note: 'Pronounced “sahr-iss.” Age updates automatically every June 25.', side: 'left' },
  { id: 'trading', media: 'countersnipe', label: 'Trading systems', eyebrow: 'Markets, then code', title: 'I like finding the moment a market disagrees with itself.', body: 'That puzzle is why I build trading bots. What began with Roblox items became live CS2 arbitrage, prediction-market research, and systems where the logs and mistakes are as interesting as the wins.', href: '/quant', side: 'left' },
  { id: 'econ-mom', media: 'prediction', label: 'Econ.mom', eyebrow: 'Twelve tools, every source shown', title: 'I wanted economics to feel touchable.', body: 'I built Econ.mom because changing an assumption and seeing the result makes a model click faster than memorizing one. Its free tools keep every formula and dataset visible.', href: '/econ-mom', side: 'left' },
  { id: 'local-ledger', media: 'ventures', label: 'Local Ledger', eyebrow: 'A public-data observatory', title: 'I wanted to see a place as a living system.', body: 'That curiosity became Local Ledger: jobs, income, housing, schools, and public spending on one research desk, plus a simulator for asking what might change next.', href: '/local-ledger', side: 'right' },
  { id: 'att', media: 'att', label: 'ATT Agency', eyebrow: 'Want a site like this?', title: 'I co-founded the studio that builds them.', body: 'At ATT Agency, I help turn a business into a brand, website, campaign, and measurement system without passing the work between disconnected vendors.', href: '/att-agency', side: 'right' },
  { id: 'contact', media: 'contact', label: 'Contact', eyebrow: 'Boulder to anywhere', title: 'Contact me.', body: 'Discord: PandaXPanther · sarastotey@icloud.com · 720-415-9085', side: 'center', cta: true },
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const flightDurations = [6.041667, 6.041667, 6.041667, 4.041667, 6.041667, 6.041667];
const markerTimes = flightDurations.map((_, index) => flightDurations.slice(0, index).reduce((sum, duration) => sum + duration, 0));
const markerProgress = chapters.map((_, index) => index / (chapters.length - 1));
const TRANSITION_SECONDS = 0.85;
const INTENT_THRESHOLD = 36;
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const nearestMarker = (position) => markerProgress.reduce((nearest, progress, index) => (
  Math.abs(progress - position) < Math.abs(markerProgress[nearest] - position) ? index : nearest
), 0);

export default function ScrollWorld() {
  const root = useRef(null);
  const videoRef = useRef(null);
  const markerRef = useRef(0);
  const transitionRef = useRef(null);
  const queuedDirectionRef = useRef(0);
  const intentRef = useRef(0);
  const wheelGestureRef = useRef(false);
  const wheelTimerRef = useRef(0);
  const touchStartRef = useRef(null);
  const programmaticScrollRef = useRef(false);
  const scrollTimerRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const [active, setActive] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const markerScrollTop = (index) => {
    const node = root.current;
    if (!node) return 0;
    return node.offsetTop + markerProgress[index] * Math.max(1, node.offsetHeight - innerHeight);
  };

  const applyMarker = (index) => {
    markerRef.current = index;
    setActive(index);
    window.scrollTo(0, markerScrollTop(index));
    const video = videoRef.current;
    if (video?.readyState >= 1) video.currentTime = Math.min(markerTimes[index], Math.max(0, video.duration - 0.04));
  };

  const rememberPosition = () => {
    const marker = markerRef.current;
    const snapshot = {
      marker,
      position: markerProgress[marker],
      scrollY: markerScrollTop(marker),
      videoTime: markerTimes[marker],
    };
    sessionStorage.setItem('saras-world-snapshot', JSON.stringify(snapshot));
    sessionStorage.setItem('saras-world-position', String(snapshot.position));
    history.replaceState({ ...history.state, worldSnapshot: snapshot }, '');
  };

  const goToMarkerRef = useRef(() => {});
  goToMarkerRef.current = (requestedIndex, { instant = false, userInitiated = false } = {}) => {
    const nextIndex = clamp(requestedIndex, 0, chapters.length - 1);
    if (userInitiated) setHasScrolled(true);
    if (transitionRef.current) {
      queuedDirectionRef.current = Math.sign(nextIndex - markerRef.current);
      return;
    }
    if (nextIndex === markerRef.current && !instant) return;

    const fromIndex = markerRef.current;
    const fromScroll = scrollY;
    const toScroll = markerScrollTop(nextIndex);
    const video = videoRef.current;
    const fromTime = video?.readyState >= 1 ? video.currentTime : markerTimes[fromIndex];
    const toTime = markerTimes[nextIndex];
    const revealAt = 0.46;
    let revealed = nextIndex === fromIndex;

    markerRef.current = nextIndex;
    programmaticScrollRef.current = true;
    if (instant || reduceMotionRef.current) {
      applyMarker(nextIndex);
      programmaticScrollRef.current = false;
      rememberPosition();
      return;
    }

    setTransitioning(true);
    transitionRef.current = animate(0, 1, {
      duration: TRANSITION_SECONDS,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (progress) => {
        window.scrollTo(0, fromScroll + (toScroll - fromScroll) * progress);
        if (video?.readyState >= 1) video.currentTime = fromTime + (toTime - fromTime) * progress;
        if (!revealed && progress >= revealAt) {
          revealed = true;
          setActive(nextIndex);
        }
      },
      onComplete: () => {
        transitionRef.current = null;
        programmaticScrollRef.current = false;
        setTransitioning(false);
        applyMarker(nextIndex);
        rememberPosition();
        const queuedDirection = queuedDirectionRef.current;
        queuedDirectionRef.current = 0;
        if (queuedDirection) goToMarkerRef.current(nextIndex + queuedDirection, { userInitiated: true });
      },
    });
  };

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduceMotionRef.current = query.matches;
      setReduceMotion(query.matches);
    };
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
      if (!snapshot) return;
      const marker = Number.isInteger(snapshot.marker)
        ? clamp(snapshot.marker, 0, chapters.length - 1)
        : nearestMarker(Number.isFinite(snapshot.position) ? clamp(snapshot.position) : 0);
      goToMarkerRef.current(marker, { instant: true });
      const video = videoRef.current;
      if (video && video.readyState < 1) video.addEventListener('loadedmetadata', () => applyMarker(marker), { once: true });
    };
    restore();
    addEventListener('pageshow', restore);
    return () => removeEventListener('pageshow', restore);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;

    const step = (direction) => goToMarkerRef.current(markerRef.current + direction, { userInitiated: true });
    const onWheel = (event) => {
      if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      event.preventDefault();
      clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => {
        wheelGestureRef.current = false;
        intentRef.current = 0;
      }, 180);
      intentRef.current += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (wheelGestureRef.current || Math.abs(intentRef.current) < INTENT_THRESHOLD) return;
      wheelGestureRef.current = true;
      step(Math.sign(intentRef.current));
    };
    const onTouchStart = (event) => {
      const touch = event.touches[0];
      touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchMove = (event) => {
      const start = touchStartRef.current;
      const touch = event.touches[0];
      if (start && touch && Math.abs(touch.clientY - start.y) > Math.abs(touch.clientX - start.x)) event.preventDefault();
    };
    const onTouchEnd = (event) => {
      const start = touchStartRef.current;
      const touch = event.changedTouches[0];
      touchStartRef.current = null;
      if (!start || !touch) return;
      const deltaY = start.y - touch.clientY;
      if (Math.abs(deltaY) >= 44 && Math.abs(deltaY) > Math.abs(start.x - touch.clientX)) step(Math.sign(deltaY));
    };
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(event.target.tagName)) return;
      const direction = event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ' ? 1
        : event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      step(direction);
    };
    const onScroll = () => {
      if (programmaticScrollRef.current) return;
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = window.setTimeout(() => {
        const position = clamp((scrollY - node.offsetTop) / Math.max(1, node.offsetHeight - innerHeight));
        goToMarkerRef.current(nearestMarker(position), { userInitiated: true });
      }, 100);
    };
    const onResize = () => applyMarker(markerRef.current);
    const onPageHide = () => rememberPosition();

    addEventListener('wheel', onWheel, { passive: false });
    addEventListener('touchstart', onTouchStart, { passive: true });
    addEventListener('touchmove', onTouchMove, { passive: false });
    addEventListener('touchend', onTouchEnd, { passive: true });
    addEventListener('keydown', onKeyDown);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    addEventListener('pagehide', onPageHide);
    return () => {
      transitionRef.current?.stop();
      clearTimeout(wheelTimerRef.current);
      clearTimeout(scrollTimerRef.current);
      rememberPosition();
      removeEventListener('wheel', onWheel);
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchmove', onTouchMove);
      removeEventListener('touchend', onTouchEnd);
      removeEventListener('keydown', onKeyDown);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
      removeEventListener('pagehide', onPageHide);
    };
  }, []);

  return (
    <main ref={root} className="scroll-world" data-marker={active} data-transitioning={transitioning ? 'true' : 'false'} style={{ '--world-height': `${chapters.length * 100}vh` }}>
      <div className="scroll-world__sticky">
        <div className="scroll-world__stage" aria-hidden="true">
          <div className="scroll-world__scene"><img src={reduceMotion ? `/world/flight/${chapters[active].media}.webp` : '/world/flight/intro-4k.webp'} alt="" />{!reduceMotion && <video ref={videoRef} src="/world/flight/continuous-flight.mp4" muted playsInline preload="auto" />}</div>
        </div>
        <div className="world-wash" aria-hidden="true" />
        {chapters.map((chapter, index) => <article key={chapter.id} className={`world-copy world-copy--${chapter.side} ${active === index ? 'is-active' : ''}`}><span className="world-copy__count">{String(index + 1).padStart(2, '0')} / {chapters.length}</span><span className="world-copy__eyebrow">{chapter.eyebrow}</span><h1>{chapter.title}</h1><p>{chapter.body}</p>{chapter.note && <small className="world-copy__note">{chapter.note}</small>}{chapter.href && <a className="glass-button" href={chapter.href} data-world-cta="true" onClick={rememberPosition}>Take me there</a>}{chapter.cta && <div className="world-copy__contact"><a href="mailto:sarastotey@icloud.com">Email</a><a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={`https://github.com/${IDENTITY.github_user}`} target="_blank" rel="noreferrer">GitHub</a><a href={IDENTITY.instagram} target="_blank" rel="noreferrer">Instagram</a></div>}</article>)}
        <div className={`world-controls ${hasScrolled ? 'is-dismissed' : ''}`}><button type="button" onClick={() => goToMarkerRef.current(Math.max(0, active - 1), { userInitiated: true })} aria-label="Back to previous section">↑</button><span>scroll to explore <i aria-hidden="true">⌄</i></span></div>
        <nav className="world-route" aria-label="World chapters">{chapters.map((chapter, index) => <button key={chapter.id} className={active === index ? 'is-active' : ''} onClick={() => goToMarkerRef.current(index, { userInitiated: true })} aria-label={`Go to ${chapter.label}`}><i aria-hidden="true" /></button>)}</nav>
      </div>
    </main>
  );
}
