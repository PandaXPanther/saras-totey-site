import React, { useRef, useState } from 'react';
import { PIECE_NAME, PIECE_VALUE, turnName } from '../chess/model.js';

const glyphs = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const files = 'abcdefgh';
const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

export function Piece({ type, color }) {
  return <span aria-hidden="true" className={`saras-chess__piece saras-chess__piece--${color}`}>{glyphs[type]}</span>;
}

export function Board({ game, facing, onSelect, onDrop, selected, legal = [], last, suggested }) {
  const drag = useRef(null);
  const [focused, setFocused] = useState('e2');
  const checked = game.isCheck();
  let rows = game.board();
  if (facing === 'b') rows = [...rows].reverse().map((row) => [...row].reverse());

  return (
    <div className="saras-chess__board" role="group" aria-label="Chessboard">
      {rows.flatMap((row, rank) => row.map((piece, file) => {
        const name = facing === 'w' ? files[file] + (8 - rank) : files[7 - file] + (rank + 1);
        const target = legal.includes(name);
        const recent = last?.from === name || last?.to === name;
        const checkedKing = checked && piece?.type === 'k' && piece.color === game.turn();
        const marker = suggested?.slice(2, 4) === name ? 'destination'
          : suggested?.slice(0, 2) === name ? 'origin' : undefined;
        return (
          <button key={name} type="button"
            className={`saras-chess__square ${(rank + file) % 2 ? 'dark' : 'light'}`}
            aria-label={`${name} ${piece ? turnName(piece.color) + ' ' + PIECE_NAME[piece.type] : 'empty'}`}
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
            data-last={recent || undefined}
            data-check={checkedKing || undefined}
            data-suggested={marker}
            draggable={Boolean(onSelect && piece?.color === game.turn())}
            onDragStart={(event) => {
              drag.current = name;
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', name);
            }}
            onDragEnd={() => { drag.current = null; }}
            onDragOver={(event) => { if (drag.current) event.preventDefault(); }}
            onDrop={(event) => {
              event.preventDefault();
              if (drag.current) onDrop?.(drag.current, name);
              drag.current = null;
            }}
            onClick={() => onSelect?.(name)}>
            {file === 0 && <span aria-hidden="true" className="saras-chess__rank">{name[1]}</span>}
            {rank === 7 && <span aria-hidden="true" className="saras-chess__file">{name[0]}</span>}
            {piece && <Piece color={piece.color} type={piece.type} />}
            {target && <span aria-hidden="true" className={`saras-chess__target${piece ? ' saras-chess__target--capture' : ''}`} />}
          </button>
        );
      }))}
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
