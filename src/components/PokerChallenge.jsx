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
              <p>Take a seat at my table. We each start with 1,000 play chips in heads-up no-limit Texas Hold’em.</p>
              <p className="saras-poker__inspiration">The train doors and 4:11 clock are a nod to Kinji Hakari’s domain in <cite>Jujutsu Kaisen</cite>.</p>
              <button type="button" className="saras-poker__primary" ref={start} onClick={() => setOpen(true)}>Deal me in</button>
            </>}
          </div>
          {!open && <figure className="saras-poker__art" aria-label="Hakari’s Idle Death Gamble, with Pure Love Train doors and a 4:11 jackpot clock">
            <figcaption>Idle Death Gamble</figcaption>
            <span className="saras-poker__train-line">Private Pure Love Train</span>
            <div className="saras-poker__doors" aria-hidden="true"><span /><span /><i /></div>
            <span className="saras-poker__clock">4:11</span>
          </figure>}
        </header>
        {open && <Suspense fallback={<p role="status">Dealing cards…</p>}>
          <PokerGame onClose={close} />
        </Suspense>}
      </div>
    </section>
  );
}
