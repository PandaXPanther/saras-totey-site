import React, { useEffect, useLayoutEffect, useState } from 'react';
import Nav from './components/Nav.jsx';
import AudioControl from './components/AudioControl.jsx';
import ScrollWorld from './components/ScrollWorld.jsx';
import ProjectPage from './components/ProjectPage.jsx';
import { cleanPath, canonicalPath, routes } from './data/routes.js';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const setMeta = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);

function readLocation() {
  return { path: canonicalPath(location.pathname), hash: location.hash, ...history.state };
}

export default function App({ initialPath = '/' }) {
  const [entry, setEntry] = useState(() => typeof window === 'undefined' ? { path: initialPath } : readLocation());
  const { path, hash, y, returnY } = entry;

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const normalized = cleanPath(location.pathname);
    const canonical = canonicalPath(normalized);
    if (normalized !== canonical) history.replaceState(history.state, '', canonical + location.search + location.hash);

    const sync = () => setEntry(readLocation());
    const navigate = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element && event.target.closest('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      const nextPath = canonicalPath(url.pathname);
      const currentPath = canonicalPath(location.pathname);
      if (nextPath === currentPath && url.hash) return;

      event.preventDefault();
      const position = window.scrollY;
      const destination = link.dataset.backToProjects ? history.state?.returnY : undefined;
      const selectedWork = currentPath === '/' && link.dataset.workLink === 'true';
      history.replaceState({ ...history.state, y: position }, '');
      history.pushState({ y: url.hash ? undefined : destination ?? 0, returnY: selectedWork ? position : undefined }, '', nextPath + url.search + url.hash);
      sync();
    };

    window.addEventListener('popstate', sync);
    document.addEventListener('click', navigate);
    return () => {
      history.scrollRestoration = previousRestoration;
      window.removeEventListener('popstate', sync);
      document.removeEventListener('click', navigate);
    };
  }, []);

  useBrowserLayoutEffect(() => {
    if (Number.isFinite(y)) {
      window.scrollTo(0, y);
    } else if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    }
  }, [entry]);

  useEffect(() => {
    const { title, description } = routes[path] || routes['/'];
    const canonical = `https://sarastotey.com${path}`;
    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  }, [path]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Nav pathname={path} />
      <AudioControl />
      <div id="main-content" tabIndex={-1}>
        {path === '/' ? <ScrollWorld /> : <ProjectPage slug={path.slice(1)} canReturnToWorld={Number.isFinite(returnY)} />}
      </div>
    </>
  );
}
