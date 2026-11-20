import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { botName } from '../chess/banter.js';
import { MATERIAL_VALUE, materialBalance, opposite, PIECE_NAME, turnName } from '../chess/model.js';
import { grades } from '../chess/strategy.js';
import { timeControls, useChessMatch } from '../chess/useChessMatch.js';
import { Board, Captures, Piece } from './ChessBoard.jsx';
import ChessGameReview, { Grade } from './ChessGameReview.jsx';
import { BoardEvaluation } from './ChessEvaluation.jsx';

function Clock({ time, active }) {
  if (time == null) return null;
  const seconds = Math.ceil(time / 1000);
  return <span className="saras-chess__clock" data-active={active} data-low={seconds <= 15}>
    {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
  </span>;
}

function Player({ color, player, moves, clocks, active, material }) {
  const isPlayer = color === player;
  return <div className="saras-chess__player" data-active={active}>
    {isPlayer ? <span className="saras-chess__avatar saras-chess__avatar--you"><Piece color={color} type="k" /></span>
      : <img className="saras-chess__avatar" src="/saras-headshot.jpg" width="42" height="42" alt="" />}
    <div className="saras-chess__identity">
      <strong>{isPlayer ? 'You' : botName}</strong>
      <span>{turnName(color)}{!isPlayer && ' · ~1750'}</span>
    </div>
    <Captures moves={moves} color={color} />
    {material > 0 && <span className="saras-chess__material"
      aria-label={`${color === 'w' ? 'White' : 'Black'} material advantage +${material}`}>+{material}</span>}
    <Clock time={clocks?.[color]} active={active} />
  </div>;
}

function MoveList({ moves, data, position, setPosition }) {
  const active = useRef(null);
  useEffect(() => {
    const button = active.current;
    const list = button?.closest('.saras-chess__moves');
    if (!list) return;
    if (button.offsetTop < list.scrollTop) list.scrollTop = button.offsetTop;
    else if (button.offsetTop + button.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = button.offsetTop + button.offsetHeight - list.clientHeight;
    }
  }, [position]);

  return <div className="saras-chess__moves" aria-label="Move list">
    {moves.length === 0 && <p>Moves will appear here.</p>}
    {moves.map((move, index) => index % 2 === 0 && <div className="saras-chess__move-row" key={index}>
      <span>{index / 2 + 1}.</span>
      {moves.slice(index, index + 2).map(({ san }, offset) => {
        const row = index + offset;
        const selected = position === row + 1;
        return (
          <button key={row} ref={selected ? active : null} type="button" aria-pressed={selected} onClick={() => setPosition(row + 1)}>
            {san} {data[row] && <Grade grade={data[row].grade} iconOnly />}
          </button>
        );
      })}
    </div>)}
  </div>;
}

function Chat({ rows, send }) {
  const [input, setInput] = useState('');
  const history = useRef(null);
  useEffect(() => {
    history.current.scrollTop = history.current.scrollHeight;
  }, [rows]);

  return <section className="saras-chess__chat" aria-label="Game chat">
    <h3>Chat</h3>
    <div className="saras-chess__messages" role="log" aria-label="Chat messages" ref={history}>
      {rows.map(({ author, text }, index) => <div key={index} data-mine={author === 'You'}>
        <strong>{author}</strong><span>{text}</span>
      </div>)}
    </div>
    <form onSubmit={(event) => { event.preventDefault(); send(input); setInput(''); }}>
      <input aria-label="Chat message" placeholder="say something" value={input} maxLength={140}
        onChange={(event) => setInput(event.target.value)} />
      <button type="submit" disabled={!input.trim()}>Send</button>
    </form>
  </section>;
}

export default function ChessGame({ player, control, onRestart, onClose }) {
  const match = useChessMatch(player, control);
  const [facing, setFacing] = useState(player);
  const [selected, setSelected] = useState(null);
  const [position, setPosition] = useState(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [promotion, setPromotion] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [analysis, setAnalysis] = useState([]);
  const [practice, setPractice] = useState(null);
  const heading = useRef(null);
  const promotionDialog = useRef(null);
  const reviewHeading = useRef(null);

  const index = position ?? match.moves.length;
  const current = match.moves[index - 1];
  const review = analysis[index - 1];
  const line = practice?.mode === 'best' ? review?.continuation.slice(0, practice.step) ?? [] : [];
  const alternate = practice?.move ?? line.at(-1);
  const shownMove = practice ? alternate : current;
  const fen = practice ? (alternate?.after ?? current?.before) : current?.after;
  const board = useMemo(() => new Chess(fen), [fen]);
  const whiteMaterial = useMemo(() => materialBalance(board, 'w', MATERIAL_VALUE), [board]);
  const visibleMoves = practice
    ? [...match.moves.slice(0, index - 1), ...line, ...(practice.move ? [practice.move] : [])]
    : match.moves.slice(0, index);
  const mate = shownMove?.san.endsWith('#');
  const resultTitle = match.outcome?.winner === player ? 'You won'
    : match.outcome?.winner ? botName + ' won' : 'Draw';
  const checkmateResult = mate && !reviewing && match.outcome?.reason === 'Checkmate';
  const shownReview = practice ? analysis[index - 2] : review;
  const bestPosition = alternate && alternate.lan === review?.suggested && line.length <= 1;
  const evaluation = mate ? { kind: 'checkmate', score: shownMove.color === 'w' ? 1 : -1 }
    : bestPosition ? review.bestEvaluation
      : (!alternate && shownReview?.evaluation) || (!shownMove && index <= 1 ? { kind: 'cp', score: 0 } : undefined);
  const whiteChance = mate ? Number(shownMove.color === 'w') : bestPosition ? review.bestWhiteChance
    : (!alternate ? shownReview?.whiteChance : undefined) ?? 0.5;
  const liveTurn = match.ready && !match.outcome && !match.error && position === null && match.turn === player;
  const canPlay = !promotion && (liveTurn || (practice?.mode === 'retry' && !practice.move));
  const targets = canPlay && selected ? board.moves({ square: selected, verbose: true }).map((move) => move.to) : [];
  const suggestion = practice?.mode === 'best' && !practice.step ? review?.suggested : undefined;
  const boardGrade = reviewing && !practice && review ? { name: review.grade, symbol: grades[review.grade] } : undefined;
  const status = match.outcome
    ? resultTitle + (match.outcome.reason === 'Checkmate' ? ' by checkmate' : ' · ' + match.outcome.reason)
    : match.error ? 'Engine unavailable. Start a new game to retry.'
      : !match.ready ? 'Loading the engine…'
        : match.turn === player ? 'Your move' : 'Saras is thinking…';

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { if (promotion && !promotionDialog.current.open) promotionDialog.current.showModal(); }, [promotion]);
  useEffect(() => { if (reviewing) reviewHeading.current?.focus({ preventScroll: true }); }, [reviewing]);

  function seek(ply) {
    setSelected(null);
    setPractice(null);
    setPosition(ply < match.moves.length ? ply : null);
  }

  function submit(move) {
    if (practice) setPractice({ ...practice, move });
    else if (!match.play(move.lan)) return;
    setSelected(null);
  }

  function togglePractice(mode) {
    setSelected(null);
    setPractice(practice?.mode === mode ? null : { mode, step: 0 });
  }

  function tryMove(from, to) {
    if (!canPlay) return false;
    const options = board.moves({ square: from, verbose: true }).filter((move) =>
      move.to === to || (move.isKingsideCastle() && to === 'h' + from[1]) ||
        (move.isQueensideCastle() && to === 'a' + from[1]));
    if (!options.length) return false;
    if (options[0].promotion) setPromotion({ options });
    else submit(options[0]);
    return true;
  }

  function chooseSquare(square) {
    if (!canPlay) return;
    if (selected === square) setSelected(null);
    else if (!selected || !tryMove(selected, square)) {
      setSelected(board.get(square)?.color === board.turn() ? square : null);
    }
  }

  function openReview() {
    setReviewing(true);
    seek(match.moves.length);
  }

  function downloadPgn() {
    const game = new Chess();
    match.moves.forEach((move) => game.move(move.san));
    const result = match.outcome.winner ? (match.outcome.winner === 'w' ? '1-0' : '0-1') : '1/2-1/2';
    game.setHeader('Event', 'Play Saras');
    game.setHeader('White', player === 'w' ? 'You' : botName);
    game.setHeader('Black', player === 'b' ? 'You' : botName);
    game.setHeader('Result', result);
    const url = URL.createObjectURL(new Blob([game.pgn()], { type: 'application/x-chess-pgn' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'play-saras.pgn';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="saras-chess__studio" onKeyDown={(event) => {
      if (!reviewing || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        event.target.closest('input, select, textarea, dialog')) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const next = index + (event.key === 'ArrowLeft' ? -1 : 1);
      if (next >= 0 && next <= match.moves.length) seek(next);
    }}>
      <div className="saras-chess__topbar">
        <div tabIndex={-1} ref={heading}><strong>{timeControls[control].name}</strong><span>Play as {turnName(player)}</span></div>
        <div>
          {reviewing && <>
            <button type="button" onClick={() => { seek(match.moves.length); setReviewing(false); }}>Back to game</button>
            <button type="button" onClick={downloadPgn}>Save PGN</button>
          </>}
          <button type="button" onClick={() => setFacing(opposite(facing))}>Flip board</button>
          <button type="button" onClick={onRestart}>New game</button>
          <button type="button" onClick={onClose}>Close game</button>
        </div>
      </div>
      <div className="saras-chess__layout">
        <div className="saras-chess__stage">
          {[opposite(facing), facing].map((color, playerIndex) => (
            <React.Fragment key={playerIndex}>
              {playerIndex === 1 && <>
                <div className="saras-chess__board-with-eval" data-review={reviewing}>
                  {reviewing && <BoardEvaluation evaluation={evaluation} whiteChance={whiteChance} facing={facing} />}
                  <Board game={board} facing={facing} selected={selected}
                    last={shownMove} legal={targets} suggested={suggestion} grade={boardGrade}
                    onSelect={canPlay ? chooseSquare : undefined} onDrop={canPlay ? tryMove : undefined} />
                </div>
                {checkmateResult && <div className="saras-chess__board-result" aria-hidden="true">
                  <strong>Checkmate</strong><span>{resultTitle}</span>
                </div>}
              </>}
              <Player color={color} player={player} moves={visibleMoves} clocks={reviewing ? null : match.clocks}
                material={color === 'w' ? whiteMaterial : -whiteMaterial}
                active={!match.outcome && !match.error && match.ready && match.turn === color} />
            </React.Fragment>
          ))}
          <div className="saras-chess__navigation" aria-label="Replay controls">
            <button type="button" title="First position" aria-label="First position" disabled={index === 0} onClick={() => seek(0)}>‹‹</button>
            <button type="button" title="Previous move" aria-label="Previous move" disabled={index === 0} onClick={() => seek(index - 1)}>‹</button>
            <button type="button" title="Next move" aria-label="Next move" disabled={index === match.moves.length} onClick={() => seek(index + 1)}>›</button>
            <button type="button" title="Latest position" aria-label="Latest position" disabled={index === match.moves.length} onClick={() => seek(match.moves.length)}>››</button>
            {position !== null && <span>Position {index} / {match.moves.length}</span>}
          </div>
        </div>
        <aside className="saras-chess__side">
          {!reviewing && <div className="saras-chess__status" data-mate={checkmateResult || undefined}>
            <p role="status">{status}</p>
            <div>
              {match.outcome && match.moves.length > 0 && <>
                <button type="button" className="saras-chess__primary" onClick={openReview}>Review game</button>
                <button type="button" onClick={downloadPgn}>Save PGN</button>
              </>}
              {match.ready && !match.outcome && !match.error && (confirmResign ? <>
                <button type="button" onClick={match.resign}>Confirm resignation</button>
                <button type="button" onClick={() => setConfirmResign(false)}>Cancel</button>
              </> : <button type="button" onClick={() => setConfirmResign(true)}>Resign</button>)}
            </div>
          </div>}
          {reviewing && <div className="saras-chess__review-panel" ref={reviewHeading} tabIndex={-1}>
            <ChessGameReview moves={match.moves} position={index} onPosition={seek} player={player} data={analysis} onData={setAnalysis}
              practice={practice} onPractice={togglePractice} onLineStep={(step) => setPractice({ mode: 'best', step })} />
          </div>}
          <div className="saras-chess__record">
            <h3>Moves</h3>
            <MoveList moves={match.moves} data={analysis} position={index} setPosition={seek} />
          </div>
          {!reviewing && <Chat rows={match.chat} send={match.sendChat} />}
        </aside>
      </div>
      {promotion && <dialog ref={promotionDialog} className="saras-chess__promotion" onCancel={() => setPromotion(null)}>
        <h3>Promote pawn</h3>
        <div>{promotion.options.map((move) => <button key={move.promotion} type="button"
          aria-label={`Promote to ${PIECE_NAME[move.promotion]}`}
          onClick={() => { submit(move); setPromotion(null); }}><Piece color={move.color} type={move.promotion} /></button>)}</div>
        <button type="button" onClick={() => setPromotion(null)}>Cancel</button>
      </dialog>}
    </div>
  );
}
