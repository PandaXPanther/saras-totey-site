export const botName = 'Totally Real Saras';
export const openingChat = () => [{ author: botName, text: 'glhf' }];

const replies = ['aight bet', 'we’ll see', 'lmao', 'just move bro'];

export function replyTo(text, index) {
  if (/\b(gg|good game|well played)\b/i.test(text)) return 'gg';
  if (/\b(glhf|good luck)\b/i.test(text)) return 'glhf';
  if (/\b(engine|stockfish|bot)\b/i.test(text)) return 'im literally right here';
  if (/\b(shuckle|pokemon|pokémon)\b/i.test(text)) return 'shuckle goes on e4';
  if (/\b(draw|rematch)\b/i.test(text)) return 'finish this one first';
  return replies[index % replies.length];
}

export function moveBanter(move, player, ply) {
  const mine = move.color === player;
  const phrase = (choices) => choices[Math.floor(ply / 2) % choices.length];
  if (move.promotion) return mine ? 'aight u got that' : 'queen dlc just dropped';
  if (move.captured === 'q') return mine ? 'ok relax' : phrase(['oh thats tough', 'queen had plans anyway', 'u were using that?']);
  if (move.san.endsWith('+') && !mine) return phrase(['king lookin nervous', 'found u', 'security check']);
  if (move.captured && 'rnb'.includes(move.captured)) {
    return mine ? phrase(['aight u got that', 'bro relax', 'i saw it after']) : phrase(['thx gang', 'free is free', 'bro donated']);
  }
  if (move.isKingsideCastle() || move.isQueensideCastle()) return mine ? 'king in witness protection' : 'moved out';
  return null;
}
