export const sceneWidth = 720;
export const sceneHeight = 420;

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dot(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function ring(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function glow(ctx, x, y, radius, color) {
  const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
  wash.addColorStop(0, color);
  wash.addColorStop(1, color.slice(0, 7) + '00');
  ctx.fillStyle = wash;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function grid(ctx, x, y, columns, rows, step, color) {
  for (let column = 0; column <= columns; column += 1) {
    const xx = x + column * step;
    line(ctx, xx, y, xx, y + rows * step, color);
  }
  for (let row = 0; row <= rows; row += 1) {
    const yy = y + row * step;
    line(ctx, x, yy, x + columns * step, yy, color);
  }
}

function curve(ctx, x, y, slope, offset, color, width) {
  ctx.beginPath();
  for (let px = 110; px <= 663; px += 7) {
    const delta = px - x;
    const py = y + offset + slope * delta + 0.00042 * delta * Math.abs(delta);
    if (px === 110) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function economics(ctx, t) {
  const x = 406 + 29 * Math.sin(t * 0.63);
  const y = 206 + 18 * Math.sin(t * 0.45 + 0.8);
  glow(ctx, x, y, 260, '#ba91ee65');
  glow(ctx, 527, 333, 155, '#88ccae6d');
  grid(ctx, 96, 50, 14, 8, 40, '#74579c24');
  line(ctx, 96, 50, 96, 370, '#77589980');
  line(ctx, 96, 370, 656, 370, '#77589980');

  ctx.save();
  ctx.beginPath();
  ctx.rect(96, 50, 560, 320);
  ctx.clip();
  curve(ctx, x, y, 0.48, -26, '#724bad40', 1);
  curve(ctx, x, y, -0.51, 26, '#21876c4d', 1);
  curve(ctx, x, y, 0.48, 0, '#7853ad', 2.5);
  curve(ctx, x, y, -0.51, 0, '#257b68', 2.5);
  ctx.setLineDash([4, 6]);
  line(ctx, 96, y, x, y, '#76519d99');
  line(ctx, x, y, x, 370, '#39867699');
  ctx.restore();

  glow(ctx, x, y, 36, '#fff9fcf5');
  ring(ctx, x, y, 12 + 6 * (1 + Math.sin(t * 1.7)), '#855ab37a');
  dot(ctx, x, y, 5, '#774da3');
  dot(ctx, x, y, 2, '#fff');
  dot(ctx, 96, y, 3.2, '#8b67af');
  dot(ctx, x, 370, 3.2, '#33816e');
}

function roundedPanel(ctx, x, y, width, height, fill, border) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.35;
  ctx.stroke();
}

function studio(ctx, t) {
  const drift = 8 * Math.sin(t * 0.55);
  const y = 106 + drift;
  const accent = '#a64d75';
  glow(ctx, 385, 185, 235, '#e39bba8a');
  glow(ctx, 601, 275, 167, '#9ad0c98a');
  grid(ctx, 90, 42, 18, 10, 32, '#a36b851e');

  roundedPanel(ctx, 195, y + 37, 309, 176, '#f9dfeab5', '#ac6f9aa9');
  roundedPanel(ctx, 218, y + 19, 309, 176, '#f7e1ecdd', '#ac6f9ab7');
  roundedPanel(ctx, 240, y, 309, 176, '#fff5f7ed', '#a45b83cb');
  line(ctx, 240, y + 27, 549, y + 27, '#be86a48f');
  for (let n = 0; n < 3; n += 1) dot(ctx, 256 + n * 11, y + 14, 2.8, accent);

  roundedPanel(ctx, 257, y + 47, 114, 104, '#f3d4e6b5', '#a65c9185');
  ctx.save();
  ctx.setLineDash([3, 5]);
  line(ctx, 273, y + 125, 351, y + 64, '#8f4a9173');
  line(ctx, 273, y + 64, 351, y + 125, '#8f4a9173');
  ctx.restore();
  for (let n = 0; n < 4; n += 1) {
    line(ctx, 389, y + 55 + n * 15, 522 - n * 16, y + 55 + n * 15, n === 0 ? '#984a76b5' : '#bc82a68f', n === 0 ? 4 : 2);
  }
  roundedPanel(ctx, 390, y + 123, 68, 20, '#c07caa72', '#a8578c78');

  const connectorY = y + 102;
  line(ctx, 549, connectorY, 590, connectorY, '#338977a8', 1.5);
  line(ctx, 590, connectorY, 590, connectorY + 44, '#338977a8', 1.5);
  line(ctx, 590, connectorY + 44, 641, connectorY + 44, '#338977a8', 1.5);
  ring(ctx, 646, connectorY + 44, 5, '#338977');
  const progress = (t * 32) % 136;
  if (progress < 41) dot(ctx, 549 + progress, connectorY, 4, '#2b8978');
  else if (progress < 85) dot(ctx, 590, connectorY + progress - 41, 4, '#2b8978');
  else dot(ctx, 590 + progress - 85, connectorY + 44, 4, '#2b8978');
}

function topTile(ctx, x, y, width, depth, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y - depth);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x, y + depth);
  ctx.lineTo(x - width, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function tileSide(ctx, x, y, width, depth, drop, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y + depth);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + drop);
  ctx.lineTo(x, y + depth + drop);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function block(ctx, x, y, width, depth, drop, top, left, right, edge) {
  tileSide(ctx, x, y, -width, depth, drop, left);
  tileSide(ctx, x, y, width, depth, drop, right);
  topTile(ctx, x, y, width, depth, top, edge);
}

const terrain = [
  [0, 0, 3, 4, 2, 0, 0],
  [0, 3, 4, 5, 4, 3, 0],
  [2, 4, 5, 2, 2, 4, 2],
  [4, 5, 3, 2, 2, 5, 3],
  [3, 4, 3, 2, 4, 5, 0],
  [0, 2, 4, 5, 4, 2, 0],
  [0, 0, 2, 3, 2, 0, 0],
];
const grass = ['#a2c99c', '#acd1aa', '#8dbc9e', '#a4cdb0'];
const looseBlocks = [[230, 139, 15], [567, 109, 17], [603, 223, 13], [253, 292, 13]];

function voxel(ctx, t) {
  glow(ctx, 412, 210, 242, '#69bca284');
  glow(ctx, 422, 95, 135, '#a7e1be95');
  const hovering = 9 * Math.sin(t * 0.63);
  for (let row = 0; row < terrain.length; row += 1) {
    for (let col = 0; col < terrain[row].length; col += 1) {
      const height = terrain[row][col];
      if (!height) continue;
      const x = 412 + (col - row) * 28;
      const y = 156 + (col + row) * 15 - height * 10 + hovering;
      const water = height === 2 && row > 1 && row < 5 && (col === 3 || col === 4);
      const drop = 28 + (row * 11 + col * 7) % 36;
      block(ctx, x, y, 28, 15, drop, water ? '#7bc9c4' : grass[(row + col * 3) % grass.length],
        '#60998b', '#477f77', water ? '#508f8f' : '#699d87');
      if (water) {
        const ripple = 3 * Math.sin(t * 1.7 + row);
        line(ctx, x - 9 + ripple, y, x + 8 + ripple, y, '#e0ffedce');
      }
    }
  }

  for (let n = 0; n < looseBlocks.length; n += 1) {
    const [x, y, size] = looseBlocks[n];
    const floating = Math.sin(t * 0.9 + n * 1.35) * 10;
    block(ctx, x, y + floating, size, size * 0.54, size * 0.8, '#b5d8b1', '#82b8a7', '#679e90', '#83b0a2');
  }
}

const movePath = [[-2, 2], [-1, 0], [1, -1], [2, 1], [0, 2], [-2, 2]];
const pieces = [[-3, 0, '#f6a388'], [-2, -2, '#d5a5eb'], [2, 2, '#d5a5eb'], [3, -1, '#f6a388']];

function piece(ctx, x, y, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 6, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  line(ctx, x - 6, y - 3, x - 4, y - 19, color, 1.6);
  line(ctx, x + 6, y - 3, x + 4, y - 19, color, 1.6);
  dot(ctx, x, y - 23, 5, color);
}

function games(ctx, t) {
  const x = 423;
  const y = 212;
  glow(ctx, x, y, 253, '#a74f997a');
  glow(ctx, 561, 87, 143, '#d17a5267');
  for (let row = -4; row < 4; row += 1) {
    for (let col = -4; col < 4; col += 1) {
      const color = (row + col) % 2 === 0 ? '#d386b47a' : '#67456e79';
      topTile(ctx, x + (col - row) * 33, y + (col + row) * 16, 33, 16, color, '#e5abcf48');
    }
  }

  for (const [col, row, color] of pieces) piece(ctx, x + (col - row) * 33, y + (col + row) * 16 - 3, color);
  for (let n = 1; n < movePath.length; n += 1) {
    const [a, b] = movePath[n - 1];
    const [c, d] = movePath[n];
    line(ctx, x + (a - b) * 33, y + (a + b) * 16 - 8, x + (c - d) * 33, y + (c + d) * 16 - 8, '#ffd1ba85', 1.4);
  }
  const progress = (t * 0.58) % (movePath.length - 1);
  const step = Math.floor(progress);
  const mix = progress - step;
  const [a, b] = movePath[step];
  const [c, d] = movePath[step + 1];
  const col = a + (c - a) * mix;
  const row = b + (d - b) * mix;
  const cursorX = x + (col - row) * 33;
  const cursorY = y + (col + row) * 16 - 8;
  glow(ctx, cursorX, cursorY, 31, '#ffc68ba0');
  dot(ctx, cursorX, cursorY, 4.8, '#ffe7b7');

  for (let n = 0; n < 6; n += 1) {
    const starX = 228 + n * 78;
    const starY = 96 + 16 * Math.sin(n * 2.2 + t * 0.5);
    dot(ctx, starX, starY, n % 2 ? 2.9 : 1.7, '#eab79fb5');
  }
}

const graphNodes = [
  [263, 211], [306, 116], [318, 302], [389, 190], [402, 300],
  [460, 99], [474, 226], [534, 148], [547, 290], [620, 211], [578, 87],
];
const graphEdges = [[0, 1], [0, 2], [0, 3], [1, 3], [1, 5], [2, 4], [3, 4], [3, 5], [3, 6],
  [4, 6], [4, 8], [5, 7], [5, 10], [6, 7], [6, 8], [6, 9], [7, 9], [7, 10], [8, 9], [9, 10]];

function graphY(t, n) {
  return graphNodes[n][1] + 8 * Math.sin(t * 0.64 + n * 0.73);
}

function network(ctx, t) {
  glow(ctx, 451, 190, 249, '#8da9e590');
  glow(ctx, 581, 220, 133, '#82c3c66c');
  for (let n = 0; n < 4; n += 1) {
    ctx.beginPath();
    ctx.ellipse(440, 195, 94 + n * 37, 52 + n * 22, -0.27, 0, Math.PI * 2);
    ctx.strokeStyle = '#5877ad3d';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (const [from, to] of graphEdges) {
    line(ctx, graphNodes[from][0], graphY(t, from), graphNodes[to][0], graphY(t, to), '#3c6aab61', 1.2);
  }
  for (let n = 0; n < graphNodes.length; n += 1) {
    const x = graphNodes[n][0];
    const y = graphY(t, n);
    const hub = n === 3 || n === 6 || n === 7;
    if (hub) ring(ctx, x, y, 10 + 3 * Math.sin(t * 1.8 + n), '#4f75ad91');
    dot(ctx, x, y, hub ? 5 : 3, hub ? '#344e90' : '#509698');
    if (hub) dot(ctx, x, y, 2.1, '#eef8fd');
  }
  for (let n = 0; n < 3; n += 1) {
    const progress = t * 0.68 + n * 4.4;
    const [from, to] = graphEdges[Math.floor(progress) % graphEdges.length];
    const mix = progress % 1;
    const x = graphNodes[from][0] + (graphNodes[to][0] - graphNodes[from][0]) * mix;
    const y = graphY(t, from) + (graphY(t, to) - graphY(t, from)) * mix;
    dot(ctx, x, y, 3, '#1e76a5');
  }
}

export const pageScenes = { economics, studio, voxel, games, network };
