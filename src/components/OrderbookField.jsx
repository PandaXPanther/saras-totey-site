import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

/**
 * Hero background: an orderbook-depth silhouette that breathes slowly.
 * Gentle amplitude modulation, no color pulsing, no drifting particles.
 * Muted slate palette to match the rest of the page.
 */

function Bars({ count = 44, side = 'bid' }) {
  const groupRef = useRef();

  const bars = useMemo(() => {
    const arr = [];
    let seed = side === 'bid' ? 7 : 13;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < count; i++) {
      const dist = Math.abs(i - count / 2);
      const base = 0.35 + rand() * 1.6 * Math.exp(-dist * 0.055);
      arr.push({
        x: (i - count / 2) * 0.18,
        base: Math.max(0.05, base),
        phase: (i * 0.35 + (side === 'bid' ? 1.7 : 0)) % (Math.PI * 2),
        freq: 0.28 + rand() * 0.18,
        amp: 0.18 + rand() * 0.16,
      });
    }
    return arr;
  }, [count, side]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = groupRef.current;
    if (!g) return;
    for (let i = 0; i < g.children.length; i++) {
      const mesh = g.children[i];
      const b = bars[i];
      // Gentle sinusoidal breathing around each bar's base height
      const h = b.base * (1 + Math.sin(t * b.freq + b.phase) * b.amp);
      const scaled = Math.max(0.04, h);
      mesh.scale.y = scaled;
      mesh.position.y = (side === 'bid' ? -1 : 1) * (scaled / 2 + 0.03);
    }
  });

  return (
    <group ref={groupRef}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, 0, 0]}>
          <boxGeometry args={[0.1, 1, 0.06]} />
          <meshBasicMaterial
            transparent
            opacity={0.3}
            color={side === 'bid' ? '#4c6a88' : '#5c7398'}
          />
        </mesh>
      ))}
    </group>
  );
}

function Grid() {
  const lines = useMemo(() => {
    const g = [];
    for (let i = -6; i <= 6; i++) g.push({ y: i * 0.5 });
    return g;
  }, []);
  return (
    <group>
      {lines.map((l, i) => (
        <mesh key={i} position={[0, l.y, -0.5]}>
          <planeGeometry args={[20, 0.004]} />
          <meshBasicMaterial color="#3a4560" transparent opacity={0.14} />
        </mesh>
      ))}
    </group>
  );
}

export default function OrderbookField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <fog attach="fog" args={['#05070d', 4, 12]} />
      <Grid />
      <group position={[0, 0.05, 0]}>
        <Bars count={44} side="ask" />
      </group>
      <group position={[0, -0.05, 0]}>
        <Bars count={44} side="bid" />
      </group>
    </Canvas>
  );
}
