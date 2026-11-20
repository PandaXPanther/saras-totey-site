import React, { useEffect, useRef } from 'react';

export function evaluationText(evaluation) {
  if (!evaluation) return '—';
  const { kind, score } = evaluation;
  if (kind === 'checkmate') return 'Mate';
  if (kind === 'mate') return 'M' + Math.abs(score);
  if (!score) return '0.00';
  return (score > 0 ? '+' : '−') + (Math.abs(score) / 100).toFixed(2);
}

export function evaluationMeaning(evaluation) {
  if (!evaluation) return 'Evaluation pending';
  const { kind, score } = evaluation;
  const side = score > 0 ? 'White' : 'Black';
  if (kind === 'checkmate') return side + ' won by checkmate';
  if (kind === 'mate') return side + ' can force mate in ' + Math.abs(score);
  if (!score) return 'Even position';
  return side + ' advantage, ' + (Math.abs(score) / 100).toFixed(2);
}

export function BoardEvaluation({ evaluation, whiteChance, facing }) {
  const advantage = facing === 'w' ? whiteChance : 1 - whiteChance;
  const label = evaluationMeaning(evaluation);
  return (
    <div className="saras-chess__eval" role="group" aria-label="Position evaluation" title={label}
      data-facing={facing} data-advantage={advantage >= 0.5 ? 'bottom' : 'top'}
      style={{ '--split': (100 - 100 * advantage) + '%' }}>
      <span aria-label={label}>{evaluationText(evaluation)}</span>
    </div>
  );
}

function drawGraph(canvas, data, selected, total) {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const cx = canvas.getContext('2d');
  if (!cx) return;
  cx.scale(ratio, ratio);
  const inset = 7;
  const plotHeight = height - 2 * inset;
  const x = (ply) => inset + (width - 2 * inset) * ply / total;
  const y = (chance) => inset + plotHeight * (1 - chance);
  const points = [0.5, ...data.map(({ whiteChance }) => whiteChance)];
  const drawLine = () => {
    cx.beginPath();
    points.forEach((chance, ply) => ply === 0 ? cx.moveTo(x(ply), y(chance)) : cx.lineTo(x(ply), y(chance)));
  };
  cx.beginPath();
  cx.moveTo(x(0), y(0.5));
  cx.lineTo(x(total), y(0.5));
  cx.strokeStyle = '#8a687d';
  cx.setLineDash([4, 4]);
  cx.stroke();
  cx.setLineDash([]);
  drawLine();
  cx.lineTo(x(data.length), y(0.5));
  cx.closePath();
  const area = cx.createLinearGradient(0, 0, 0, height);
  area.addColorStop(0, '#f4bf856b');
  area.addColorStop(0.5, '#b4899120');
  area.addColorStop(1, '#c897d366');
  cx.fillStyle = area;
  cx.fill();
  drawLine();
  cx.strokeStyle = '#f4cbab';
  cx.lineWidth = 2;
  cx.lineJoin = 'round';
  cx.stroke();
  cx.beginPath();
  cx.moveTo(x(selected), inset);
  cx.lineTo(x(selected), height - inset);
  cx.strokeStyle = '#f2d4df7a';
  cx.lineWidth = 1;
  cx.stroke();
  if (selected <= data.length) {
    cx.beginPath();
    cx.arc(x(selected), y(points[selected]), 4, 0, Math.PI * 2);
    cx.fillStyle = '#ffdd9b';
    cx.fill();
  }
}

export function EvaluationGraph({ data, moves, position, onPosition }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const draw = () => drawGraph(canvas, data, position, moves.length);
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [data, position, moves.length]);

  return (
    <figure className="saras-chess__graph">
      <figcaption><b>Evaluation by move</b><small>White ↑ · Black ↓</small></figcaption>
      <canvas ref={ref} aria-hidden="true" onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        const fraction = (event.clientX - box.left - 7) / (box.width - 14);
        onPosition(Math.max(0, Math.min(moves.length, Math.round(fraction * moves.length))));
      }} />
      <div className="saras-chess__graph-controls">
        <input type="range" aria-label="Game position" min="0" max={moves.length}
          value={position}
          aria-valuetext={position > data.length ? 'Waiting for analysis' : (moves[position - 1]?.san ?? 'Starting position')}
          onChange={(event) => onPosition(Number(event.target.value))} />
        <span>{position} / {moves.length}</span>
      </div>
    </figure>
  );
}
