import React from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Activity,
  Shield,
  Zap,
  XCircle,
  Dna,
  Cpu,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ContestSummaryProps {
  result: any;
  onClose: () => void;
}

export const ContestSummary: React.FC<ContestSummaryProps> = ({ result, onClose }) => {
  const [evaluationPhase, setEvaluationPhase] = React.useState<'INITIAL' | 'MCQ' | 'CODING' | 'COMPLETE'>('INITIAL');
  const [displayScore, setDisplayScore] = React.useState(0);
  const [processedMcqIndices, setProcessedMcqIndices] = React.useState<number[]>([]);
  const [processedCodingIndices, setProcessedCodingIndices] = React.useState<number[]>([]);
  const [statusMessage, setStatusMessage] = React.useState('Initializing Performance Auditor...');

  const violationsCount = result.violations?.length || 0;
  const trustScore = Math.max(0, 100 - (violationsCount * 15));

  // Evaluation Sequence
  React.useEffect(() => {
    const runEvaluation = async () => {
      // 1. Initial Delay
      await new Promise(r => setTimeout(r, 1200));
      
      // 2. MCQ Phase
      setEvaluationPhase('MCQ');
      const mcqAnswers = result.mcqAnswers || [];
      for (let i = 0; i < mcqAnswers.length; i++) {
        setStatusMessage(`Analyzing MCQ Response #${i + 1}...`);
        await new Promise(r => setTimeout(r, 600));
        setProcessedMcqIndices(prev => [...prev, i]);
        
        if (mcqAnswers[i].isCorrect) {
          setDisplayScore(curr => curr + 10);
        }
      }

      // 3. Coding Phase
      setEvaluationPhase('CODING');
      const codingAnswers = result.codingAnswers || [];
      for (let i = 0; i < codingAnswers.length; i++) {
        const problem = codingAnswers[i];
        setStatusMessage(`Compiling Algorithmic Solution #${i + 1}...`);
        await new Promise(r => setTimeout(r, 1000));
        setStatusMessage(`Executing Test Matrix for Problem #${i + 1}...`);
        await new Promise(r => setTimeout(r, 1000));
        
        setProcessedCodingIndices(prev => [...prev, i]);
        if (problem.score > 0) {
          // Count up score
          const start = displayScore;
          const end = displayScore + problem.score;
          for (let s = start + 1; s <= end; s++) {
            setDisplayScore(s);
            await new Promise(r => setTimeout(r, 5));
          }
        }
      }

      // 4. Wrap up
      setEvaluationPhase('COMPLETE');
      setStatusMessage('Integrity Verification Synchronized');
    };

    runEvaluation();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center bg-[#050505] p-6 lg:p-12 overflow-y-auto custom-scrollbar">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8 pb-20"
      >
        {/* Auditor Header */}
        <div className="text-center space-y-6 relative py-12">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-orange-500/0 via-orange-500/50 to-orange-500/0" />
           
           <div className="relative inline-block">
              <div className={cn(
                "absolute inset-0 blur-[60px] rounded-full transition-colors duration-1000",
                evaluationPhase === 'COMPLETE' ? "bg-emerald-500/20" : "bg-orange-500/30 animate-pulse"
              )} />
              <div className="relative p-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={evaluationPhase}
                     initial={{ opacity: 0, rotateY: 180 }}
                     animate={{ opacity: 1, rotateY: 0 }}
                     exit={{ opacity: 0, rotateY: -180 }}
                     transition={{ duration: 0.6 }}
                   >
                     {evaluationPhase === 'COMPLETE' ? (
                       <CheckCircle2 size={48} className="text-emerald-500" />
                     ) : (
                       <Trophy size={48} className="text-orange-500" />
                     )}
                   </motion.div>
                 </AnimatePresence>
              </div>
           </div>

           <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {evaluationPhase === 'COMPLETE' ? 'Evaluation Verified' : 'System Audit in Progress'}
              </h2>
              <div className="flex items-center justify-center gap-2">
                 <div className={cn("w-1.5 h-1.5 rounded-full", evaluationPhase === 'COMPLETE' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse')} />
                 <p className={cn(
                   "text-xs font-bold tracking-tight",
                   evaluationPhase === 'COMPLETE' ? "text-emerald-500" : "text-zinc-500"
                 )}>
                   {statusMessage}
                 </p>
              </div>
           </div>
        </div>

        {/* Conceptual Audit Segment (MCQs) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-zinc-600 tracking-wider">Conceptual Verification</span>
              <span className="text-[10px] font-bold text-zinc-500">{result.mcqAnswers?.length || 0} Items</span>
           </div>
           
           <div className="space-y-3">
              {(result.mcqAnswers || []).map((ans: any, idx: number) => (
                 <motion.div 
                   key={idx}
                   layout
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ 
                     opacity: processedMcqIndices.includes(idx) ? 1 : 0.2, 
                     x: 0,
                     scale: processedMcqIndices.includes(idx) ? 1 : 0.98
                   }}
                   className={cn(
                     "p-5 rounded-2xl border flex items-center justify-between transition-all duration-500",
                     !processedMcqIndices.includes(idx) ? "bg-zinc-950/20 border-zinc-900" :
                     ans.isCorrect ? "bg-emerald-500/[0.02] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "bg-red-500/[0.02] border-red-500/20"
                   )}
                 >
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-colors",
                         !processedMcqIndices.includes(idx) ? "bg-zinc-900 text-zinc-700" :
                         ans.isCorrect ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                       )}>
                          {idx + 1}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-zinc-300">MCQ Response Audit</p>
                          <p className="text-[10px] text-zinc-500 font-semibold tracking-wider">Logic Tier {idx + 1}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <AnimatePresence>
                          {processedMcqIndices.includes(idx) && (
                             <motion.div
                               initial={{ scale: 0, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               className={cn(ans.isCorrect ? "text-emerald-500" : "text-red-500")}
                             >
                                {ans.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                             </motion.div>
                          )}
                       </AnimatePresence>
                       <span className={cn(
                         "text-[10px] font-black min-w-[60px] text-right",
                         !processedMcqIndices.includes(idx) ? "text-zinc-800" :
                         ans.isCorrect ? "text-emerald-500" : "text-red-500"
                       )}>
                          {processedMcqIndices.includes(idx) ? (ans.isCorrect ? '+10 PTS' : '+0 PTS') : 'AUDITING'}
                       </span>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>

        {/* Algorithmic Audit Segment (Problems) */}
        <div className="space-y-4 pt-8">
           <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-zinc-600 tracking-[0.2em]">Algorithmic Matrix</span>
              <span className="text-[10px] font-bold text-zinc-500">{result.codingAnswers?.length || 0} Challenges</span>
           </div>

           <div className="space-y-4">
              {(result.codingAnswers || []).map((ans: any, idx: number) => (
                 <motion.div 
                   key={idx}
                   layout
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ 
                     opacity: processedCodingIndices.includes(idx) ? 1 : 0.2, 
                     y: 0 
                   }}
                   className={cn(
                     "p-6 rounded-[2rem] border transition-all duration-700 overflow-hidden relative",
                     !processedCodingIndices.includes(idx) ? "bg-zinc-950/20 border-zinc-900" :
                     ans.score > 0 ? "bg-zinc-950 border-emerald-500/20 shadow-2xl" : "bg-zinc-950 border-red-500/20"
                   )}
                 >
                    {/* Background Detail */}
                    <div className="absolute -top-12 -right-12 text-zinc-900 opacity-20 pointer-events-none">
                       <Dna size={120} />
                    </div>

                    <div className="flex items-start justify-between relative">
                       <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "px-3 py-1 rounded-lg text-[10px] font-black",
                               !processedCodingIndices.includes(idx) ? "bg-zinc-800 text-zinc-600" :
                               ans.score > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                             )}>
                                Problem #{idx + 1}
                             </div>
                             <span className="text-[10px] font-semibold text-zinc-500 tracking-wider">
                                {processedCodingIndices.includes(idx) ? ans.status : 'System Queued'}
                             </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-zinc-500">
                                   <Cpu size={12} />
                                   <span className="text-[9px] font-bold tracking-wider">Runtime</span>
                                </div>
                                <p className="text-xs font-bold text-zinc-300">
                                   {processedCodingIndices.includes(idx) 
                                     ? (ans.executionTimeMs ? `${ans.executionTimeMs}ms` : '---') 
                                     : '---'}
                                </p>
                             </div>
                             <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-zinc-500">
                                   <Layers size={12} />
                                   <span className="text-[9px] font-bold tracking-wider">Memory</span>
                                </div>
                                <p className="text-xs font-bold text-zinc-300">
                                   {processedCodingIndices.includes(idx) 
                                     ? (ans.memoryKb ? `${(ans.memoryKb / 1024).toFixed(1)} MB` : '---') 
                                     : '---'}
                                </p>
                             </div>
                          </div>
                       </div>

                       <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-3xl font-black text-white">
                             {processedCodingIndices.includes(idx) ? `+${ans.score || 0}` : '---'}
                          </p>
                          <div className={cn(
                            "px-4 py-2 rounded-xl border text-[10px] font-black",
                            !processedCodingIndices.includes(idx) ? "border-zinc-800 text-zinc-700" :
                            ans.status === 'NOT_ATTEMPTED' ? "border-zinc-800 text-zinc-500 bg-zinc-900" :
                            ans.score > 0 ? "border-emerald-500/30 text-emerald-500" : "border-red-500/30 text-red-500"
                          )}>
                             {processedCodingIndices.includes(idx) 
                               ? (ans.status === 'NOT_ATTEMPTED' 
                                   ? 'No Participation' 
                                   : `${ans.testCasesPassed || 0}/${ans.totalTestCases || 5} Passed`) 
                               : 'Pending'}
                          </div>
                       </div>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>

        {/* Reconciliation Footer (Analysis Summary) */}
        <AnimatePresence>
           {evaluationPhase === 'COMPLETE' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-12 space-y-8"
              >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Running Score Total */}
                    <div className="md:col-span-2 bg-zinc-950 border border-emerald-500/30 p-8 rounded-[2.5rem] flex items-center justify-between relative overflow-hidden group shadow-2xl">
                       <div className="absolute inset-0 bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.04] transition-colors" />
                       <div className="relative">
                          <p className="text-xs font-bold text-emerald-500/60 tracking-tight">Verified Total Score</p>
                          <h2 className="text-6xl font-bold text-white tracking-tight">{displayScore}</h2>
                       </div>
                       <Trophy size={64} className="text-emerald-500 opacity-20" />
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1">
                       <p className="text-xs font-bold text-zinc-500 tracking-tight">Time Taken</p>
                       <p className="text-3xl font-black text-white">
                          {Math.floor((result.durationSeconds || 0) / 60).toString().padStart(2, '0')}:
                          {((result.durationSeconds || 0) % 60).toString().padStart(2, '0')}
                       </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1">
                       <p className="text-xs font-bold text-zinc-500 tracking-tight">Trust Index</p>
                       <div className="flex items-center gap-2">
                          <Shield size={16} className="text-emerald-500" />
                          <p className="text-3xl font-black text-white">{trustScore}%</p>
                       </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1">
                       <p className="text-xs font-bold text-zinc-500 tracking-tight">Solution Accuracy</p>
                       <p className="text-3xl font-black text-zinc-200">{result.accuracy}%</p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1">
                       <p className="text-xs font-bold text-zinc-500 tracking-tight">Code Efficiency</p>
                       <div className="flex items-center gap-2">
                          <Zap size={16} className="text-orange-500" />
                          <p className="text-3xl font-black text-white">{result.efficiency}%</p>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={onClose}
                   className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-[2rem] font-black text-sm tracking-widest transition-all hover:scale-[1.01] active:scale-95 shadow-2xl shadow-orange-950/20 flex items-center justify-center gap-3 group"
                 >
                   Finalize Session
                   <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </motion.div>
           )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
