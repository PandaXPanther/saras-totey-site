import React from 'react';
import Nav from './components/Nav.jsx';
import Hero from './sections/Hero.jsx';
import Thesis from './sections/Thesis.jsx';
import System from './sections/System.jsx';
import Backtest from './sections/Backtest.jsx';
import Live from './sections/Live.jsx';
import Roadmap from './sections/Roadmap.jsx';
import Other from './sections/Other.jsx';
import Awards from './sections/Awards.jsx';
import Footer from './sections/Footer.jsx';
import AudioControl from './components/AudioControl.jsx';
import CulturalWorld from './components/CulturalWorld.jsx';
import { SYSTEMS } from './data/content.js';

export default function App() {
  return (
    <>
      <Nav />
      <AudioControl />
      <CulturalWorld />
      <main>
        <div data-world="japan"><Hero /><Thesis /></div>
        <div data-world="trading">
          {SYSTEMS.map((s, i) => <System key={s.slug} system={s} flipped={i % 2 === 1} />)}
          <Backtest /><Live /><Roadmap />
        </div>
        <div data-world="bridge"><Other /></div>
        <div data-world="india"><Awards /><Footer /></div>
      </main>
    </>
  );
}
