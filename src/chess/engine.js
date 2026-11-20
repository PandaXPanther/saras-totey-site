const engineUrl = '/chess-engine/stockfish-19-lite-single.js';

export function parseInfo(line) {
  const match = /^info depth (\d+).*?\bmultipv (\d+) score (cp|mate) (-?\d+)(.*?)\bpv (\S.*)$/.exec(line);
  if (!match || /\b(?:lowerbound|upperbound)\b/.test(match[5])) return null;
  return { depth: Number(match[1]), rank: Number(match[2]), kind: match[3], score: Number(match[4]), pv: match[6].split(/\s+/) };
}

export function createEngine() {
  const worker = new Worker(engineUrl);
  let pending;
  let closed = false;

  function settle(error, value) {
    if (!pending) return;
    const { resolve, reject, timeout } = pending;
    pending = undefined;
    clearTimeout(timeout);
    if (error) reject(error);
    else resolve(value);
  }

  function close(error = new Error('Engine stopped')) {
    if (closed) return;
    closed = true;
    worker.terminate();
    settle(error);
  }

  function exchange(wait, send) {
    if (closed || pending) return Promise.reject(new Error('Engine unavailable'));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => close(new Error('Stockfish timed out')), 20000);
      pending = { wait, resolve, reject, timeout, lines: new Map() };
      send();
    });
  }

  worker.onmessage = ({ data }) => {
    if (!pending || typeof data !== 'string') return;
    const line = data.trim();
    if (pending.wait === 'bestmove') {
      const info = parseInfo(line);
      if (info) {
        const rows = pending.lines.get(info.depth) ?? new Map();
        rows.set(info.rank, info);
        pending.lines.set(info.depth, rows);
      }
      if (line.startsWith('bestmove ')) {
        const depths = [...pending.lines.values()].filter((rows) => rows.has(1));
        const last = depths.at(-1);
        const previous = depths.at(-2);
        const complete = (previous?.size ?? 0) > (last?.size ?? 0) ? previous : last;
        const lines = [...(complete?.values() ?? [])].sort((a, b) => a.rank - b.rank);
        settle(null, { best: line.split(/\s+/)[1], lines });
      }
    } else if (line === pending.wait) {
      settle(null);
    }
  };
  worker.onerror = () => close(new Error('Stockfish could not load'));

  const post = (command) => worker.postMessage(command);
  const ready = exchange('uciok', () => post('uci')).then(() => exchange('readyok', () => post('isready')));
  // A closed session can be discarded while startup is still underway.
  ready.catch(() => {});

  return {
    ready,
    close,
    async analyze(fen, { elo, lines = 1, nodes = 42000, moves, history } = {}) {
      await ready;
      return exchange('bestmove', () => {
        post('setoption name UCI_LimitStrength value ' + Boolean(elo));
        if (elo) post('setoption name UCI_Elo value ' + elo);
        post('setoption name MultiPV value ' + lines);
        post(history?.length ? 'position startpos moves ' + history.join(' ') : 'position fen ' + fen);
        post('go nodes ' + nodes + (moves ? ' searchmoves ' + moves.join(' ') : ''));
      });
    },
  };
}
