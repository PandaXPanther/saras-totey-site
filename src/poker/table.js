import { handRank, shuffledDeck } from './cards.js';

export const HUMAN = 0;
export const BOT = 1;
export const STARTING_STACK = 1000;
export const SMALL_BLIND = 5;
export const BIG_BLIND = 10;
export const PHASE_NAMES = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
const phases = Object.keys(PHASE_NAMES);

export const otherSeat = (seat) => 1 - seat;
export const potSize = (hand) => hand.outcome?.pot ?? hand.committed[0] + hand.committed[1];

function pay(state, player, chips) {
  state.stacks[player] -= chips;
  state.street[player] += chips;
  state.committed[player] += chips;
}

function dealStreet(state) {
  const next = phases.indexOf(state.phase) + 1;
  state.phase = phases[next];
  state.deck.shift();
  state.board.push(...state.deck.splice(0, next === 1 ? 3 : 1));
  state.street = [0, 0];
  state.lastRaise = BIG_BLIND;
  state.pending = [otherSeat(state.dealer), state.dealer];
  state.log.push({ type: 'street', phase: state.phase });
}

function settle(state, reason, folded) {
  const ranks = reason === 'showdown' ? state.hole.map((cards) => handRank([...cards, ...state.board])) : null;
  const winner = ranks
    ? (ranks[0].score === ranks[1].score ? null : Number(ranks[1].score > ranks[0].score))
    : otherSeat(folded);
  const matched = Math.min(...state.committed);
  const pot = matched * 2;
  for (const seat of [HUMAN, BOT]) {
    const refund = state.committed[seat] - matched;
    const award = winner === null ? matched : (winner === seat ? pot : 0);
    state.stacks[seat] += refund + award;
  }
  state.actor = null;
  state.pending = [];
  state.outcome = { reason, winner, pot, ranks };
  return state;
}

function progress(state) {
  const largest = Math.max(...state.street);
  state.pending = state.pending.filter((seat) =>
    state.stacks[seat] > 0 && (state.stacks[otherSeat(seat)] > 0 || state.street[seat] < largest));
  if (state.pending.length) {
    state.actor = state.pending[0];
    return state;
  }
  if (state.stacks.includes(0)) {
    while (state.phase !== 'river') dealStreet(state);
    return settle(state, 'showdown');
  }
  if (state.phase === 'river') return settle(state, 'showdown');
  dealStreet(state);
  state.actor = state.pending[0];
  return state;
}

export function createHand({
  stacks = [STARTING_STACK, STARTING_STACK],
  deck = shuffledDeck(),
  dealer = HUMAN,
  number = 1,
  previousActions = [],
} = {}) {
  const bigBlind = otherSeat(dealer);
  const state = {
    stacks: [...stacks], total: stacks[0] + stacks[1], deck: [...deck], hole: [[], []], board: [],
    dealer, number, actor: dealer, phase: 'preflop', lastRaise: BIG_BLIND,
    street: [0, 0], committed: [0, 0], pending: [dealer, bigBlind],
    log: [], outcome: null, previousActions,
  };
  for (let round = 0; round < 2; round++) {
    state.hole[dealer].push(state.deck.shift());
    state.hole[bigBlind].push(state.deck.shift());
  }
  for (const [seat, blind] of [[dealer, SMALL_BLIND], [bigBlind, BIG_BLIND]]) {
    const amount = Math.min(state.stacks[seat], blind);
    pay(state, seat, amount);
    state.log.push({ type: 'blind', seat, amount, phase: state.phase });
  }
  return progress(state);
}

export function legalActions(hand) {
  if (hand.outcome) return null;
  const seat = hand.actor;
  const opponent = otherSeat(seat);
  const largest = Math.max(...hand.street);
  const toCall = Math.min(largest - hand.street[seat], hand.stacks[seat]);
  const maximum = Math.min(hand.street[seat] + hand.stacks[seat], hand.street[opponent] + hand.stacks[opponent]);
  const maxTo = maximum > largest ? maximum : null;
  return {
    toCall,
    minTo: maxTo === null ? null : Math.min(maxTo, largest + hand.lastRaise),
    maxTo,
    largest,
    isBet: largest === 0,
  };
}

export function applyAction(hand, seat, action) {
  if (hand.outcome || seat !== hand.actor) return hand;
  const legal = legalActions(hand);
  const { type, to } = action;
  const allowed = type === (legal.toCall ? 'call' : 'check') || (type === 'fold' && legal.toCall > 0) ||
    (type === 'raise' && legal.maxTo !== null && Number.isInteger(to) && to >= legal.minTo && to <= legal.maxTo);
  if (!allowed) return hand;

  const state = {
    ...hand, stacks: [...hand.stacks], street: [...hand.street], committed: [...hand.committed],
    pending: hand.pending.slice(1), log: [...hand.log], board: [...hand.board], deck: [...hand.deck],
  };
  const amount = type === 'raise' ? to - state.street[seat] : (type === 'call' ? legal.toCall : 0);
  state.log.push({
    type: type === 'raise' && legal.isBet ? 'bet' : type, seat, amount, to,
    facing: legal.toCall, potBefore: potSize(hand), phase: hand.phase,
    allIn: amount > 0 && amount === state.stacks[seat],
  });
  if (type === 'fold') return settle(state, 'fold', seat);
  pay(state, seat, amount);
  if (type === 'raise') {
    state.lastRaise = Math.max(state.lastRaise, to - legal.largest);
    state.pending = [otherSeat(seat)];
  }
  return progress(state);
}

export function nextHand(hand, deck) {
  if (!hand.outcome || hand.stacks.includes(0)) return hand;
  const previousActions = [...hand.previousActions, ...hand.log.filter(({ seat, type }) => seat === HUMAN && type !== 'blind')].slice(-80);
  return createHand({
    stacks: hand.stacks, deck, dealer: otherSeat(hand.dealer),
    number: hand.number + 1, previousActions,
  });
}

// The worker gets this projection only. Neither the live deck nor the opponent's hole cards are included.
export function publicView(hand, seat) {
  if (hand.outcome || hand.actor !== seat) return null;
  return {
    seat, dealer: hand.dealer, phase: hand.phase, cards: [...hand.hole[seat]], board: [...hand.board],
    stacks: [...hand.stacks], street: [...hand.street], pot: potSize(hand), legal: legalActions(hand),
    log: hand.log.map((entry) => ({ ...entry })), previousActions: hand.previousActions.map((entry) => ({ ...entry })),
  };
}
