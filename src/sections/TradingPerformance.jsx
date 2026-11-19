import React, { useState } from 'react';
import { benchmarkProfit, extendModelHistory } from '../data/tradingPerformance.js';
import { signedMoney, usdTotal } from '../data/tradingFormat.js';

const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const tickLabel = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
});
const viewport = { width: 1000, height: 260 };
const dayMs = 86_400_000;
const source = 'https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy';
const formatDate = (day) => dateLabel.format(new Date(day));

function line(series, x, y, maxGap) {
  return series.map(([date, value], index) => {
    const gap = index && Date.parse(date) - Date.parse(series[index - 1][0]) > maxGap * dayMs;
    return `${!index || gap ? 'M' : 'L'}${x(date).toFixed(2)} ${y(value).toFixed(2)}`;
  }).join(' ');
}

function PerformanceChart({ model, benchmark }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const dates = [...new Set([...model, ...benchmark].map(([date]) => date))].sort();
  const first = dates[0];
  const last = dates.at(-1);
  const active = dates.includes(selectedDate) ? selectedDate : last;
  const botPoint = model.findLast(([date]) => date <= active);
  const spyPoint = benchmark.findLast(([date]) => date <= active);
  const start = Date.parse(first);
  const length = Math.max(dayMs, Date.parse(last) - start);
  const values = [...model, ...benchmark].map(([, cents]) => cents);
  const peak = Math.max(0, ...values);
  const floor = Math.min(0, ...values);
  const units = Math.max(1000, (peak - floor) / 4);
  const magnitude = 10 ** Math.floor(Math.log10(units));
  const step = ([1, 2, 2.5, 5, 10].find((n) => n * magnitude >= units) ?? 10) * magnitude;
  const top = Math.max(step, Math.ceil(peak / step) * step);
  const bottom = Math.floor(floor / step) * step;
  const ticks = Array.from({ length: (top - bottom) / step + 1 }, (_, i) => top - i * step);
  const x = (day) => 6 + (Date.parse(day) - start) / length * (viewport.width - 12);
  const y = (cents) => 5 + (top - cents) / (top - bottom) * (viewport.height - 10);
  const middle = dates[Math.floor((dates.length - 1) / 2)];

  function pickDate(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const time = start + (event.clientX - rect.left) / rect.width * length;
    const date = dates.reduce((best, candidate) => (
      Math.abs(Date.parse(candidate) - time) < Math.abs(Date.parse(best) - time) ? candidate : best
    ));
    setSelectedDate(date);
  }

  return (
    <div className="performance-chart">
      <div className="performance-plot">
        <div className="performance-y" aria-hidden="true">
          {ticks.map((tick) => <span key={tick} style={{ top: `${y(tick) / viewport.height * 100}%` }}>{tickLabel.format(tick / 100)}</span>)}
        </div>
        <svg viewBox={`0 0 ${viewport.width} ${viewport.height}`} preserveAspectRatio="none" aria-hidden="true"
          onPointerMove={(event) => { if (event.pointerType === 'mouse') pickDate(event); }} onPointerDown={pickDate}>
          {ticks.map((tick) => <line className="performance-gridline" key={tick} x1="0" x2={viewport.width} y1={y(tick)} y2={y(tick)} />)}
          <path className="performance-series performance-series--model" d={line(model, x, y, 3)} />
          <path className="performance-series performance-series--benchmark" d={line(benchmark, x, y, 6)} />
          <line className="performance-crosshair" x1={x(active)} x2={x(active)} y1="0" y2={viewport.height} />
        </svg>
      </div>
      <div className="performance-dates mono small" aria-hidden="true">
        {[...new Set([first, middle, last])].map((date) => <span key={date}>{formatDate(date)}</span>)}
      </div>
      <label className="performance-inspect">
        <span className="visually-hidden">Compare by date</span>
        <input type="range" min="0" max={dates.length - 1} value={dates.indexOf(active)}
          aria-valuetext={formatDate(active)} onChange={(event) => setSelectedDate(dates[Number(event.target.value)])} />
      </label>
      <p className="performance-selection mono small">
        <strong>{formatDate(active)}</strong>
        <span>Combined bots {botPoint ? signedMoney(botPoint[1] / 100) : '—'}</span>
        <span>S&amp;P 500 benchmark {spyPoint ? signedMoney(spyPoint[1] / 100) : '—'}{spyPoint && spyPoint[0] !== active ? ` (${formatDate(spyPoint[0])} close)` : ''}</span>
      </p>
    </div>
  );
}

export default function TradingPerformance({ dashboard, paperTotals, performance }) {
  const principal = dashboard.baseline.systems.countersnipe.portfolio_value_usd;
  const model = extendModelHistory(performance.model, dashboard.trades, paperTotals);
  const benchmark = model.length ? benchmarkProfit(performance.benchmark, model[0][0], principal) : [];
  const lastClose = benchmark.at(-1);
  return (
    <section id="performance" className="trade-log trading-performance" aria-labelledby="performance-heading">
      <h3 id="performance-heading">Combined bot P&amp;L</h3>
      <p className="small text-dim">Both lines start with {usdTotal(principal)} before the first model fill.</p>
      <div className="performance-legend">
        <div>
          <span className="performance-key performance-key--model">All bots · model-generated</span>
          <strong data-model-pnl>{signedMoney(paperTotals.profit_usd)}</strong>
        </div>
        <div>
          <span className="performance-key performance-key--benchmark">S&amp;P 500 benchmark · SPY</span>
          <strong data-benchmark-pnl>{lastClose ? signedMoney(lastClose[1] / 100) : 'Unavailable'}</strong>
          {lastClose && <span className="small text-dim">Through <time dateTime={lastClose[0]}>{formatDate(lastClose[0])}</time> close</span>}
        </div>
      </div>
      {!!model.length && <PerformanceChart model={model} benchmark={benchmark} />}
      <p className="small text-dim">The benchmark uses daily NAV and excludes distributions. <a href={source} target="_blank" rel="noreferrer">State Street fund data</a></p>
    </section>
  );
}
