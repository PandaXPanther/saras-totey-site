import React, { useEffect, useState } from 'react';
import { IDENTITY, LIVE, SYSTEMS } from '../data/content.js';
import STATIC_DASHBOARD from '../data/trading-live.json';
import System from '../sections/System.jsx';
import Backtest from '../sections/Backtest.jsx';
import Live from '../sections/Live.jsx';
import Roadmap from '../sections/Roadmap.jsx';
import Hero from '../sections/Hero.jsx';
import Thesis from '../sections/Thesis.jsx';
import Footer from '../sections/Footer.jsx';

const projects = {
  'econ-mom': {
    eyebrow: 'The Mother of Econ', title: 'Econ.mom', dek: 'Twelve free, citation-rigorous economics tools I built to make the models I met in AP Econ easier to question, test, and actually understand.', href: 'https://econ.mom', cta: 'Open Econ.mom',
    stats: [['12', 'public economics tools'], ['May 2026', 'featured by Marginal Revolution'], ['Free', 'no paywall between a question and its evidence']],
    sections: [['A working economics desk', 'The collection moves beyond explainers. It includes an AP free-response grader, tariff modeling, and a public Shadow Fed. Each tool turns a policy question into something a reader can inspect, change, and challenge.'], ['Built for scrutiny', 'Formulas and sources sit beside the result. The project uses cited public datasets and makes assumptions visible, so a polished output never substitutes for an auditable method.'], ['Press and reach', 'Marginal Revolution featured Econ.mom in May 2026 and specifically called attention to its formulas and cited datasets. That recognition matters because rigor, not traffic theater, is the product.']],
  },
  'local-ledger': {
    eyebrow: 'local-ledger.net', title: 'A local economy should never require invented data.', dek: 'I built public dashboards across every state, 3,143 counties, and 120 metro areas because I wanted local government data to be usable without losing where it came from, plus a simulator you can crash.', href: 'https://local-ledger.net', cta: 'Open local-ledger.net',
    stats: [['50', 'states'], ['3,143', 'counties'], ['120', 'metro areas'], ['0', 'fabricated data points']],
    sections: [['The country, at local resolution', 'Local Ledger brings jobs, income, housing, schools, and federal spending into one geographic research surface. Rankings make comparison possible without flattening places into one score.'], ['Primary-source backbone', 'The dashboards cite FRED, the Bureau of Labor Statistics, Census Bureau, Bureau of Economic Analysis, College Scorecard, and USAspending. The integrity counter reads 0 fabricated because missing data stays missing.'], ['The simulator is the extravagant part', 'The economy simulator turns the observatory into a live policy lab. Change the forces acting on a place (employment, income, housing pressure, and public investment) and watch the local picture respond as a connected system instead of a stack of isolated charts. It makes counterfactuals tangible while keeping the real baseline data in view, so exploring a dramatic scenario never gets confused with reporting a fact.']],
  },
  'att-agency': {
    eyebrow: 'attagency.co', title: 'Small businesses deserve technical work that holds up.', dek: 'Want a site like this? I co-founded the studio that builds them. ATT Agency connects brands, custom websites, video, ads, and analytics without the usual handoffs.', href: 'https://attagency.co', cta: 'Visit ATT Agency',
    stats: [['3', 'co-founders'], ['11', 'projects shipped'], ['1', 'team accountable for the outcome']],
    sections: [['My role in the studio', 'I co-founded ATT Agency with Ryder Thomas and Sunny Avula. I work where software, strategy, and measurement meet, helping clients commission a complete system or only the pieces they need.'], ['Work tied to outcomes', 'Brand, site, video, advertising, and analytics are planned together, so the public face and the measurement layer do not drift apart.']],
  },
};

const footerLinks = [['GitHub', `https://github.com/${IDENTITY.github_user}`], ['LinkedIn', IDENTITY.linkedin], ['Buy Me a Coffee', IDENTITY.bmc], ['Instagram', IDENTITY.instagram]];

function SiteFooter() {
  return <footer className="site-footer"><strong>Site made by Saras Totey</strong><nav aria-label="Social links">{footerLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>)}</nav></footer>;
}

function BackToWorld({ visible }) { return visible ? <a className="take-back" href="/" data-restore-world="true">← Take me back</a> : null; }

function QuantPage({ canReturnToWorld }) {
  const [dashboard, setDashboard] = useState(STATIC_DASHBOARD);
  const [liveSignals, setLiveSignals] = useState(LIVE.cards);
  const [tradeStatus, setTradeStatus] = useState('baseline');

  useEffect(() => {
    let cancelled = false;
    fetch(`/generated/trading-live.json?ts=${Date.now()}`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`trade feed ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
          setTradeStatus('live');
        }
      })
      .catch(() => {
        if (!cancelled) setTradeStatus('baseline');
      });
    fetch(`/generated/live-signals.json?ts=${Date.now()}`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`live signals ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data.cards)) setLiveSignals(data.cards);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return <main className="project-page project-page--quant"><BackToWorld visible={canReturnToWorld} /><Hero /><Thesis />{SYSTEMS.map((system, index) => <System key={system.slug} system={system} dashboard={dashboard} liveSignals={liveSignals} flipped={index % 2 === 1} />)}<Backtest /><Live dashboard={dashboard} tradeStatus={tradeStatus} /><Roadmap /><Footer /></main>;
}

function Recognition() {
  return <section className="recognition"><span>Recognition</span><h2>Reviewed by working economists</h2><p className="recognition__press">Featured in the press</p><p className="recognition__lede">Twelve free, interactive AP-Econ tools with every dataset cited.</p><div className="recognition__grid"><article><strong>Marginal Revolution</strong><p>Tyler Cowen, on Marginal Revolution, one of the most-read economics blogs in the world.</p><a href="https://marginalrevolution.com/marginalrevolution/2026/05/monday-assorted-links-558.html#:~:text=6.-,%E2%80%9CTwelve%20free,every%20dataset%20cited.%E2%80%9D" target="_blank" rel="noreferrer">Read the entry →</a></article><article><strong>N. Gregory Mankiw, Robert M. Beren Professor of Economics, Harvard. Author of Principles of Economics; former Chairman of the Council of Economic Advisers.</strong><p>Personally reviewed by N. Gregory Mankiw, who engaged directly with the project and pushed it to ship deeper, clearer explanations behind every tool.</p><a href="https://gregmankiw.blogspot.com/" target="_blank" rel="noreferrer">Greg Mankiw’s Blog →</a></article><article><strong>Ruben A. Rivera, PhD, Senior Director of Academic Programs</strong><p>Reviewed and praised by Ruben Rivera, PhD, who leads academic programs at the Council for Economic Education and directs the National Economics Challenge.</p></article></div></section>;
}

export default function ProjectPage({ slug, canReturnToWorld = false }) {
  if (slug === 'quant') return <QuantPage canReturnToWorld={canReturnToWorld} />;
  const project = projects[slug];
  if (!project) return <main className="project-page"><header className="project-hero"><span>404</span><h1>This island is not on the map.</h1><a className="hero-cta" href="/">Return home</a></header><SiteFooter /></main>;
  return <main className={`project-page project-page--${slug}`}><BackToWorld visible={canReturnToWorld} /><header className="project-hero"><span>{project.eyebrow}</span><h1>{project.title}</h1><p>{project.dek}</p><a className="hero-cta" href={project.href} target="_blank" rel="noreferrer">{project.cta}</a></header><section className="project-stats">{project.stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section><section className="project-story">{project.sections.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</section>{slug === 'econ-mom' && <Recognition />}<SiteFooter /></main>;
}
