const framesPerPack = 24;
const lastFrame = 821;
const maxDecodes = 3;
const maxBitmaps = 9;
const variants = {
  wide: { width: 1920, height: 1080 },
  portrait: { width: 800, height: 1280 },
};

export function visibleFlightFrame(frame) {
  // The lens is completely occluded in the middle of this foreground wipe.
  if (frame >= 340 && frame <= 346) return frame < 343 ? 339 : 347;
  return frame;
}

function unpack(buffer) {
  const view = new DataView(buffer);
  const count = view.getUint32(0, true);
  if (count < 1 || count > framesPerPack) throw new Error('Invalid flight frame pack');
  let offset = (count + 1) * 4;
  const frames = [];
  for (let i = 0; i < count; i++) {
    const size = view.getUint32((i + 1) * 4, true);
    frames.push(new Uint8Array(buffer, offset, size));
    offset += size;
  }
  if (offset !== buffer.byteLength) throw new Error('Incomplete flight frame pack');
  return frames;
}

export function createFlightFrames(canvas, variant, onDraw, onFailure) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context || typeof createImageBitmap !== 'function') throw new Error('Frame decoding unavailable');
  const { width, height } = variants[variant];
  canvas.width = width;
  canvas.height = height;
  const request = new AbortController();
  const packs = new Map();
  const bitmaps = new Map();
  const decoding = new Set();
  let target = 0;
  let painted = -1;
  let direction = 1;
  let failed = false;
  let pendingPacks = 0;
  let paintRequest = 0;

  function nextFrame() {
    const gap = target - painted;
    // Normal wheel steps travel through intermediate frames. A distant chapter
    // jump can go straight to its requested view.
    if (painted >= 0 && Math.abs(gap) <= 100) {
      return visibleFlightFrame(painted + Math.sign(gap) * Math.min(Math.abs(gap), 9));
    }
    return target;
  }

  function stopOnFailure() {
    if (failed || request.signal.aborted) return;
    failed = true;
    onFailure();
  }

  function queuePack(index) {
    if (index < 0 || index > Math.floor(lastFrame / framesPerPack) || packs.has(index) || pendingPacks >= 3) return;
    packs.set(index, null);
    pendingPacks++;
    const key = String(index).padStart(2, '0');
    fetch(`/world/flight/frames/${variant}/${key}.bin`, { signal: request.signal }).then((response) => {
      if (!response.ok) throw new Error('Flight frame pack unavailable');
      return response.arrayBuffer();
    }).then((data) => {
      if (request.signal.aborted || failed) return;
      packs.set(index, unpack(data));
      const current = Math.floor(nextFrame() / framesPerPack);
      for (const [cached, value] of packs) {
        if (Array.isArray(value) && Math.abs(cached - current) > 2) packs.delete(cached);
      }
    }).catch(() => {
      packs.set(index, false);
      if (index === Math.floor(target / framesPerPack)) stopOnFailure();
    }).finally(() => { pendingPacks--; fill(); });
  }

  function draw() {
    paintRequest = 0;
    if (request.signal.aborted) return;
    const frame = nextFrame();
    const image = bitmaps.get(frame);
    if (!image || painted === frame) return;
    context.drawImage(image, 0, 0);
    painted = frame;
    onDraw(frame);
    fill();
  }

  function fill() {
    if (failed || request.signal.aborted) return;
    const frameToDraw = nextFrame();
    const packIndex = Math.floor(frameToDraw / framesPerPack);
    if (packs.get(packIndex) === false) { stopOnFailure(); return; }
    queuePack(packIndex);
    if (Array.isArray(packs.get(packIndex))) queuePack(packIndex + direction);
    if (bitmaps.has(frameToDraw) && painted !== frameToDraw && !paintRequest) paintRequest = requestAnimationFrame(draw);
    const predicted = visibleFlightFrame(frameToDraw + Math.sign(target - frameToDraw) * Math.min(Math.abs(target - frameToDraw), 9));
    const candidates = [frameToDraw, predicted, frameToDraw + direction, frameToDraw + direction * 3];
    for (const frame of candidates) {
      if (decoding.size >= maxDecodes) break;
      if (frame < 0 || frame > lastFrame || bitmaps.has(frame) || decoding.has(frame)) continue;
      const pack = packs.get(Math.floor(frame / framesPerPack));
      const data = pack?.[frame % framesPerPack];
      if (!data) continue;
      decoding.add(frame);
      createImageBitmap(new Blob([data], { type: 'image/webp' })).then((image) => {
        if (request.signal.aborted || failed) {
          image.close();
          return;
        }
        bitmaps.set(frame, image);
        if (bitmaps.size > maxBitmaps) {
          const upcoming = nextFrame();
          const farthest = [...bitmaps.keys()].sort((a, b) => Math.abs(b - upcoming) - Math.abs(a - upcoming))[0];
          bitmaps.get(farthest).close();
          bitmaps.delete(farthest);
        }
      }).catch(stopOnFailure).finally(() => {
        decoding.delete(frame);
        fill();
      });
    }
  }

  return {
    show(frame) {
      if (failed) return;
      if (frame !== target) direction = Math.sign(frame - target);
      target = frame;
      fill();
    },
    dispose() {
      request.abort();
      cancelAnimationFrame(paintRequest);
      bitmaps.forEach((image) => image.close());
      bitmaps.clear();
      packs.clear();
    },
  };
}
