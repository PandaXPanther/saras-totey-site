import React from 'react';

export const PROJECT_LINKS = [
  { href: '/', label: 'World' },
  { href: '/quant', label: 'Quant' },
  { href: '/econ-mom', label: 'econ.mom' },
  { href: '/local-ledger', label: 'Local Ledger' },
  { href: '/att-agency', label: 'ATT' },
];

export default function Nav() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  return (
    <nav className="glass-nav" aria-label="Project pages">
      {PROJECT_LINKS.map((link) => <a key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</a>)}
    </nav>
  );
}
