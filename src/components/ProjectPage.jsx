import React from 'react';
import { IDENTITY, SYSTEMS } from '../data/content.js';
import { useTradingFeeds } from '../data/useTradingFeeds.js';
import { Economics, Agency, Roblox, Misc } from './PortfolioPages.jsx';
import System from '../sections/System.jsx';
import Backtest from '../sections/Backtest.jsx';
import Live from '../sections/Live.jsx';
import Roadmap from '../sections/Roadmap.jsx';
import Hero from '../sections/Hero.jsx';
import Thesis from '../sections/Thesis.jsx';
import Footer from '../sections/Footer.jsx';

const pages = { economics: Economics, 'att-agency': Agency, roblox: Roblox, misc: Misc };
const footerLinks = [
  ['GitHub', `https://github.com/${IDENTITY.github_user}`],
  ['LinkedIn', IDENTITY.linkedin],
  ['Instagram', IDENTITY.instagram],
  ['Buy Me a Coffee', IDENTITY.bmc],
];

function SiteFooter() {
  return (
    <footer className="folio-wrap site-footer">
      <a href="/">Saras Totey</a>
      <nav aria-label="Social links">{footerLinks.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>
      ))}</nav>
    </footer>
  );
}

function BackToProjects() {
  return <div className="folio-wrap project-return"><a href="/" data-back-to-projects="true">Back to selected work</a></div>;
}

function QuantPage({ canReturnToWorld }) {
  const { dashboard, signals } = useTradingFeeds();
  return <main className="project-page project-page--quant">
    {canReturnToWorld && <BackToProjects />}
    <Hero /><Thesis />
    {SYSTEMS.map((system) => <System key={system.slug} system={system} dashboard={dashboard} liveSignals={signals.cards} />)}
    <Backtest dashboard={dashboard} />
    <Live dashboard={dashboard} signals={signals} />
    <Roadmap /><Footer />
  </main>;
}

export default function ProjectPage({ slug, canReturnToWorld = false }) {
  if (slug === 'quant') return <QuantPage canReturnToWorld={canReturnToWorld} />;
  const Page = Object.hasOwn(pages, slug) ? pages[slug] : null;
  return (
    <main className={`project-page ${Page ? `project-page--${slug}` : 'project-page--missing'}`}>
      {canReturnToWorld && <BackToProjects />}
      {Page ? <Page /> : <header className="folio-wrap page-heading">
        <h1 className="folio-serif">Page not found.</h1>
        <a className="folio-button" href="/">Return home</a>
      </header>}
      <SiteFooter />
    </main>
  );
}
