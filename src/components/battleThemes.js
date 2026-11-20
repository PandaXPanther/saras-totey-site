const favorites = [
  ['llnXhrCn9Yo', 'Black & White Elite Four'],
  ['0yqm7vrCp-g', 'Volo'],
  ['GIn8_Q27WFY', 'Zinnia'],
  ['vjOKKDgKvp4', 'Lugia'],
  ['AVUdyEWH2nE', 'Sword & Shield Gym Leader'],
];
const showdown = ['oras-trainer', 'xy-rival', 'bw-rival', 'hgss-kanto-trainer', 'bw-subway-trainer']
  .map((name) => [name, `https://play.pokemonshowdown.com/audio/${name}.mp3`]);
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
  return { favorites: freshOrder(favorites, 'favorites'), native: freshOrder(showdown, 'showdown')[0][1] };
}
