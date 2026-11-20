import React, { useState } from 'react';
import { grades } from '../chess/strategy.js';
import { botName } from '../chess/banter.js';
import { ReviewPerformance, ReviewProgress } from './ChessReviewResult.jsx';
import { EvaluationGraph, evaluationText, evaluationMeaning } from './ChessEvaluation.jsx';

const keyGrades = new Set(['Brilliant', 'Great', 'Mistake', 'Miss', 'Blunder']);
const moveNotation = (ply, san) => Math.ceil(ply / 2) + (ply % 2 ? '. ' : '... ') + san;

export function Grade({ grade, iconOnly = false }) {
  return <span className="saras-chess__grade" data-grade={grade} title={iconOnly ? grade : undefined}>
    <span aria-hidden="true">{grades[grade]}</span><span className={iconOnly ? 'saras-chess__visually-hidden' : undefined}>{grade}</span>
  </span>;
}

function GradeSummary({ outcomes, onGrade }) {
  return (
    <table className="saras-chess__scores">
      <thead><tr><th scope="col">Move quality</th>{outcomes.map(({ color, label }) =>
        <th key={color} scope="col">{label}</th>)}</tr></thead>
      <tbody>
        {Object.keys(grades).map((grade) => <tr key={grade}>
          <th scope="row"><Grade grade={grade} /></th>
          {outcomes.map(({ color, rows }) => {
            const matching = rows.filter((row) => row.grade === grade);
            return <td key={color}>{matching.length > 0
              ? <button type="button" aria-label={matching.length + ' ' + grade + ' moves by ' + (color === outcomes[0].color ? 'you' : botName)}
                  onClick={() => onGrade(matching[0].ply)}>{matching.length}</button>
              : <span>0</span>}</td>;
          })}
        </tr>)}
      </tbody>
    </table>
  );
}

function MoveFeedback({ choice, move, position, player, practice, onPractice, onLineStep }) {
  const best = practice?.mode === 'best';
  const retry = practice?.mode === 'retry';
  return (
    <div className="saras-chess__coach" aria-live="polite">
      <div className="saras-chess__coach-heading">
        <h4>{moveNotation(position, move.san)}</h4>
        <Grade grade={choice.grade} />
      </div>
      <p>{choice.explanation}</p>
      {choice.evaluation.kind === 'mate' && <p><strong>{evaluationMeaning(choice.evaluation)}</strong></p>}
      <div className="saras-chess__compare">
        <div><small>Played</small><strong>{move.san}</strong><span title={evaluationMeaning(choice.evaluation)}>{evaluationText(choice.evaluation)}</span></div>
        <div><small>Best move</small><strong>{choice.bestMove}</strong><span title={evaluationMeaning(choice.bestEvaluation)}>{evaluationText(choice.bestEvaluation)}</span></div>
      </div>
      <div className="saras-chess__review-actions">
        <button type="button" aria-pressed={best} onClick={() => onPractice('best')}>
          {best ? 'Show played move' : 'Show best move'}
        </button>
        {move.color === player && <button type="button" aria-pressed={retry}
          onClick={() => onPractice('retry')}>{retry ? 'Exit replay' : 'Replay this move'}</button>}
      </div>
      {best && <div className="saras-chess__line">
        <strong>Best line</strong>
        <div role="group" aria-label="Best line">
          {choice.continuation.map(({ san }, index) => (
            <button type="button" key={index} aria-pressed={practice.step === index + 1}
              onClick={() => onLineStep(index + 1)}>{san}</button>
          ))}
        </div>
      </div>}
      {retry && <p role="status">{!practice.move ? 'Find the best move on the board.'
        : practice.move.lan === choice.suggested ? 'You found the best move.'
          : `You played ${practice.move.san}. The engine preferred ${choice.bestMove}.`}</p>}
    </div>
  );
}

export default function ChessGameReview({ moves, position, onPosition, player, review, outcomes, practice, onPractice, onLineStep }) {
  const [view, setView] = useState('moves');
  const [filter, setFilter] = useState('both');
  const { data } = review;

  const assessed = data.map((row, index) => ({ ...row, ply: index + 1, move: moves[index] }));
  const keys = assessed.filter(({ move, grade }) =>
    (keyGrades.has(grade) || move.san.endsWith('#')) &&
    (filter === 'both' || (filter === 'you') === (move.color === player)));
  const next = keys.find(({ ply }) => ply > position);
  const previous = keys.findLast(({ ply }) => ply < position);
  const chosen = data[position - 1];

  function openMove(ply) {
    onPosition(ply);
    setView('moves');
  }

  return (
    <div className="saras-chess__review">
      <h3>Game review</h3>
      <div className="saras-chess__review-switch" role="group" aria-label="Review view">
        <button type="button" aria-pressed={view === 'summary'} onClick={() => setView('summary')}>Summary</button>
        <button type="button" aria-pressed={view === 'moves'} onClick={() => setView('moves')}>Move analysis</button>
      </div>
      <ReviewProgress review={review} />
      {data.length > 0 && <EvaluationGraph data={data} moves={moves} position={position} onPosition={onPosition} />}
      {view === 'summary' && <>
        <ReviewPerformance outcomes={outcomes} complete={review.complete} />
        {data.length > 0 && <>
          <button type="button" className="saras-chess__primary saras-chess__begin-review"
            onClick={() => openMove(keys[0]?.ply ?? 1)}>{keys.length ? 'Review key moves' : 'Review moves'}</button>
          <GradeSummary outcomes={outcomes} onGrade={openMove} />
        </>}
      </>}
      {view === 'moves' && <>
        <div className="saras-chess__key-controls" role="group" aria-label="Key moves">
          <label>Key moves
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="both">Both players</option><option value="you">Your moves</option><option value="bot">Saras’s moves</option>
            </select>
          </label>
          <button type="button" disabled={!previous} onClick={() => onPosition(previous.ply)}>Previous key</button>
          <button type="button" disabled={!next} onClick={() => onPosition(next.ply)}>Next key</button>
        </div>
        {chosen ? <MoveFeedback choice={chosen} move={moves[position - 1]} position={position} player={player}
          practice={practice} onPractice={onPractice} onLineStep={onLineStep} />
          : <p className="saras-chess__review-empty">{position === 0 ? 'Select a move to see its analysis.' : 'Analysis is pending for this move.'}</p>}
      </>}
    </div>
  );
}
