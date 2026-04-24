import React from 'react';
import { toast } from 'sonner';
import {
  Play,
  RotateCcw,
  Copy,
  Maximize2,
  Minimize2,
  Settings2,
  Terminal,
  Sun,
  Moon,
  Type,
  Expand,
  Loader2,
  RotateCw,
  CheckCircle2,
  Clock,
  HardDrive,
  Percent,
  Trophy,
  Sparkles,
  Trash2,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Zap,
  ShieldAlert,
  AlertCircle,
  Lock
} from 'lucide-react';
import {
  Group,
  Panel,
  Separator
} from 'react-resizable-panels';
import { cn } from '../lib/utils.ts';
import { api } from '../lib/api.ts';
import { TestCase, Submission } from '../types.ts';
import { useExecutionEngine } from '../hooks/useExecutionEngine.ts';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { THEME_OPTIONS } from '../lib/monaco-themes.ts';
import CodeEditor from './Common/CodeEditor.tsx';

const CustomResizeHandle = ({ direction }: { direction: 'horizontal' | 'vertical' }) => (
  <Separator className={cn(
    "relative transition-all duration-300 group z-50",
    direction === 'horizontal' ? "w-1 hover:w-1.5 cursor-col-resize" : "h-1 hover:h-1.5 cursor-row-resize",
    "bg-transparent flex items-center justify-center"
  )}>
    <div className={cn(
      "bg-zinc-800/50 transition-colors group-hover:bg-orange-500/50",
      direction === 'horizontal' ? "w-[1px] h-full" : "h-[1px] w-full"
    )} />
  </Separator>
);

interface EditorAreaProps {
  problemId: string;
  problemData?: any | null;
  testCases?: TestCase[];
  initialSubmissions?: any[];
  onRefreshHistory?: () => void;
  cachedCode?: string;
  onCodeChange?: (code: string) => void;
  isContestMode?: boolean;
}

const EMPTY_ARRAY: any[] = [];

const EditorArea = ({ 
  problemId, 
  problemData, 
  testCases: propsTestCases = EMPTY_ARRAY, 
  initialSubmissions = EMPTY_ARRAY,
  onRefreshHistory,
  cachedCode,
  onCodeChange,
  isContestMode
}: EditorAreaProps) => {
  const language = React.useMemo(() => {
    return (problemData?.language || 'java').toLowerCase().trim();
  }, [problemData?.language]);

  const [editorFontSize, setEditorFontSize] = React.useState(14);
  const [isZenMode, setIsZenMode] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [editorTheme, setEditorTheme] = React.useState(() => {
    return localStorage.getItem('codegraph-theme') || 'vs-dark';
  });

  // Persistence
  React.useEffect(() => {
    localStorage.setItem('codegraph-theme', editorTheme);
  }, [editorTheme]);

  const [testCases, setTestCases] = React.useState<TestCase[]>([]);
  const [activeTestCase, setActiveTestCase] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<'testcases' | 'result'>('testcases');
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = React.useState<any>(null);
  const [runResult, setRunResult] = React.useState<any>(null);
  const [code, setCode] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);
  const { status: engineStatus } = useExecutionEngine();
  const { currentUser } = useAuth();
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(1000);
  const [containerHeight, setContainerHeight] = React.useState(0);

  // Refs for background operations (Emergency Save)
  const codeRef = React.useRef(code);
  const langRef = React.useRef(language);
  const probIdRef = React.useRef(problemId);
  const templateRef = React.useRef(problemData?.solutionTemplate);
  const lastTrackedRef = React.useRef<string | null>(null);

  // Guard: Determine if data is stale - Ensure types are handled and provide a clear boolean
  const isDataStale = React.useMemo(() => {
    if (!problemData) return false;
    const dataId = String(problemData._id || problemData.id || "");
    return String(problemId) !== dataId;
  }, [problemId, problemData]);

  // Resize Observer to handle compact mode and height calculations
  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync test cases and submissions from props 
  React.useEffect(() => {
    // RESET INTERNAL STATE ON PROBLEM CHANGE
    setActiveTestCase(0);
    setActiveTab('testcases');
    setRunResult(null);
    setSelectedSubmission(null);
    setTestCases([]);
    
    if (!problemId || isDataStale) return;

    const fetchSamples = async () => {
      // VALIDATE props data
      const isStale = problemData && String(problemData._id || problemData.id) !== String(problemId);
      const testCasesToUse = (propsTestCases && !isStale) ? propsTestCases : null;

      if (testCasesToUse && testCasesToUse.length > 0) {
        setTestCases(testCasesToUse);
        return;
      }
      
      try {
        const fetched = await api.getSampleTestCases(problemId);
        const samples = Array.isArray(fetched) ? fetched : (fetched as any)?.data || [];
        setTestCases(samples);
      } catch (err) {
        console.error("Failed to fetch sample test cases:", err);
        setTestCases([]);
      }
    };

    fetchSamples();
    setSubmissions(initialSubmissions || EMPTY_ARRAY);
    
  }, [problemId, isDataStale]);

  // Tracking Progress
  React.useEffect(() => {
    if (problemId && !isDataStale && lastTrackedRef.current !== problemId) {
      lastTrackedRef.current = problemId;
      api.trackProgress(problemId).catch(err => console.warn("Track progress failed", err));
    }
  }, [problemId, isDataStale]);

  // Code restoration logic
  React.useEffect(() => {
    if (!problemId || isDataStale) return;

    const controller = new AbortController();
    const restoreCode = async () => {
      try {
        const normalize = (c: string) => (c || "").replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n');
        
        // 1. Check for Cached Code (Highest Priority - handles user switching back)
        if (cachedCode !== undefined) {
          setCode(normalize(cachedCode));
          return;
        }

        // 2. Check for previous submissions (Higher Priority as per request)
        if (initialSubmissions && initialSubmissions.length > 0) {
          try {
            const latestSub = await api.getSubmission(initialSubmissions[0].id || initialSubmissions[0]._id);
            if (controller.signal.aborted) return;
            if (latestSub && latestSub.sourceCode) {
              setCode(normalize(latestSub.sourceCode));
              return;
            }
          } catch (err) {
            console.error("Failed to fetch latest submission:", err);
          }
        }

        // 3. Check for Drafts (Auth Mode)
        if (currentUser?.id) {
          try {
            const draft = await api.getDraft(currentUser.id, problemId);
            if (controller.signal.aborted) return;
            const draftCode = draft?.sourceCode || draft?.code;
            if (draftCode) {
               setCode(normalize(draftCode));
               return;
            }
          } catch (err) {
            console.warn("No draft found, checking template...");
          }
        }

        // 4. Check for Problem Data Template (Fallback Solution Code)
        if (problemData?.solutionTemplate && !isDataStale) {
          setCode(normalize(problemData.solutionTemplate));
          return;
        }

        // Final Fallback: Hardcoded Java Boilerplate
        if (language === 'java') {
          setCode("class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}");
        }
      } catch (err) {
        console.error("Code restoration failed:", err);
      }
    };

    restoreCode();
    return () => controller.abort();
  }, [problemId, isDataStale, currentUser?.id, problemData?.solutionTemplate]);

  // Ref sync effects
  React.useEffect(() => {
    codeRef.current = code;
  }, [code]);

  React.useEffect(() => {
    langRef.current = language;
    probIdRef.current = problemId;
    templateRef.current = problemData?.solutionTemplate;
  }, [language, problemId, problemData?.solutionTemplate]);

  // Emergency Save on Unmount
  React.useEffect(() => {
    return () => {
      const finalCode = codeRef.current;
      const finalLang = langRef.current;
      const finalProbId = probIdRef.current;
      const finalTemplate = templateRef.current;

      if (finalCode && currentUser?.id && finalProbId && finalCode !== finalTemplate) {
        api.saveDraft(currentUser.id, finalProbId, finalCode, finalLang).catch(() => {});
      }
    };
  }, [currentUser?.id]);

  // Auto-save logic
  React.useEffect(() => {
    if (!code || !currentUser?.id || !problemId || isDataStale || code === problemData?.solutionTemplate) return;

    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        await api.saveDraft(currentUser.id, problemId, code, language);
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, currentUser?.id, problemId, isDataStale, language, problemData?.solutionTemplate]);

  // Zen Mode ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isZenMode]);

  const isCompact = containerWidth < 380;
  const isUltraCompact = containerWidth < 300;
  const isEngineOnline = engineStatus === 'ONLINE';

  if (!problemData || isDataStale) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse bg-[#0A0A0A]">
        <div className="p-4 bg-orange-500/10 rounded-full">
          <Loader2 size={24} className="text-orange-500 animate-spin" />
        </div>
        <p className="text-[10px] font-bold text-zinc-500 tracking-wider">Warming Engine...</p>
      </div>
    );
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      if (onCodeChange) onCodeChange(value);
    }
  };

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setActiveTab('result');
      setRunResult(null);
      // For Run, we use the sample test cases already in state
      const result = await api.runCode(problemId, code, language, testCases, problemData?.driverCode || "");
      setRunResult(result);
      if (result.status === 'ACCEPTED') {
        toast.success("Code executed successfully!");
      } else {
        toast.error(`Run failed: ${result.status.replace('_', ' ')}`);
      }

      // Record Run to Node.js for tracking
      try {
        await api.saveSubmissionToNode({
          problemId,
          sourceCode: code,
          language,
          status: result.status,
          executionTimeMs: result.executionTimeMs || 0,
          memoryUsageKb: result.memoryKb || 0,
          testCasesPassed: result.results?.filter((r: any) => r.passed).length || 0,
          totalTestCases: result.results?.length || 0,
          isRun: true
        });
      } catch (nodeErr) {
        console.warn("Failed to record run in Node.js", nodeErr);
      }
    } catch (err) {
      console.error("Run failed:", err);
      setRunResult({ status: 'ERROR', runtimeError: 'Execution failed.' });
      toast.error("Execution failed. Check your logic.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setActiveTab('result');
      setRunResult(null);
      
      // Dispatch immediate event to switch left panel to Submission tab
      window.dispatchEvent(new CustomEvent('submission-started'));

      toast.info("Preparing submission...", { icon: <Rocket size={16} className="text-orange-500" /> });
      
      // Fetch ALL test cases (including hidden) for final submission
      const allTestCases = await api.getAllTestCases(problemId);

      let sub = await api.submitCode(problemId, code, language, allTestCases, problemData?.driverCode || "");
      toast.info("Submission received. Judging...", {
        icon: <Loader2 className="animate-spin text-orange-500" size={16} />
      });

      // Poll for result
      let attempts = 0;
      const maxAttempts = 20;
      while (sub.status === 'PENDING' && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000));
        sub = await api.getSubmission(sub.id);
        setRunResult(sub); // Show partial result/status in Result tab
        attempts++;
      }

      if (sub.status === 'ACCEPTED') {
        toast.success("Accepted!", {
          description: `All test cases passed. Runtime: ${sub.executionTimeMs}ms`
        });
      } else {
        toast.error(`${sub.status.replace('_', ' ')}`, {
          description: "One or more test cases failed."
        });
        
        // Auto-select failing hidden test case if possible
        if (sub.failedInput) {
          const failingIdx = allTestCases.findIndex(t => t.input === sub.failedInput);
          if (failingIdx !== -1) {
            setActiveTestCase(failingIdx);
          }
        }
      }

      // Also save to Node.js server for persistent tracking
      try {
        await api.saveSubmissionToNode({
          problemId,
          sourceCode: code,
          language,
          status: (sub as any).status,
          executionTimeMs: (sub as any).executionTimeMs,
          memoryUsageKb: (sub as any).memoryUsageKb || (sub as any).memoryKb,
          testCasesPassed: (sub as any).results?.filter((r: any) => r.passed).length || 0,
          totalTestCases: (sub as any).results?.length || 0,
          isRun: false
        });
      } catch (nodeErr) {
        console.warn("Failed to record submission in Node.js", nodeErr);
      }

      // Dispatch global event for other components (like ContentArea) to show details
      window.dispatchEvent(new CustomEvent('submission-success', { detail: sub }));

      // Refresh list globally
      onRefreshHistory?.();
    } catch (err) {
      console.error("Submit failed:", err);
      toast.error("Network error during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch individual submission details when one is selected
  const handleSelectSubmission = async (sub: any) => {
    try {
      // Show list item loading if we want, but simple fetch for now
      const fullSub = await api.getSubmission(sub.id);
      setSelectedSubmission(fullSub);
    } catch (err) {
      console.error("Failed to fetch submission details:", err);
      setSelectedSubmission(sub);
      toast.error("Could not fetch details.");
    }
  };

  const handleDeleteSubmission = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    toast.error("Confirm deletion?", {
      description: "This will permanently remove the submission history.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const promise = api.deleteSubmission(id);
            toast.promise(promise, {
              loading: "Deleting submission...",
              success: () => {
                setSubmissions(prev => prev.filter(sub => sub.id !== id));
                return "Successfully removed submission.";
              },
              error: "Failed to delete submission."
            });
            await promise;
          } catch (err) {
            console.error(err);
          }
        }
      }
    });
  };



  const toggleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex(t => t.id === editorTheme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    setEditorTheme(THEME_OPTIONS[nextIndex].id);
  };

  const currentThemeLabel = THEME_OPTIONS.find(t => t.id === editorTheme)?.label || 'Theme';


  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full bg-[#0F0F0F] overflow-hidden">
      {/* Editor Header */}
      <div className={cn(
        "h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#141414]",
        isCompact && "px-2"
      )}>
        <div className="flex items-center gap-2">
          {!isCompact && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-800 rounded text-xs font-bold text-orange-500">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              Java
            </div>
          )}
          {isCompact && (
            <div className="w-8 h-8 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded text-orange-500 font-bold text-[10px]">
              J
            </div>
          )}
        </div>
        <div className={cn("flex items-center gap-2", isCompact ? "gap-1" : "gap-3")}>
          {/* Font Size Controls - Adjusted for responsiveness */}
          <div className={cn(
            "flex items-center bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-1 gap-1",
            !isUltraCompact ? "px-2 gap-2" : "px-1 gap-1"
          )}>
            {!isUltraCompact && <Type size={12} className="text-zinc-500" />}
            <button
              onClick={() => setEditorFontSize(prev => Math.max(8, prev - 1))}
              className="text-zinc-400 hover:text-zinc-200 text-xs font-bold px-1"
            >-</button>
            <span className="text-[10px] font-bold text-zinc-300 min-w-[18px] text-center">{editorFontSize}</span>
            <button
              onClick={() => setEditorFontSize(prev => Math.min(32, prev + 1))}
              className="text-zinc-400 hover:text-zinc-200 text-xs font-bold px-1"
            >+</button>
          </div>

          <button
            onClick={toggleTheme}
            className={cn(
               "flex items-center gap-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-all hover:border-zinc-700 shadow-sm",
               isCompact ? "px-2" : "px-3"
            )}
            title={`Switch Theme (Current: ${currentThemeLabel})`}
          >
            <div 
              className="w-2 h-2 rounded-full shrink-0" 
              style={{ backgroundColor: THEME_OPTIONS.find(t => t.id === editorTheme)?.color }} 
            />
            {!isCompact && <span>{currentThemeLabel}</span>}
          </button>

          {!isEngineOnline && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-[10px] text-red-400 font-bold animate-pulse">
              <AlertCircle size={12} />
              {!isUltraCompact && engineStatus}
            </div>
          )}
          
          {isSaving && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[10px] text-blue-400 font-bold">
              <Loader2 size={12} className="animate-spin" />
              {!isUltraCompact && "Saving..."}
            </div>
          )}

          {!isContestMode && (
             <button 
               onClick={handleSubmit}
               disabled={isRunning || isSubmitting || !isEngineOnline}
               className={cn(
                 "flex items-center gap-2 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded transition-all disabled:opacity-50 shadow-lg shadow-orange-900/20 active:scale-95",
                 isCompact ? "px-2.5" : "px-4",
                 !isEngineOnline && "cursor-not-allowed bg-zinc-800 text-zinc-500 hover:bg-zinc-800 shadow-none border border-zinc-700"
               )}
               title={isEngineOnline ? "Submit Code" : "Execution Engine is Offline"}
             >
               {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
               {!isCompact && <span>Submit</span>}
             </button>
          )}

          <button 
            onClick={handleRun}
            disabled={isRunning || isSubmitting || !isEngineOnline}
            className={cn(
              "flex items-center gap-2 py-1.5 text-white text-xs font-bold rounded transition-all disabled:opacity-50 shadow-lg active:scale-95",
              isContestMode 
                ? (isCompact ? "px-4 py-2 bg-orange-600 hover:bg-orange-500" : "px-8 py-2 bg-orange-600 hover:bg-orange-500")
                : cn("bg-zinc-800 hover:bg-zinc-700", isCompact ? "px-2.5" : "px-4"),
              !isEngineOnline && "cursor-not-allowed border border-zinc-700 opacity-30"
            )}
            title={isEngineOnline ? "Run Code" : "Execution Engine is Offline"}
          >
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className={isEngineOnline ? "text-orange-500" : "text-zinc-500"} fill="currentColor" />}
            {!isCompact && <span>{isContestMode ? "Run Code" : "Run"}</span>}
          </button>
        </div>
      </div>

      {/* Zen Mode Overlay */}
      {isZenMode && (
        <div className="fixed inset-0 z-[200] bg-[#0F0F0F] flex flex-col">
          <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#141414]">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-zinc-200">Zen Mode</h2>
              <div className="h-4 w-px bg-zinc-800"></div>
              <span className="text-xs text-zinc-500 italic">Press ESC to exit</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Font Size Controls */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 gap-3">
                <Type size={14} className="text-zinc-500" />
                <button
                  onClick={() => setEditorFontSize(prev => Math.max(8, prev - 1))}
                  className="text-zinc-400 hover:text-zinc-200 font-bold"
                >-</button>
                <span className="text-xs font-bold text-zinc-300 min-w-[24px] text-center">{editorFontSize}</span>
                <button
                  onClick={() => setEditorFontSize(prev => Math.min(32, prev + 1))}
                  className="text-zinc-400 hover:text-zinc-200 font-bold"
                >+</button>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all shadow-xl"
                title="Switch Theme"
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: THEME_OPTIONS.find(t => t.id === editorTheme)?.color }} 
                />
                {currentThemeLabel}
              </button>

              <button
                onClick={() => setIsZenMode(false)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1">
            <CodeEditor
              path={`zen-${problemId}.java`}
              language={language}
              theme={editorTheme}
              value={code}
              onChange={handleEditorChange}
              fontSize={editorFontSize + 2}
              problemData={problemData}
            />
          </div>
          {!isEngineOnline && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-4 p-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 ring-4 ring-red-500/5">
                  <Lock size={32} />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">Editor Locked</h3>
                  <p className="text-xs text-zinc-400 font-medium">Execution Engine is currently offline.</p>
                </div>
                <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
                  System Unavailable
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Editor & Test Cases */}
      <div className="flex-1 overflow-hidden relative group">
        <Group orientation="vertical">
          <Panel 
            defaultSize={65} 
            minSize={200} 
            maxSize={containerHeight > 0 ? containerHeight - 150 : undefined}
            className="overflow-hidden"
          >
            <div className="h-full relative group overflow-hidden">
              <CodeEditor
                path={`${problemId}.java`}
                language={language}
                theme={editorTheme}
                value={code}
                onChange={handleEditorChange}
                fontSize={editorFontSize}
                readOnly={false}
                problemData={problemData}
              />
              <button
                onClick={() => setIsZenMode(true)}
                className="absolute bottom-4 right-4 p-2 bg-zinc-800/50 text-zinc-400 rounded hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Zen Mode"
              >
                <Expand size={16} />
              </button>
              {!isEngineOnline && (
                <div className="absolute top-2 right-2 z-20 animate-in fade-in duration-500">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded-md text-[9px] font-bold text-red-400 shadow-xl backdrop-blur-sm">
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    OFFLINE
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <CustomResizeHandle direction="vertical" />

          <Panel defaultSize={35} minSize={150} className="overflow-hidden">
            {/* Test Cases Area */}
            <div className="h-full border-t border-zinc-800 flex flex-col bg-[#141414]">
              <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-[#1A1A1A]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-500/20 rounded flex items-center justify-center text-purple-400">
                    <Terminal size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Test Cases</span>
                </div>
                {(runResult || code !== "") && (
                  <button 
                    onClick={() => {
                      setRunResult(null);
                      // Reset logic if needed
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </div>
              
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar bg-[#141414]">
                  {/* Case Selection Bar */}
                  <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {/* Only show Sample Cases by default, or failing hidden case */}
                    {testCases.map((tc, idx) => {
                      const isSample = (tc as any).sample === true || tc.isSample === true; // Handle both naming conventions
                      const isFailingHidden = runResult && !runResult.results && !isSample && (runResult.status === 'WRONG_ANSWER' || runResult.status === 'TIME_LIMIT_EXCEEDED' || runResult.status === 'RUNTIME_ERROR');
                      
                      // Show if it's sample OR if it's the specific index that failed (if available)
                      // Since we don't have the index for hidden failures in Submission DTO, we can check if it's the active one
                      if (!isSample && !isFailingHidden) return null;

                      const caseResult = runResult?.results?.[idx];
                      const hasPassed = caseResult?.passed;
                      const isCaseRun = caseResult !== undefined;
                      const isActive = activeTestCase === idx;

                      return (
                        <button 
                          key={idx}
                          onClick={() => setActiveTestCase(idx)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 border shrink-0",
                            isActive 
                              ? isCaseRun 
                                ? hasPassed 
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                  : "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                : "bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                              : isCaseRun
                                ? hasPassed 
                                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500/60 hover:bg-emerald-500/10" 
                                  : "bg-red-500/5 border-red-500/20 text-red-500/60 hover:bg-red-500/10"
                                : "bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
                          )}
                        >
                          {isCaseRun && (hasPassed ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />)}
                          {!isSample ? "Hidden Case" : `Case ${idx + 1}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Banner - Specific to current test case or global failure */}
                  {runResult && (
                    <div className="mb-4">
                      {/* Compilation Error is always shown */}
                      {runResult.status === 'COMPILATION_ERROR' ? (
                        <div className="flex items-center gap-1.5 bg-zinc-900/50 p-2 rounded-lg border border-red-500/20">
                          <ShieldAlert size={16} className="text-red-500" />
                          <span className="text-[12px] font-bold uppercase tracking-wider text-red-500">Compilation Error</span>
                        </div>
                      ) : (
                        /* Case-specific status */
                        runResult.results?.[activeTestCase] && (
                          <div className={cn(
                            "flex items-center gap-1.5 p-2 rounded-lg border transition-colors",
                            runResult.results[activeTestCase].passed 
                              ? "bg-emerald-500/5 border-emerald-500/20" 
                              : "bg-red-500/5 border-red-500/20"
                          )}>
                            {runResult.results[activeTestCase].passed ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <ShieldAlert size={16} className="text-red-500" />
                            )}
                            <span className={cn(
                              "text-[12px] font-bold uppercase tracking-wider",
                              runResult.results[activeTestCase].passed ? "text-emerald-500" : "text-red-500"
                            )}>
                              {runResult.results[activeTestCase].passed ? "Accepted" : (runResult.results[activeTestCase].error ? "Runtime Error" : "Wrong Answer")}
                            </span>
                          </div>
                        )
                      )}

                      {/* Global errors like Compile or specific runtime traces */}
                      {runResult.compileError && (
                        <pre className="mt-2 p-3 bg-black/50 text-red-400 text-[10px] font-mono whitespace-pre-wrap rounded border border-red-900/20 overflow-x-auto">
                          {runResult.compileError}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Case Fields */}
                  {((runResult?.results?.length && activeTestCase < runResult.results.length) || (testCases.length > 0 && activeTestCase < testCases.length)) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {/* Input Field */}
                      <div className="relative group">
                        <div className="absolute -top-2 left-2.5 px-2 bg-[#141414] text-[8px] font-bold text-zinc-600 uppercase tracking-widest z-10">
                          Input
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-md p-3 text-[12px] font-mono text-zinc-400 group-hover:border-zinc-700 transition-colors whitespace-pre-wrap">
                          {runResult?.results?.[activeTestCase]?.input || runResult?.failedInput || testCases[activeTestCase]?.input}
                        </div>
                      </div>

                      {/* Shared row for outputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Your Output */}
                        <div className="relative group">
                          <div className="absolute -top-2 left-2.5 px-2 bg-[#141414] text-[8px] font-bold text-zinc-600 uppercase tracking-widest z-10">
                            Your Output
                          </div>
                          <div className={cn(
                            "bg-zinc-900/30 border border-zinc-800 rounded-md p-3 text-[12px] font-mono min-h-[46px] group-hover:border-zinc-700 transition-colors whitespace-pre-wrap",
                            runResult?.results?.[activeTestCase] 
                              ? runResult.results[activeTestCase].passed 
                                ? "text-emerald-400" 
                                : "text-red-400"
                              : "text-zinc-400"
                          )}>
                            {((runResult?.results?.[activeTestCase]?.actualOutput || (activeTestCase === 0 && runResult?.actualOutput))?.toString().trim().replace(/ +/g, '\n')) || "—"}
                          </div>
                        </div>

                        {/* Expected Output */}
                        <div className="relative group">
                          <div className="absolute -top-2 left-2.5 px-2 bg-[#141414] text-[8px] font-bold text-zinc-600 uppercase tracking-widest z-10">
                            Expected Output
                          </div>
                          <div className="bg-zinc-900/30 border border-zinc-800 rounded-md p-3 text-[12px] font-mono text-zinc-400 min-h-[46px] group-hover:border-zinc-700 transition-colors whitespace-pre-wrap">
                            {(runResult?.results?.[activeTestCase]?.expectedOutput || testCases[activeTestCase]?.expectedOutput)?.toString().trim().replace(/ +/g, '\n') || "—"}
                          </div>
                        </div>
                      </div>

                      {/* Explanation / Error */}
                      {(testCases[activeTestCase]?.explanation || runResult?.results?.[activeTestCase]?.error || runResult?.failedTestCaseExplanation) && (
                        <div className="relative group">
                          <div className="absolute -top-2 left-2.5 px-2 bg-[#141414] text-[8px] font-bold text-zinc-600 uppercase tracking-widest z-10">
                            {runResult?.results?.[activeTestCase]?.error ? 'Runtime Error' : 'Note'}
                          </div>
                          <div className={cn(
                            "bg-zinc-900/30 border border-zinc-800 rounded-md p-3 text-[11px] group-hover:border-zinc-700 transition-colors",
                            runResult?.results?.[activeTestCase]?.error ? 'text-red-400 font-mono' : 'text-zinc-500 italic'
                          )}>
                            {runResult?.results?.[activeTestCase]?.error || runResult?.failedTestCaseExplanation || testCases[activeTestCase]?.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
export default React.memo(EditorArea);
