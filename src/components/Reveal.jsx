import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.06,
      ease: [0.2, 0.9, 0.2, 1],
    },
  }),
};

export default function Reveal({ children, i = 0, as: Tag = 'div', ...rest }) {
  return (
    <motion.div
      custom={i}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
