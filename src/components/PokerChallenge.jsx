import React, { lazy, Suspense, useRef, useState } from 'react';
import '../styles/poker.css';

const PokerGame = lazy(() => import('./PokerGame.jsx'));

export default function PokerChallenge() {
  const [open, setOpen] = useState(false);
  const start = useRef(null);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => start.current?.focus({ preventScroll: true }));
  }

  return (
    <section id="poker" className="folio-wrap misc-poker" aria-labelledby="poker-heading">
      <div className="saras-poker">
        <header className="saras-poker__header" data-open={open}>
          <div>
            <p className="folio-kicker">Heads-up Hold’em · Play chips</p>
            <h2 id="poker-heading">Play me in poker.</h2>
            {!open && <>
              <p>Take on Totally Real Saras in no-limit Texas Hold’em. I like big pots, bold bluffs, and making you pay to see the river.</p>
              <p className="saras-poker__inspiration">The jackpot is a nod to Kinji Hakari from <cite>Jujutsu Kaisen</cite>.</p>
              <button type="button" className="saras-poker__primary" ref={start} onClick={() => setOpen(true)}>Deal me in</button>
            </>}
          </div>
          {!open && <div className="saras-poker__art" aria-hidden="true">
            <div className="saras-poker__reels"><span>7</span><span>7</span><span>7</span></div>
            <div className="saras-poker__art-suit">♠</div>
          </div>}
        </header>
        {open && <Suspense fallback={<p role="status">Dealing cards…</p>}>
          <PokerGame onClose={close} />
        </Suspense>}
      </div>
    </section>
  );
}
