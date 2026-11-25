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

function polygon(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

const chessBackRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
const chessmen = [];
for (const row of [0, 1, 6, 7]) {
  for (let col = 0; col < 8; col += 1) {
    chessmen.push({ col, row, side: row < 4 ? 'black' : 'white', kind: row === 1 || row === 6 ? 'pawn' : chessBackRank[col] });
  }
}
chessmen.sort((a, b) => a.col + a.row - b.col - b.row);

const opening = [
  { col: 4, row: 6, toCol: 4, toRow: 4, start: .36 },
  { col: 4, row: 1, toCol: 4, toRow: 3, start: 1.17 },
  { col: 6, row: 7, toCol: 5, toRow: 5, start: 1.98 },
  { col: 1, row: 0, toCol: 2, toRow: 2, start: 2.79 },
  { col: 5, row: 7, toCol: 1, toRow: 3, start: 3.60 },
];
const chessMoves = new Map(opening.map(move => [move.row * 8 + move.col, move]));
const pawnStem = [[-6, -5], [-3, -13], [-3, -17], [3, -17], [3, -13], [6, -5]];
const bishopStem = [[-8, -5], [-4, -12], [-3, -18], [3, -18], [4, -12], [8, -5]];
const knightSilhouette = [[-9, -5], [-7, -15], [-2, -22], [-5, -29], [1, -27], [5, -30], [9, -22], [10, -16], [6, -14], [0, -18], [-1, -12], [6, -5]];
const rookSilhouette = [[-8, -5], [-6, -20], [-9, -22], [-9, -29], [-5, -29], [-5, -25],
  [-2, -25], [-2, -29], [2, -29], [2, -25], [5, -25], [5, -29], [9, -29], [9, -22], [6, -20], [8, -5]];
const royalStem = [[-9, -5], [-5, -14], [-6, -21], [6, -21], [5, -14], [9, -5]];
const queenCrown = [[-6, -20], [-12, -29], [-5, -26], [0, -34], [5, -26], [12, -29], [6, -20]];
const kingCrown = [[-6, -20], [-9, -27], [-5, -29], [5, -29], [9, -27], [6, -20]];

function drawChessPiece(ctx, man, x, y, active) {
  const fill = man.side === 'white' ? (active ? '#fff2dc' : '#f0c4c7') : (active ? '#d2a6ff' : '#ae8bd4');
  const shade = man.side === 'white' ? '#a86588' : '#654b89';
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 1, 11, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.fillRect(-9, -6, 18, 5);
  if (man.kind === 'pawn') {
    polygon(ctx, pawnStem, fill);
    dot(ctx, 0, -21, 5, fill);
  } else if (man.kind === 'bishop') {
    polygon(ctx, bishopStem, fill);
    ctx.beginPath();
    ctx.ellipse(0, -22, 4.6, 8.1, -.15, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    line(ctx, 0, -22, 4, -28, shade, 1.3);
  } else if (man.kind === 'knight') {
    polygon(ctx, knightSilhouette, fill);
    dot(ctx, 4, -23, 1.2, shade);
  } else if (man.kind === 'rook') {
    polygon(ctx, rookSilhouette, fill);
  } else {
    polygon(ctx, royalStem, fill);
    polygon(ctx, man.kind === 'king' ? kingCrown : queenCrown, fill);
    if (man.kind === 'king') {
      line(ctx, 0, -36, 0, -27, fill, 2.2);
      line(ctx, -3, -33, 3, -33, fill, 2);
    }
  }
  line(ctx, -6, -7, 6, -7, shade, 1.2);
  ctx.restore();
}

const boardX = 442;
const boardY = 219;
const squareWidth = 32;
const squareDepth = 16;
const squareX = (col, row) => boardX + (col - row) * squareWidth;
const squareY = (col, row) => boardY + (col + row - 7) * squareDepth;

function games(ctx, t) {
  glow(ctx, boardX, boardY, 245, '#a74f997d');
  glow(ctx, 561, 91, 147, '#d17a5267');
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const color = (row + col) % 2 === 0 ? '#d386b476' : '#67456eb0';
      topTile(ctx, squareX(col, row), squareY(col, row), squareWidth, squareDepth, color, '#e5abcf50');
    }
  }

  let moving;
  for (const man of chessmen) {
    const move = chessMoves.get(man.row * 8 + man.col);
    const phase = move ? (t - move.start) / .62 : -1;
    if (phase > 0 && phase < 1) {
      moving = man;
    } else {
      const col = phase >= 1 ? move.toCol : man.col;
      const row = phase >= 1 ? move.toRow : man.row;
      drawChessPiece(ctx, man, squareX(col, row), squareY(col, row), false);
    }
  }

  if (moving) {
    const move = chessMoves.get(moving.row * 8 + moving.col);
    const phase = (t - move.start) / .62;
    const eased = phase * phase * (3 - 2 * phase);
    const col = move.col + (move.toCol - move.col) * eased;
    const row = move.row + (move.toRow - move.row) * eased;
    const x = squareX(col, row);
    const y = squareY(col, row);
    const lift = Math.sin(Math.PI * phase) * (moving.kind === 'knight' ? 19 : 8);
    glow(ctx, x, y - 11, 28, '#ffc68b84');
    drawChessPiece(ctx, moving, x, y - lift, true);
  }
}

const towers = [
  [246, 32, 38], [280, 32, 73], [313, 43, 51], [359, 31, 109], [393, 41, 69],
  [437, 29, 92], [469, 46, 49], [517, 32, 78], [554, 36, 129], [595, 36, 78],
  [632, 29, 54], [663, 48, 105],
];
const mechaWing = [[15, -8], [29, -34], [68, -60], [57, -27], [87, -34], [63, -7], [40, 7], [25, 22], [17, 14]];
const wingTrim = [[29, -25], [61, -49], [51, -24], [69, -28], [47, -10], [36, -8]];
const mechaArm = [[18, 1], [31, 7], [29, 24], [17, 37], [12, 31], [20, 17]];
const mechaLeg = [[1, 14], [16, 15], [16, 36], [11, 52], [3, 51], [6, 32], [0, 25]];
const mechaTorso = [[-21, -12], [-10, -20], [10, -20], [21, -12], [15, 17], [0, 25], [-15, 17]];
const mechaChest = [[-15, -10], [0, -3], [15, -10], [10, 7], [0, 14], [-10, 7]];
const mechaHead = [[-12, -34], [-4, -38], [4, -38], [12, -34], [9, -22], [0, -17], [-9, -22]];

function drawMecha(ctx, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    polygon(ctx, mechaWing, '#454774');
    polygon(ctx, wingTrim, '#9da5d7');
    polygon(ctx, mechaArm, '#505d88');
    polygon(ctx, mechaLeg, '#40496f');
    line(ctx, 26, -11, 51, -24, '#c4d1ff', 1.5);
    ctx.restore();
  }
  polygon(ctx, mechaTorso, '#344168');
  polygon(ctx, mechaChest, '#7f8cc5');
  polygon(ctx, mechaHead, '#4a5587');
  line(ctx, -7, -29, 7, -29, '#fe9d94', 2.4);
  dot(ctx, 0, 1, 3.1, '#efb0c6');
  ctx.restore();
}

function anime(ctx, t) {
  glow(ctx, 492, 154, 276, '#b6bbf5b4');
  glow(ctx, 578, 119, 180, '#efbfce8a');
  const moonX = 545;
  const moonY = 130;
  const moonRadius = 79;
  dot(ctx, moonX, moonY, moonRadius, '#efe5f2');
  ring(ctx, moonX, moonY, moonRadius, '#9996c8');
  for (let i = 0; i < 5; i += 1) {
    const y = moonY + 17 + i * 10;
    const x = Math.sqrt(moonRadius ** 2 - (y - moonY) ** 2);
    line(ctx, moonX - x, y, moonX + x, y, '#b2a2d04d');
  }

  for (let i = 0; i < towers.length; i += 1) {
    const [base, width, height] = towers[i];
    const x = base - t * (i % 2 ? 1.4 : .7);
    const roof = 316 - height;
    ctx.fillStyle = i % 2 ? '#6b77a682' : '#8798c678';
    ctx.fillRect(x, roof, width, height + 19);
    ctx.fillRect(x + width * .28, roof - 6, width * .44, 6);
    if (i % 3 === 2) line(ctx, x + width * .5, roof - 6, x + width * .5, roof - 21, '#717ba7a0');
    for (let y = roof + 12; y < 312; y += 12) {
      for (let light = 6; light < width - 4; light += 8) {
        ctx.fillStyle = (light + Math.round(y) + i) % 3 === 0 ? '#fff0ccbd' : '#dadef990';
        ctx.fillRect(x + light, y, 3, 2);
      }
    }
  }
  line(ctx, 226, 335, 704, 335, '#64779c77');
  for (let i = 0; i < 7; i += 1) {
    const x = 302 + i * 51 + 12 * Math.sin(t * .8 + i);
    const y = 63 + (i * 41) % 154;
    line(ctx, x, y, x + 23 + i * 4, y - 10, '#8790c65c');
  }

  const approach = 1 - (1 - Math.min(t / 4.4, 1)) ** 2;
  const x = 519 - approach * 74;
  const y = 177 - approach * 36;
  glow(ctx, x, y + 39, 59, '#f9b6ba91');
  drawMecha(ctx, x, y, -.17 + approach * .22);
}

export const pageScenes = { economics, studio, voxel, games, anime };
