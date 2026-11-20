import { suspendAmbientForBattle } from './AudioControl.jsx';

export function createBattleAudio(theme) {
  const restoreAmbient = suspendAmbientForBattle();
  const music = new Audio(theme);
  music.volume = 0.20;
  music.loop = true;
  const Context = window.AudioContext || window.webkitAudioContext;
  let context;
  let enabled = true;
  let closed = false;

  function unlockEffects() {
    if (!Context) return;
    try {
      context ||= new Context();
      if (context.state === 'suspended') void context.resume().catch(() => {});
    } catch { /* Audio effects are optional on this device. */ }
  }

  function syncMusic() {
    if (closed || !enabled) music.pause();
    else void music.play().catch(() => {});
  }

  unlockEffects();
  syncMusic();

  return {
    setEnabled(value) {
      enabled = value;
      if (value) unlockEffects();
      syncMusic();
    },
    setTheme(url) {
      music.src = url;
      syncMusic();
    },
    playShiny() {
      if (!enabled || closed || context?.state !== 'running') return;
      const start = context.currentTime;
      // A short original glassy chord, timed to the opening sparkle.
      [659.25, 987.77, 1318.51, 1975.53].forEach((frequency, index) => {
        const at = start + index * 0.038;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.001, at);
        gain.gain.exponentialRampToValueAtTime(0.16 / (1 + index * 0.40), at + 0.013);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.33);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.35);
      });
    },
    close() {
      if (closed) return;
      closed = true;
      music.pause();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      restoreAmbient();
    },
  };
}
