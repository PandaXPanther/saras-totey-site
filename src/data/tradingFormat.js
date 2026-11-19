import { SYSTEMS } from './content.js';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', signDisplay: 'exceptZero',
});
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const price = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 8,
});
const utcStamp = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
});
const utcFillTime = new Intl.DateTimeFormat('en-GB', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
});

export const signedMoney = (value) => money.format(Math.round(value * 100) / 100);
export const usdTotal = (value) => usd.format(value);
export const usdPrice = (value) => price.format(value);
export const formatStamp = (iso) => iso ? utcStamp.format(new Date(iso)) : 'Pending';
export const formatFillTime = (iso) => utcFillTime.format(new Date(iso));

export function summarizePaper(systems) {
  const total = { total_trades: 0, wins: 0, profit_usd: 0, return_pct_sum: 0, notional_usd: 0 };
  for (const { slug } of SYSTEMS) {
    const { generated } = systems[slug];
    for (const key of Object.keys(total)) total[key] += generated[key];
  }
  return total;
}

export function paperMetrics(generated) {
  const { total_trades: count, wins, profit_usd: profit, return_pct_sum: returnSum } = generated;
  return [
    { k: 'Fills', v: count.toLocaleString('en-US') },
    { k: 'Net P&L', v: signedMoney(profit) },
    { k: 'Win rate', v: count ? `${(100 * wins / count).toFixed(1)}%` : '—' },
    { k: 'Avg. return', v: count ? `${(returnSum / count).toFixed(2)}%` : '—' },
  ];
}
