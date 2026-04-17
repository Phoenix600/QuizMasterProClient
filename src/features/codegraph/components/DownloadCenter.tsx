import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Apple, Monitor, Terminal, Download, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

interface DownloadCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadCenter: React.FC<DownloadCenterProps> = ({ isOpen, onClose }) => {
  const OS_OPTIONS = [
    {
      id: 'macos',
      name: 'macOS',
      icon: <Apple className="w-5 h-5" />,
      variants: [
        { name: 'Apple Silicon (M1/M2/M3)', size: '12.4 MB', link: '#' },
        { name: 'Intel Chip', size: '13.1 MB', link: '#' }
      ]
    },
    {
      id: 'windows',
      name: 'Windows',
      icon: <Monitor className="w-5 h-5" />,
      variants: [
        { name: 'Windows x64 (Installer)', size: '15.8 MB', link: '#' },
        { name: 'Portable (ZIP)', size: '14.2 MB', link: '#' }
      ]
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: <Terminal className="w-5 h-5" />,
      variants: [
        { name: 'Debian/Ubuntu (.deb)', size: '11.5 MB', link: '#' },
        { name: 'AppImage', size: '10.9 MB', link: '#' },
        { name: 'Binary (tar.gz)', size: '10.2 MB', link: '#' }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl bg-[#0F0F0F] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">CodeGraph Local Engine</h2>
                  <p className="text-sm text-zinc-500 mt-1">Install the local execution engine to compile and run your code with maximum performance.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl space-y-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Low Latency</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Direct execution on your machine eliminates network Round-Trip Time during code runs.</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl space-y-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Local Privacy</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Your code and test cases stay on your machine. Nothing is uploaded to our servers.</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl space-y-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">All Languages</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Leverage your local compilers and runtimes for Java, Python, C++, and more.</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Downloads (v1.4.2)</h3>
                <div className="grid grid-cols-1 gap-4">
                  {OS_OPTIONS.map((os) => (
                    <div key={os.id} className="flex items-center gap-6 p-4 border border-zinc-800 rounded-xl hover:bg-zinc-900/30 transition-colors group">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-100 transition-colors">
                        {os.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-zinc-200">{os.name}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {os.variants.map((v, i) => (
                            <button key={i} className="flex items-center gap-2 text-[10px] text-zinc-500 hover:text-orange-500 transition-colors">
                              <Download size={10} />
                              <span>{v.name}</span>
                              <span className="text-zinc-700 opacity-50">({v.size})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-[#0F0F0F] flex items-center justify-center text-[8px] font-bold text-zinc-500">
                      U{i}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500">Joined by 12,400+ developers using local execution.</span>
              </div>
              <p className="text-[10px] text-zinc-600">Requires Java 17+ and 100MB free space.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
