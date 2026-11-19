import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/portfolio.css';
import './styles/scroll-world.css';
import App from './App.jsx';

const root = document.getElementById('root');

createRoot(root).render(<App />);
