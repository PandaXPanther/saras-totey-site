import React, { useEffect, useState } from 'react';

const AMBIENT_AUDIO_SRC = '/ambient-fairy-fountain.ogg';
const AMBIENT_VOLUME = 0.16;
const AUDIO_KEY = '__sarasAmbientAudio';
const AUDIO_GRAPH_KEY = '__sarasAmbientAudioGraph';

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

const getAudioGraph = () => {
  if (typeof window === 'undefined') return null;
  if (window[AUDIO_GRAPH_KEY]) return window[AUDIO_GRAPH_KEY];

  const element = getAudio();
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!element || !AudioContext) return null;

  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.72;
  const source = context.createMediaElementSource(element);
  source.connect(analyser);
  analyser.connect(context.destination);
  window[AUDIO_GRAPH_KEY] = { context, analyser };
  return window[AUDIO_GRAPH_KEY];
};

export const readAmbientFrequencyData = (target) => {
  const element = getAudio();
  const graph = typeof window === 'undefined' ? null : window[AUDIO_GRAPH_KEY];
  if (!element || element.paused || !graph || graph.context.state !== 'running') return false;
  graph.analyser.getByteFrequencyData(target);
  return true;
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
      const graph = getAudioGraph();
      if (graph?.context.state === 'suspended') await graph.context.resume();
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
