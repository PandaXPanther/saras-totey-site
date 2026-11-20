export const battleFavorites = [
  ['llnXhrCn9Yo', 'Black & White Elite Four'],
  ['0yqm7vrCp-g', 'Volo'],
  ['GIn8_Q27WFY', 'Zinnia'],
  ['vjOKKDgKvp4', 'Lugia'],
  ['AVUdyEWH2nE', 'Sword & Shield Gym Leader'],
];
const showdown = [
  ['oras-trainer', 'Omega Ruby & Alpha Sapphire Trainer'],
  ['xy-rival', 'X & Y Rival'],
  ['bw-rival', 'Black & White Rival'],
  ['hgss-kanto-trainer', 'HeartGold & SoulSilver Kanto Trainer'],
  ['bw-subway-trainer', 'Black & White Battle Subway'],
];
const previousTrackKey = 'portfolio-battle-theme-showdown';
let lastInTab;

export function nextBattleTheme() {
  let previous = lastInTab;
  try { previous = sessionStorage.getItem(previousTrackKey) ?? previous; } catch { /* Memory works in private contexts. */ }

  const available = showdown.filter(([file]) => file !== previous);
  const [file, name] = available[Math.floor(Math.random() * available.length)];
  lastInTab = file;
  try { sessionStorage.setItem(previousTrackKey, file); } catch { /* The next match still skips the previous track. */ }

  return { name, url: `https://play.pokemonshowdown.com/audio/${file}.mp3` };
}
