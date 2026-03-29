import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`bg-[#1a1a1a] border border-white/10 rounded-3xl w-full ${maxWidth} relative overflow-hidden shadow-2xl`}
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
