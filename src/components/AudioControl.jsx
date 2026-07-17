import React, { useEffect, useRef, useState } from 'react';

const AMBIENT_AUDIO_SRC = '/ambient-fairy-fountain.ogg';
const AMBIENT_VOLUME = 0.16;

export default function AudioControl() {
  const audio = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = audio.current;
    if (!element) return undefined;

    element.volume = AMBIENT_VOLUME;
    element.muted = true;

    const startMutedPlayback = () => {
      element.play().catch(() => {
        // The button remains available when the browser requires an explicit click.
      });
    };

    const interactionEvents = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel'];
    const removeInteractionListeners = () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, startMutedPlayback);
      });
    };

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, startMutedPlayback, { passive: true, once: true });
    });

    startMutedPlayback();

    return removeInteractionListeners;
  }, []);

  const toggle = async () => {
    const element = audio.current;
    if (!element) return;

    if (!element.muted) {
      element.muted = true;
      setMuted(true);
      return;
    }

    element.muted = false;
    setMuted(false);

    try {
      await element.play();
    } catch {
      element.muted = true;
      setMuted(true);
    }
  };

  return (
    <div className="audio-dock">
      <audio
        ref={audio}
        className="audio-source"
        src={AMBIENT_AUDIO_SRC}
        loop
        muted={muted}
        autoPlay
        preload="auto"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      />
      <button type="button" onClick={toggle} aria-label={muted ? 'Turn ambient sound on' : 'Mute ambient sound'}>
        <span className="audio-bars" aria-hidden="true"><i /><i /><i /></span>
        {muted ? (playing ? 'sound off' : 'tap for sound') : 'sound on'}
      </button>
    </div>
  );
}
