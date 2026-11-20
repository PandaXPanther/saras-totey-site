import { cardRank, cardSuit, DECK, handCategory, handScore, leadingRank } from './cards.js';
import { BIG_BLIND, otherSeat } from './table.js';

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const MADE_STRENGTH = [0, 0, 0.69, 0.76, 0.85, 0.90, 0.96, 0.98, 1];

function startingStrength(cards) {
  const [high, low] = cards.map(cardRank).sort((a, b) => b - a);
  if (high === low) return 0.56 + (high - 2) * 0.036;
  const suited = cardSuit(cards[0]) === cardSuit(cards[1]);
  const connected = Math.max(0, 4 - (high - low)) * 0.017;
  return 0.12 + (high - 2) * 0.038 + (low - 2) * 0.026 + (suited ? 0.075 : 0) + connected;
}

function drawStrength(cards, board) {
  if (!board.length || board.length === 5) return 0;
  const suits = [0, 0, 0, 0];
  let rankMask = 0;
  for (const card of [...cards, ...board]) {
    suits[cardSuit(card)]++;
    rankMask |= 1 << cardRank(card);
  }
  const flush = cards.some((card) => suits[cardSuit(card)] === 4);
  if (rankMask & (1 << 14)) rankMask |= 1 << 1;
  let straightOuts = 0;
  for (let low = 1; low <= 10; low++) {
    const window = 31 << low;
    const missing = window & ~rankMask;
    if (missing && !(missing & (missing - 1)) &&
        cards.some((card) => (window & (1 << cardRank(card))) || (low === 1 && cardRank(card) === 14))) {
      straightOuts |= missing;
    }
  }
  const open = Boolean(straightOuts & (straightOuts - 1));
  return (flush ? 0.17 : 0) + (open ? 0.13 : straightOuts ? 0.06 : 0);
}

function madeStrength(cards, score, boardHigh) {
  const kind = handCategory(score);
  if (kind >= 2) return MADE_STRENGTH[kind];
  if (kind === 1 && cards.some((card) => cardRank(card) === leadingRank(score))) {
    return leadingRank(score) >= boardHigh ? 0.59 : 0.37;
  }
  return cards.some((card) => cardRank(card) === 14) ? 0.24 : 0.14;
}

const isAggressive = ({ type }) => type === 'raise' || type === 'bet';

function opponentRange(view, unseen) {
  const opponent = otherSeat(view.seat);
  const theirActions = view.log.filter(({ seat }) => seat === opponent);
  const preRaises = theirActions.filter((entry) => entry.phase === 'preflop' && isAggressive(entry)).length;
  const lastPressure = theirActions.findLast((entry) => entry.phase === view.phase && isAggressive(entry));
  const pressure = lastPressure && view.board.length
    ? clamp(lastPressure.amount / Math.max(BIG_BLIND, lastPressure.potBefore), 0.35, 2)
    : 0;
  const high = Math.max(0, ...view.board.map(cardRank));
  const allowDraws = view.board.length > 0 && view.board.length < 5 && pressure > 0;
  const candidates = [];
  let mass = 0;

  for (let first = 0; first < unseen.length - 1; first++) {
    for (let second = first + 1; second < unseen.length; second++) {
      const cards = [unseen[first], unseen[second]];
      const start = startingStrength(cards);
      const score = view.board.length ? handScore([...cards, ...view.board]) : 0;
      const made = view.board.length ? madeStrength(cards, score, high) : start;
      const draw = allowDraws ? drawStrength(cards, view.board) : 0;
      const preWeight = preRaises ? 0.28 + 2 * start ** Math.min(preRaises + 1, 4) : 1;
      const nowWeight = pressure > 0 ? 0.34 + (3 + pressure) * (made + draw) ** 2 : 1;
      const weight = preWeight * nowWeight;
      mass += weight;
      candidates.push({ cards, score, weight, mass, callWeight: 0.23 + 2.2 * made ** 2 });
    }
  }
  return candidates;
}

function drawOpponent(candidates, random) {
  const target = random() * candidates.at(-1).mass;
  let low = 0;
  let high = candidates.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (target < candidates[middle].mass) high = middle;
    else low = middle + 1;
  }
  return candidates[low];
}

function comparison(first, second) {
  return first === second ? 0.5 : Number(first > second);
}

export function equityEstimate(view, random = Math.random, samples = 420) {
  const known = [...view.cards, ...view.board];
  const unseen = DECK.filter((card) => !known.includes(card));
  const candidates = opponentRange(view, unseen);
  let won = 0;
  let mass = 0;
  let calledWon = 0;
  let calledMass = 0;

  function tally(share, weight, callWeight) {
    won += share * weight;
    mass += weight;
    calledWon += share * weight * callWeight;
    calledMass += weight * callWeight;
  }

  if (view.board.length === 5) {
    const ours = handScore(known);
    for (const { score, weight, callWeight } of candidates) tally(comparison(ours, score), weight, callWeight);
  } else {
    for (let sample = 0; sample < samples; sample++) {
      const { cards, callWeight } = drawOpponent(candidates, random);
      const remaining = unseen.filter((card) => !cards.includes(card));
      const board = [...view.board];
      while (board.length < 5) {
        const index = Math.floor(random() * remaining.length);
        board.push(remaining[index]);
        const last = remaining.pop();
        if (index < remaining.length) remaining[index] = last;
      }
      tally(comparison(handScore([...view.cards, ...board]), handScore([...cards, ...board])), 1, callWeight);
    }
  }
  return { share: won / mass, called: calledWon / calledMass };
}

function foldTendency(view) {
  const opponent = otherSeat(view.seat);
  const faced = [...view.previousActions, ...view.log.filter((entry) => entry.seat === opponent)]
    .filter((entry) => entry.facing >= BIG_BLIND && entry.facing >= 0.32 * entry.potBefore);
  const folded = faced.filter(({ type }) => type === 'fold').length;
  return (3.2 + folded) / (8 + faced.length);
}

function blockerStrength(cards, board) {
  const suits = [0, 0, 0, 0];
  for (const card of board) suits[cardSuit(card)]++;
  if (cards.some((card) => cardRank(card) === 14 && suits[cardSuit(card)] >= 3)) return 0.11;
  return cards.some((card) => cardRank(card) >= 13) ? 0.04 : 0;
}

function preferredBet(view, equity, random) {
  const { legal, seat, street, board, phase, pot, cards } = view;
  const opponent = otherSeat(seat);
  const inPosition = seat === view.dealer;
  const draws = drawStrength(cards, board);
  const blockers = blockerStrength(cards, board);
  const folded = foldTendency(view);
  const lastRaises = view.log.filter((entry) => entry.phase === phase && isAggressive(entry)).length;
  const callEdge = phase === 'river' || legal.maxTo === null ? 0 : (inPosition ? 0.024 : 0.052);
  const implied = legal.maxTo !== null && phase !== 'river' ? draws * 0.16 : 0;
  const callValue = (equity.share - callEdge + implied) * (pot + legal.toCall) - legal.toCall;
  const passive = legal.toCall ? (callValue >= 0 ? { type: 'call' } : { type: 'fold' }) : { type: 'check' };
  if (legal.maxTo === null) return passive;

  if (phase === 'preflop' && lastRaises === 0) {
    const playability = startingStrength(cards);
    const open = inPosition ? equity.share > 0.515 || random() < playability * 0.34
      : equity.share > 0.57 || (playability > 0.51 && random() < 0.27);
    if (open) return { type: 'raise', to: clamp(inPosition ? 25 : 35, legal.minTo, legal.maxTo) };
    if (inPosition && equity.share < 0.40 && random() < 0.36) return { type: 'fold' };
    return passive;
  }

  const value = equity.called > (phase === 'preflop' ? 0.54 : 0.53);
  const semi = draws >= 0.06 && equity.share >= 0.30 && random() < (inPosition ? 0.76 : 0.61);
  const bluff = equity.share < 0.43 && folded > 0.24 && lastRaises < 2 &&
    random() < (blockers + (inPosition ? 0.16 : 0.09) + Math.max(0, folded - 0.38));
  if (!value && !semi && !bluff) return passive;
  if (value && lastRaises === 0 && equity.share > 0.83 && !inPosition && random() < 0.11) return passive;

  const sizes = phase === 'preflop' ? [0.75, 1.13] : [0.46, 0.76, 1.12, 1.45];
  const potAfterCall = pot + legal.toCall;
  const targets = new Set(sizes.map((size) => clamp(
    legal.largest + Math.round(potAfterCall * size), legal.minTo, legal.maxTo,
  )));
  const passiveValue = Math.max(0, legal.toCall ? callValue : equity.share * pot * (inPosition ? 0.88 : 0.78));
  let best = passive;
  let bestValue = passiveValue;

  for (const to of targets) {
    const cost = to - street[seat];
    const opponentCall = to - street[opponent];
    const pressure = opponentCall / Math.max(BIG_BLIND, potAfterCall);
    const foldChance = clamp(folded + 0.24 * (pressure - 0.53) + blockers * 0.6 -
      (legal.toCall ? 0.13 : 0) - lastRaises * 0.08, 0.07, 0.84);
    const calledValue = equity.called * (pot + cost + opponentCall) - cost;
    const futureRisk = phase === 'river' ? 0 : 0.045 * cost * (value ? 1 : 2);
    const variation = (random() - 0.45) * pot * (semi || bluff ? 0.16 : 0.07);
    const edge = foldChance * pot + (1 - foldChance) * calledValue - futureRisk + variation;
    if (edge > bestValue) {
      best = { type: 'raise', to };
      bestValue = edge;
    }
  }
  return best;
}

export function pickPokerAction(view, random = Math.random, samples) {
  const equity = equityEstimate(view, random, samples);
  return preferredBet(view, equity, random);
}
