export const PIECE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
export const PIECE_VALUE = { p: 1, n: 3, b: 3.25, r: 5, q: 9, k: 0 };
export const MATERIAL_VALUE = { ...PIECE_VALUE, b: 3 };
export const PLAY_ELO = 1750;

export const moveKey = (move) => move.lan;
export const positionKey = (game) => game.fen().split(' ').slice(0, 4).join(' ');
export const turnName = (color) => color === 'w' ? 'white' : 'black';
export const opposite = (color) => color === 'w' ? 'b' : 'w';

const featureNames = [
  'capture', 'recapture', 'check', 'castle', 'king', 'centralPawn', 'flankPawn',
  'developKnight', 'developBishop', 'earlyQueen', 'lateRook', 'pawnPush',
];

export function moveFeatures(move, previous, ply) {
  const opening = ply < 20;
  const fromHome = move.from[1] === (move.color === 'w' ? '1' : '8');
  const castle = move.isKingsideCastle() || move.isQueensideCastle();
  return [
    Boolean(move.captured),
    Boolean(move.captured && previous?.to === move.to),
    /[+#]$/.test(move.san),
    castle,
    move.piece === 'k' && !castle,
    opening && move.piece === 'p' && /[cdef]/.test(move.from[0]),
    opening && move.piece === 'p' && /[abgh]/.test(move.from[0]),
    opening && fromHome && move.piece === 'n',
    opening && fromHome && move.piece === 'b',
    opening && move.piece === 'q',
    !opening && move.piece === 'r',
    !opening && move.piece === 'p' && !move.captured,
  ].map(Number);
}

function logOdds(sums, count) {
  return sums.map((sum) => Math.log((sum + 12) / (count - sum + 12)));
}

export function fitPreferences(examples) {
  const played = featureNames.map(() => 0);
  const available = featureNames.map(() => 0);
  for (const { actual, legal } of examples) {
    actual.forEach((value, index) => { played[index] += value; });
    for (const features of legal) {
      features.forEach((value, index) => { available[index] += value / legal.length; });
    }
  }
  const baseline = logOdds(available, examples.length);
  return logOdds(played, examples.length).map((value, index) =>
    Math.round(1000 * Math.max(-1, Math.min(1, value - baseline[index]))) / 1000);
}

export function styleScore(weights, move, previous, ply) {
  const features = moveFeatures(move, previous, ply);
  return features.reduce((score, feature, index) => score + feature * weights[index], 0);
}

export function materialBalance(game, color, values = PIECE_VALUE) {
  return game.board().flat().reduce((total, piece) => {
    if (!piece) return total;
    return total + values[piece.type] * (piece.color === color ? 1 : -1);
  }, 0);
}

export function fromUci(game, uci) {
  if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null;
  try {
    return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  } catch {
    return null;
  }
}

export function resultFor(game) {
  if (game.isCheckmate()) return { winner: opposite(game.turn()), reason: 'Checkmate' };
  if (game.isStalemate()) return { winner: null, reason: 'Stalemate' };
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'Threefold repetition' };
  if (game.isInsufficientMaterial()) return { winner: null, reason: 'Insufficient material' };
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: 'Fifty-move rule' };
  return null;
}
