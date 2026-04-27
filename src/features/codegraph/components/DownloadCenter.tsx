import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { SiLinux } from 'react-icons/si';
import { cn } from '../lib/utils';

const AppleLogo = () => (
  <svg viewBox="0 0 384 512" className="w-5 h-5" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const WindowsLogo = () => (
  <svg viewBox="0 0 448 512" className="w-5 h-5" fill="currentColor">
    <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.3H0v150zm203.8 28.1L448 480V268.3H203.8v178.1zm0-380.6v180.1H448V32L203.8 65.8z" />
  </svg>
);

// const LinuxLogo = () => (
//   <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
//     <path d="M12 0C7.58 0 4 3.58 4 8c0 2.21 1.05 4.17 2.68 5.46C5.05 14.68 4 16.71 4 19c0 2.76 2.24 5 5 5h6c2.76 0 5-2.24 5-5 0-2.29-1.05-4.32-2.68-5.54C18.95 12.17 20 10.21 20 8c0-4.42-3.58-8-8-8zm0 2c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zm0 14c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
//   </svg>
// );

// const LinuxLogo = () => (
//   <svg viewBox="0 0 32 32" className="w-5 h-5" fill="currentColor">
//     <path d="M16 2c-3.5 0-6 2.5-6 6 0 2 1 3.5 2.2 4.6C10.2 13.7 9 15.7 9 18c0 3.5 2.7 6 7 6s7-2.5 7-6c0-2.3-1.2-4.3-3.2-5.4C21 11.5 22 10 22 8c0-3.5-2.5-6-6-6zm0 2c2.3 0 4 1.7 4 4s-1.7 4-4 4-4-1.7-4-4 1.7-4 4-4zm-3 14c0-1.7 1.3-3 3-3s3 1.3 3 3c0 2.2-1.8 4-3 4s-3-1.8-3-4z"/>
//   </svg>
// );

const LinuxLogo = () => (
  <SiLinux className="w-5 h-5 text-gray-300" />
);

interface DownloadCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadCenter: React.FC<DownloadCenterProps> = ({ isOpen, onClose }) => {
  const OS_OPTIONS = [
    {
      id: 'macos',
      name: 'macOS',
      icon: <AppleLogo />,
      variants: [
        { name: 'Apple Silicon (M1/M2/M3)', size: '12.4 MB', link: '#' },
        { name: 'Intel Chip', size: '13.1 MB', link: '#' }
      ]
    },
    {
      id: 'windows',
      name: 'Windows',
      icon: <WindowsLogo />,
      variants: [
        { name: 'Windows x64 (Installer)', size: '15.8 MB', link: '#' },
        { name: 'Portable (ZIP)', size: '14.2 MB', link: '#' }
      ]
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: <LinuxLogo />,
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
                  {[1, 2, 3].map(i => (
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
