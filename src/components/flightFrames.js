const lastFrame = 821;
const desktopStillStep = 3;
const nativeDesktopSize = [2560, 1440];
const overviewStep = 12;
const motionStep = 2;
const motionColumns = 4;
const motionTiles = 12;
const detailColumns = 3;
const detailTiles = 6;
const overviewColumns = 10;
const formats = {
  wide: { overview: [320, 180], motion: [768, 432], detail: [1280, 720], canvas: [1920, 1080] },
  portrait: { overview: [230, 368], motion: [480, 768], detail: [800, 1280], canvas: [900, 1440] },
};

export function visibleFlightFrame(frame) {
  // The lens is completely occluded in the middle of this foreground wipe.
  if (frame >= 340 && frame <= 346) return frame < 343 ? 339 : 347;
  return frame;
}

async function decode(blob) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob); } catch { /* Use the normal image decoder if bitmaps are unavailable. */ }
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
const sheetName = (group) => String(group).padStart(2, '0');

async function load(url, controller, priority = 'auto') {
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, priority });
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

function sharpDesktopFrame(frame) {
  if (frame === lastFrame) return lastFrame;
  const sample = Math.round(frame / desktopStillStep) * desktopStillStep;
  if (sample >= 340 && sample <= 346) return frame < 343 ? 339 : 348;
  return sample;
}

export function createFlightFrames(canvas, variant, onDraw, onUnavailable) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Flight canvas unavailable');
  const { overview: overviewSize, motion: baseMotionSize, detail: detailSize, canvas: canvasSize } = formats[variant];
  const [width, height] = canvasSize;
  canvas.width = width;
  canvas.height = height;
  const desktop = variant === 'wide' && !matchMedia('(pointer: coarse)').matches;
  const connection = navigator.connection;
  const enableDetail = !connection?.saveData;
  const useDesktopMotion = desktop && enableDetail && (!connection?.effectiveType || connection.effectiveType === '4g');
  const columnsPerSheet = useDesktopMotion ? detailColumns : motionColumns;
  const tilesPerSheet = useDesktopMotion ? detailTiles : motionTiles;
  const motionSize = useDesktopMotion ? detailSize : baseMotionSize;
  const motionGroup = (frame) => Math.floor(sheetFrame(frame, motionStep) / tilesPerSheet);
  const prefetchRadius = Math.ceil(72 / (motionStep * tilesPerSheet));
  const motionPath = `/world/flight/motion-${useDesktopMotion ? 'v2' : 'v1'}/${variant}/`;
  const detailPath = `/world/flight/motion-v2/${variant}/`;
  const sheets = new Map();
  const requests = new Map();
  const failedAt = new Map();
  const overviewRequest = new AbortController();
  const lastSheet = motionGroup(lastFrame);
  let overview;
  let still;
  let detailRequest;
  let detailAttempt = -1;
  let target = 0;
  let destination = 0;
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
    const group = Math.floor(index / tilesPerSheet);
    let source = sheets.get(group);
    let tile = index % tilesPerSheet;
    let size = motionSize;
    let columns = columnsPerSheet;
    let frame = Math.min(lastFrame, index * motionStep);
    let quality = 'motion';

    if (still?.target === target) {
      ({ image: source, frame, tile, columns, size } = still);
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
      if (!displayed || Math.abs(displayed.frame - target) > 24) {
        displayed = undefined;
        onUnavailable();
      }
      return;
    }
    if (displayed?.frame === frame && displayed.quality === quality) return;
    const [w, h] = size;
    const [outputWidth, outputHeight] = desktop && quality === 'detail' ? nativeDesktopSize : canvasSize;
    if (canvas.width !== outputWidth || canvas.height !== outputHeight) {
      canvas.width = outputWidth;
      canvas.height = outputHeight;
    }
    context.imageSmoothingQuality = desktop ? 'high' : 'medium';
    context.drawImage(source, tile % columns * w, Math.floor(tile / columns) * h, w, h, 0, 0, outputWidth, outputHeight);
    displayed = { frame, quality };
    onDraw(frame, quality);
  }

  function queueSheet(group) {
    if (group < 0 || group > lastSheet || sheets.has(group) || requests.has(group)) return;
    if (Date.now() - failedAt.get(group) < 5000) return;
    const controller = new AbortController();
    requests.set(group, controller);
    load(`${motionPath}${sheetName(group)}.webp`, controller, group === motionGroup(target) ? 'high' : 'low')
      .then(decode).then((image) => {
        if (disposed || controller.signal.aborted) {
          release(image);
          return;
        }
        sheets.set(group, image);
        if (sheets.size > 3) {
          const current = motionGroup(target);
          const farthest = [...sheets.keys()].sort((a, b) => Math.abs(b - current) - Math.abs(a - current))[0];
          release(sheets.get(farthest));
          sheets.delete(farthest);
        }
        requestPaint();
      }).catch(() => {
        if (requests.get(group) === controller) failedAt.set(group, Date.now());
      }).finally(() => {
        if (requests.get(group) !== controller) return;
        requests.delete(group);
        fillQueue();
      });
  }

  function fillQueue() {
    if (disposed) return;
    const current = motionGroup(target);
    const next = motionGroup(destination);
    const stopped = isResting && target !== 0;
    for (const [group, controller] of requests) {
      const keep = stopped ? group === current : Math.min(Math.abs(group - current), Math.abs(group - next)) <= prefetchRadius;
      if (keep) continue;
      requests.delete(group);
      controller.abort();
    }
    // After a swipe, let the sharp stopped frame use the available bandwidth.
    if (stopped && enableDetail && (detailRequest || detailAttempt !== target || still?.target === target)) return;
    // Prefetch where the native scroll is heading, even while the camera is catching up.
    const nearby = [next, current];
    if (!isResting || !target) nearby.push(next + direction);
    if (!isResting && destination > 0) nearby.push(next + 2 * direction);
    for (const group of nearby) {
      if (requests.size >= 3 || (!destination && group !== current && !sheets.has(current))) break;
      queueSheet(group);
    }
  }

  async function refine(frame) {
    if (disposed || !isResting || frame !== target || !frame || detailAttempt === frame) return;
    detailAttempt = frame;
    const controller = new AbortController();
    detailRequest = controller;
    try {
      let detail;
      if (desktop) {
        const sample = sharpDesktopFrame(frame);
        const index = String(Math.ceil(sample / desktopStillStep)).padStart(3, '0');
        const image = await load(`/world/flight/stills-v4/wide/${index}.webp`, controller, 'high').then(decode);
        detail = { image, frame: sample, tile: 0, columns: 1, size: nativeDesktopSize };
      } else {
        const sample = sheetFrame(frame, motionStep);
        const group = sheetName(Math.floor(sample / detailTiles));
        const image = await load(`${detailPath}${group}.webp`, controller, 'high').then(decode);
        detail = { image, frame: Math.min(lastFrame, sample * motionStep), tile: sample % detailTiles, columns: detailColumns, size: detailSize };
      }
      if (disposed || controller.signal.aborted) {
        release(detail.image);
        return;
      }
      release(still?.image);
      still = { ...detail, target: frame };
      requestPaint();
    } catch {
      // The motion atlas can keep showing the stopped view.
    } finally {
      if (detailRequest === controller) {
        detailRequest = undefined;
        fillQueue();
      }
    }
  }

  load(`/world/flight/overview-v3/${variant}.webp`, overviewRequest, 'high').then(decode).then((image) => {
    if (disposed) release(image);
    else {
      overview = image;
      requestPaint();
    }
  }).catch(() => { /* Motion sheets are independently available. */ });
  queueSheet(0);

  return {
    show(frame, next, resting) {
      if (next !== destination) direction = Math.sign(next - destination);
      if (frame !== target) {
        detailRequest?.abort();
        detailAttempt = -1;
      }
      target = frame;
      destination = next;
      isResting = resting;
      fillQueue();
      if (enableDetail && resting && frame && still?.target !== frame) refine(frame);
      if (paintRequest) cancelAnimationFrame(paintRequest);
      draw();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(paintRequest);
      overviewRequest.abort();
      detailRequest?.abort();
      requests.forEach((controller) => controller.abort());
      sheets.forEach(release);
      release(overview);
      release(still?.image);
    },
  };
}
