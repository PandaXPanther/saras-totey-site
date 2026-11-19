import React, { useEffect, useState } from 'react';

const profile = 'https://www.chess.com/member/skibidisarz';
const stats = 'https://api.chess.com/pub/player/skibidisarz/stats';
const formats = [['chess_rapid', 'Rapid'], ['chess_blitz', 'Blitz'], ['chess_bullet', 'Bullet'], ['chess_daily', 'Daily']];

export default function ChessRatings() {
  const [result, setResult] = useState({ ratings: null, checkedAt: null, unavailable: false });

  useEffect(() => {
    let pending;
    let lastRequest = 0;
    let disposed = false;

    async function refresh() {
      if (disposed || pending || document.hidden || Date.now() - lastRequest < 60_000) return;
      lastRequest = Date.now();
      pending = new AbortController();
      const timeout = setTimeout(() => pending?.abort(), 6000);
      try {
        const response = await fetch(stats, { signal: pending.signal });
        if (!response.ok) throw new Error('Chess.com ratings unavailable');
        const data = await response.json();
        const ratings = formats.flatMap(([key, label]) => {
          const rating = data[key]?.last?.rating;
          return Number.isInteger(rating) && rating > 0 ? [{ label, rating }] : [];
        });
        if (!disposed) setResult({ ratings, checkedAt: new Date(), unavailable: false });
      } catch {
        if (!disposed) setResult((previous) => ({ ...previous, unavailable: true }));
      } finally {
        clearTimeout(timeout);
        pending = undefined;
      }
    }

    refresh();
    const interval = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      disposed = true;
      pending?.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const { ratings, checkedAt, unavailable } = result;
  return (
    <section id="chess" className="folio-wrap misc-chess" aria-labelledby="chess-heading">
      <div className="chess-panel">
        <div>
          <p className="folio-kicker">Chess.com · skibidisarz</p>
          <h2 id="chess-heading">Chess ratings</h2>
          <a className="folio-link" href={profile} target="_blank" rel="noreferrer">View my games <span aria-hidden="true">↗</span></a>
        </div>
        <div className="chess-panel__ratings" aria-live="polite">
          {ratings?.length > 0 && <dl>
            {ratings.map(({ label, rating }) => <div key={label}><dt>{label}</dt><dd>{rating.toLocaleString('en-US')}</dd></div>)}
          </dl>}
          {unavailable ? <p>{checkedAt ? 'Last successful check' : 'Ratings are temporarily unavailable.'}</p>
            : ratings === null ? <p>Loading Chess.com ratings…</p>
              : ratings.length === 0 ? <p>No rated results published yet.</p> : <p>Last checked</p>}
          {checkedAt && <time dateTime={checkedAt.toISOString()}>{checkedAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>}
        </div>
      </div>
    </section>
  );
}
