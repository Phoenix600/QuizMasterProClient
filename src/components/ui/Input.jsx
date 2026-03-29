import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className = '', 
  error,
  icon: Icon,
  ...props 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all ${Icon ? 'pl-12' : ''} ${error ? 'border-red-500/50' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
