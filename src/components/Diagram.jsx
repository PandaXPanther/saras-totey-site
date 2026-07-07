import React from 'react';

/**
 * Renders a hand-crafted architecture SVG from a { nodes, edges } spec.
 * Uses columns and optional rows. Rendered inside a card container.
 */
export default function Diagram({ spec, accent = '#9db5ff' }) {
  const { nodes, edges } = spec;
  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row || 0)) + 1;
  const NODE_W = 176, NODE_H = 60, GAP_X = 60, GAP_Y = 40, PAD = 24;
  const W = PAD * 2 + cols * NODE_W + (cols - 1) * GAP_X;
  const H = PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y;
  const colX = (c) => PAD + NODE_W / 2 + c * (NODE_W + GAP_X);
  const rowY = (r) => PAD + NODE_H / 2 + r * (NODE_H + GAP_Y);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, { ...n, x: colX(n.col), y: rowY(n.row || 0) }]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Architecture diagram">
      <defs>
        <linearGradient id="edge-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0.15" />
          <stop offset="0.5" stopColor={accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={accent} stopOpacity="0.15" />
        </linearGradient>
        <filter id="soft-glow">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Edges first */}
      {edges.map(([a, b], i) => {
        const A = byId[a], B = byId[b];
        if (!A || !B) return null;
        const dx = B.x - A.x, dy = B.y - A.y;
        // Bezier curve
        const c1x = A.x + dx * 0.5, c1y = A.y;
        const c2x = A.x + dx * 0.5, c2y = B.y;
        const startX = A.x + (dx > 0 ? NODE_W / 2 : (dx < 0 ? -NODE_W / 2 : 0));
        const endX = B.x + (dx > 0 ? -NODE_W / 2 : (dx < 0 ? NODE_W / 2 : 0));
        const d = `M ${startX} ${A.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${B.y}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="url(#edge-grad)" strokeWidth="1.5" filter="url(#soft-glow)" />
            <path d={d} fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="1" />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const x = colX(n.col), y = rowY(n.row || 0);
        return (
          <g key={i} transform={`translate(${x - NODE_W/2}, ${y - NODE_H/2})`}>
            <rect
              width={NODE_W} height={NODE_H} rx="8"
              fill="rgba(15, 21, 36, 0.96)"
              stroke={accent} strokeOpacity="0.4" strokeWidth="1"
            />
            <text
              x={NODE_W/2} y="24"
              textAnchor="middle"
              fill="#e6edf6"
              style={{ font: '600 12px "Satoshi", sans-serif', letterSpacing: '0.02em' }}
            >
              {n.label}
            </text>
            <text
              x={NODE_W/2} y="42"
              textAnchor="middle"
              fill="#96a2b8"
              style={{ font: '400 9.5px "JetBrains Mono", monospace', letterSpacing: '0.02em' }}
            >
              {n.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
