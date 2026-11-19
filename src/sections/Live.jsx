import React from 'react';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import { formatStamp } from '../data/tradingFormat.js';

const aggregateLabels = {
  'Portfolio value': 'Modeled portfolio value',
  'Total profit': 'Baseline + simulated P&L',
  'Total trades': 'Baseline records + simulated fills',
  'Win rate': 'Combined outcome rate',
};

function Cards({ cards, labels = {} }) {
  return <div className="grid grid-3">{cards.map(({ k, v, foot }) => (
    <div key={k} className="kpi">
      <div className="kpi-k">{labels[k] || k}</div>
      <div className="kpi-v">{v}</div>
      <div className="kpi-foot">{foot}</div>
    </div>
  ))}</div>;
}

export default function Live({ dashboard, signals }) {
  return (
    <section id="live" style={{ overflow: 'hidden' }}>
      <Aurora color="#3a5878" size={520} top="30%" left="15%" opacity={0.14} />
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">Trading telemetry</div>
          <h2>Trading <span className="grad">dashboard.</span></h2>
          <p className="lede dashboard-intro">The model starts with historical receipts and adds simulated fills. Baseline observations include CS2 purchases, prediction-market trades, and ranked research wallets.</p>
          <p className="mono small text-faint">Latest simulated fill · {formatStamp(dashboard.totals.last_trade_iso)} · <a href="#paper-receipts">View paper receipts</a></p>
        </Reveal>
        <Reveal><div className="mt-4"><Cards cards={dashboard.cards} labels={aggregateLabels} /></div></Reveal>
        <Reveal>
          <div className="mt-12">
            <h3 className="dashboard-subtitle">Repository and API signals</h3>
            <p className="mono small text-faint">Updated {formatStamp(signals.generated_at)}</p>
            <div className="mt-4"><Cards cards={signals.cards} /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
