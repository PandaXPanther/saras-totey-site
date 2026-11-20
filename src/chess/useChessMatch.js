import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { createEngine } from './engine.js';
import { fromUci, opposite, resultFor } from './model.js';
import { pickMove } from './strategy.js';
import { botName, moveBanter, openingChat, replyTo } from './banter.js';

export const timeControls = {
  blitz: { name: '5 + 3 Blitz', minutes: 5, increment: 3 },
  rapid: { name: '10 min Rapid', minutes: 10, increment: 0 },
  untimed: { name: 'Untimed', minutes: 0, increment: 0 },
};

export function timeLeft(clock, color, now) {
  return Math.max(0, clock[color] - (clock.active === color ? now - clock.started : 0));
}

export function useChessMatch(player, control) {
  const { minutes, increment } = timeControls[control];
  const rules = useRef(null);
  if (!rules.current) rules.current = new Chess();
  const engine = useRef(null);
  const history = useRef([]);
  const time = useRef({ w: minutes * 60000, b: minutes * 60000, active: null, started: 0 });
  const ended = useRef(false);
  const chatState = useRef({ lastMove: -8, lastReply: -Infinity, replies: 0 });
  const [moves, setMoves] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [chat, setChat] = useState(openingChat);
  const [, refreshClock] = useState(0);

  function appendChat(author, text) {
    setChat((rows) => [...rows.slice(-49), { author, text }]);
  }

  function sendChat(text) {
    const trimmed = text.trim().slice(0, 140);
    if (!trimmed) return;
    appendChat('You', trimmed);
    const state = chatState.current;
    if (ended.current || performance.now() - state.lastReply < 1300) return;
    appendChat(botName, replyTo(trimmed, state.replies++));
    state.lastReply = performance.now();
  }

  function pauseClock() {
    const clock = time.current;
    if (clock.active) {
      clock[clock.active] = timeLeft(clock, clock.active, performance.now());
      clock.active = null;
    }
  }

  function fail() {
    pauseClock();
    setError(true);
  }

  function finish(result) {
    if (ended.current) return;
    ended.current = true;
    pauseClock();
    setOutcome(result);
    appendChat(botName, 'gg');
  }

  function flag(color) {
    const winner = opposite(color);
    const material = rules.current.board().flat().filter((piece) => piece?.color === winner);
    // A lone king has no mating material against any legal arrangement of the board.
    finish(material.length === 1 ? { winner: null, reason: 'Time and insufficient material' } : { winner, reason: 'Time' });
  }

  function play(uci, actor) {
    const board = rules.current;
    if (!ready || ended.current || board.turn() !== actor) return false;
    const stamp = performance.now();
    const clock = time.current;
    const remaining = timeLeft(clock, actor, stamp);
    if (clock.active === actor && remaining <= 0) {
      flag(actor);
      return false;
    }
    const move = fromUci(board, uci);
    if (!move) return false;

    history.current = [...history.current, move];
    if (minutes) {
      clock[actor] = remaining + increment * 1000;
      clock.active = board.turn();
      clock.started = stamp;
    }
    setMoves(history.current);
    const result = resultFor(board);
    if (result) {
      finish(result);
    } else {
      const ply = history.current.length;
      const quip = moveBanter(move, player, ply);
      if (quip && (move.captured === 'q' || move.promotion || ply - chatState.current.lastMove >= 7)) {
        chatState.current.lastMove = ply;
        appendChat(botName, quip);
      }
    }
    return true;
  }

  useEffect(() => {
    let disposed = false;
    let session;
    try {
      session = createEngine();
      engine.current = session;
      session.ready.then(() => {
        if (disposed) return;
        if (minutes) {
          time.current.active = 'w';
          time.current.started = performance.now();
        }
        setReady(true);
      }).catch(() => { if (!disposed) fail(); });
    } catch {
      fail();
    }
    return () => {
      disposed = true;
      session?.close();
    };
  }, [minutes]);

  useEffect(() => {
    if (!ready || !minutes || outcome || error) return;
    const interval = setInterval(() => {
      const now = performance.now();
      const active = time.current.active;
      if (active && timeLeft(time.current, active, now) <= 0) flag(active);
      else refreshClock(now);
    }, 150);
    return () => clearInterval(interval);
  }, [ready, minutes, outcome, error]);

  const turn = moves.length % 2 === 0 ? 'w' : 'b';
  useEffect(() => {
    if (!ready || outcome || error || turn === player) return;
    let stale = false;
    const session = engine.current;
    pickMove(session, new Chess(rules.current.fen()), moves)
      .then((uci) => {
        if (!stale && !ended.current && !play(uci, turn) && !ended.current) fail();
      })
      .catch(() => { if (!stale && !ended.current) fail(); });
    return () => { stale = true; };
  }, [moves, ready, outcome, error, player, turn]);

  const now = performance.now();
  return {
    moves, outcome, ready, error, chat, sendChat, turn,
    clocks: minutes ? { w: timeLeft(time.current, 'w', now), b: timeLeft(time.current, 'b', now) } : null,
    play: (uci) => play(uci, player),
    resign: () => finish({ winner: opposite(player), reason: 'Resignation' }),
  };
}
