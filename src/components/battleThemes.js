export const battleFavorites = [
  { file: 'bw-elite-four', name: 'Black & White Elite Four', youtubeId: 'llnXhrCn9Yo' },
  { file: 'volo', name: 'Volo', youtubeId: '0yqm7vrCp-g' },
  { file: 'zinnia', name: 'Zinnia', youtubeId: 'GIn8_Q27WFY' },
  { file: 'lugia', name: 'Lugia', youtubeId: 'vjOKKDgKvp4' },
  { file: 'swsh-gym-leader-cheer', name: 'Sword & Shield Gym Leader (Cheer)', youtubeId: 'AVUdyEWH2nE' },
];

const previousTrackKey = 'portfolio-battle-theme-favorites';
let remaining = [];
let previous;

export function nextBattleTheme() {
  if (!remaining.length) remaining = [...battleFavorites];
  if (!previous) {
    try { previous = sessionStorage.getItem(previousTrackKey); } catch { /* Memory works in private contexts. */ }
  }

  const eligible = remaining.filter(({ file }) => file !== previous);
  const track = eligible[Math.floor(Math.random() * eligible.length)];
  remaining.splice(remaining.indexOf(track), 1);
  previous = track.file;
  try { sessionStorage.setItem(previousTrackKey, previous); } catch { /* Memory still skips the previous track. */ }

  return { name: track.name, url: `/battle-arena/music/${track.file}.mp3` };
}
