import React, { useEffect, useState } from 'react';
import Nav from './components/Nav.jsx';
import AudioControl from './components/AudioControl.jsx';
import ScrollWorld from './components/ScrollWorld.jsx';
import ProjectPage from './components/ProjectPage.jsx';

const metadata = {
  '/': ['Saras Totey · Developer, researcher, and builder', 'Meet Saras Totey, a Boulder full-stack developer building trading bots, economics tools, public-data products, and websites.', '/og-saras-totey.png?v=3'],
  '/quant': ['Trading systems · Saras Totey', 'Independent trading systems built by Saras Totey: live CS2 arbitrage, prediction-market research, and transparent quantitative experiments.', '/og-saras-totey.png?v=3'],
  '/econ-mom': ['Econ.mom · Saras Totey', 'Twelve free, interactive economics tools with formulas, explanations, and every dataset cited.', '/og-saras-totey.png?v=3'],
  '/local-ledger': ['local-ledger.net · Saras Totey', 'A nationwide economic observatory and simulator covering every state, 3,143 counties, and 120 metro areas.', '/og-saras-totey.png?v=3'],
  '/att-agency': ['ATT Agency · Saras Totey', 'Saras Totey’s work co-founding ATT Agency and shipping brands, websites, video, ads, and analytics.', '/og-saras-totey.png?v=3'],
};

const setMeta = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);

export default function App({ initialPath = '/' }) {
  const [path, setPath] = useState(() => typeof window === 'undefined' ? initialPath : (window.location.pathname.replace(/\/$/, '') || '/'));
  useEffect(() => {
    const sync = () => setPath(window.location.pathname.replace(/\/$/, '') || '/');
    const navigate = (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      const restoreWorld = link.dataset.restoreWorld === 'true';
      const fromWorld = link.dataset.worldCta === 'true';
      const savedWorldSnapshot = sessionStorage.getItem('saras-world-snapshot');
      const returnSnapshot = window.history.state?.worldReturnSnapshot;
      const nextState = restoreWorld && returnSnapshot
        ? { worldSnapshot: returnSnapshot }
        : fromWorld && savedWorldSnapshot
          ? { worldReturnSnapshot: JSON.parse(savedWorldSnapshot) }
          : {};
      window.history.pushState(nextState, '', `${url.pathname}${url.search}${url.hash}`);
      sync();
      if (!restoreWorld) window.scrollTo(0, 0);
    };
    addEventListener('popstate', sync);
    document.addEventListener('click', navigate);
    return () => { removeEventListener('popstate', sync); document.removeEventListener('click', navigate); };
  }, []);
  useEffect(() => {
    const [title, description, image] = metadata[path] || metadata['/'];
    const canonical = `https://sarastotey.com${path === '/' ? '/' : path}`;
    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[property="og:image"]', `https://sarastotey.com${image}`);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', `https://sarastotey.com${image}`);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  }, [path]);
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Nav pathname={path} />
      <AudioControl />
      <div id="main-content">{path === '/' ? <ScrollWorld /> : <ProjectPage slug={path.slice(1)} canReturnToWorld={typeof window !== 'undefined' && Boolean(window.history.state?.worldReturnSnapshot)} />}</div>
    </>
  );
}
