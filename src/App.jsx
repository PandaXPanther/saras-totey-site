import React, { useEffect, useState } from 'react';
import Nav from './components/Nav.jsx';
import AudioControl from './components/AudioControl.jsx';
import ScrollWorld from './components/ScrollWorld.jsx';
import ProjectPage from './components/ProjectPage.jsx';

const metadata = {
  '/': ['Saras Totey — Boulder Developer and Quant Researcher', 'Meet Saras Totey, a Boulder full-stack developer building trading bots, economics tools, public-data products, and websites.', '/og-saras-totey.png?v=3'],
  '/quant': ['Quantitative Trading Systems and Research | Saras Totey', 'Explore Saras Totey’s independent quantitative trading systems, including live CS2 arbitrage, prediction-market research, and documented experiments.', '/og-saras-totey.png?v=3'],
  '/econ-mom': ['Free Interactive Economics Tools | Econ.mom by Saras Totey', 'Explore 12 free interactive economics tools built by Saras Totey, with visible formulas, clear explanations, and every underlying dataset cited.', '/og-saras-totey.png?v=3'],
  '/local-ledger': ['Local Economic Data Dashboard | Local Ledger by Saras Totey', 'Explore Saras Totey’s local economic data dashboard and simulator covering jobs, housing, schools, and public spending across U.S. counties and metros.', '/og-saras-totey.png?v=3'],
  '/att-agency': ['Web Design and Development Work | ATT Agency · Saras Totey', 'See Saras Totey’s work co-founding ATT Agency and delivering brand strategy, web design, development, video, advertising, and measurement systems.', '/og-saras-totey.png?v=3'],
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
