import React from 'react';
import { AWARDS, SYSTEMS } from '../data/content.js';
import System from '../sections/System.jsx';
import Backtest from '../sections/Backtest.jsx';
import Live from '../sections/Live.jsx';
import Roadmap from '../sections/Roadmap.jsx';

const projects = {
  'econ-mom': {
    eyebrow: 'The Mother of Econ', title: 'Economics tools built to show their work.', dek: 'Twelve free, citation-rigorous tools for students, debaters, and policy desks.', href: 'https://econ.mom', cta: 'Open econ.mom',
    stats: [['12', 'public economics tools'], ['May 2026', 'featured by Marginal Revolution'], ['Free', 'no paywall between a question and its evidence']],
    sections: [
      ['A working economics desk', 'The collection moves beyond explainers. It includes an AP free-response grader, tariff modeling, and a public Shadow Fed. Each tool turns a policy question into something a reader can inspect, change, and challenge.'],
      ['Built for scrutiny', 'Formulas and sources sit beside the result. The project uses cited public datasets and makes assumptions visible, so a polished output never substitutes for an auditable method.'],
      ['Press and reach', 'Marginal Revolution featured econ.mom in May 2026 and specifically called attention to its formulas and cited datasets. That recognition matters because rigor, not traffic theater, is the product.'],
    ],
  },
  'local-ledger': {
    eyebrow: 'Nationwide Economic Observatory', title: 'A local economy should never require invented data.', dek: 'Public dashboards across every state, 3,143 counties, and 120 metro areas.', href: 'https://local-ledger.net', cta: 'Open Local Ledger',
    stats: [['50', 'states'], ['3,143', 'counties'], ['120', 'metro areas'], ['0', 'fabricated data points']],
    sections: [
      ['The country, at local resolution', 'Local Ledger brings jobs, income, housing, schools, and federal spending into one geographic research surface. Rankings and an economy simulator make comparison possible without flattening places into one score.'],
      ['Primary-source backbone', 'The dashboards cite FRED, the Bureau of Labor Statistics, Census Bureau, Bureau of Economic Analysis, College Scorecard, and USAspending. The integrity counter reads 0 fabricated because missing data stays missing.'],
      ['Designed for a real question', 'A visitor can move from a national claim to a state, county, or metro view and inspect the evidence beneath it. The product is an observatory, not a list of decorative charts.'],
    ],
  },
  'att-agency': {
    eyebrow: 'Boulder, Colorado', title: 'Small businesses deserve technical work that holds up.', dek: 'ATT Agency combines brands, custom websites, video, ads, and analytics into one accountable studio.', href: 'https://attagency.co', cta: 'Visit ATT Agency',
    stats: [['3', 'co-founders'], ['5', 'connected disciplines'], ['1', 'team accountable for the outcome']],
    sections: [['One studio, fewer handoffs', 'Saras co-founded ATT Agency with Ryder Thomas and Sunny Avula. Clients can commission the full system or only the parts they need.'], ['Work tied to outcomes', 'Brand, site, video, advertising, and analytics are planned together, so the public face and the measurement layer do not drift apart.']],
  },
};

function QuantPage() {
  return <main className="project-page project-page--quant"><header className="project-hero"><span>Quant systems</span><h1>Three systems. Every claim attached to evidence.</h1><p>Live capital, paper systems, research findings, citations, code, and current telemetry.</p></header>{SYSTEMS.map((system, index) => <System key={system.slug} system={system} flipped={index % 2 === 1} />)}<Backtest /><Live /><Roadmap /></main>;
}

export default function ProjectPage({ slug }) {
  if (slug === 'quant') return <QuantPage />;
  const project = projects[slug];
  if (!project) return <main className="project-page"><header className="project-hero"><span>404</span><h1>This island is not on the map.</h1><a className="glass-button" href="/">Return to the world</a></header></main>;
  return (
    <main className={`project-page project-page--${slug}`}>
      <header className="project-hero"><span>{project.eyebrow}</span><h1>{project.title}</h1><p>{project.dek}</p><a className="glass-button" href={project.href} target="_blank" rel="noreferrer">{project.cta}</a></header>
      <section className="project-stats">{project.stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>
      <section className="project-story">{project.sections.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</section>
      {slug === 'att-agency' && <section className="project-record"><h2>Beyond the studio</h2>{AWARDS.groups.map((group) => <article key={group.title}><h3>{group.title}</h3><p>{group.items.map((item) => item.k).join(' · ')}</p></article>)}</section>}
      <footer className="project-footer"><a href="/">Return to the scroll world</a><a href={project.href} target="_blank" rel="noreferrer">Visit project</a></footer>
    </main>
  );
}
