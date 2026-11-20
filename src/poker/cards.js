export const CARD_RANKS = '23456789TJQKA';
export const SUITS = [
  { symbol: '♥', name: 'hearts', red: true },
  { symbol: '♦', name: 'diamonds', red: true },
  { symbol: '♣', name: 'clubs', red: false },
  { symbol: '♠', name: 'spades', red: false },
];
export const DECK = Array.from({ length: 52 }, (_, index) => index);
export const cardRank = (card) => card % 13 + 2;
export const cardSuit = (card) => Math.floor(card / 13);

const categoryNames = [
  'High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush',
  'Full house', 'Four of a kind', 'Straight flush',
];
const rankNames = [
  '', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'jack', 'queen', 'king', 'ace',
];
const rankBase = 15 ** 5;

export function cardName(card) {
  return rankNames[cardRank(card)] + ' of ' + SUITS[cardSuit(card)].name;
}

export function shuffledDeck(random = Math.random) {
  const cards = [...DECK];
  for (let index = cards.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

function straightHigh(mask) {
  if (mask & (1 << 14)) mask |= 1 << 1;
  for (let high = 14; high >= 5; high--) {
    if (((mask >> (high - 4)) & 31) === 31) return high;
  }
  return 0;
}

function pack(category, first = 0, second = 0, third = 0, fourth = 0, fifth = 0) {
  return (((((category * 15 + first) * 15 + second) * 15 + third) * 15 + fourth) * 15 + fifth);
}

export const handCategory = (score) => Math.floor(score / rankBase);
export const leadingRank = (score) => Math.floor(score / (15 ** 4)) % 15;

// Compare the best five directly from the rank counts and suited rank masks.
export function handScore(cards) {
  const counts = new Uint8Array(15);
  const suits = [0, 0, 0, 0];
  const suitCounts = [0, 0, 0, 0];
  let mask = 0;
  for (const card of cards) {
    const rank = cardRank(card);
    const suit = cardSuit(card);
    counts[rank]++;
    suits[suit] |= 1 << rank;
    suitCounts[suit]++;
    mask |= 1 << rank;
  }

  const flush = suitCounts.findIndex((count) => count >= 5);
  if (flush >= 0) {
    const high = straightHigh(suits[flush]);
    if (high) return pack(8, high);
  }

  const ranks = [];
  const pairs = [];
  const triples = [];
  let quad = 0;
  for (let rank = 14; rank >= 2; rank--) {
    if (counts[rank]) ranks.push(rank);
    if (counts[rank] >= 2) pairs.push(rank);
    if (counts[rank] === 3) triples.push(rank);
    if (counts[rank] === 4) quad = rank;
  }

  if (quad) return pack(7, quad, ranks.find((rank) => rank !== quad));
  if (triples.length && pairs.length > 1) {
    return pack(6, triples[0], pairs.find((rank) => rank !== triples[0]));
  }
  if (flush >= 0) return pack(5, ...ranks.filter((rank) => suits[flush] & (1 << rank)).slice(0, 5));
  const straight = straightHigh(mask);
  if (straight) return pack(4, straight);
  if (triples.length) return pack(3, triples[0], ...ranks.filter((rank) => rank !== triples[0]).slice(0, 2));
  if (pairs.length >= 2) {
    return pack(2, pairs[0], pairs[1], ranks.find((rank) => rank !== pairs[0] && rank !== pairs[1]));
  }
  if (pairs.length) return pack(1, pairs[0], ...ranks.filter((rank) => rank !== pairs[0]).slice(0, 3));
  return pack(0, ...ranks.slice(0, 5));
}

export function handRank(cards) {
  const score = handScore(cards);
  const category = handCategory(score);
  const high = leadingRank(score);
  const label = category === 8 && high === 14 ? 'Royal flush'
    : category === 0 ? rankNames[high][0].toUpperCase() + rankNames[high].slice(1) + ' high'
      : categoryNames[category];
  const second = Math.floor(score / (15 ** 3)) % 15;
  const plural = (rank) => rankNames[rank] + (rank === 6 ? 'es' : 's');
  let detail = label;
  if (category === 1) detail = 'Pair of ' + plural(high);
  if (category === 3) detail = 'Three ' + plural(high);
  if (category === 7) detail = 'Four ' + plural(high);
  if (category === 2) detail = 'Two pair, ' + plural(high) + ' and ' + plural(second);
  if (category === 6) detail = 'Full house, ' + plural(high) + ' over ' + plural(second);
  if (category >= 4 && category <= 5) {
    detail = rankNames[high][0].toUpperCase() + rankNames[high].slice(1) + '-high ' + label.toLowerCase();
  }
  return { score, label, detail };
}
