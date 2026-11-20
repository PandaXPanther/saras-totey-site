import React, { useEffect, useRef, useState } from 'react';

const tracks = [
  ['llnXhrCn9Yo', 'Black & White Elite Four'],
  ['0yqm7vrCp-g', 'Volo'],
  ['GIn8_Q27WFY', 'Zinnia'],
  ['vjOKKDgKvp4', 'Lugia'],
  ['AVUdyEWH2nE', 'Sword & Shield Gym Leader'],
];
let playerApi;

function loadPlayerApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!playerApi) {
    playerApi = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('YouTube player unavailable'));
      document.head.append(script);
    });
  }
  return playerApi;
}

export default function BattleSoundtrack({ enabled, matchIndex, audio }) {
  const [trackIndex, setTrackIndex] = useState(matchIndex % tracks.length);
  const [seen, setSeen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const viewport = useRef(null);
  const slot = useRef(null);
  const player = useRef(null);
  const visible = useRef(false);
  const resumeWhenVisible = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.intersectionRatio >= 0.55 && entry.boundingClientRect.width >= 200;
      if (visible.current) {
        setSeen(true);
        if (resumeWhenVisible.current && !document.hidden) {
          resumeWhenVisible.current = false;
          player.current?.playVideo?.();
        }
      } else {
        if (player.current?.getPlayerState?.() === 1) resumeWhenVisible.current = true;
        player.current?.pauseVideo?.();
        audio.setFavoritePlaying(false);
      }
    }, { threshold: 0.55 });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [audio]);

  useEffect(() => {
    if (!enabled || !seen) return;
    const host = slot.current;
    let disposed = false;
    const order = [...tracks.slice(trackIndex), ...tracks.slice(0, trackIndex)];
    const params = new URLSearchParams({
      enablejsapi: '1',
      origin: window.location.origin,
      playsinline: '1',
      loop: '1',
      playlist: order.slice(1).map(([id]) => id).join(','),
    });
    const frame = document.createElement('iframe');
    frame.title = 'YouTube battle soundtrack';
    frame.src = `https://www.youtube-nocookie.com/embed/${order[0][0]}?${params}`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    setUnavailable(false);
    loadPlayerApi().then((youtube) => {
      if (disposed) return;
      host.replaceChildren(frame);
      player.current = new youtube.Player(frame, {
        events: {
          onReady({ target }) {
            target.setVolume(36);
            if (visible.current && !document.hidden) target.playVideo();
          },
          onStateChange({ data, target }) {
            if (data === youtube.PlayerState.PLAYING && (document.hidden || !visible.current)) {
              target.pauseVideo();
              return;
            }
            audio.setFavoritePlaying(data === youtube.PlayerState.PLAYING);
          },
          onError() {
            audio.setFavoritePlaying(false);
            setUnavailable(true);
          },
        },
      });
    }).catch(() => {
      if (disposed) return;
      host.replaceChildren();
      setUnavailable(true);
    });

    function onVisibility() {
      if (document.hidden) {
        if (player.current?.getPlayerState?.() === 1) resumeWhenVisible.current = true;
        player.current?.pauseVideo?.();
      } else if (visible.current && resumeWhenVisible.current) {
        resumeWhenVisible.current = false;
        player.current?.playVideo?.();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      player.current?.destroy?.();
      player.current = null;
      resumeWhenVisible.current = false;
      host.replaceChildren();
      audio.setFavoritePlaying(false);
    };
  }, [audio, enabled, seen, trackIndex]);

  return (
    <aside className="pokemon-soundtrack" aria-label="Battle soundtrack">
      <label>
        Battle soundtrack
        <select value={trackIndex} onChange={({ target }) => setTrackIndex(Number(target.value))}>
          {tracks.map(([id, name], index) => <option key={id} value={index}>{name}</option>)}
        </select>
      </label>
      <div className="pokemon-soundtrack__viewport" ref={viewport}>
        <div ref={slot} className="pokemon-soundtrack__player" />
        {(!enabled || !seen) && <span>{enabled ? 'Pokémon themes' : 'Sound off'}</span>}
      </div>
      {enabled && unavailable && <p>Using the Showdown battle theme.</p>}
    </aside>
  );
}
