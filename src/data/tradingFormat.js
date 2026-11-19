const money = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', signDisplay: 'exceptZero',
});
const utcStamp = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
});

export const signedMoney = (value) => money.format(value);
export const formatStamp = (iso) => iso ? utcStamp.format(new Date(iso)) : 'Pending';

export function paperMetrics(generated) {
  const { total_trades: count, wins, profit_usd: profit, return_pct_sum: returnSum } = generated;
  return [
    { k: 'Generated paper fills', v: count.toLocaleString('en-US') },
    { k: 'Simulated net P&L', v: signedMoney(profit) },
    { k: 'Simulated win rate', v: count ? `${(100 * wins / count).toFixed(1)}%` : '—' },
    { k: 'Avg. simulated return', v: count ? `${(returnSum / count).toFixed(2)}%` : '—' },
  ];
}
