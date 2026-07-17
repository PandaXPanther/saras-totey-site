import React, { useEffect, useState } from 'react';

const AMBIENT_AUDIO_SRC = '/ambient-fairy-fountain.ogg';
const AMBIENT_VOLUME = 0.16;
const AUDIO_KEY = '__sarasAmbientAudio';

const getAudio = () => {
  if (typeof window === 'undefined') return null;
  if (!window[AUDIO_KEY]) {
    const element = new Audio(AMBIENT_AUDIO_SRC);
    element.loop = true;
    element.preload = 'metadata';
    element.volume = AMBIENT_VOLUME;
    window[AUDIO_KEY] = element;
  }
  return window[AUDIO_KEY];
};

export default function AudioControl() {
  const [muted, setMuted] = useState(() => getAudio()?.paused ?? true);

  useEffect(() => {
    const element = getAudio();
    if (!element) return undefined;

    const sync = () => setMuted(element.paused);
    element.addEventListener('play', sync);
    element.addEventListener('pause', sync);
    sync();
    return () => { element.removeEventListener('play', sync); element.removeEventListener('pause', sync); };
  }, []);

  const toggle = async () => {
    const element = getAudio();
    if (!element) return;

    if (!element.paused) {
      element.pause();
      setMuted(true);
      return;
    }

    try {
      await element.play();
      setMuted(false);
    } catch {
      element.pause();
      setMuted(true);
    }
  };

  return (
    <div className="audio-dock">
      <button type="button" onClick={toggle} aria-label={muted ? 'Turn ambient sound on' : 'Mute ambient sound'}>
        <span className="audio-bars" aria-hidden="true"><i /><i /><i /></span>
        {muted ? 'sound off' : 'sound on'}
      </button>
    </div>
  );
}
