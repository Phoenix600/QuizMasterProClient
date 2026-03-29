import React from 'react';

const Loader = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const loader = (
    <div className={`${sizes[size]} border-white/10 border-t-orange-500 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#141414] flex items-center justify-center z-50">
        {loader}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {loader}
    </div>
  );
};

export default Loader;
