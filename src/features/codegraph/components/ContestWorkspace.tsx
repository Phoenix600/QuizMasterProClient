import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  HelpCircle, 
  FileCode, 
  Timer,
  AlertCircle,
  X,
  Maximize2,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuizPlayer from '../../quizes/components/QuizPlayer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { McqQuestion } from './McqQuestion';
import ContentArea from './ContentArea';
import EditorArea from './EditorArea';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { toast } from 'sonner';

interface ContestWorkspaceProps {
  contestId: string;
  onFinish: (result: any) => void;
}

const STABLE_EMPTY_ARRAY: any[] = [];

const ContestTimer = React.memo(({ durationMinutes, contestId, onTimeUp }: { durationMinutes: number; contestId: string; onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!durationMinutes || durationMinutes <= 0 || !contestId) return;

    // 1. Calculate or Restore EndTime
    const storageKey = `contest_timer_${contestId}`;
    let storedData = localStorage.getItem(storageKey);
    let endTime: number;

    if (storedData) {
      try {
        const { endTime: storedEnd, duration: storedDuration } = JSON.parse(storedData);
        // If duration changed in DB, reset the timer (good for testing/admin updates)
        if (storedDuration !== durationMinutes) {
          endTime = Date.now() + durationMinutes * 60 * 1000;
          localStorage.setItem(storageKey, JSON.stringify({ endTime, duration: durationMinutes }));
        } else {
          endTime = storedEnd;
        }
      } catch (e) {
        endTime = Date.now() + durationMinutes * 60 * 1000;
        localStorage.setItem(storageKey, JSON.stringify({ endTime, duration: durationMinutes }));
      }
    } else {
      endTime = Date.now() + durationMinutes * 60 * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ endTime, duration: durationMinutes }));
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        onTimeUp();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [durationMinutes, contestId, onTimeUp]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "px-6 py-2 rounded-2xl border-2 flex items-center gap-3 transition-colors",
      timeLeft < 300 ? "bg-red-500/10 border-red-500/50 text-red-500 animate-pulse" : "bg-zinc-950 border-zinc-800 text-orange-500"
    )}>
       <Timer size={20} />
       <span className="text-xl font-mono font-black tabular-nums">{formatTime(timeLeft)}</span>
    </div>
  );
});

export const ContestWorkspace: React.FC<ContestWorkspaceProps> = ({ contestId, onFinish }) => {
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{current: number, total: number, label: string} | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  
  const [violations, setViolations] = useState<any[]>([]);
  const [startTime] = useState(new Date());
  // Local cache for coding problems to prevent loss during rapid switching
  const [codeCache, setCodeCache] = useState<Record<string, string>>({});
  const [codingSubmissions, setCodingSubmissions] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState<'mcq' | 'coding'>('mcq');
  const [mcqIndex, setMcqIndex] = useState(0);
  const [codingIndex, setCodingIndex] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);

  useEffect(() => {
    const count = Object.keys(answers).length;
    setAttemptedCount(count);
  }, [answers]);

  const handleCodeChange = (problemId: string, code: string) => {
    setCodeCache(prev => ({ ...prev, [problemId]: code }));
  };

  const logViolation = (type: string, metadata?: any) => {
    setViolations(prev => [...prev, { type, timestamp: new Date(), metadata }]);
  };
  
  useEffect(() => {
    fetchContest();
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.error("SECURITY ALERT: Tab switching detected. This event has been logged.", {
          duration: 5000,
          icon: <AlertCircle className="text-red-500" />
        });
        logViolation('VISIBILITY_HIDDEN');
      }
    };

    const handleBlur = () => {
      toast.warning("INTEGRITY WARNING: Browser focus lost. Please stay within the exam window.", {
        duration: 4000
      });
      logViolation('BLUR');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.error("INTEGRITY VIOLATION: Fullscreen mode exited. Click the 'Maximize' icon to return.", {
           duration: 8000,
           action: {
             label: "RE-ENTER FULLSCREEN",
             onClick: () => document.documentElement.requestFullscreen().catch(() => {})
           }
        });
        logViolation('FULLSCREEN_EXIT');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5, Ctrl+R, Cmd+R
      if (
        e.key === 'F5' || 
        ((e.ctrlKey || e.metaKey) && e.key === 'r') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'R')
      ) {
        e.preventDefault();
        toast.info("ACTION RESTRICTED: Browser refresh is disabled during the contest.", {
          icon: <AlertCircle className="text-orange-500" />
        });
        logViolation('REFRESH_ATTEMPT');
      }
    };

    const handleSubmissionSuccess = (e: any) => {
      const sub = e.detail;
      setCodingSubmissions(prev => ({
        ...prev,
        [sub.problemId]: {
          problemId: sub.problemId,
          submissionId: sub.id,
          status: sub.status,
          passedTestCases: sub.passedTestCases,
          totalTestCases: sub.totalTestCases,
          executionTimeMs: sub.executionTimeMs,
          memoryKb: sub.memoryKb || sub.memoryUsageKb
        }
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('submission-success', handleSubmissionSuccess);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('submission-success', handleSubmissionSuccess);
    };
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

  const handleAutoSubmit = React.useCallback(() => {
    toast.warning("Time's up! Submitting your answers automatically.");
    submitContest();
  }, [contestId, answers, violations]);

  const submitContest = async () => {
    try {
      setIsSubmitting(true);
      setIsAuditing(true);
      
      const codingProblems = contest.codingProblems || [];
      const updatedSubmissions = { ...codingSubmissions };

      // 1. PERFORM ALGORITHM AUDIT (Evaluate changed code via Java Judge Engine)
      for (let i = 0; i < codingProblems.length; i++) {
        const problem = codingProblems[i];
        const problemId = problem._id || problem.id;
        const cachedCode = codeCache[problemId];

        setAuditProgress({ 
          current: i + 1, 
          total: codingProblems.length, 
          label: `Auditing: ${problem.title}` 
        });

        // Trigger evaluation ONLY if there is cached code
        if (cachedCode) {
          try {
            toast.info(`Auditing: ${problem.title}`, { duration: 2000 });
            
            // Fetch test cases first
            const testCases = await api.getAllTestCases(problemId);
            
            // Submit to Java Engine
            let sub = await api.submitCode(
              problemId, 
              cachedCode, 
              (problem.language || 'java').toLowerCase(), 
              testCases, 
              problem.driverCode || ""
            );

            // Poll for completion
            let attempts = 0;
            while ((sub.status === 'PENDING' || sub.status === 'QUEUED') && attempts < 30) {
              await new Promise(r => setTimeout(r, 1000));
              sub = await api.getSubmission(sub.id);
              attempts++;
            }

            // Store the verified result
            updatedSubmissions[problemId] = {
              problemId,
              submissionId: sub.id,
              status: sub.status,
              executionTimeMs: sub.executionTimeMs,
              memoryKb: sub.memoryUsageKb || sub.memoryKb,
              testCasesPassed: sub.passedTestCases || 0,
              totalTestCases: sub.totalTestCases || 0,
              score: sub.status === 'ACCEPTED' ? (problem.points || 100) : 0
            };
          } catch (auditErr) {
            console.error(`Audit failed for ${problem.title}`, auditErr);
          }
        }
      }

      setAuditProgress({ 
        current: codingProblems.length, 
        total: codingProblems.length, 
        label: "Compiling Integrity Report..." 
      });
      await new Promise(r => setTimeout(r, 1500));

      // 2. FINAL RECONCILIATION (Submit to Node.js)
      const result = await api.submitContest(contestId, {
        answers,
        codingSubmissions: Object.values(updatedSubmissions),
        finalCodes: codeCache,
        violations,
        startTime
      });

      localStorage.removeItem(`contest_timer_${contestId}`);
      toast.success("Contest session finalized successfully!");
      if (document.exitFullscreen) {
         document.exitFullscreen().catch(() => {});
      }
      onFinish(result);
    } catch (err) {
      toast.error("Audit protocol failed. Connection interrupted.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsAuditing(false);
      setAuditProgress(null);
    }
  };

  const { mcqs, coding } = React.useMemo(() => {
    if (!contest) return { mcqs: [], coding: [] };
    
    const mcqPool = [...(contest.mcqQuestions || [])].map(q => ({ ...q, type: 'mcq' }));
    const codingPool = [...(contest.codingProblems || [])].map(p => ({ ...p, type: 'coding' }));

    return { mcqs: mcqPool, coding: codingPool };
  }, [contest]);

  // Sync section if one is empty
  useEffect(() => {
    if (mcqs.length === 0 && coding.length > 0) setActiveSection('coding');
    if (coding.length === 0 && mcqs.length > 0) setActiveSection('mcq');
  }, [mcqs.length, coding.length]);

  if (loading || !contest) return (
     <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0A0A0A] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        <p className="text-zinc-500 font-semibold tracking-wider text-xs">Loading Unified Workspace...</p>
     </div>
  );

  const currentQuestion = activeSection === 'mcq' ? mcqs[mcqIndex] : coding[codingIndex];

  return (
    <div className="h-screen w-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Contest Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0 relative z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-600 rounded-lg shadow-lg shadow-orange-900/40">
                <Trophy size={18} className="text-white" />
             </div>
             <div>
                <h1 className="text-sm font-bold text-white tracking-tight">{contest.title}</h1>
                <p className="text-[10px] text-zinc-500 font-semibold tracking-wider">Unified Contest Session</p>
             </div>
          </div>
          
          <div className="h-6 w-px bg-zinc-800" />

          <div className="flex items-center gap-8">
            {/* MCQ Section Nav */}
            {mcqs.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">MCQs</span>
                <div className="flex items-center gap-1.5">
                  {mcqs.map((_, i) => (
                    <button 
                      key={`mcq-nav-${i}`}
                      onClick={() => {
                        setActiveSection('mcq');
                        setMcqIndex(i);
                      }}
                      className={cn(
                        "w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center shrink-0 border",
                        activeSection === 'mcq' && mcqIndex === i 
                          ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Coding Section Nav */}
            {coding.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Coding</span>
                <div className="flex items-center gap-1.5">
                  {coding.map((_, i) => (
                    <button 
                      key={`coding-nav-${i}`}
                      onClick={() => {
                        setActiveSection('coding');
                        setCodingIndex(i);
                      }}
                      className={cn(
                        "w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center shrink-0 border",
                        activeSection === 'coding' && codingIndex === i 
                          ? "bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-8">
           <ContestTimer 
             durationMinutes={contest.duration} 
             contestId={contestId}
             onTimeUp={handleAutoSubmit} 
           />

           <button 
             onClick={submitContest}
             disabled={isSubmitting}
             className={cn(
               "px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-xl active:scale-95 flex items-center gap-2 border",
               isAuditing 
                 ? "bg-zinc-800 text-zinc-400 border-zinc-700 cursor-not-allowed" 
                 : "bg-orange-600 hover:bg-orange-500 text-white border-orange-500/20 shadow-orange-900/20"
             )}
           >
             {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
             {isAuditing ? "Performing Audit..." : "Finish Session"}
           </button>
        </div>
      </header>

      {/* Audit Progress Overlay */}
      <AnimatePresence>
        {isAuditing && auditProgress && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
           >
              <div className="max-w-md w-full space-y-8 text-center">
                 <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full border-4 border-zinc-800 border-t-orange-500 animate-spin shadow-[0_0_30px_rgba(234,88,12,0.2)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <ShieldAlert className="text-orange-500 animate-pulse" size={32} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Security & Integrity Audit</h2>
                    <p className="text-zinc-500 text-xs font-semibold tracking-wider">{auditProgress.label}</p>
                 </div>

                 <div className="space-y-2">
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                       <motion.div 
                         className="h-full bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.5)]"
                         initial={{ width: 0 }}
                         animate={{ width: `${(auditProgress.current / auditProgress.total) * 100}%` }}
                       />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-zinc-600 tracking-wider">
                       <span>Phase {auditProgress.current}</span>
                       <span>{Math.round((auditProgress.current / auditProgress.total) * 100)}% Complete</span>
                    </div>
                 </div>

                 <div className="pt-8 grid gap-2">
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       <span className="text-[10px] font-semibold text-zinc-400 tracking-wider text-left">Identity Verification Secured</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl opacity-50">
                       <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />
                       <span className="text-[10px] font-semibold text-zinc-400 tracking-wider text-left">Evaluating Algorithm Efficiency...</span>
                    </div>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Content */}
      <main className="flex-1 overflow-hidden">
        {activeSection === 'mcq' ? (
           <div className="h-full w-full bg-[#0A0A0A] overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Left: Overview & Question */}
                 <div className="lg:col-span-9 space-y-8">
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Questions</p>
                          <p className="text-3xl font-black text-white">{mcqs.length}</p>
                       </div>
                       <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Attempted</p>
                          <p className="text-3xl font-black text-emerald-500">{attemptedCount}</p>
                       </div>
                       <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Remaining</p>
                          <p className="text-3xl font-black text-zinc-400">{mcqs.length - attemptedCount}</p>
                       </div>
                       <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</p>
                          <p className="text-3xl font-black text-emerald-500 animate-pulse">Active</p>
                       </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[3rem] p-10 space-y-10 min-h-[600px] flex flex-col">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <span className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-black text-orange-500 uppercase tracking-widest">
                                Section A
                             </span>
                             <span className="text-zinc-600 text-xs font-bold">/</span>
                             <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Conceptual Round</span>
                          </div>
                          <div className="px-5 py-2 bg-zinc-800/50 rounded-2xl text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                             Question {mcqIndex + 1}
                          </div>
                       </div>

                       <div className="flex-1">
                          <McqQuestion 
                            question={currentQuestion}
                            selectedOptionId={answers[currentQuestion._id] || null}
                            onSelect={(optId) => setAnswers({ ...answers, [currentQuestion._id]: optId })}
                          />
                       </div>
                       
                       <div className="pt-10 border-t border-zinc-800 flex justify-between">
                          <button 
                            onClick={() => setMcqIndex(Math.max(0, mcqIndex - 1))}
                            disabled={mcqIndex === 0}
                            className="flex items-center gap-2 px-8 py-4 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-30 active:scale-95"
                          >
                            <ChevronLeft size={16} />
                            Prev
                          </button>
                          <button 
                            onClick={() => {
                              if (mcqIndex < mcqs.length - 1) {
                                setMcqIndex(mcqIndex + 1);
                              } else if (coding.length > 0) {
                                setActiveSection('coding');
                                setCodingIndex(0);
                              }
                            }}
                            className="flex items-center gap-2 px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-900/20 active:scale-95"
                          >
                            {mcqIndex < mcqs.length - 1 ? 'Next Question' : 'Proceed to Coding Round'}
                            <ChevronRight size={16} />
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Right: Palette */}
                 <div className="lg:col-span-3 space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                       <div className="space-y-1">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Question Palette</h3>
                          <p className="text-[10px] text-zinc-600 font-bold tracking-wider">Quick Jump Navigation</p>
                       </div>

                       <div className="grid grid-cols-4 gap-3">
                          {mcqs.map((_, i) => {
                             const isAnswered = !!answers[mcqs[i]._id];
                             const isActive = mcqIndex === i;
                             return (
                                <button
                                   key={`palette-${i}`}
                                   onClick={() => setMcqIndex(i)}
                                   className={cn(
                                      "w-full aspect-square rounded-xl text-[11px] font-black transition-all border flex items-center justify-center",
                                      isActive 
                                         ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/40 scale-110 z-10" 
                                         : isAnswered
                                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
                                            : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-500"
                                   )}
                                >
                                   {i + 1}
                                </button>
                             );
                          })}
                       </div>

                       <div className="pt-6 border-t border-zinc-800 space-y-3">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-md bg-orange-600" />
                             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Current</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
                             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Attempted</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-md bg-zinc-800/50 border border-zinc-700/50" />
                             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Not Visited</span>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-3xl">
                        <div className="flex items-start gap-3">
                           <AlertCircle className="text-orange-500 mt-0.5" size={16} />
                           <p className="text-[10px] text-orange-500/80 font-bold leading-relaxed tracking-wide uppercase">
                              Conceptual Mode: Ensure all questions are answered before proceeding to Section B.
                           </p>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
           <div className="h-full flex flex-col relative overflow-hidden">
              <Group 
                key={`contest-group-${contestId}-${currentIndex}`} 
                id="contest-group" 
                orientation="horizontal"
              >
                 <Panel defaultSize={45} minSize={25} className="flex flex-col">
                    <ContentArea 
                      key={`contest-content-${currentQuestion._id || currentQuestion.id}`}
                      problemId={currentQuestion._id || currentQuestion.id}
                      problemData={currentQuestion}
                      isStudyMode={false}
                      isContestMode={true}
                      onToggleStudyMode={() => {}}
                    />
                 </Panel>
                 
                 <Separator className="w-1.5 transition-all duration-300 group z-50 bg-transparent flex items-center justify-center cursor-col-resize">
                    <div className="w-[1px] h-full bg-zinc-800 group-hover:bg-orange-500/50 transition-colors" />
                 </Separator>

                 <Panel defaultSize={55} minSize={30} className="flex flex-col">
                    <EditorArea 
                      key={`contest-editor-${currentQuestion._id || currentQuestion.id}`}
                      problemId={currentQuestion._id || currentQuestion.id}
                      problemData={currentQuestion}
                      testCases={currentQuestion.testCases || STABLE_EMPTY_ARRAY}
                      cachedCode={codeCache[currentQuestion._id || currentQuestion.id]}
                      onCodeChange={(newCode) => handleCodeChange(currentQuestion._id || currentQuestion.id, newCode)}
                      isContestMode={true}
                    />
                 </Panel>
              </Group>
           </div>
        )}
      </main>

      {/* Footer Nav */}
      <footer className="h-14 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-8 shrink-0">
        <button 
          onClick={() => {
            if (activeSection === 'coding' && codingIndex === 0 && mcqs.length > 0) {
               setActiveSection('mcq');
               setMcqIndex(mcqs.length - 1);
            } else if (activeSection === 'mcq') {
               setMcqIndex(Math.max(0, mcqIndex - 1));
            } else {
               setCodingIndex(Math.max(0, codingIndex - 1));
            }
          }}
          disabled={activeSection === 'mcq' && mcqIndex === 0}
          className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-zinc-200 disabled:opacity-30 tracking-wider transition-all uppercase"
        >
          <ChevronLeft size={16} />
          Previous Question
        </button>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className={cn(
                "w-2 h-2 rounded-full",
                activeSection === 'mcq' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.5)]"
              )} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                {activeSection === 'mcq' ? 'Section A: Conceptual' : 'Section B: Coding Round'}
              </span>
           </div>
        </div>
 
        <button 
          onClick={() => {
            if (activeSection === 'mcq' && mcqIndex === mcqs.length - 1 && coding.length > 0) {
               setActiveSection('coding');
               setCodingIndex(0);
            } else if (activeSection === 'mcq') {
               setMcqIndex(Math.min(mcqs.length - 1, mcqIndex + 1));
            } else {
               setCodingIndex(Math.min(coding.length - 1, codingIndex + 1));
            }
          }}
          disabled={activeSection === 'coding' && codingIndex === coding.length - 1}
          className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-zinc-200 disabled:opacity-30 tracking-wider transition-all uppercase"
        >
          Next Question
          <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
};
