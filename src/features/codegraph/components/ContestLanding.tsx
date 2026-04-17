import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Terminal, 
  Maximize2, 
  Eye, 
  Lock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileCode
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

interface ContestLandingProps {
  contestId: string;
  onStart: () => void;
  onBack: () => void;
}

export const ContestLanding: React.FC<ContestLandingProps> = ({ contestId, onStart, onBack }) => {
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [isEnablingSecurity, setIsEnablingSecurity] = useState(false);

  useEffect(() => {
    fetchContest();
  }, [contestId]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const data = await api.getContest(contestId);
      setContest(data);
    } catch (err) {
      console.error("Failed to fetch contest", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartContest = async () => {
    if (!agreed) return;
    
    setIsEnablingSecurity(true);
    
    // Integrity Enforcement Sequence
    try {
      // 1. Request Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      // 2. Small delay to ensure visual transition
      await new Promise(r => setTimeout(r, 1500));
      
      onStart();
    } catch (err) {
      console.error("Security enforcement failed", err);
      onStart(); // Fallback to start anyway but integrity check will flag it
    } finally {
      setIsEnablingSecurity(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0A0A0A] overflow-y-auto custom-scrollbar flex flex-col items-center py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full space-y-12"
      >
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-semibold text-orange-500 tracking-wider">
            <ShieldCheck size={12} />
            Secure Competitive Environment
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight leading-none underline decoration-orange-600 decoration-8 underline-offset-8">
            {contest.title}
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto font-semibold leading-relaxed">
            {contest.description || "Master your logic under pressure. Competitive integrity is strictly enforced."}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
             <Clock className="text-orange-500" size={24} />
             <div className="space-y-1">
                <p className="text-[10px] font-semibold text-zinc-600 tracking-wider">Duration</p>
                <p className="text-xl font-bold text-white leading-none">{contest.duration} Minutes</p>
             </div>
          </div>
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
             <FileCode className="text-orange-500" size={24} />
             <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-zinc-500 tracking-wider mb-1">Problems</span>
                <span className="text-lg font-bold text-white tracking-tight">
                  {contest.codingProblems?.length || 0} Coding + {contest.mcqQuestions?.length || 0} MCQs
                </span>
             </div>
          </div>
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
             <ShieldAlert className="text-orange-500" size={24} />
             <div className="space-y-1">
                <p className="text-[10px] font-semibold text-zinc-600 tracking-wider">Integrity Level</p>
                <p className="text-xl font-bold text-emerald-500 leading-none">High (Strict)</p>
             </div>
          </div>
        </div>

        {/* Instructions & Integrity */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 space-y-8 border-r border-zinc-900">
               <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                 <Terminal size={18} className="text-orange-500" />
                 Contest Instructions
               </h3>
               <ul className="space-y-6">
                  {[
                    "Once started, you cannot leave the contest workspace until submission.",
                    "Ensure you have a stable internet connection for real-time tracking.",
                    "MCQs and Coding problems will be presented in a single timeline.",
                    "Submissions are final. Review your logic before confirming."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-4">
                       <div className="shrink-0 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                         {i + 1}
                       </div>
                       <p className="text-sm text-zinc-400 font-semibold leading-normal">{text}</p>
                    </li>
                  ))}
               </ul>
            </div>

            <div className="p-10 bg-orange-600/5 space-y-8">
               <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                 <Lock size={18} className="text-orange-500" />
                 Integrity Protocols
               </h3>
               <div className="space-y-6">
                  <div className="flex gap-4 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
                     <Maximize2 size={24} className="text-orange-500" />
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Fullscreen Required</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Platform will auto-lock into fullscreen mode upon start.</p>
                     </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
                     <Eye size={24} className="text-orange-500" />
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Focus Monitoring</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Automatic detection of tab switches or application blurring.</p>
                     </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
                     <HelpCircle size={24} className="text-orange-500" />
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Zero Tolerance</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Plagiarism checks and clipboard monitoring enabled.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-6 pt-6 pb-20">
           <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-800 bg-zinc-900 text-orange-600 focus:ring-orange-500 focus:ring-offset-zinc-950 transition-all cursor-pointer" 
              />
              <span className="text-sm font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors tracking-wider">
                I understand and agree to the protocols
              </span>
           </label>

           <div className="flex items-center gap-4">
             <button 
               onClick={onBack}
               className="px-8 py-4 rounded-full border border-orange-500/20 text-orange-500 hover:text-white hover:bg-orange-600/10 hover:border-orange-500/50 text-xs font-bold transition-all tracking-wider shadow-lg shadow-orange-950/5"
             >
               Return to Curriculum
             </button>
             <button 
               onClick={handleStartContest}
               disabled={!agreed || isEnablingSecurity}
               className={cn(
                 "group relative flex items-center gap-3 px-12 py-4 rounded-full text-xs font-black transition-all overflow-hidden border",
                 agreed 
                   ? "bg-orange-600 text-white shadow-[0_20px_50px_rgba(234,88,12,0.25)] hover:bg-orange-500 hover:scale-105 active:scale-95 border-orange-400/30" 
                   : "bg-zinc-900 text-zinc-700 cursor-not-allowed opacity-50 border-zinc-800"
               )}
             >
                {isEnablingSecurity ? (
                   <span className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     INITIALIZING PROTOCOLS...
                   </span>
                ) : (
                  <>
                    <span className="relative z-10 tracking-widest">START CONTEST NOW</span>
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
             </button>
           </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
};
