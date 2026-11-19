import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';

const flightPath = '/world/flight/';
const flightPoster = `${flightPath}continuous-flight-poster.webp`;
const chapterStarts = [0, 145, 290, 435, 532, 677];
const lastFrame = 821;
const fps = 24;
const scrollScreens = 9.4;
// The original camera passes through a dark foreground beam into the next island.
// Keep its near and far sides and traverse the occluded footage in less scroll space.
const beamStart = 336;
const beamEnd = 348;
const beamScrollFrames = 3;
const trimmedScrollFrames = beamEnd - beamStart - beamScrollFrames;
const scrollFrames = lastFrame - trimmedScrollFrames;
const scrollFrame = (frame) => frame >= beamEnd ? frame - trimmedScrollFrames : frame;

const clamp = (value) => Math.min(1, Math.max(0, value));
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const isInAppWebView = () => typeof navigator !== 'undefined'
  && /Instagram|FBAN|FBAV|Discord|;\s*wv\)|\bwv\b|WebView/i.test(navigator.userAgent);

function mediaFrame(progress, settled) {
  const frame = progress * scrollFrames;
  if (frame <= beamStart) return Math.round(frame);
  if (frame >= beamStart + beamScrollFrames) return Math.round(frame + trimmedScrollFrames);
  const local = (frame - beamStart) / beamScrollFrames;
  if (settled) return local < .5 ? beamStart : beamEnd;
  return Math.round(beamStart + local * (beamEnd - beamStart));
}

function getAge(now = new Date()) {
  const birthday = new Date(now.getFullYear(), 5, 25);
  return now.getFullYear() - 2009 - (now < birthday ? 1 : 0);
}

function chooseFlight() {
  if (matchMedia('(max-width: 720px) and (max-aspect-ratio: 5/8)').matches) return 'continuous-flight-portrait.mp4';
  if (matchMedia('(max-width: 768px)').matches) return 'continuous-flight-mobile.mp4';
  return 'continuous-flight.mp4';
}

function useFlightSource(video, enabled, onFailure) {
  useEffect(() => {
    const player = video.current;
    if (!enabled || !player) return;
    const name = chooseFlight();
    const url = flightPath + name;
    const request = new AbortController();
    let objectUrl;
    player.dataset.flightSource = name;
    // Some static hosts return the complete file even for a Range request.
    // Use that response directly as a seekable local file on those hosts.
    async function prepare() {
      const response = await fetch(url, { headers: { Range: 'bytes=0-0' }, signal: request.signal });
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('video/')) throw new Error('Flight video unavailable');
      if (response.status === 206) {
        if (!request.signal.aborted) player.src = url;
        return;
      }
      const movie = await response.blob();
      if (request.signal.aborted) return;
      objectUrl = URL.createObjectURL(movie);
      player.src = objectUrl;
    }
    prepare().catch(() => { if (!request.signal.aborted) onFailure(true); });
    return () => {
      request.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [video, enabled, onFailure]);
}

const chapters = [
  { id: 'intro', media: 'continuous-flight-poster', label: 'Home', eyebrow: 'Boulder, Colorado', title: 'Saras Totey.', body: `I’m a ${getAge()}-year-old full-stack developer who grew up in Boulder. I build trading bots, research markets, and make other cool projects.`, note: 'Pronounced “sahr-iss.” Age updates automatically every June 25.', side: 'left' },
  { id: 'trading', media: 'countersnipe', label: 'Trading systems', eyebrow: 'Markets, then code', title: 'I like finding the moment a market disagrees with itself.', body: 'That puzzle is why I build trading bots. What began with Roblox items became live CS2 arbitrage, prediction-market research, and systems where the logs and mistakes are as interesting as the wins.', href: '/quant', side: 'left' },
  { id: 'econ-mom', media: 'prediction', label: 'Econ.mom', eyebrow: 'Twelve tools, every source shown', title: 'I wanted economics to feel touchable.', body: 'I built Econ.mom because changing an assumption and seeing the result makes a model click faster than memorizing one. Its free tools keep every formula and dataset visible.', href: '/economics#econ-mom', side: 'left' },
  { id: 'local-ledger', media: 'ventures', label: 'Local Ledger', eyebrow: 'A public-data observatory', title: 'I wanted to see a place as a living system.', body: 'That curiosity became Local Ledger: jobs, income, housing, schools, and public spending on one research desk, plus a simulator for asking what might change next.', href: '/economics#local-ledger', side: 'right' },
  { id: 'att', media: 'att', label: 'ATT Agency', eyebrow: 'attagency.co', title: 'Want a site that looks like this? I co-founded the studio that builds them.', body: 'At ATT Agency, I help turn a business into a brand, website, campaign, and measurement system without passing the work between disconnected vendors.', href: '/att-agency', side: 'right' },
  { id: 'contact', media: 'contact', label: 'Contact', eyebrow: 'Boulder to anywhere', title: 'Contact me.', body: 'Discord: PandaXPanther · sarastotey@icloud.com · 720-415-9085', side: 'center' },
];

function WorldChapter({ chapter, index, active }) {
  const Heading = index === 0 ? 'h1' : 'h2';
  return <article aria-hidden={!active} className={`world-copy world-copy--${chapter.side} world-copy--${chapter.id}${active ? ' is-active' : ''}`}>
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
    {chapter.href && <a className="glass-button" href={chapter.href} data-work-link="true">Take me there</a>}
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
  const video = useRef(null);
  const dimensions = useRef({ top: 0, distance: 1, height: 0, width: 0, growth: 0 });
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [reduced, setReduced] = useState(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const staticWorld = reduced || mediaFailed;
  const playFlight = reduced === false && !mediaFailed;

  useBrowserLayoutEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(motion.matches);
    sync();
    motion.addEventListener('change', sync);
    return () => motion.removeEventListener('change', sync);
  }, []);

  useBrowserLayoutEffect(() => {
    const node = root.current;
    const player = video.current;
    const viewport = window.visualViewport;
    const inApp = isInAppWebView();
    // A stable scroll distance keeps the film and chapter anchors fixed as mobile
    // browser chrome changes the visible height.
    let paint = 0;
    let settleTimer = 0;
    let settled = true;
    let hintHidden = window.scrollY > 6;
    let targetFrame = 0;
    let compensation = -1;
    let framePresented = false;

    function seek() {
      if (!player || player.readyState < 1 || !Number.isFinite(player.duration) || player.seeking) return;
      const time = targetFrame ? Math.min((targetFrame + .12) / fps, player.duration - .5 / fps) : 0;
      if (Math.abs(player.currentTime - time) < .02) return;
      if (!player.seekable.length || time > player.seekable.end(player.seekable.length - 1)) return;
      player.currentTime = time;
    }

    function update() {
      paint = 0;
      const { top, distance, height, growth } = dimensions.current;
      const y = window.scrollY - top;
      const progress = clamp(y / distance);
      targetFrame = mediaFrame(progress, settled);
      const chapter = chapterStarts.findLastIndex((start) => targetFrame >= start);
      if (chapter !== activeRef.current) {
        activeRef.current = chapter;
        setActive(chapter);
      }
      if (!hintHidden && y > 6) {
        hintHidden = true;
        setHasScrolled(true);
      }
      if (inApp) {
        const next = Math.round(growth * (1 - clamp(y / (height * .5))));
        if (next !== compensation) {
          compensation = next;
          node.style.setProperty('--world-viewport-compensation', `${next}px`);
        }
      }
      // Keep the detailed poster visible until there is an actual scrubbed frame.
      if (!targetFrame) delete node.dataset.flightReady;
      if (targetFrame > 0 && framePresented && !player?.seeking) {
        node.dataset.flightReady = 'true';
      }
      seek();
    }

    function queue() {
      if (!paint) paint = requestAnimationFrame(update);
    }

    function scroll() {
      settled = false;
      queue();
      // Only an obscured transition needs a settle pass. All other scroll
      // positions already resolve directly to an original movie frame.
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => { settled = true; queue(); }, 120);
    }

    function measure() {
      if (viewport && Math.abs(viewport.scale - 1) > .02) return;
      const old = dimensions.current;
      const width = document.documentElement.clientWidth;
      const height = inApp ? Math.round(viewport?.height ?? window.innerHeight) : window.innerHeight;
      const top = node.getBoundingClientRect().top + window.scrollY;
      const layoutHeight = Math.max(height, document.documentElement.clientHeight, window.innerHeight);
      const reflow = old.width !== width;
      const stableHeight = reflow ? height : old.height || height;
      const distance = stableHeight * scrollScreens;
      dimensions.current = { top, width, height: stableHeight, distance, growth: Math.max(0, height - stableHeight) };
      node.style.setProperty('--world-scroll-distance', `${distance}px`);
      node.style.setProperty('--world-height', `${distance + layoutHeight}px`);
      node.style.setProperty('--world-viewport-height', `${height}px`);
      if (reflow && old.width && window.scrollY > old.top) {
        window.scrollTo(0, top + clamp((window.scrollY - old.top) / old.distance) * distance);
      }
      queue();
    }

    function frameReady() {
      framePresented = player.readyState >= 2 && player.currentTime >= .5 / fps;
      queue();
    }
    function mediaError() {
      setMediaFailed(true);
    }

    measure();
    if (hintHidden) setHasScrolled(true);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    viewport?.addEventListener('resize', measure, { passive: true });
    player?.addEventListener('loadedmetadata', queue);
    player?.addEventListener('progress', queue);
    player?.addEventListener('loadeddata', frameReady);
    player?.addEventListener('seeked', frameReady);
    player?.addEventListener('error', mediaError);
    return () => {
      cancelAnimationFrame(paint);
      clearTimeout(settleTimer);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', measure);
      viewport?.removeEventListener('resize', measure);
      player?.removeEventListener('loadedmetadata', queue);
      player?.removeEventListener('progress', queue);
      player?.removeEventListener('loadeddata', frameReady);
      player?.removeEventListener('seeked', frameReady);
      player?.removeEventListener('error', mediaError);
    };
  }, [playFlight]);
  useFlightSource(video, playFlight, setMediaFailed);

  function jumpTo(index) {
    const { top, distance } = dimensions.current;
    const offset = scrollFrame(chapterStarts[index]) / scrollFrames * distance;
    window.scrollTo({ top: top + offset + (index ? 2 : 0), behavior: reduced ? 'instant' : 'smooth' });
  }

  return <main ref={root} className="scroll-world" data-marker={active} data-scroll-mode="free" data-in-app-webview={isInAppWebView() || undefined}>
    <span className="world-contact-anchor" id="contact" style={{ '--contact-position': scrollFrame(chapterStarts[5]) / scrollFrames }} />
    <div className="scroll-world__sticky">
      <div className="scroll-world__stage" aria-hidden="true">
        <div className="scroll-world__scene">
          <img src={staticWorld ? `${flightPath}${chapters[active].media}.webp` : flightPoster} alt="" fetchpriority="high" />
          {playFlight && <video ref={video} muted playsInline preload="auto" disablePictureInPicture />}
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
