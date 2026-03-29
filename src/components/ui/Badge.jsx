import React from 'react';

const Badge = ({ children, variant = 'primary', className = '', icon: Icon }) => {
  const variants = {
    primary: "bg-orange-500/10 text-orange-500",
    secondary: "bg-blue-500/10 text-blue-500",
    success: "bg-green-500/10 text-green-500",
    danger: "bg-red-500/10 text-red-500",
    neutral: "bg-white/5 text-gray-400",
  };

  return (
    <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${variants[variant]} ${className}`}>
      {Icon && <Icon size={14} />}
      {children}
    </div>
  );
};

export default Badge;
