import React from 'react';
import { motion } from 'motion/react';

const Card = ({ children, className = '', onClick, hover = true, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, borderColor: 'rgba(255, 255, 255, 0.1)' } : {}}
      onClick={onClick}
      className={`bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 transition-all relative overflow-hidden group ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
