import { writeFile } from 'node:fs/promises';
import { Chess } from 'chess.js';
import { fitPreferences, moveFeatures, moveKey, positionKey } from '../src/chess/model.js';

const username = 'skibidisarz';
const url = 'https://api.chess.com/pub/player/' + username;
const headers = { 'User-Agent': 'sarastotey.com portfolio chess (public game history)' };

async function getJson(endpoint) {
  if (!endpoint.startsWith(url + '/games/')) throw new Error('Unexpected Chess.com archive URL');
  const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Chess.com archive returned ' + response.status);
  return response.json();
}

const { archives } = await getJson(url + '/games/archives');
const examples = [];
const openings = {};
const openingMoves = {};
const seen = new Set();
const formats = {};
let games = 0;

function addMove(table, key, move) {
  const choices = table[key] ??= {};
  choices[move] = (choices[move] ?? 0) + 1;
}

for (const archive of archives) {
  for (const entry of (await getJson(archive)).games) {
    if (entry.rules !== 'chess' || !entry.rated || !entry.pgn || seen.has(entry.url)) continue;
    const color = entry.white.username.toLowerCase() === username ? 'w'
      : entry.black.username.toLowerCase() === username ? 'b' : null;
    if (!color) continue;
    const replay = new Chess();
    replay.loadPgn(entry.pgn);
    const history = replay.history({ verbose: true });
    if (!history.length || history[0].before !== new Chess().fen()) continue;
    seen.add(entry.url);
    games++;
    formats[entry.time_class] = (formats[entry.time_class] ?? 0) + 1;
    const board = new Chess();
    history.forEach((move, ply) => {
      const key = positionKey(board);
      if (ply < 16) addMove(openingMoves, key, moveKey(move));
      if (move.color === color) {
        const previous = history[ply - 1];
        if (ply < 24) addMove(openings, key, moveKey(move));
        const legal = board.moves({ verbose: true }).map((candidate) => moveFeatures(candidate, previous, ply));
        if (legal.length > 1) examples.push({ actual: moveFeatures(move, previous, ply), legal });
      }
      board.move(move.san);
    });
  }
}

if (!games || !examples.length) throw new Error('No rated standard games were available');
const profile = { username, games, formats, examples: examples.length, weights: fitPreferences(examples), openings, openingMoves };
await writeFile(new URL('../src/chess/profile.json', import.meta.url), JSON.stringify(profile) + '\n');
console.log('Fitted %d decision positions from %d rated games (%s).', examples.length, games, JSON.stringify(formats));
