const favorites = [
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
const lastInTab = {};

function freshOrder(tracks, kind) {
  const order = [...tracks];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const key = `portfolio-battle-theme-${kind}`;
  let previous = lastInTab[kind];
  try { previous = sessionStorage.getItem(key) ?? previous; } catch { /* Memory works in private contexts. */ }
  if (order[0][0] === previous) {
    const j = 1 + Math.floor(Math.random() * (order.length - 1));
    [order[0], order[j]] = [order[j], order[0]];
  }
  lastInTab[kind] = order[0][0];
  try { sessionStorage.setItem(key, order[0][0]); } catch { /* The next match still skips the previous track. */ }
  return order;
}

export function nextBattleThemes() {
  const [file, name] = freshOrder(showdown, 'showdown')[0];
  return {
    favorites: freshOrder(favorites, 'favorites'),
    native: { name, url: `https://play.pokemonshowdown.com/audio/${file}.mp3` },
  };
}
