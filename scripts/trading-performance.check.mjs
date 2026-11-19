import assert from 'node:assert/strict';
import test from 'node:test';
import { benchmarkProfit, extendModelHistory, validPerformance } from '../src/data/tradingPerformance.js';

test('cumulative P&L retains the archive and advances from the authoritative total', () => {
  const archived = [['2026-07-08', 0, 0], ['2026-07-09', 1230, 10], ['2026-07-10', 1621, 12]];
  const fills = [
    { timestamp: '2026-07-11T23:00:00Z', profit_loss_usd: 2.17 },
    { timestamp: '2026-07-12T03:00:00Z', profit_loss_usd: -0.39 },
    { timestamp: '2026-07-10T19:00:00Z', profit_loss_usd: 3.40 },
    { timestamp: '2026-07-12T15:00:00Z', profit_loss_usd: 1.14 },
  ];
  const totals = { profit_usd: 19.13, total_trades: 15 };
  assert.deepEqual(extendModelHistory(archived, fills, totals), [
    ['2026-07-08', 0, 0], ['2026-07-09', 1230, 10], ['2026-07-10', 1621, 12],
    ['2026-07-11', 1838, 13], ['2026-07-12', 1913, 15],
  ]);
});

test('benchmark applies the same $1,424 from the prior close and preserves actual close dates', () => {
  const nav = [['2026-07-09', 710], ['2026-07-10', 720], ['2026-07-13', 738], ['2026-07-14', 702]];
  assert.deepEqual(benchmarkProfit(nav, '2026-07-11', 1424), [
    ['2026-07-11', 0], ['2026-07-13', 3560], ['2026-07-14', -3560],
  ]);
  assert.deepEqual(benchmarkProfit(nav, '2026-07-08', 1424), []);
  assert.equal(validPerformance({ model: [['2026-07-08', 0, 0]], benchmark: nav }), true);
  assert.equal(validPerformance({ model: [['2026-07-08', 0, 0]], benchmark: [...nav].reverse() }), false);
});
