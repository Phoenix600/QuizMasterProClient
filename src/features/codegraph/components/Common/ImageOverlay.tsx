import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageOverlayProps {
  src: string | null;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({ src, alt, isOpen, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-12 cursor-zoom-out"
        >
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 right-6 p-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-full transition-all border border-white/10"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X size={24} />
          </motion.button>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt || 'Full screen preview'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/5 cursor-default"
            />
            
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{alt || 'Image Preview'}</span>
                <div className="w-px h-3 bg-zinc-800" />
                <button 
                  onClick={() => window.open(src, '_blank')}
                  className="text-zinc-400 hover:text-white transition-colors"
                  title="Open in new tab"
                >
                    <Download size={14} />
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
