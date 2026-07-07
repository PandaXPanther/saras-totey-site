import React from 'react';
import Nav from './components/Nav.jsx';
import Hero from './sections/Hero.jsx';
import Thesis from './sections/Thesis.jsx';
import System from './sections/System.jsx';
import Backtest from './sections/Backtest.jsx';
import Other from './sections/Other.jsx';
import Awards from './sections/Awards.jsx';
import Footer from './sections/Footer.jsx';
import { SYSTEMS } from './data/content.js';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Thesis />
        {SYSTEMS.map((s, i) => (
          <System key={s.slug} system={s} flipped={i % 2 === 1} />
        ))}
        <Backtest />
        <Other />
        <Awards />
        <Footer />
      </main>
    </>
  );
}
