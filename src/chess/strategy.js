import { Chess } from 'chess.js';
import profile from './profile.json';
import { fromUci, materialBalance, moveKey, PIECE_VALUE, PLAY_ELO, positionKey, styleScore } from './model.js';

function centipawns(line) {
  if (line.kind === 'cp') return line.score;
  const sign = line.score > 0 ? 1 : -1;
  return sign * (10000 - Math.abs(line.score) * 10);
}

function expected(cp) {
  return 1 / (1 + Math.exp(-cp / 180));
}

function sacrifice(fen, line) {
  if (line.pv.length < 4) return false;
  const board = new Chess(fen);
  const color = board.turn();
  const initial = materialBalance(board, color);
  const offered = fromUci(board, line.pv[0]);
  const accepted = fromUci(board, line.pv[1]);
  if (!offered || !accepted?.captured || PIECE_VALUE[accepted.captured] < 3) return false;
  for (const uci of line.pv.slice(2, 4)) {
    if (!fromUci(board, uci)) return false;
  }
  return initial - materialBalance(board, color) >= 1.75;
}

function viableSacrifice(fen, line, best) {
  const score = expected(centipawns(line));
  const ceiling = expected(centipawns(best));
  return score >= 0.5 && ceiling < 0.97 && ceiling - score <= 0.035 && sacrifice(fen, line);
}

function unforcedKing(game, move, ply) {
  if (move.piece !== 'k' || move.captured || move.isKingsideCastle() || move.isQueensideCastle() || game.isCheck()) return false;
  const opposingMaterial = game.board().flat().reduce((total, piece) => {
    if (!piece || piece.color === move.color || piece.type === 'p') return total;
    return total + PIECE_VALUE[piece.type];
  }, 0);
  return ply < 32 && opposingMaterial >= 8;
}

export async function pickMove(engine, game, moves, random = Math.random) {
  const fen = game.fen();
  const legal = game.moves({ verbose: true });
  if (legal.length <= 1) return legal[0]?.lan;
  const ply = moves.length;
  const history = moves.map(moveKey);
  const known = profile.openings[positionKey(game)] ?? {};
  const candidates = await engine.analyze(fen, { history, lines: 6, nodes: 42000 });
  const best = candidates.lines[0];
  const weak = await engine.analyze(fen, { history, elo: PLAY_ELO, lines: 4, nodes: 24000 });
  if (!best) return weak.best;

  const indexed = new Map(candidates.lines.map((line) => [line.pv[0], line]));
  const preferred = Object.keys(known).sort((a, b) => known[b] - known[a])[0];
  if (preferred && !indexed.has(preferred) && legal.some((move) => move.lan === preferred)) {
    const { lines } = await engine.analyze(fen, { history, moves: [preferred], nodes: 15000 });
    if (lines[0]) indexed.set(preferred, lines[0]);
  }

  const tactical = candidates.lines.find((line) => viableSacrifice(fen, line, best));
  if (tactical) {
    const checked = await engine.analyze(fen, {
      history, moves: [...new Set([best.pv[0], tactical.pv[0]])], lines: 2, nodes: 95000,
    });
    const confirmed = checked.lines.find((line) => line.pv[0] === tactical.pv[0]);
    if (confirmed && viableSacrifice(fen, confirmed, checked.lines[0])) return confirmed.pv[0];
  }

  const weakScore = indexed.has(weak.best) ? centipawns(indexed.get(weak.best)) : null;
  const topScore = centipawns(best);
  const floor = weakScore === null ? topScore - 75 : Math.max(topScore - 205, weakScore - 32);
  const rated = legal.flatMap((move) => {
    const line = indexed.get(move.lan);
    const isWeak = move.lan === weak.best;
    if (!line && !isWeak) return [];
    const cp = line ? centipawns(line) : floor;
    const kingPenalty = unforcedKing(game, move, ply) && topScore - cp >= 0 ? 175 : 0;
    if (cp < floor && !isWeak) return [];
    const baseline = isWeak ? 78 : 0;
    const style = 26 * styleScore(profile.weights, move, moves.at(-1), ply);
    const opening = known[move.lan] ? 65 + 35 * Math.log2(known[move.lan]) : 0;
    const quality = Math.max(-250, Math.min(0, cp - topScore)) * 0.63;
    return [{ move, score: baseline + style + opening + quality - kingPenalty + 12 * random() }];
  });
  return rated.sort((a, b) => b.score - a.score)[0]?.move.lan ?? best.pv[0];
}

export const grades = {
  Brilliant: '✦', Great: '▲', Best: '★', Excellent: '◆', Good: '●',
  Book: '◧', Inaccuracy: '△', Mistake: '!', Miss: '×', Blunder: '××',
};

const explanations = {
  Brilliant: 'A sound sacrifice. The engine’s line gives up material and keeps the position favorable.',
  Great: 'The other options give up a significant part of your advantage.',
  Best: 'The engine found no stronger move at this depth.',
  Excellent: 'This keeps nearly all of the value of the best move.',
  Good: 'Playable, with a stronger option available.',
  Book: 'This opening move appears in the games used to train the bot.',
  Inaccuracy: 'This gives away part of the position’s value.',
  Mistake: 'This makes your position substantially worse.',
  Miss: 'There was a chance to take control of the game here.',
  Blunder: 'This changes the likely outcome of the game.',
};

function gradeMove({ move, best, played, before, loss, alternative, book }) {
  if (move.san.endsWith('#')) return 'Best';
  if (viableSacrifice(move.before, played, best)) return 'Brilliant';
  if (book && loss <= 0.04) return 'Book';
  if (move.lan === best.pv[0] || loss < 0.002) {
    if (alternative && before > 0.37 && before < 0.94 &&
        before - expected(centipawns(alternative)) >= 0.15) return 'Great';
    return 'Best';
  }
  if (loss <= 0.022) return 'Excellent';
  if (loss <= 0.06) return 'Good';
  if (before >= 0.77 && before - loss < 0.64 && centipawns(best) - centipawns(played) >= 95) return 'Miss';
  if (loss <= 0.115) return 'Inaccuracy';
  if (loss <= 0.21) return 'Mistake';
  return 'Blunder';
}

export async function reviewMove(engine, move, history) {
  const { lines } = await engine.analyze(move.before, { history, lines: 3, nodes: 54000 });
  let [best, alternative] = lines;
  let played = lines.find((line) => line.pv[0] === move.lan);
  if (!played) {
    const forced = await engine.analyze(move.before, { history, moves: [move.lan], nodes: 30000 });
    played = forced.lines[0];
  }
  if (!best || !played) throw new Error('Stockfish did not return a review line');
  if (centipawns(played) > centipawns(best)) {
    alternative = best;
    best = played;
  }

  const before = expected(centipawns(best));
  const after = expected(centipawns(played));
  const loss = Math.max(0, before - after);
  const board = new Chess(move.before);
  const book = Boolean(profile.openingMoves[positionKey(board)]?.[move.lan]);
  const grade = gradeMove({ move, best, played, before, loss, alternative, book });
  const continuation = [];
  for (const uci of best.pv.slice(0, 8)) {
    const next = fromUci(board, uci);
    if (!next) break;
    continuation.push(next);
  }
  const whiteScore = (score) => move.color === 'w' ? score : -score;
  const checkmate = move.san.endsWith('#');
  const scoreFor = (line, mates) => mates
    ? { kind: 'checkmate', score: whiteScore(1) }
    : { kind: line.kind, score: whiteScore(line.kind === 'mate' && line.score > 0 ? Math.max(1, line.score - 1) : line.score) };
  const missedMate = best.kind === 'mate' && best.score > 0 && (played.kind !== 'mate' || played.score <= 0);
  const explanation = checkmate ? 'This move ends the game by checkmate.'
    : missedMate ? 'There was a forced mate here. Follow the best line to see it.'
      : explanations[grade];

  return {
    grade, loss, continuation, explanation,
    bestMove: continuation[0]?.san ?? best.pv[0],
    suggested: continuation[0]?.lan,
    evaluation: scoreFor(played, checkmate),
    bestEvaluation: scoreFor(best, continuation[0]?.san.endsWith('#')),
    bestWhiteChance: move.color === 'w' ? before : 1 - before,
    whiteChance: checkmate ? Number(move.color === 'w') : (move.color === 'w' ? after : 1 - after),
    accuracy: Math.max(0, 103.5 * Math.exp(-4.4 * loss) - 3.5),
  };
}
