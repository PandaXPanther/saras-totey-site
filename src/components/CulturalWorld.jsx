import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const scenes = [
  { key: 'japan', src: '/world/japan.webp', alt: 'Sakura trees, torii gates, and a pagoda in an indigo landscape' },
  { key: 'trading', src: '/world/trading.webp', alt: 'A Japanese timber study looking into a garden of cherry trees' },
  { key: 'bridge', src: '/world/bridge.webp', alt: 'A stone threshold between Japanese and Indian architectural landscapes' },
  { key: 'india', src: '/world/india.webp', alt: 'An Indian temple courtyard with rangoli, marigolds, and diya lamps' },
];

export default function CulturalWorld() {
  const [active, setActive] = useState('japan');
  const { scrollYProgress } = useScroll();
  const drift = useTransform(scrollYProgress, [0, 1], ['0%', '-9%']);

  useEffect(() => {
    const targets = document.querySelectorAll('[data-world]');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.dataset.world);
      },
      { rootMargin: '-28% 0px -28% 0px', threshold: [0, 0.2, 0.5] },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cultural-world" aria-hidden="true">
      {scenes.map((scene) => (
        <motion.img
          key={scene.key}
          src={scene.src}
          alt=""
          className={active === scene.key ? 'world-scene is-active' : 'world-scene'}
          style={{ y: drift }}
        />
      ))}
      <div className="world-veil" />
      <div className="petal-field">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
    </div>
  );
}
