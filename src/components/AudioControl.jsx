import React, { useEffect, useRef, useState } from 'react';

const AMBIENT_AUDIO_SRC = '/ambient-fairy-fountain.ogg';
const AMBIENT_VOLUME = 0.16;

export default function AudioControl() {
  const audio = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const element = audio.current;
    if (!element) return undefined;

    element.volume = AMBIENT_VOLUME;
    element.pause();
    element.muted = false;
    return undefined;
  }, []);

  const toggle = async () => {
    const element = audio.current;
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
      <audio
        ref={audio}
        className="audio-source"
        src={AMBIENT_AUDIO_SRC}
        loop
        preload="metadata"
        aria-hidden="true"
        onPlay={() => setMuted(false)}
        onPause={() => setMuted(true)}
      />
      <button type="button" onClick={toggle} aria-label={muted ? 'Turn ambient sound on' : 'Mute ambient sound'}>
        <span className="audio-bars" aria-hidden="true"><i /><i /><i /></span>
        {muted ? 'sound off' : 'sound on'}
      </button>
    </div>
  );
}
