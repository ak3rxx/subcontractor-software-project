
import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
        <span className="text-xl font-bold text-white">GS</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Grandscale</h1>
    </div>
  );
};

export default Logo;
