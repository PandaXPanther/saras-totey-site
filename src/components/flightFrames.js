const lastFrame = 821;
const framesPerPack = 24;
const overviewStep = 12;
const motionStep = 2;
const motionColumns = 4;
const overviewColumns = 10;
const formats = {
  wide: { overview: [192, 108], motion: [768, 432], canvas: [1920, 1080] },
  portrait: { overview: [125, 200], motion: [480, 768], canvas: [600, 960] },
};

export function visibleFlightFrame(frame) {
  // The lens is completely occluded in the middle of this foreground wipe.
  if (frame >= 340 && frame <= 346) return frame < 343 ? 339 : 347;
  return frame;
}

function stillFromPack(buffer, index) {
  const view = new DataView(buffer);
  const count = view.getUint32(0, true);
  if (index >= count || count > framesPerPack) throw new Error('Invalid flight frame pack');
  let offset = (count + 1) * 4;
  for (let frame = 0; frame < index; frame++) offset += view.getUint32((frame + 1) * 4, true);
  const size = view.getUint32((index + 1) * 4, true);
  return new Blob([new Uint8Array(buffer, offset, size)], { type: 'image/webp' });
}

async function decode(blob) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob); } catch { /* Use the WebView's normal image decoder. */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const release = (image) => image?.close?.();

async function load(url, controller) {
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Flight media unavailable');
    return await response.blob();
  } finally {
    clearTimeout(timeout);
  }
}

function sheetFrame(target, step) {
  if (target === lastFrame) return Math.ceil(lastFrame / step);
  const frame = Math.round(target / step) * step;
  if (frame >= 340 && frame <= 346) return target <= 339 ? 338 / step : 348 / step;
  return frame / step;
}

export function createFlightFrames(canvas, variant, onDraw, onUnavailable) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Flight canvas unavailable');
  const { overview: overviewSize, motion: motionSize, canvas: canvasSize } = formats[variant];
  const [width, height] = canvasSize;
  canvas.width = width;
  canvas.height = height;
  const path = `/world/flight/motion-v1/${variant}/`;
  const sheets = new Map();
  const requests = new Map();
  const failedAt = new Map();
  const overviewRequest = new AbortController();
  const lastSheet = Math.floor(lastFrame / framesPerPack);
  const enableDetail = variant === 'wide' && !matchMedia('(pointer: coarse)').matches && !navigator.connection?.saveData;
  let overview;
  let still;
  let detailRequest;
  let detailTimer;
  let detailAttempt = -1;
  let target = 0;
  let direction = 1;
  let isResting = true;
  let disposed = false;
  let paintRequest = 0;
  let displayed;

  function requestPaint() {
    if (!disposed && !paintRequest) paintRequest = requestAnimationFrame(draw);
  }

  function draw() {
    paintRequest = 0;
    const index = sheetFrame(target, motionStep);
    const perSheet = framesPerPack / motionStep;
    const group = Math.floor(index / perSheet);
    let source = sheets.get(group);
    let tile = index % perSheet;
    let size = motionSize;
    let columns = motionColumns;
    let frame = Math.min(lastFrame, index * motionStep);
    let quality = 'motion';

    if (still?.frame === target && isResting) {
      source = still.image;
      tile = 0;
      size = canvasSize;
      columns = 1;
      frame = target;
      quality = 'detail';
    } else if (!source) {
      source = overview;
      tile = sheetFrame(target, overviewStep);
      size = overviewSize;
      columns = overviewColumns;
      frame = Math.min(lastFrame, tile * overviewStep);
      quality = 'overview';
    }

    if (!source) {
      // On a cold connection a distant swipe should still reveal the right chapter.
      if (!displayed || Math.abs(displayed.frame - target) > framesPerPack) {
        displayed = undefined;
        onUnavailable();
      }
      return;
    }
    if (displayed?.frame === frame && displayed.quality === quality) return;
    const [w, h] = size;
    context.drawImage(source, tile % columns * w, Math.floor(tile / columns) * h, w, h, 0, 0, width, height);
    displayed = { frame, quality };
    onDraw(frame, quality);
  }

  function queueSheet(group) {
    if (group < 0 || group > lastSheet || sheets.has(group) || requests.has(group)) return;
    if (Date.now() - failedAt.get(group) < 5000) return;
    const controller = new AbortController();
    requests.set(group, controller);
    const file = String(group).padStart(2, '0');
    load(`${path}${file}.webp`, controller).then(decode).then((image) => {
      if (disposed || controller.signal.aborted) {
        release(image);
        return;
      }
      sheets.set(group, image);
      if (sheets.size > 3) {
        const current = Math.floor(sheetFrame(target, motionStep) * motionStep / framesPerPack);
        const farthest = [...sheets.keys()].sort((a, b) => Math.abs(b - current) - Math.abs(a - current))[0];
        release(sheets.get(farthest));
        sheets.delete(farthest);
      }
      if (group === Math.floor(sheetFrame(target, motionStep) * motionStep / framesPerPack)) queueSheet(group + direction);
      requestPaint();
    }).catch(() => {
      if (requests.get(group) === controller) failedAt.set(group, Date.now());
    }).finally(() => {
      if (requests.get(group) === controller) requests.delete(group);
    });
  }

  async function refine(frame) {
    detailTimer = undefined;
    if (disposed || !isResting || frame !== target || !frame || detailAttempt === frame) return;
    detailAttempt = frame;
    const controller = new AbortController();
    detailRequest = controller;
    const group = String(Math.floor(frame / framesPerPack)).padStart(2, '0');
    try {
      const data = await load(`/world/flight/frames/wide/${group}.bin`, controller);
      const image = await decode(stillFromPack(await data.arrayBuffer(), frame % framesPerPack));
      if (disposed || controller.signal.aborted) {
        release(image);
        return;
      }
      release(still?.image);
      still = { frame, image };
      requestPaint();
    } catch {
      // The atlas can display the stopped view by itself.
    } finally {
      if (detailRequest === controller) detailRequest = undefined;
    }
  }

  load(`${path}overview.webp`, overviewRequest).then(decode).then((image) => {
    if (disposed) release(image);
    else {
      overview = image;
      requestPaint();
    }
  }).catch(requestPaint);

  return {
    show(frame, resting) {
      if (frame !== target) {
        direction = Math.sign(frame - target);
        detailRequest?.abort();
        detailAttempt = -1;
        clearTimeout(detailTimer);
        detailTimer = undefined;
      }
      target = frame;
      isResting = resting;
      const group = Math.floor(sheetFrame(frame, motionStep) * motionStep / framesPerPack);
      const ahead = group + direction;
      for (const [pending, controller] of requests) {
        if (pending === group || pending === ahead) continue;
        requests.delete(pending);
        controller.abort();
      }
      queueSheet(group);
      if (sheets.has(group) || frame % framesPerPack >= 8) queueSheet(ahead);
      if (enableDetail && resting && frame && !detailTimer && detailAttempt !== frame) {
        detailTimer = setTimeout(() => refine(frame), 480);
      }
      requestPaint();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(paintRequest);
      clearTimeout(detailTimer);
      overviewRequest.abort();
      detailRequest?.abort();
      requests.forEach((controller) => controller.abort());
      sheets.forEach(release);
      release(overview);
      release(still?.image);
    },
  };
}
