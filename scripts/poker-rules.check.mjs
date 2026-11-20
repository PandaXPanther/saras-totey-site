import assert from 'node:assert/strict';
import test from 'node:test';
import { cardRank, handRank } from '../src/poker/cards.js';
import { applyAction, createHand, legalActions, nextHand, publicView } from '../src/poker/table.js';
import { equityEstimate, pickPokerAction } from '../src/poker/bot.js';

const card = (name) => 'hdcs'.indexOf(name.at(-1)) * 13 + '23456789TJQKA'.indexOf(name[0]);
const cards = (line) => line.split(' ').map(card);

function fixtureDeck(first) {
  return [...first, ...Array.from({ length: 52 }, (_, index) => index).filter((value) => !first.includes(value))];
}

function act(hand, player, type, to) {
  const next = applyAction(hand, player, { type, to });
  assert.notEqual(hand, next, 'Expected a legal action');
  const onTable = next.outcome ? 0 : next.committed[0] + next.committed[1];
  assert.equal(next.stacks[0] + next.stacks[1] + onTable, hand.total);
  return next;
}

test('best-five rankings cover a wheel, full house, quads and kickers', () => {
  assert.equal(cardRank(card('As')), 14);
  assert.equal(handRank(cards('As 2h 3d 4s 5s 9h Kd')).label, 'Straight');
  assert.ok(handRank(cards('As 2h 3d 4s 5s 9h Kd')).score < handRank(cards('2s 3h 4d 5d 6s 9c Jd')).score);
  assert.equal(handRank(cards('As Ah Ac Kd Kc Kh 3d')).label, 'Full house');
  assert.equal(handRank(cards('As Ah Ac Ad Kh Kc 3d')).label, 'Four of a kind');
  assert.equal(handRank(cards('As Ks Qs Js Ts 9h 3d')).label, 'Royal flush');
  assert.ok(handRank(cards('As Ah Kd 8c 7d 5s 4h')).score > handRank(cards('Ad Ac Qd 8c 7d 5s 4h')).score);
});

test('heads-up blinds, the big blind option and postflop order are enforced', () => {
  let hand = createHand({ deck: fixtureDeck(cards('Ah Kd Ac Qd 2h 8d 7c 6s')) });
  assert.deepEqual(hand.street, [5, 10]);
  assert.equal(hand.actor, 0);
  assert.equal(legalActions(hand).toCall, 5);
  assert.equal(applyAction(hand, 1, { type: 'check' }), hand);
  hand = act(hand, 0, 'call');
  assert.equal(hand.actor, 1);
  assert.equal(hand.phase, 'preflop');
  hand = act(hand, 1, 'check');
  assert.equal(hand.actor, 1);
  assert.equal(hand.phase, 'flop');
  assert.equal(hand.board.length, 3);
  hand = act(hand, 1, 'raise', 22);
  assert.equal(legalActions(hand).minTo, 44);
  assert.equal(applyAction(hand, 0, { type: 'raise', to: 43 }), hand);
  hand = act(hand, 0, 'raise', 47);
  assert.equal(legalActions(hand).minTo, 72);
  hand = act(hand, 1, 'fold');
  assert.equal(hand.outcome.pot, 64);
  assert.equal(hand.outcome.winner, 0);
  const following = nextHand(hand, fixtureDeck(cards('Ah Kd Ac Qd')));
  assert.equal(following.dealer, 1);
  assert.equal(following.actor, 1);
});

test('short stacks run out the board and return unmatched chips at showdown', () => {
  const deck = fixtureDeck(cards('As Kh Ad Kc 2h 3h 7d Js 4h 9d 5h 8s'));
  let hand = createHand({ stacks: [4, 120], deck });
  assert.equal(hand.outcome.reason, 'showdown');
  assert.equal(hand.outcome.winner, 0);
  assert.deepEqual(hand.stacks, [8, 116]);
  hand = createHand({ stacks: [100, 26], deck });
  hand = act(hand, 0, 'raise', 25);
  const limits = legalActions(hand);
  assert.equal(limits.minTo, 26);
  assert.equal(limits.maxTo, 26);
  hand = act(hand, 1, 'raise', 26);
  assert.equal(legalActions(hand).maxTo, null);
  hand = act(hand, 0, 'call');
  assert.equal(hand.outcome.pot, 52);
  assert.equal(hand.board.length, 5);
});

test('a board-only royal flush splits the matched pot', () => {
  const deck = fixtureDeck(cards('2h Kd 3h Qd 4h As Ks Qs 5h Js 6h Ts'));
  let hand = createHand({ stacks: [100, 70], deck });
  hand = act(hand, 0, 'raise', 70);
  hand = act(hand, 1, 'call');
  assert.equal(hand.outcome.winner, null);
  assert.deepEqual(hand.stacks, [100, 70]);
});

test('the opponent receives no private human cards or undealt cards', () => {
  const hand = createHand({ dealer: 1, deck: fixtureDeck(cards('Ah Kd Ac Qd')) });
  const view = publicView(hand, 1);
  assert.deepEqual(view.cards, hand.hole[1]);
  assert.equal(Object.hasOwn(view, 'deck'), false);
  assert.equal(Object.hasOwn(view, 'hole'), false);
  assert.deepEqual(view, publicView({ ...hand, deck: [...hand.deck].reverse(), hole: [cards('4s 5s'), hand.hole[1]] }, 1));
});

test('a royal flush is unbeatable and the bot uses legal raise sizes', () => {
  const hand = createHand({ dealer: 1, deck: fixtureDeck(cards('Ah Kd Ac Qd')) });
  const view = publicView(hand, 1);
  const choice = pickPokerAction(view, () => 0.44);
  assert.equal(choice.type, 'raise');
  assert.ok(choice.to >= view.legal.minTo && choice.to <= view.legal.maxTo);
  const royal = equityEstimate({ ...view, cards: cards('As Ks'), board: cards('Qs Js Ts 2d 5h') }, () => 0.5);
  assert.equal(royal.share, 1);
});

test('simulated runouts never deal the same card twice at the tail of the deck', () => {
  const result = equityEstimate({ seat: 1, cards: [38, 46], board: [37, 0, 21], log: [] }, () => 0.99999, 1);
  assert.equal(result.share, 0.5);
});
