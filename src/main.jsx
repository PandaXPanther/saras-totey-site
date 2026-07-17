import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';

const root = document.getElementById('root');

if (root.hasChildNodes() && window.location.pathname === '/') {
  hydrateRoot(root, <App />);
} else {
  createRoot(root).render(<App />);
}
