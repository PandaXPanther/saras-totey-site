import React from 'react';
import { routes } from '../data/routes.js';

const compactLabels = { '/att-agency': 'ATT', '/economics': 'Econ', '/misc': 'Misc' };

export default function Nav({ pathname }) {
  return (
    <nav className="glass-nav" data-tone={pathname === '/quant' || pathname === '/misc' ? 'dark' : undefined} aria-label="Portfolio pages">
      {Object.entries(routes).map(([href, { label, short }]) => (
        <a key={href} href={href} aria-label={label} aria-current={pathname === href ? 'page' : undefined}>
          <span className="nav-full">{label}</span>
          <span className="nav-short">{compactLabels[href] || short || label}</span>
        </a>
      ))}
    </nav>
  );
}
