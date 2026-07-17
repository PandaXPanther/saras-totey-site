import React from 'react';

export const PROJECT_LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/', label: 'Trading systems' },
  { href: '/econ-mom', label: 'econ.mom' },
  { href: '/local-ledger', label: 'Local Ledger' },
  { href: '/att-agency', label: 'ATT Agency' },
];

export default function Nav({ pathname = '/' }) {
  return (
    <nav className="glass-nav" aria-label="Project pages">
      {PROJECT_LINKS.map((link) => <a key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</a>)}
    </nav>
  );
}
