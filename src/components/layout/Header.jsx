import React from 'react';
import { motion } from 'motion/react';
import { LogOut, User as UserIcon, LayoutDashboard, Trophy } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';

const Header = ({ onNavigate, currentView }) => {
  const { currentUser, logout, isAdmin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#141414]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => onNavigate('home')}
        >
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
            <Trophy className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
            Brain<span className="text-orange-500">Teaser</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <button 
            onClick={() => onNavigate('home')}
            className={`px-6 py-2 rounded-xl text-[15px] font-semibold transition-all ${currentView === 'home' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Home
          </button>
          {currentUser && !isAdmin && (
            <button 
              onClick={() => onNavigate('selection')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'selection' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Quizzes
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => onNavigate('admin')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'admin' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Admin Panel
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-base font-semibold text-white">{currentUser.name}</span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{currentUser.role}</span>
              </div>
              <button 
                onClick={logout}
                className="w-10 h-10 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate('login')}
              className="px-6 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
