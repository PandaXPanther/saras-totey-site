// This frame runs the hosted Pokémon Showdown renderer in its own sandbox.
(() => {
  const send = (type, values) => parent.postMessage({ type: `pokemon-arena:${type}`, ...values }, '*');
  const arena = document.querySelector('#arena');
  let version = 0;

  try {
    const battle = new Battle({
      $frame: $('.battle'),
      $logFrame: $('.battle-log'),
      paused: false,
      autoresize: true,
    });
    battle.setMute(true);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) battle.scene.animationOff();

    function rendered() {
      send('rendered', { version, turn: battle.turn });
    }

    battle.subscribe((event) => {
      if (event === 'atqueueend' || event === 'ended') rendered();
      if (event === 'error') send('failed');
    });

    addEventListener('message', ({ source, data }) => {
      if (source !== parent || !data) return;
      if (data.type === 'pokemon-arena:commands') {
        version = data.version;
        battle.addBatch(data.commands);
        if (battle.atQueueEnd) rendered();
      }
      if (data.type === 'pokemon-arena:sound') battle.setMute(!data.on);
      if (data.type === 'pokemon-arena:theme' && ['arcade', 'night', 'classic'].includes(data.theme)) {
        arena.dataset.theme = data.theme;
        arena.dataset.bounce = String(data.portraitBounce === true);
      }
    });

    new ResizeObserver(() => send('height', { height: arena.offsetHeight })).observe(arena);
    send('ready');
  } catch (error) {
    console.error(error);
    send('failed');
  }
})();
