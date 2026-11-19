const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const sortedDays = (rows) => rows.every(([date], index) =>
  datePattern.test(date) && Number.isFinite(Date.parse(date)) && (!index || date > rows[index - 1][0]));

export function validPerformance(data) {
  return Array.isArray(data?.model) && data.model.length > 0
    && data.model.every((row) => Array.isArray(row) && row.length === 3
      && Number.isSafeInteger(row[1]) && Number.isSafeInteger(row[2]) && row[2] >= 0)
    && sortedDays(data.model)
    && Array.isArray(data.benchmark)
    && data.benchmark.every((row) => Array.isArray(row) && row.length === 2
      && Number.isFinite(row[1]) && row[1] > 0)
    && sortedDays(data.benchmark);
}

export function extendModelHistory(history, fills, totals) {
  if (!fills.length) return history.filter(([, , count]) => count <= totals.total_trades);
  const days = new Map();
  for (const { timestamp, profit_loss_usd: profit } of fills) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const [pnl, count] = days.get(date) ?? [0, 0];
    days.set(date, [pnl + Math.round(profit * 100), count + 1]);
  }

  let pnl = Math.round(totals.profit_usd * 100);
  let count = totals.total_trades;
  // Work backward from the authoritative all-time total. This yields an exact
  // end-of-day value even when the first retained date only has some of its fills.
  const recent = [...days].sort(([a], [b]) => b.localeCompare(a)).map(([date, [delta, fillsOnDate]]) => {
    const point = [date, pnl, count];
    pnl -= delta;
    count -= fillsOnDate;
    return point;
  }).reverse();
  const [oldest, , oldestCount] = recent[0];
  const previous = history.filter(([date, , fillCount]) => date < oldest && fillCount <= oldestCount);
  return [...previous, ...recent];
}

export function benchmarkProfit(nav, start, startingBalance) {
  const startNav = nav.findLast(([date]) => date <= start);
  if (!startNav || !Number.isFinite(startingBalance) || startingBalance <= 0) return [];
  const initialNav = startNav[1];
  return [
    [start, 0],
    ...nav.filter(([date]) => date > start).map(([date, value]) =>
      [date, Math.round(startingBalance * (value / initialNav - 1) * 100)]),
  ];
}
