import React, { useEffect, useRef } from 'react';

export function ReviewProgress({ review }) {
  if (review.complete) return null;
  return (
    <div className="saras-chess__review-progress">
      <span role="status">{review.failed ? 'Analysis paused.' : `Analyzing ${review.data.length} of ${review.total} moves…`}</span>
      {review.failed ? <button type="button" onClick={review.retry}>Resume analysis</button>
        : <progress aria-label="Review progress" value={review.data.length} max={review.total} />}
    </div>
  );
}

export function ReviewPerformance({ outcomes, complete }) {
  return (
    <>
      <div className="saras-chess__accuracy-cards" role="group" aria-label="Performance estimates">
        {outcomes.map(({ color, label, accuracy, rating }) => (
          <div key={color} className="saras-chess__performance-card">
            <span>{label}</span>
            <dl>
              <div>
                <dt>Estimated Elo</dt>
                <dd aria-label={`${label === 'You' ? 'Your' : label} estimated Elo`}>
                  {complete && rating !== null ? '~' + rating.toLocaleString('en-US') : '—'}
                </dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd>{complete && accuracy !== null ? accuracy + '%' : '—'}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      {complete && <p className="saras-chess__estimate-note">
        {outcomes.some(({ rating, weight }) => rating !== null && weight < 6)
          ? 'Limited sample. These Elo estimates only reflect this game.'
          : 'Elo estimates reflect move quality in this game.'}
      </p>}
    </>
  );
}

export default function ChessReviewResult({ result, review, outcomes, onReview, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { if (!dialog.current.open) dialog.current.showModal(); }, []);

  return (
    <dialog ref={dialog} className="saras-chess__result-dialog" aria-labelledby="chess-result-heading"
      aria-describedby="chess-result-description" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <p className="saras-chess__result-outcome" id="chess-result-description">{result}</p>
      <h3 id="chess-result-heading">Game review</h3>
      <ReviewProgress review={review} />
      <ReviewPerformance outcomes={outcomes} complete={review.complete} />
      <div className="saras-chess__result-actions">
        <button type="button" className="saras-chess__primary" onClick={onReview}>Review first move</button>
        <button type="button" onClick={onClose}>View final position</button>
      </div>
    </dialog>
  );
}
