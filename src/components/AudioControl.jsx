import React, { useEffect, useRef, useState } from 'react';

const VIDEO_ID = 'Tn8F7M5BH2s';

export default function AudioControl() {
  const frame = useRef(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin === 'https://www.youtube.com') setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const command = (func, args = []) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
  };

  const toggle = () => {
    command('playVideo');
    command('setVolume', [16]);
    command(muted ? 'unMute' : 'mute');
    setMuted((value) => !value);
    setReady(true);
  };

  return (
    <div className="audio-dock">
      <iframe
        ref={frame}
        className="audio-source"
        src={`https://www.youtube.com/embed/${VIDEO_ID}?enablejsapi=1&autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&playsinline=1`}
        title="Ambient background music"
        allow="autoplay"
        tabIndex="-1"
      />
      <button type="button" onClick={toggle} aria-label={muted ? 'Turn ambient sound on' : 'Mute ambient sound'}>
        <span className="audio-bars" aria-hidden="true"><i /><i /><i /></span>
        {muted ? (ready ? 'sound off' : 'tap for sound') : 'sound on'}
      </button>
    </div>
  );
}
