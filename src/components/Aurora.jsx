import React from 'react';

/**
 * Pure-CSS aurora blobs. Used as ambient section decoration.
 * Positioned absolutely by the parent section.
 */
export default function Aurora({ color = '#9db5ff', size = 480, top = '10%', left = '50%', opacity = 0.28 }) {
  return (
    <div
      aria-hidden
      className="aurora"
      style={{
        top, left,
        width: size, height: size,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 60%)`,
        opacity,
      }}
    />
  );
}
