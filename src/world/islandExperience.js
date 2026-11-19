import * as THREE from 'three';
import { buildIsland, landmarks } from './buildIsland.js';

const clamp = (value) => Math.min(1, Math.max(0, value));

export function mountIsland(canvas, track, markerNodes) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.add(buildIsland());

  const ambient = new THREE.HemisphereLight('#fff6ed', '#a39075', 1.65);
  const key = new THREE.DirectionalLight('#fff0d8', 2.6);
  key.position.set(-4, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -8.5, right: 8.5, top: 8.5, bottom: -8.5, near: 1, far: 28 });
  key.shadow.normalBias = .024;
  key.shadow.bias = -.00025;
  key.shadow.camera.updateProjectionMatrix();
  const rim = new THREE.DirectionalLight('#dae4fb', .8);
  rim.position.set(4, 4, -6);
  scene.add(ambient, key, rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(13, 9.2), new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: 'varying vec2 uvShadow; void main() { uvShadow = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 uvShadow;
      void main() {
        float falloff = 1.0 - smoothstep(0.15, 0.5, length(uvShadow - vec2(0.5)));
        gl_FragColor = vec4(0.34, 0.23, 0.17, falloff * falloff * 0.34);
      }`,
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.94;
  floor.receiveShadow = true;
  scene.add(floor);

  const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 65);
  const markers = Object.entries(landmarks).map(([id, point]) => [markerNodes[id], new THREE.Vector3(...point)]);
  const point = new THREE.Vector3();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let visible = true;
  let width = 0;
  let height = 0;
  let target = 0;
  let progress = 0;
  let pointerX = 0;
  let lean = 0;
  let lastTime = 0;

  function queue() {
    if (!frame && visible && width && height) frame = requestAnimationFrame(draw);
  }

  function readScroll() {
    const rect = track.getBoundingClientRect();
    const range = rect.height - Math.max(0, window.innerHeight - 64);
    target = preference.matches ? 0 : clamp(window.scrollY / Math.max(360, range));
    queue();
  }

  function draw(time) {
    frame = 0;
    const ease = 1 - Math.exp(-Math.min(48, time - (lastTime || time - 16)) / 75);
    const tilt = preference.matches ? 0 : pointerX;
    lastTime = time;
    progress = preference.matches ? 0 : progress + (target - progress) * ease;
    lean = preference.matches ? 0 : lean + (tilt - lean) * ease;
    if (Math.abs(target - progress) < .001) progress = target;
    if (Math.abs(tilt - lean) < .001) lean = tilt;

    const angle = .53 - 1.09 * progress + .065 * lean;
    const elevation = .67 - .16 * progress;
    const distance = 18;
    const radius = Math.cos(elevation) * distance;
    camera.position.set(Math.sin(angle) * radius, Math.sin(elevation) * distance, Math.cos(angle) * radius);
    camera.lookAt(0, .46 + .12 * progress, -.16);
    camera.zoom = 1 + .035 * Math.sin(Math.PI * progress);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);

    for (const [node, vector] of markers) {
      point.copy(vector).project(camera);
      const x = 50 * (1 + point.x);
      const y = 50 * (1 - point.y);
      node.style.left = `${x.toFixed(2)}%`;
      node.style.top = `${y.toFixed(2)}%`;
    }
    canvas.dataset.progress = progress.toFixed(3);
    if (progress !== target || lean !== tilt) queue();
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const vertical = Math.max(9.5, 14.65 / aspect);
    camera.top = vertical / 2;
    camera.bottom = -camera.top;
    camera.right = camera.top * aspect;
    camera.left = -camera.right;
    const density = Math.max(1, Math.min(window.devicePixelRatio || 1, 1.75, Math.sqrt(1_750_000 / (width * height))));
    renderer.setPixelRatio(density);
    renderer.setSize(width, height, false);
    readScroll();
  }

  function trackPointer(event) {
    if (event.pointerType !== 'mouse' || preference.matches) return;
    const bounds = canvas.getBoundingClientRect();
    pointerX = 2 * clamp((event.clientX - bounds.left) / bounds.width) - 1;
    queue();
  }

  function resetPointer() {
    pointerX = 0;
    queue();
  }

  const area = canvas.parentElement;
  const sizing = new ResizeObserver(resize);
  sizing.observe(area);
  sizing.observe(track);
  const observation = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) readScroll();
  }, { rootMargin: '60px' });
  observation.observe(area);
  window.addEventListener('scroll', readScroll, { passive: true });
  canvas.addEventListener('webglcontextrestored', restore);
  preference.addEventListener('change', readScroll);
  area.addEventListener('pointermove', trackPointer, { passive: true });
  area.addEventListener('pointerleave', resetPointer);
  resize();
  if (width && height) {
    cancelAnimationFrame(frame);
    progress = target;
    draw(performance.now());
  }
  function restore() {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    resize();
  }

  return () => {
    cancelAnimationFrame(frame);
    sizing.disconnect();
    observation.disconnect();
    window.removeEventListener('scroll', readScroll);
    canvas.removeEventListener('webglcontextrestored', restore);
    preference.removeEventListener('change', readScroll);
    area.removeEventListener('pointermove', trackPointer);
    area.removeEventListener('pointerleave', resetPointer);
    const resources = new Set();
    scene.traverse((object) => {
      if (object.geometry) resources.add(object.geometry);
      if (object.material) for (const material of [object.material].flat()) resources.add(material);
      if (object.isInstancedMesh) object.dispose();
    });
    resources.forEach((resource) => resource.dispose());
    key.shadow.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
