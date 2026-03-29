import React from 'react';

const Container = ({ children, className = '', maxWidth = 'max-w-7xl' }) => {
  return (
    <div className={`mx-auto px-6 ${maxWidth} ${className}`}>
      {children}
    </div>
  );
};

export default Container;
