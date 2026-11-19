import * as THREE from 'three';

const tau = 2 * Math.PI;
const stone = ['#bc9270', '#d5b590', '#a47a64', '#e6caa1', '#cfac81'];
const pink = ['#de829d', '#ed9db1', '#f2b4bf', '#f9cacc', '#e998b0'];
const green = ['#557053', '#779268', '#456658', '#87a56b', '#668252'];
const gold = ['#ee9e3f', '#ffbc51', '#df8142'];

export const landmarks = {
  hunter: [-4.1, 1.15, 1.8],
  wall: [4.5, 1.3, 2.15],
  geass: [-.65, .78, .6],
  diamond: [2.1, 3.12, -.75],
  spiral: [1.25, .2, 3.24],
  pokemon: [-2.6, .48, 3.0],
};

export function buildIsland() {
  const island = new THREE.Group();
  let seed = 9807;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();
  const pick = (palette) => palette[Math.floor(random() * palette.length)];
  const shapes = {
    box: new THREE.BoxGeometry(),
    rock: new THREE.IcosahedronGeometry(1, 0),
    leaf: new THREE.IcosahedronGeometry(1, 1),
    round: new THREE.CylinderGeometry(.5, .5, 1, 14),
    pine: new THREE.CylinderGeometry(.08, .5, 1, 7),
    orb: new THREE.SphereGeometry(.5, 12, 8),
  };
  const batches = new Map();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);

  function piece(kind, x, y, z, w, h, d, tint, yaw = 0, pitch = 0, roll = 0) {
    if (!batches.has(kind)) batches.set(kind, []);
    dummy.position.set(x, y, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(pitch, yaw, roll);
    dummy.updateMatrix();
    batches.get(kind).push([dummy.matrix.clone(), tint]);
  }
  function beam(a, b, width, tint, kind = 'round') {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    if (!batches.has(kind)) batches.set(kind, []);
    dummy.position.copy(start).lerp(end, .5);
    dummy.scale.set(width, delta.length(), width);
    dummy.quaternion.setFromUnitVectors(up, delta.normalize());
    dummy.updateMatrix();
    batches.get(kind).push([dummy.matrix.clone(), tint]);
  }
  function facetMesh(positions, colors, materialOptions = {}) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: .87, side: THREE.DoubleSide, ...materialOptions,
    }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    island.add(mesh);
    return mesh;
  }
  function rockyBase(cx, cz, rx, rz, top, depth, surface, sides) {
    const count = 36;
    const rim = Array.from({ length: count }, (_, i) => {
      const angle = i / count * tau;
      return { angle, radii: 1 + .07 * Math.sin(angle * 5) + .045 * Math.cos(angle * 7) + between(-.055, .055) };
    });
    const rings = [[1, 0], [1.04, .16], [.91, .40], [.83, .67], [.64, .91], [.25, 1]].map(([scale, level]) => (
      rim.map(({ angle, radii }) => [
        cx + Math.cos(angle) * rx * radii * scale,
        top - depth * level + (level === 0 ? 0 : between(-.10, .10) * depth),
        cz + Math.sin(angle) * rz * radii * scale,
      ])
    ));
    const positions = [];
    const colors = [];
    const triangle = (a, b, c, tint) => {
      positions.push(...a, ...b, ...c);
      color.set(tint).multiplyScalar(between(.82, 1.1));
      for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
    };
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      triangle([cx, top, cz], rings[0][next], rings[0][i], pick(surface));
      for (let j = 0; j < rings.length - 1; j++) {
        const [upper, lower] = [rings[j], rings[j + 1]];
        const tint = sides[j];
        triangle(upper[i], lower[i], upper[next], tint);
        triangle(upper[next], lower[i], lower[next], tint);
      }
      triangle([cx, top - depth * 1.07, cz], rings.at(-1)[i], rings.at(-1)[next], sides.at(-1));
    }
    facetMesh(positions, colors);
  }
  rockyBase(0, 0, 5.75, 4.05, 0, 2.72, ['#c5b487', '#cbbb91', '#c2b38b', '#c4b88e'], [
    '#c6a675', '#a98066', '#c59569', '#9a6c59', '#775448',
  ]);
  rockyBase(.1, -1.2, 4.25, 2.45, .29, .48, ['#c8b68e', '#c6b58d', '#bbac85'], [
    '#c0a77e', '#af9271', '#b7a17d', '#937962', '#a28d74',
  ]);

  function pine(x, y, z, size) {
    piece('round', x, y + size * .36, z, .13 * size, size * .72, .13 * size, '#725142');
    for (let i = 0; i < 3; i++) {
      const width = (0.73 - .15 * i) * size;
      piece('pine', x, y + (.53 + .25 * i) * size, z, width, .73 * size, width, pick(green), random() * tau);
    }
  }

  function flatiron(x, z, w, h, angle) {
    const profile = new THREE.Shape();
    profile.moveTo(-w * .77, 0);
    profile.lineTo(w * .22, 0);
    profile.lineTo(w * .98, h * .91);
    profile.lineTo(w * .87, h);
    profile.lineTo(w * .50, h * .93);
    profile.lineTo(-w * .62, h * .28);
    profile.closePath();
    const geometry = new THREE.ExtrudeGeometry(profile, { depth: .42, bevelEnabled: true, bevelSize: .14, bevelThickness: .13, bevelSegments: 1, steps: 1 });
    const mountain = new THREE.Mesh(geometry, [
      new THREE.MeshStandardMaterial({ color: '#d39a6f', roughness: 1 }),
      new THREE.MeshStandardMaterial({ color: '#a17964', roughness: 1 }),
    ]);
    mountain.position.set(x, .16, z);
    mountain.rotation.y = angle;
    mountain.castShadow = mountain.receiveShadow = true;
    island.add(mountain);
    mountain.updateMatrix();
    for (let i = 0; i < 7; i++) {
      const t = .24 + i * .093;
      const left = -.63 + Math.max(0, t - .28) * 1.7;
      const right = .22 + t * .83;
      const a = new THREE.Vector3(w * (left + .08), h * t, .553).applyMatrix4(mountain.matrix);
      const b = new THREE.Vector3(w * (right - .08), h * (t + .07), .553).applyMatrix4(mountain.matrix);
      beam(a.toArray(), b.toArray(), between(.017, .041), pick(['#b48465', '#e0ae85', '#c28d6d']));
    }
  }
  flatiron(-3.25, -2.22, .99, 2.55, -.16);
  flatiron(-2.18, -3.17, 1.12, 3.48, -.12);
  flatiron(-.91, -3.46, .96, 4.05, -.27);
  flatiron(.29, -3.39, .81, 3.30, -.32);
  flatiron(1.31, -3.08, .64, 2.66, -.24);
  for (let i = 0; i < 27; i++) {
    const x = between(-4.4, 3.45);
    const z = between(-3.2, -2.15);
    if ((x / 5.4) ** 2 + (z / 3.63) ** 2 < .97) pine(x, .29, z, between(.35, 1.04));
  }

  function blossom(x, y, z, scale) {
    const trunk = '#775044';
    const joint = [x - .13 * scale, y + 1.04 * scale, z];
    beam([x, y, z], joint, .17 * scale, trunk);
    for (let j = 0; j < 8; j++) {
      const angle = j / 8 * tau + between(-.24, .24);
      const separation = between(.30, .74) * scale;
      const b = [x + Math.cos(angle) * separation, y + between(1.26, 1.88) * scale, z + Math.sin(angle) * separation];
      beam(joint, b, .08 * scale, trunk);
      piece('leaf', ...b, .44 * scale, .33 * scale, .45 * scale, pick(pink), random() * tau);
      for (let k = 0; k < 7; k++) {
        const radius = between(.075, .18) * scale;
        piece('leaf', b[0] + between(-.38, .38) * scale, b[1] + between(.10, .32) * scale, b[2] + between(-.37, .37) * scale, radius * 1.3, radius, radius, pick(pink), random() * tau);
      }
    }
    for (let i = 0; i < 23; i++) {
      const angle = random() * tau;
      const radius = between(.16, .86) * scale;
      piece('leaf', x + Math.cos(angle) * radius, y + .014, z + Math.sin(angle) * radius, .055, .015, .035, pick(pink), angle);
    }
  }
  blossom(-3.6, 0, 1.13, 1.32);
  blossom(3.99, 0, -1.1, 1.27);
  blossom(.46, .29, -2.15, .86);
  blossom(3.6, 0, 2.66, .73);

  function hipRoof(x, y, z, w, d, rise) {
    const positions = [];
    const colors = [];
    const corners = [[-w, -d], [-w, d], [w, d], [w, -d]];
    const roofColors = ['#293951', '#26384e', '#304761', '#364c68', '#213047', '#414e65'];
    const point = (face, u, t) => {
      const [a, b] = [corners[face], corners[(face + 1) % 4]];
      const corner = Math.pow(Math.abs(u * 2 - 1), 4) * (1 - t) ** 4;
      const fx = a[0] + (b[0] - a[0]) * u;
      const fz = a[1] + (b[1] - a[1]) * u;
      return [
        x + fx * (1 - .83 * t), y + rise * (t ** 1.36 + .17 * corner),
        z + fz * (1 - .95 * t),
      ];
    };
    for (let face = 0; face < 4; face++) {
      const tiles = face % 2 ? 20 : 13;
      for (let i = 0; i < tiles; i++) {
        for (let row = 0; row < 6; row++) {
          const a = point(face, i / tiles, row / 6);
          const b = point(face, (i + 1) / tiles, row / 6);
          const c = point(face, (i + 1) / tiles, (row + 1) / 6);
          const d = point(face, i / tiles, (row + 1) / 6);
          positions.push(...a, ...b, ...c, ...a, ...c, ...d);
          color.set(pick(roofColors));
          for (let k = 0; k < 6; k++) colors.push(color.r, color.g, color.b);
          if (row === 0) beam(a, b, .065, '#9f7250');
          if (i % 2 === 0) beam([a[0], a[1] + .02, a[2]], [d[0], d[1] + .02, d[2]], .042, '#52627a');
        }
      }
      for (let row = 0; row < 6; row++) beam(point(face, 0, row / 6), point(face, 0, (row + 1) / 6), .08, '#b68855');
    }
    facetMesh(positions, colors);
    beam([x - w * .23, y + rise, z], [x + w * .23, y + rise, z], .10, '#d5a469');
  }

  const x = 2.03;
  const z = -.86;
  const wood = '#804e3b';
  const trim = '#bb864f';
  piece('box', x, .36, z, 2.97, .27, 2.25, '#dbc2a0');
  piece('box', x, .53, z, 2.76, .12, 2.04, '#ba8d60');
  piece('box', x, 1.14, z - .04, 2.23, 1.16, 1.62, '#be9265');
  for (const dx of [-1.16, 0, 1.16]) {
    for (const dz of [-.86, .86]) {
      piece('round', x + dx, 1.23, z + dz, .16, 1.39, .16, wood);
      piece('round', x + dx, .62, z + dz, .23, .18, .23, trim);
      piece('round', x + dx, 1.80, z + dz, .23, .17, .23, trim);
    }
  }
  for (const side of [-1, 1]) {
    piece('box', x, 1.85, z + side * .84, 2.73, .18, .18, wood);
    piece('box', x + side * 1.13, 1.83, z, .17, .17, 1.9, wood);
    for (const dx of [-.60, .60]) {
      piece('box', x + dx, 1.17, z + side * .792, .82, .74, .026, '#352c35');
      piece('box', x + dx, 1.17, z + side * .808, .66, .53, .039, '#d09956');
      for (let k = -2; k <= 2; k++) piece('box', x + dx + k * .142, 1.17, z + side * .84, .032, .56, .028, wood);
      for (const y of [.995, 1.16, 1.325]) piece('box', x + dx, y, z + side * .84, .69, .026, .028, wood);
    }
  }
  hipRoof(x, 1.92, z, 1.64, 1.30, .68);
  piece('box', x, 2.47, z, 1.30, .43, .95, wood);
  hipRoof(x, 2.68, z, 1.16, .87, .64);
  piece('orb', x, 3.4, z, .21, .23, .21, '#e6b660');
  for (let j = 0; j < 4; j++) piece('box', x, .4 - .09 * j, z + 1.1 + .19 * j, 1.68 + .12 * j, .16, .33, pick(stone));
  for (const dx of [-.93, .92]) {
    piece('round', x + dx, 1.58, z + .98, .25, .31, .25, '#f5be67');
    piece('round', x + dx, 1.75, z + .98, .28, .065, .28, wood);
    piece('round', x + dx, 1.43, z + .98, .24, .055, .24, wood);
  }

  const sx = -1.53;
  const sz = -1.24;
  for (let j = 0; j < 3; j++) piece('box', sx, .34 + j * .12, sz, 1.82 - j * .17, .16, 1.57 - j * .17, pick(stone));
  piece('box', sx, 1.02, sz, 1.23, 1.12, 1.06, '#dcb78c');
  piece('box', sx, .94, sz + .54, .38, .70, .035, '#5e4335');
  piece('round', sx, 1.23, sz + .56, .37, .1, .36, '#5e4335', 0, Math.PI / 2);
  for (const dx of [-.54, -.40, .40, .54]) piece('box', sx + dx, 1.00, sz + .59, .08, .88, .12, '#eed0a5');
  for (let level = 0; level < 9; level++) {
    const radius = 1.43 * (1 - level / 9) ** .71;
    const y = 1.58 + level * .123;
    piece('round', sx, y, sz, radius, .16, radius * .88, level % 2 ? '#d3a979' : '#e5c197', Math.PI / 12);
    for (let j = 0; j < 10; j++) {
      const a = j / 10 * tau;
      piece('rock', sx + Math.sin(a) * radius * .48, y, sz + Math.cos(a) * radius * .43, .062, .070, .062, '#cfaa81', a);
    }
  }
  piece('orb', sx, 2.76, sz, .27, .23, .27, '#dfa856');
  piece('pine', sx, 2.91, sz, .15, .22, .15, '#bd8750');
  for (let j = 0; j < 3; j++) piece('box', sx, .50 - j * .08, sz + .69 + j * .17, .72 + .16 * j, .15, .23, pick(stone));

  const gx = -2.48;
  const gz = 1.66;
  for (const side of [-1, 1]) {
    piece('box', gx + side * .54, .68, gz, .23, 1.35, .27, '#c79b72');
    piece('box', gx + side * .54, .10, gz, .34, .23, .36, '#e5c4a1');
    piece('box', gx + side * .54, 1.26, gz, .35, .21, .38, '#e6c29c');
  }
  piece('box', gx, 1.30, gz, 1.48, .17, .45, wood);
  hipRoof(gx, 1.41, gz, .92, .38, .33);
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const px = -2.35 + 3.95 * t - Math.sin(t * Math.PI * 1.4) * 1.06;
    const pz = 3.41 - 2.98 * t;
    piece('rock', px, t > .68 ? .32 : .042, pz, .43, .055, .25, pick(stone), between(-.6, .6));
    piece('rock', px + .50, t > .68 ? .32 : .035, pz, .30, .053, .22, pick(stone), between(-.6, .6));
  }
  for (let i = 0; i < 19; i++) {
    const a = .04 + i * .043;
    const wx = 5 * Math.cos(a);
    const wz = 3.53 * Math.sin(a);
    const angle = Math.atan2(5 * Math.sin(a), 3.53 * Math.cos(a));
    for (let j = 0; j < 3; j++) piece('box', wx, .11 + j * .20, wz, .36, .193, .36, pick(stone), angle);
    piece('box', wx, .68, wz, .39, .15, .43, '#d2ac80', angle);
    if (i % 2 === 0) piece('box', wx, .855, wz, .27, .23, .26, '#bc956f', angle);
  }

  const pondX = .16;
  const pondZ = 2.31;
  piece('round', pondX, .035, pondZ, 3.21, .10, 2.28, '#547c79');
  piece('round', pondX, .085, pondZ, 2.97, .042, 2.04, '#5cafaa');
  piece('round', pondX, .108, pondZ, 2.49, .012, 1.64, '#44958e');
  for (let i = 0; i < 15; i++) {
    const a = i / 15 * tau;
    piece('rock', pondX + 1.53 * Math.cos(a), .13, pondZ + 1.09 * Math.sin(a), between(.16, .32), between(.095, .21), between(.17, .30), pick(stone), a);
  }
  for (let i = 0; i < 14; i++) {
    const wx = pondX + between(-1.05, 1.02);
    const wz = pondZ + between(-.49, .52);
    piece('box', wx, .123, wz, between(.08, .34), .009, between(.018, .033), pick(['#8cc8bf', '#acd9c8', '#79c4b7']), between(-.21, .25));
  }
  for (let i = 0; i < 7; i++) piece('rock', -.42 + i * .15, .15, 1.33, .20, between(.16, .3), .26, pick(stone), between(0, tau));
  for (let i = 0; i < 6; i++) beam([-.38 + .085 * i, .39, 1.43], [-.34 + .085 * i, .13, 1.70], .05, '#8bd1c9');

  function lamp(x, y, z) {
    piece('round', x, y + .05, z, .16, .10, .16, '#b67c50');
    piece('orb', x, y + .135, z, .072, .15, .072, '#ffc564');
  }
  for (const [lx, ly, lz] of [[-3.3, 0, 2.35], [-2.0, 0, 1.96], [-1.93, .29, -.34], [-1.11, .29, -.32], [1.05, .29, .4], [2.9, .29, .46], [2.66, 0, 2.8], [.74, 0, 3.49]]) lamp(lx, ly, lz);
  for (let i = 0; i < 110; i++) {
    const a = random() * tau;
    const x = (4.1 + between(-.16, .65)) * Math.cos(a);
    const z = (2.75 + between(.05, .78)) * Math.sin(a);
    piece('rock', x, .04, z, between(.06, .19), between(.05, .13), between(.06, .16), pick([...green, ...stone]), a);
    if (i % 3 === 0) {
      for (let j = 0; j < 4; j++) piece('leaf', x + between(-.18, .18), between(.09, .22), z + between(-.16, .16), .083, .067, .081, pick(gold), a);
    }
  }
  for (const [dx, dz] of [[-4.22, .32], [-4.20, 1.98], [3.78, .37], [3.55, -2.07], [-.57, -2.42]]) {
    for (let i = 0; i < 8; i++) piece('rock', dx + between(-.35, .35), between(.03, .19), dz + between(-.34, .34), between(.15, .42), between(.12, .32), between(.15, .38), pick(stone), between(0, tau));
  }
  for (const [bx, by, bz] of [[-4.4, 0, .6], [-3.5, .29, -1.0], [-3.15, .29, -1.72], [-.48, .29, -.97], [.48, .29, -1.52], [3.77, 0, .65], [4.27, 0, -.57], [2.8, 0, 2.26]]) {
    for (let i = 0; i < 9; i++) {
      const span = between(.08, .23);
      piece('leaf', bx + between(-.32, .32), by + span * .48, bz + between(-.22, .22), span * 1.4, span * .82, span, pick(green), random() * tau);
    }
  }
  // Trail sign, a red cap charm, a spiral inlay, and a checkerboard on the terrace.
  beam([-4.10, 0, 1.80], [-4.10, 1.06, 1.80], .12, '#815e43');
  piece('box', -4.05, 1.02, 1.8, .55, .22, .085, '#b48659', -.12);
  piece('orb', -2.6, .21, 3.0, .36, .36, .36, '#f5ede1');
  piece('orb', -2.6, .29, 3.0, .34, .22, .34, '#bb5141');
  piece('round', -2.6, .251, 3.0, .36, .035, .36, '#3e3835');
  piece('orb', -2.6, .253, 3.17, .09, .09, .045, '#fff1d5');
  piece('round', 1.25, .048, 3.24, .62, .07, .62, '#ddb58a');
  for (let i = 1; i < 34; i++) {
    const point = (k) => {
      const a = k / 33 * tau * 2;
      const r = .018 + .235 * k / 33;
      return [1.25 + r * Math.cos(a), .091, 3.24 + r * Math.sin(a)];
    };
    beam(point(i - 1), point(i), .025, '#448982', 'box');
  }
  piece('box', -.65, .39, .6, .71, .16, .71, '#8b604e');
  for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) {
    piece('box', -.65 + (a - 2.5) * .096, .479, .6 + (b - 2.5) * .096, .095, .02, .095, (a + b) % 2 ? '#594657' : '#e6c6a0');
  }
  piece('pine', -.61, .55, .58, .12, .14, .12, '#f2ddba');
  piece('orb', -.61, .63, .58, .099, .10, .10, '#f2ddba');
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.15), new THREE.MeshStandardMaterial({
    color: '#a4d7dc', metalness: .23, roughness: .25,
  }));
  gem.position.set(2.03, 3.60, -.86);
  gem.rotation.z = .18;
  island.add(gem);

  const material = new THREE.MeshStandardMaterial({ roughness: .88 });
  for (const [kind, matrices] of batches) {
    const mesh = new THREE.InstancedMesh(shapes[kind], material, matrices.length);
    matrices.forEach(([matrix, tint], index) => {
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.set(tint));
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    island.add(mesh);
  }
  return island;
}
