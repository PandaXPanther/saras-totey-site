// This frame runs the hosted Pokémon Showdown renderer in its own sandbox.
(() => {
  const send = (type, values) => parent.postMessage({ type: `pokemon-arena:${type}`, ...values }, '*');
  const arena = document.querySelector('#arena');
  const field = arena.querySelector('.battlefield');
  const sparks = arena.querySelector('.shuckle-sparks');
  const chat = arena.querySelector('.battle-feed__callout');
  const message = chat.querySelector('[data-banter]');
  const feed = arena.querySelector('.battle-feed');
  const history = arena.querySelector('.battle-chat__history');
  const input = arena.querySelector('.battle-chat__compose input');
  const log = arena.querySelector('#battle-log');
  const chatPanel = arena.querySelector('#battle-chat');
  const viewButtons = [...arena.querySelectorAll('.battle-feed__views button')];
  let version = 0;
  let openingShuckle = false;
  let playedOpening = false;
  let pendingChat = '';
  let saidHazards = false;
  let lastQuipTurn = -3;
  let lastReply = -Infinity;
  let replyNumber = 0;

  function appendChat(author, line, mine = false) {
    const entry = document.createElement('div');
    const label = document.createElement('strong');
    const body = document.createElement('div');
    entry.className = mine ? 'battle-chat__message battle-chat__message--mine' : 'battle-chat__message';
    label.textContent = author;
    body.textContent = line;
    entry.append(label, body);
    history.append(entry);
    if (history.childElementCount > 50) history.firstElementChild.remove();
    history.scrollTop = history.scrollHeight;
  }

  function say(line) {
    chat.hidden = false;
    message.textContent = line;
    appendChat('Totally Real Saras', line);
  }

  for (const button of viewButtons) {
    button.addEventListener('click', () => {
      const showChat = button.dataset.feedView === 'chat';
      feed.dataset.feedView = button.dataset.feedView;
      log.hidden = showChat;
      chatPanel.hidden = !showChat;
      for (const option of viewButtons) option.setAttribute('aria-pressed', String(option === button));
      if (showChat) history.scrollTop = history.scrollHeight;
      else log.scrollTop = log.scrollHeight;
    });
  }

  function sendChat() {
    const line = input.value.trim();
    if (!line) return;
    appendChat('You', line, true);
    input.value = '';
    if (performance.now() - lastReply < 1300) return;
    const replies = ['aight bet', 'we’ll see', 'lmao'];
    const response = /\b(gg|good game|well played)\b/i.test(line) ? 'gg' :
      /\b(glhf|good luck)\b/i.test(line) ? 'glhf' :
      /\b(shuckle|webs|rocks)\b/i.test(line) ? 'shuckle stays' : replies[replyNumber++ % replies.length];
    lastReply = performance.now();
    say(response);
  }

  arena.querySelector('.battle-chat__compose button').addEventListener('click', sendChat);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      sendChat();
    }
  });

  // Kodama's mirror-mode fallback uses short lowercase messages with minimal punctuation.
  function queueBanter(commands, turn) {
    if (commands.some((line) => /^\|(win\||tie\b)/.test(line))) {
      pendingChat = 'gg';
      return;
    }
    const hazard = commands.find((line) => /^\|move\|p2a: Saras' Shuckle\|(Sticky Web|Stealth Rock)\|/.test(line));
    if (hazard && !saidHazards) {
      pendingChat = hazard.includes('Sticky Web') ? 'nah ur stuck now' : 'enjoy the rocks';
      saidHazards = true;
      lastQuipTurn = turn;
      return;
    }
    if (turn < lastQuipTurn + 3) return;
    const knockout = commands.find((line) => /^\|faint\|p[12]a:/.test(line));
    if (knockout) {
      pendingChat = knockout.startsWith('|faint|p1a:') ? 'oh thats tough' : 'aight u got that';
      lastQuipTurn = turn;
    }
  }

  try {
    const battle = new Battle({
      $frame: $('.battle'),
      $logFrame: $('.battle-log'),
      paused: false,
      autoresize: true,
    });
    BattleSound.setBgmVolume(0);
    BattleSound.setEffectVolume(40);
    battle.setMute(true);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) battle.scene.animationOff();

    function shinyEntrance(sprite) {
      if (!openingShuckle || playedOpening) return;
      playedOpening = true;
      if (sprite) {
        const bounds = sprite.getBoundingClientRect();
        const stage = field.getBoundingClientRect();
        sparks.style.setProperty('--shiny-x', `${bounds.left - stage.left + bounds.width / 2}px`);
        sparks.style.setProperty('--shiny-y', `${bounds.top - stage.top + bounds.height / 2}px`);
      }
      sparks.dataset.active = 'true';
      say('glhf');
      send('shiny-entrance');
    }

    const summonObserver = new MutationObserver(() => {
      if (!openingShuckle || playedOpening) return;
      const sprite = field.querySelector('.battle img[src*="shiny"][src*="shuckle"]');
      if (sprite) {
        shinyEntrance(sprite);
        summonObserver.disconnect();
      }
    });
    summonObserver.observe(field, { childList: true, subtree: true });

    function rendered() {
      shinyEntrance();
      if (playedOpening) summonObserver.disconnect();
      if (pendingChat) {
        say(pendingChat);
        pendingChat = '';
      }
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
        queueBanter(data.commands, battle.turn);
        if (!playedOpening) {
          openingShuckle ||= data.commands.some((line) => line.startsWith("|switch|p2a: Saras' Shuckle|") && line.includes(', shiny|'));
        }
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
