import React, { useEffect, useRef } from 'react';
import { pageScenes, sceneWidth, sceneHeight } from './pageScenes.js';

const frameInterval = 1000 / 30;
const sceneDuration = 4800;

function PageBackdrop({ scene }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let frame = 0;
    let lastPaint = 0;
    let elapsed = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    function paint() {
      if (!width || !height) return;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const fit = Math.min(width / sceneWidth, height / sceneHeight);
      ctx.translate((width - sceneWidth * fit) / 2, (height - sceneHeight * fit) / 2);
      ctx.scale(fit, fit);
      pageScenes[scene](ctx, elapsed / 1000);
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      if (canvas.clientWidth === width && canvas.clientHeight === height && ratio === pixelRatio) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      pixelRatio = ratio;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      paint();
    }

    function sync() {
      if (elapsed >= sceneDuration || motion.matches || !visible || document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastPaint = 0;
      } else if (!frame) {
        frame = requestAnimationFrame(tick);
      }
    }

    function tick(now) {
      frame = 0;
      if (!lastPaint || now - lastPaint >= frameInterval - 1) {
        if (lastPaint) elapsed = Math.min(sceneDuration, elapsed + now - lastPaint);
        lastPaint = now;
        paint();
      }
      sync();
    }

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    visibilityObserver.observe(canvas);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', resize);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
    };
  }, [scene]);

  return <canvas className="folio-scene" data-scene={scene} ref={canvasRef} aria-hidden="true" />;
}

export default function ProjectHeading({ scene, className, children }) {
  return (
    <header className={`folio-wrap page-heading page-heading--scene ${className}`}>
      <PageBackdrop scene={scene} />
      {children}
    </header>
  );
}
