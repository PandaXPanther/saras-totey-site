import React, { lazy, Suspense, useRef, useState } from 'react';
import { games as trainingGames } from '../chess/profile.json';
import '../styles/chess.css';

const ChessGame = lazy(() => import('./ChessGame.jsx'));

export default function ChessChallenge() {
  const [side, setSide] = useState('w');
  const [control, setControl] = useState('blitz');
  const [game, setGame] = useState(null);
  const start = useRef(null);
  const id = useRef(0);

  function begin() {
    const player = side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
    setGame({ player, control, id: ++id.current });
  }

  function close() {
    setGame(null);
    requestAnimationFrame(() => start.current?.focus({ preventScroll: true }));
  }

  return <section className="saras-chess" aria-labelledby="saras-chess-heading">
    <header className="saras-chess__header" data-open={Boolean(game)}>
      <div>
        <p className="folio-kicker">skibidisarz · ~1750</p>
        <h2 id="saras-chess-heading">Play me in chess.</h2>
        {!game && <p>Play Totally Real Saras, the bot built from my {trainingGames} rated games. It looks for sacrifices and talks a little shit.</p>}
      </div>
      {!game && <div className="saras-chess__art" aria-hidden="true"><span>♞</span></div>}
    </header>
    {game ? <Suspense fallback={<p className="saras-chess__loading" role="status">Setting up the board…</p>}>
      <ChessGame key={game.id} player={game.player} control={game.control} onRestart={begin} onClose={close} />
    </Suspense> : <div className="saras-chess__setup">
      <label>Play as
        <select value={side} onChange={(event) => setSide(event.target.value)}>
          <option value="w">White</option><option value="b">Black</option><option value="random">Random</option>
        </select>
      </label>
      <label>Time control
        <select value={control} onChange={(event) => setControl(event.target.value)}>
          <option value="blitz">5 + 3 Blitz</option><option value="rapid">10 min Rapid</option><option value="untimed">Untimed</option>
        </select>
      </label>
      <button type="button" ref={start} className="saras-chess__primary" onClick={begin}>Start chess game</button>
    </div>}
    <footer className="saras-chess__attribution">
      <a href="/chess-engine/NOTICE.txt" target="_blank" rel="noreferrer">Stockfish 19 Lite · engine source</a>
    </footer>
  </section>;
}
