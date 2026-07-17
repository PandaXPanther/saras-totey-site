import React from 'react';

export const PROJECT_LINKS = [
  { href: '/home', label: 'Home', mobileLabel: 'Home' },
  { href: '/', label: 'Trading systems', mobileLabel: 'Trading' },
  { href: '/econ-mom', label: 'econ.mom', mobileLabel: 'Econ' },
  { href: '/local-ledger', label: 'Local Ledger', mobileLabel: 'Ledger' },
  { href: '/att-agency', label: 'ATT Agency', mobileLabel: 'ATT' },
];

export default function Nav({ pathname = '/' }) {
  return (
    <nav className="glass-nav" aria-label="Project pages">
      {PROJECT_LINKS.map((link) => <a key={link.href} href={link.href} aria-label={link.label} aria-current={pathname === link.href ? 'page' : undefined}><span className="nav-label--desktop">{link.label}</span><span className="nav-label--mobile">{link.mobileLabel}</span></a>)}
    </nav>
  );
}
