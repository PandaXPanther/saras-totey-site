import { botName } from './banter.js';
import { opposite } from './model.js';

// The central bands reflect a sample of the rated blitz games used for the bot profile.
// Ratings outside that sample are extrapolated from the review's accuracy metric.
const ratingBands = [[0, 400], [48, 600], [62, 900], [73, 1150], [82, 1400], [89, 1700], [95, 2100], [100, 2500]];
const referenceAccuracy = 78;
const referenceWeight = 1.5;

function ratingFor(accuracy) {
  const upper = ratingBands.findIndex(([threshold]) => threshold >= accuracy);
  if (upper <= 0) return ratingBands[0][1];
  const [lowerAccuracy, lowerRating] = ratingBands[upper - 1];
  const [upperAccuracy, upperRating] = ratingBands[upper];
  const fraction = (accuracy - lowerAccuracy) / (upperAccuracy - lowerAccuracy);
  return Math.round((lowerRating + (upperRating - lowerRating) * fraction) / 50) * 50;
}

export function reviewOutcomes(moves, analysis, player) {
  const assessed = analysis.map((row, index) => ({ ...row, ply: index + 1, color: moves[index].color }));
  return [player, opposite(player)].map((color) => {
    const rows = assessed.filter((row) => row.color === color);
    const label = color === player ? 'You' : botName;
    if (!rows.length) return { color, label, rows, accuracy: null, rating: null, weight: 0 };

    let total = 0;
    let weightedTotal = referenceWeight * referenceAccuracy;
    let weight = 0;
    for (const row of rows) {
      total += row.accuracy;
      weightedTotal += row.accuracy * row.ratingWeight;
      weight += row.ratingWeight;
    }

    return {
      color, label, rows, weight,
      accuracy: (total / rows.length).toFixed(1),
      rating: ratingFor(Math.min(100, weightedTotal / (weight + referenceWeight))),
    };
  });
}
