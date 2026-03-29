import React from 'react';
import { motion } from 'motion/react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  className = '', 
  disabled = false,
  isLoading = false,
  icon: Icon,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20",
    secondary: "bg-white/5 hover:bg-white/10 text-white",
    outline: "border border-white/10 hover:border-white/20 text-gray-400 hover:text-white",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white",
    success: "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={18} />}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;
