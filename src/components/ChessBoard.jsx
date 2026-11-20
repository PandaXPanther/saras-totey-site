import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PIECE_NAME, PIECE_VALUE, turnName } from '../chess/model.js';

const glyphs = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const files = 'abcdefgh';
const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

export function Piece({ type, color }) {
  return <span aria-hidden="true" className={`saras-chess__piece saras-chess__piece--${color}`}>{glyphs[type]}</span>;
}

function arrowStyle(uci, facing) {
  const file = (index) => files.indexOf(uci[index]);
  const rank = (index) => 8 - Number(uci[index]);
  const x = (column) => facing === 'w' ? column : 7 - column;
  const y = (row) => facing === 'w' ? row : 7 - row;
  const fromX = x(file(0));
  const fromY = y(rank(1));
  const deltaX = x(file(2)) - fromX;
  const deltaY = y(rank(3)) - fromY;
  return { left: (fromX + 0.5) * 12.5 + '%', top: (fromY + 0.5) * 12.5 + '%',
    width: Math.hypot(deltaX, deltaY) * 12.5 + '%', '--direction': Math.atan2(deltaY, deltaX) + 'rad' };
}

export function Board({ game, facing, onSelect, onDrop, selected, legal = [], last, suggested, grade }) {
  const pointer = useRef(null);
  const ignoreClick = useRef(false);
  const [dragging, setDragging] = useState(null);
  const [focused, setFocused] = useState('e2');
  const checked = game.isCheck();
  const mate = checked && game.isCheckmate();
  let rows = game.board();
  if (facing === 'b') rows = [...rows].reverse().map((row) => [...row].reverse());

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0) return;
    ignoreClick.current = false;
    const tile = event.target.closest('button[data-movable]');
    if (!onDrop || !tile) return;
    pointer.current = {
      id: event.pointerId,
      name: tile.dataset.square,
      x: event.clientX,
      y: event.clientY,
      game,
      facing,
    };
    tile.setPointerCapture(event.pointerId);
  }

  function dragPiece(event) {
    const gesture = pointer.current;
    if (gesture?.id !== event.pointerId) return;
    if (!gesture.piece) {
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 5) return;
      gesture.piece = game.get(gesture.name);
      if (!gesture.piece) return;
      gesture.size = getComputedStyle(event.target.closest('button')).fontSize;
      gesture.targets = game.moves({ square: gesture.name, verbose: true }).map((move) => move.to);
    }
    setDragging({ ...gesture, x: event.clientX, y: event.clientY });
  }

  function endDrag(event) {
    const gesture = pointer.current;
    if (gesture?.id !== event.pointerId) return;
    pointer.current = null;
    setDragging(null);
    if (!gesture.piece || event.type !== 'pointerup') return;
    ignoreClick.current = true;
    if (!onDrop || gesture.game !== game || gesture.facing !== facing) return;
    const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest('button[data-square]');
    if (tile && event.currentTarget.contains(tile) && tile.dataset.square !== gesture.name) {
      onDrop(gesture.name, tile.dataset.square);
    }
  }

  return (
    <div className="saras-chess__board" role="group" aria-label="Chessboard"
      onPointerDown={startDrag} onPointerMove={dragPiece} onPointerUp={endDrag}
      onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      {rows.flatMap((row, rank) => row.map((piece, file) => {
        const name = facing === 'w' ? files[file] + (8 - rank) : files[7 - file] + (rank + 1);
        const target = (dragging?.targets ?? legal).includes(name);
        const recent = last?.from === name || last?.to === name;
        const checkedKing = checked && piece?.type === 'k' && piece.color === game.turn()
          ? (mate ? 'mate' : 'check') : undefined;
        const checkLabel = checkedKing ? (mate ? ', checkmated' : ', in check') : '';
        const marker = suggested?.slice(2, 4) === name ? 'destination'
          : suggested?.slice(0, 2) === name ? 'origin' : undefined;
        return (
          <button key={name} type="button"
            className={`saras-chess__square ${(rank + file) % 2 ? 'dark' : 'light'}`}
            aria-label={`${name} ${piece ? turnName(piece.color) + ' ' + PIECE_NAME[piece.type] : 'empty'}${checkLabel}`}
            aria-pressed={onSelect ? selected === name : undefined}
            tabIndex={focused === name ? 0 : -1}
            onFocus={() => setFocused(name)}
            onKeyDown={(event) => {
              const step = arrows[event.key];
              if (!step) return;
              event.preventDefault();
              const nextRank = rank + step[0];
              const nextFile = file + step[1];
              if (nextRank >= 0 && nextRank < 8 && nextFile >= 0 && nextFile < 8) {
                event.currentTarget.parentElement.children[nextRank * 8 + nextFile]?.focus();
              }
            }}
            data-square={name}
            data-movable={onDrop && piece?.color === game.turn() ? '' : undefined}
            data-dragging={dragging?.name === name || undefined}
            data-last={recent || undefined}
            data-check={checkedKing}
            data-suggested={marker}
            onClick={(event) => {
              if (ignoreClick.current && event.detail > 0) return;
              onSelect?.(name);
            }}>
            {file === 0 && <span aria-hidden="true" className="saras-chess__rank">{name[1]}</span>}
            {rank === 7 && <span aria-hidden="true" className="saras-chess__file">{name[0]}</span>}
            {piece && <Piece color={piece.color} type={piece.type} />}
            {checkedKing === 'mate' && <span className="saras-chess__mate-mark" aria-hidden="true">#</span>}
            {grade && last?.to === name && <span className="saras-chess__grade saras-chess__board-grade" data-grade={grade.name}
              title={grade.name} aria-hidden="true">{grade.symbol}</span>}
            {target && <span aria-hidden="true" className={`saras-chess__target${piece ? ' saras-chess__target--capture' : ''}`} />}
          </button>
        );
      }))}
      {suggested && <span className="saras-chess__best-arrow" aria-hidden="true" style={arrowStyle(suggested, facing)} />}
      {dragging && createPortal(
        <div data-dragged-piece="" aria-hidden="true" className="saras-chess__drag-piece"
          style={{ left: dragging.x, top: dragging.y, fontSize: dragging.size }}>
          <Piece color={dragging.piece.color} type={dragging.piece.type} />
        </div>,
        document.body,
      )}
    </div>
  );
}

export function Captures({ moves, color }) {
  const captures = moves.filter((move) => move.color === color && move.captured)
    .sort((a, b) => PIECE_VALUE[a.captured] - PIECE_VALUE[b.captured]);
  if (!captures.length) return null;
  return (
    <span className="saras-chess__captures" aria-label={'Captured ' + captures.map((move) => PIECE_NAME[move.captured]).join(', ')}>
      {captures.map((move, index) => <Piece key={index} type={move.captured} color={color === 'w' ? 'b' : 'w'} />)}
    </span>
  );
}
