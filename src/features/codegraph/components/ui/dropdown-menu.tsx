import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && (child.type as any).displayName === 'DropdownMenuTrigger') {
          return React.cloneElement(child as React.ReactElement<any>, { 
            onClick: () => setIsOpen(!isOpen) 
          });
        }
        if (React.isValidElement(child) && (child.type as any).displayName === 'DropdownMenuContent') {
          return <AnimatePresence>{isOpen && React.cloneElement(child as React.ReactElement<any>, { onClose: () => setIsOpen(false) })}</AnimatePresence>;
        }
        return child;
      })}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, onClick, className }: any) => {
  return (
    <div onClick={onClick} className={cn("cursor-pointer", className)}>
      {children}
    </div>
  );
};
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = ({ children, onClose, className, align = 'end' }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className={cn(
        "absolute z-[110] mt-2 w-56 origin-top-right rounded-xl border border-zinc-800 bg-[#0F0F0F] shadow-2xl focus:outline-none overflow-hidden",
        align === 'end' ? "right-0" : "left-0",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1" onClick={onClose}>
        {children}
      </div>
    </motion.div>
  );
};
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = ({ children, onClick, className, disabled }: any) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-800 focus:bg-zinc-800 outline-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = ({ className }: any) => <div className={cn("my-1 h-[1px] bg-zinc-800", className)} />;
export const DropdownMenuLabel = ({ children, className }: any) => <div className={cn("px-4 py-2 text-xs font-bold text-zinc-500", className)}>{children}</div>;
