import React, { useEffect, useState } from 'react';
import { createEngine } from '../chess/engine.js';
import { grades, reviewMove } from '../chess/strategy.js';
import { botName } from '../chess/banter.js';

const keyGrades = new Set(['Brilliant', 'Great', 'Mistake', 'Miss', 'Blunder']);

export function Grade({ grade }) {
  return <span className="saras-chess__grade" data-grade={grade}><span aria-hidden="true">{grades[grade]}</span> {grade}</span>;
}

const evaluationText = ({ kind, score }) => {
  if (kind === 'mate') return (score >= 0 ? '+' : '−') + 'M' + Math.abs(score);
  return (score >= 0 ? '+' : '−') + (Math.abs(score) / 100).toFixed(2);
};

export default function ChessGameReview({ moves, position, onPosition, player, data, onData, practice, onPractice }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let engine;
    async function analyze() {
      try {
        engine = createEngine();
        await engine.ready;
        for (let index = data.length; index < moves.length; index++) {
          const rating = await reviewMove(engine, moves[index], moves.slice(0, index).map((move) => move.lan));
          if (!active) return;
          onData((rows) => [...rows, rating]);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        engine?.close();
      }
    }
    if (data.length < moves.length) void analyze();
    return () => { active = false; engine?.close(); };
  }, [attempt, moves, onData]);

  const chosen = data[position - 1];
  const complete = data.length === moves.length;
  const marks = Object.keys(grades).filter((grade) => data.some((row) => row.grade === grade));
  const next = data.findIndex((row, index) => index >= position && keyGrades.has(row.grade));
  const first = data.findIndex((row) => keyGrades.has(row.grade));
  const nextKey = (next >= 0 ? next : first) + 1;
  const sideRows = (side) => data.filter((_, index) => moves[index].color === side);
  const summary = [player, player === 'w' ? 'b' : 'w'].map((color) => {
    const rows = sideRows(color);
    const accuracy = rows.length
      ? (rows.reduce((sum, row) => sum + row.accuracy, 0) / rows.length).toFixed(1) : '—';
    return { color, label: color === player ? 'You' : botName, rows, accuracy };
  });

  return (
    <div className="saras-chess__review">
      <h3>Game review</h3>
      {!complete && <div className="saras-chess__review-progress">
        <span role="status">{failed ? 'Analysis paused.' : `Analyzing ${data.length} of ${moves.length} moves…`}</span>
        {failed ? <button type="button" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>Resume analysis</button>
          : <progress aria-label="Review progress" value={data.length} max={moves.length} />}
      </div>}
      {data.length > 0 && <>
        <div className="saras-chess__graph" role="group" aria-label="Evaluation by move">
          <div><span>Evaluation by move</span><small>White ↑ · Black ↓</small></div>
          <div className="saras-chess__eval-bars">
            {data.map(({ whiteChance, evaluation }, index) => (
              <button key={index} type="button" title={moves[index].san + ' ' + evaluationText(evaluation)}
                aria-label={`Position after ${moves[index].san}, ${evaluationText(evaluation)}`}
                aria-pressed={position === index + 1} onClick={() => onPosition(index + 1)}>
                <span data-white={whiteChance >= 0.5} style={{ '--advantage': `${Math.abs(whiteChance - 0.5) * 100}%` }} />
              </button>
            ))}
          </div>
        </div>
        <table className="saras-chess__scores">
          <thead><tr><th scope="col">Move quality</th>{summary.map(({ color, label }) =>
            <th key={color} scope="col">{label}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Est. accuracy</th>{summary.map(({ color, accuracy }) =>
              <td className="saras-chess__accuracy" key={color}>{accuracy}</td>)}</tr>
            {marks.map((grade) => <tr key={grade}>
              <th scope="row"><Grade grade={grade} /></th>
              {summary.map(({ color, rows }) => <td key={color}>{rows.filter((row) => row.grade === grade).length}</td>)}
            </tr>)}
          </tbody>
        </table>
        {nextKey > 0 && <button type="button" onClick={() => onPosition(nextKey)}>Next key moment</button>}
      </>}
      {chosen && (
        <div className="saras-chess__coach" aria-live="polite">
          <div><b>{moves[position - 1].san}</b> <Grade grade={chosen.grade} /> <span>{evaluationText(chosen.evaluation)}</span></div>
          <p>{chosen.explanation}</p>
          <p><strong>Best line</strong> {chosen.bestLine}</p>
          <div className="saras-chess__review-actions">
            <button type="button" aria-pressed={practice?.mode === 'best'} onClick={() => onPractice('best')}>
              {practice?.mode === 'best' ? 'Show played move' : 'Show best move'}
            </button>
            {moves[position - 1].color === player && <button type="button" aria-pressed={practice?.mode === 'retry'}
              onClick={() => onPractice('retry')}>{practice?.mode === 'retry' ? 'Exit replay' : 'Replay this move'}</button>}
          </div>
          {practice?.mode === 'retry' && <p role="status">{!practice.move ? 'Find the best move on the board.'
            : practice.move.lan === chosen.suggested ? 'You found the best move.'
              : `You played ${practice.move.san}. Stockfish preferred ${chosen.bestMove}.`}</p>}
        </div>
      )}
    </div>
  );
}
