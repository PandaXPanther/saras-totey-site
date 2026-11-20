import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { botName } from '../chess/banter.js';
import { fromUci, opposite, PIECE_NAME, turnName } from '../chess/model.js';
import { timeControls, useChessMatch } from '../chess/useChessMatch.js';
import { Board, Captures, Piece } from './ChessBoard.jsx';
import ChessGameReview, { Grade } from './ChessGameReview.jsx';

function Clock({ time, active }) {
  if (time == null) return null;
  const seconds = Math.ceil(time / 1000);
  return <span className="saras-chess__clock" data-active={active} data-low={seconds <= 15}>
    {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
  </span>;
}

function Player({ color, player, moves, clocks, active }) {
  const isPlayer = color === player;
  return <div className="saras-chess__player" data-active={active}>
    {isPlayer ? <span className="saras-chess__avatar saras-chess__avatar--you"><Piece color={color} type="k" /></span>
      : <img className="saras-chess__avatar" src="/saras-headshot.jpg" width="42" height="42" alt="" />}
    <div className="saras-chess__identity">
      <strong>{isPlayer ? 'You' : botName}</strong>
      <span>{turnName(color)}{!isPlayer && ' · ~1750'}</span>
    </div>
    <Captures moves={moves} color={color} />
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
            {san} {data[row] && <Grade grade={data[row].grade} />}
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
  const fen = practice ? current?.before : current?.after;
  const board = useMemo(() => {
    const game = new Chess(fen);
    if (practice?.move) fromUci(game, practice.move.lan);
    return game;
  }, [fen, practice?.move]);
  const liveTurn = match.ready && !match.outcome && !match.error && position === null && match.turn === player;
  const canPlay = !promotion && (liveTurn || (practice?.mode === 'retry' && !practice.move));
  const targets = canPlay && selected ? board.moves({ square: selected, verbose: true }).map((move) => move.to) : [];
  const suggestion = practice?.mode === 'best' ? review?.suggested : undefined;
  const status = match.outcome
    ? `${match.outcome.winner === player ? 'You won' : match.outcome.winner ? 'Totally Real Saras won' : 'Draw'} · ${match.outcome.reason}`
    : match.error ? 'Engine unavailable. Start a new game to retry.'
      : !match.ready ? 'Loading Stockfish…'
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
    setPractice(practice?.mode === mode ? null : { mode });
  }

  function tryMove(from, to) {
    if (!canPlay) return;
    const options = board.moves({ square: from, verbose: true }).filter((move) => move.to === to);
    if (!options.length) return;
    if (options[0].promotion) setPromotion({ from, to, options });
    else submit(options[0]);
  }

  function chooseSquare(square) {
    if (!canPlay) return;
    if (selected === square) setSelected(null);
    else if (targets.includes(square)) tryMove(selected, square);
    else setSelected(board.get(square)?.color === board.turn() ? square : null);
  }

  function openReview() {
    setReviewing(true);
    seek(1);
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
    <div className="saras-chess__studio">
      <div className="saras-chess__topbar">
        <div tabIndex={-1} ref={heading}><strong>{timeControls[control].name}</strong><span>Play as {turnName(player)}</span></div>
        <div>
          <button type="button" onClick={() => setFacing(opposite(facing))}>Flip board</button>
          <button type="button" onClick={onRestart}>New game</button>
          <button type="button" onClick={onClose}>Close game</button>
        </div>
      </div>
      <div className="saras-chess__layout">
        <div className="saras-chess__stage">
          {[opposite(facing), facing].map((color, playerIndex) => (
            <React.Fragment key={playerIndex}>
              {playerIndex === 1 && <Board game={board} facing={facing} selected={selected}
                last={practice ? practice.move : current} legal={targets} suggested={suggestion}
                onSelect={canPlay ? chooseSquare : undefined} onDrop={canPlay ? tryMove : undefined} />}
              <Player color={color} player={player} moves={match.moves.slice(0, index)} clocks={match.clocks}
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
          <div className="saras-chess__status">
            <p role="status">{status}</p>
            <div>
              {match.outcome && match.moves.length > 0 && <>
                {!reviewing && <button type="button" className="saras-chess__primary" onClick={openReview}>Review game</button>}
                <button type="button" onClick={downloadPgn}>Save PGN</button>
              </>}
              {match.ready && !match.outcome && !match.error && (confirmResign ? <>
                <button type="button" onClick={match.resign}>Confirm resignation</button>
                <button type="button" onClick={() => setConfirmResign(false)}>Cancel</button>
              </> : <button type="button" onClick={() => setConfirmResign(true)}>Resign</button>)}
            </div>
          </div>
          {reviewing && <div ref={reviewHeading} tabIndex={-1}>
            <ChessGameReview moves={match.moves} position={index} onPosition={seek} player={player} data={analysis} onData={setAnalysis}
              practice={practice} onPractice={togglePractice} />
          </div>}
          <div className="saras-chess__record">
            <h3>Moves</h3>
            <MoveList moves={match.moves} data={analysis} position={index} setPosition={seek} />
          </div>
          <Chat rows={match.chat} send={match.sendChat} />
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
