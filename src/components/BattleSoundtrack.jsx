import React, { useEffect, useRef, useState } from 'react';

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

export default function BattleSoundtrack({ enabled, themes, audio }) {
  const [open, setOpen] = useState(false);

  return (
    <details className="pokemon-soundtrack" onToggle={({ currentTarget }) => setOpen(currentTarget.open)}>
      <summary>Battle soundtrack <span>(these are my favorite themes)</span></summary>
      {open && (enabled ? <FavoritePlayer tracks={themes.favorites} nativeTheme={themes.native.name} audio={audio} /> :
        <p className="pokemon-soundtrack__message">Turn battle sound on to play the favorites.</p>)}
    </details>
  );
}

function currentVideoId(player) {
  const playlist = player.getPlaylist?.();
  const index = player.getPlaylistIndex?.();
  const videoUrl = player.getVideoUrl?.();
  if (videoUrl) {
    try {
      const id = new URL(videoUrl).searchParams.get('v');
      if (id) return id;
    } catch { /* Some browsers report no URL until the video has loaded. */ }
  }
  return playlist?.[index];
}

function FavoritePlayer({ tracks, nativeTheme, audio }) {
  const [requested, setRequested] = useState({ index: 0 });
  const [playingId, setPlayingId] = useState(null);
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
        setPlayingId(null);
        audio.setFavoritePlaying(false);
      }
    }, { threshold: 0.55 });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [audio]);

  useEffect(() => {
    if (!seen) return;
    const host = slot.current;
    let disposed = false;
    const { index } = requested;
    const order = [...tracks.slice(index), ...tracks.slice(0, index)];
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
            if (disposed) return;
            target.setVolume(36);
            if (visible.current && !document.hidden) target.playVideo();
          },
          onStateChange({ data, target }) {
            if (disposed) return;
            if (data === youtube.PlayerState.PLAYING && (document.hidden || !visible.current)) {
              target.pauseVideo();
              return;
            }
            const playing = data === youtube.PlayerState.PLAYING;
            setPlayingId(playing ? currentVideoId(target) : null);
            audio.setFavoritePlaying(playing);
          },
          onError() {
            if (disposed) return;
            setPlayingId(null);
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
    // The IFrame API can update the video ID shortly after emitting PLAYING.
    const playbackSync = window.setInterval(() => {
      if (visible.current && !document.hidden && player.current?.getPlayerState?.() === 1) {
        setPlayingId(currentVideoId(player.current));
      }
    }, 700);
    return () => {
      disposed = true;
      window.clearInterval(playbackSync);
      document.removeEventListener('visibilitychange', onVisibility);
      player.current?.destroy?.();
      player.current = null;
      resumeWhenVisible.current = false;
      host.replaceChildren();
      audio.setFavoritePlaying(false);
    };
  }, [audio, seen, tracks, requested]);

  const playingIndex = tracks.findIndex(([id]) => id === playingId);

  return (
    <div className="pokemon-soundtrack__content">
      <label>
        Theme
        <select value={playingIndex >= 0 ? playingIndex : requested.index} onChange={({ target }) => {
          setPlayingId(null);
          setRequested({ index: Number(target.value) });
        }}>
          {tracks.map(([id, name], index) => <option key={id} value={index}>{name}</option>)}
        </select>
      </label>
      <div className="pokemon-soundtrack__viewport" ref={viewport}>
        <div ref={slot} className="pokemon-soundtrack__player" />
      </div>
      <p role="status">{playingIndex >= 0 ? `Now playing ${tracks[playingIndex][1]}` :
        `Battle theme · ${nativeTheme}`}{unavailable && ' · Favorites unavailable'}</p>
    </div>
  );
}
