import React from 'react';
import { routes } from '../data/routes.js';

export default function Nav({ pathname }) {
  return (
    <header className="portfolio-nav" data-theme={pathname === '/quant' || pathname === '/att-agency' ? 'dark' : 'light'}>
      <div className="folio-wrap portfolio-nav__inner">
        <a className="portfolio-wordmark" href="/" aria-label="Saras Totey, home">ST<span>.</span></a>
        <nav aria-label="Portfolio pages">
          {Object.entries(routes).map(([href, { label, short }]) => (
            <a key={href} href={href} aria-label={label} aria-current={pathname === href ? 'page' : undefined}>
              <span className="nav-full">{label}</span><span className="nav-short">{short || label}</span>
            </a>
          ))}
        </nav>
        <a className="portfolio-nav__contact" href="/#contact">Contact</a>
      </div>
    </header>
  );
}
