import React from 'react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';
import {
  FileText,
  BookOpen,
  History,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  Share2,
  Flag,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
  Type,
  Expand,
  Trash2,
  Sparkles,
  Copy,
  HardDrive,
  Clock,
  Database,
  ExternalLink,
  X,
  Tag as TagIcon,
  Video,
  Layers,
  Activity,
  Settings as SettingsIcon,
  Terminal,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import VideoPlayer from './VideoPlayer';
import { PdfViewer } from './PdfViewer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { Problem, Submission as SubmissionType, SolutionType } from '../types';
import { ImageOverlay } from './Common/ImageOverlay';
import { registerCustomThemes, THEME_OPTIONS } from '../lib/monaco-themes.ts';

interface ContentAreaProps {
  problemId: string;
  problemData?: any | null;
  isStudyMode: boolean;
  onToggleStudyMode: () => void;
  onPrevProblem?: () => void;
  onNextProblem?: () => void;
  isContestMode?: boolean;
}

export default function ContentArea({
  problemId,
  problemData,
  isStudyMode,
  onToggleStudyMode,
  onPrevProblem,
  onNextProblem,
  isContestMode
}: ContentAreaProps) {
  const [activeTab, setActiveTab] = React.useState<'Description' | 'Editorial' | 'Submission'>('Description');
  const [activeEditorialType, setActiveEditorialType] = React.useState<SolutionType>('BRUTE');
  const [activeImplLang, setActiveImplLang] = React.useState<string>('java');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [quizAnswer, setQuizAnswer] = React.useState<string | null>(null);
  const [editorTheme, setEditorTheme] = React.useState(() => {
    return localStorage.getItem('codegraph-theme') || 'vs-dark';
  });
  const [editorFontSize, setEditorFontSize] = React.useState(12);
  const [isZenMode, setIsZenMode] = React.useState(false);
  const [selectedSubmission, setSelectedSubmission] = React.useState<any | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionType[]>([]);
  const [submissionPage, setSubmissionPage] = React.useState(0);
  const [totalSubmissionPages, setTotalSubmissionPages] = React.useState(0);
  const [totalSubmissions, setTotalSubmissions] = React.useState(0);
  const [itemsPerPage] = React.useState(10);
  const [problem, setProblem] = React.useState<Problem | null>(null);
  const contentAreaRef = React.useRef<HTMLDivElement>(null);
  const studyGridRef = React.useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Sync theme with global preference
  React.useEffect(() => {
    localStorage.setItem('codegraph-theme', editorTheme);
  }, [editorTheme]);

  const toggleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex(t => t.id === editorTheme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    setEditorTheme(THEME_OPTIONS[nextIndex].id);
  };

  const currentThemeLabel = THEME_OPTIONS.find(t => t.id === editorTheme)?.label || 'Theme';

  const [testCases, setTestCases] = React.useState<any[]>([]);
  const isSolved = submissions.some(s => s.status === 'ACCEPTED');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [overlayImage, setOverlayImage] = React.useState<string | null>(null);

  const markdownComponents: any = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="rounded-xl overflow-hidden my-6 border border-zinc-800 shadow-2xl">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, padding: '1.5rem', background: '#09090b', fontSize: isStudyMode ? '15px' : '14px' }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-orange-500/10 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-orange-500/20" {...props}>
          {children}
        </code>
      )
    },
    h1: ({ children }: any) => <h1 className={cn("font-black text-zinc-100 mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2", isStudyMode ? "text-3xl" : "text-2xl")}>{children}</h1>,
    h2: ({ children }: any) => <h2 className={cn("font-bold text-zinc-100 mt-6 mb-4 tracking-tight", isStudyMode ? "text-2xl" : "text-xl")}>{children}</h2>,
    h3: ({ children }: any) => <h3 className={cn("font-bold text-orange-500/90 mt-5 mb-2", isStudyMode ? "text-xl" : "text-lg")}>{children}</h3>,
    h4: ({ children }: any) => <h4 className={cn("font-bold text-zinc-200 mt-4 mb-2", isStudyMode ? "text-lg" : "text-md")}>{children}</h4>,
    p: ({ children }: any) => <p className={cn("mb-4 text-zinc-200 leading-relaxed", isStudyMode ? "text-[18px]" : "text-[16px]")}>{children}</p>,
    ul: ({ children }: any) => <ul className={cn("list-disc pl-5 mb-6 space-y-2 text-zinc-200", isStudyMode ? "text-[18px]" : "text-[16px]")}>{children}</ul>,
    ol: ({ children }: any) => <ol className={cn("list-decimal pl-5 mb-6 space-y-2 text-zinc-200", isStudyMode ? "text-[18px]" : "text-[16px]")}>{children}</ol>,
    strong: ({ children }: any) => <strong className="font-bold text-zinc-100">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-zinc-400">{children}</em>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-orange-500/50 bg-orange-500/5 px-6 py-4 rounded-r-xl italic my-6 text-zinc-200">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="my-8 overflow-x-auto rounded-xl border border-zinc-800 shadow-lg bg-zinc-900/20 backdrop-blur-sm">
        <table className={cn("w-full text-left border-collapse", isStudyMode ? "text-[16px]" : "text-[14px]")}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[10px] font-black tracking-widest">{children}</thead>,
    th: ({ children }: any) => <th className="px-6 py-4 border-b border-zinc-800 font-black">{children}</th>,
    td: ({ children }: any) => <td className="px-6 py-4 border-b border-zinc-800/50 text-zinc-300">{children}</td>,
    tr: ({ children }: any) => <tr className="hover:bg-zinc-800/30 transition-colors">{children}</tr>,
  };

  // Fetch Problem Data - Only on ID change
  React.useEffect(() => {
    // RESET ALL INTERNAL STATE ON PROBLEM CHANGE
    // This ensures that even if the component doesn't re-mount, the UI is fresh
    setActiveTab('Description');
    setQuizAnswer(null);
    setSelectedSubmission(null);
    setSubmissions([]);
    setSubmissionPage(0);
    setError(null);
    setLoading(true);
    setProblem(null);
    setTestCases([]);

    const controller = new AbortController();

    const fetchProblem = async () => {
      try {
        setLoading(true);
        // VALIDATE props data before using it to prevent stale "ghosting"
        const isStale = problemData && String(problemData._id || problemData.id) !== String(problemId);
        const data = (problemData && !isStale) ? problemData : await api.getProblem(problemId);

        if (!controller.signal.aborted) {
          setProblem(data);

          const fetchSamples = async () => {
            // VALIDATE props data
            const isStale = problemData && String(problemData._id || problemData.id) !== String(problemId);
            const testCasesToUse = (problemData?.testCases && !isStale) ? problemData.testCases : null;

            if (testCasesToUse && testCasesToUse.length > 0) {
              setTestCases(testCasesToUse.filter((tc: any) => tc.isSample));
              return;
            }

            try {
              const cases = await api.getSampleTestCases(problemId);
              setTestCases(cases);
            } catch (caseErr) {
              console.error("Failed to fetch sample test cases:", caseErr);
            }
          };
          fetchSamples();

          setLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch problem:", err);
          setLoading(false);
        }
      }
    };

    fetchProblem();
    return () => controller.abort();
  }, [problemId]); // ONLY depend on problemId to prevent re-fetching on parent re-renders

  // Fetch individual submission details when one is selected
  const handleSelectSubmission = async (sub: any) => {
    try {
      const fullSub = await api.getSubmission(sub.id);
      setSelectedSubmission(fullSub);
    } catch (err) {
      console.error("Failed to fetch submission details:", err);
      setSelectedSubmission(sub);
    }
  };

  const fetchSubmissions = async (page = submissionPage) => {
    try {
      const data = await api.getProblemSubmissions(problemId, page, itemsPerPage);
      const list = data.content || [];
      setSubmissions(list);
      setTotalSubmissionPages(data.totalPages || 0);
      setTotalSubmissions(data.totalElements || 0);

    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  // Handle ESC key for various modes
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If something is in fullscreen (like the PDF viewer), let it handle the ESC
        if (document.fullscreenElement) return;

        if (isZenMode) {
          setIsZenMode(false);
        } else if (selectedSubmission) {
          setSelectedSubmission(null);
        } else if (activeTab === 'Submission') {
          setActiveTab('Editorial');
        } else if (activeTab === 'Editorial') {
          setActiveTab('Description');
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isZenMode, selectedSubmission, activeTab]);

  // Fetch Submissions on tab change
  React.useEffect(() => {
    if (activeTab === 'Submission') {
      fetchSubmissions(submissionPage);
    }
  }, [problemId, activeTab, submissionPage]);

  // Listen for global submission events from Editor
  React.useEffect(() => {
    const handleSubmissionSuccess = (e: any) => {
      const sub = e.detail;
      setActiveTab('Submission');
      setSelectedSubmission(sub);
      fetchSubmissions(0); // Refresh first page
    };

    const handleSubmissionStarted = () => {
      setActiveTab('Submission');
      setSelectedSubmission(null); // Clear selected to show the history list with the "Judging..." entry
      fetchSubmissions(0);
    };

    window.addEventListener('submission-success', handleSubmissionSuccess);
    window.addEventListener('submission-started', handleSubmissionStarted);
    return () => {
      window.removeEventListener('submission-success', handleSubmissionSuccess);
      window.removeEventListener('submission-started', handleSubmissionStarted);
    };
  }, [problemId]);
  const handleDeleteSubmission = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();

    toast.error("Confirm deletion?", {
      description: "This will permanently remove the submission.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const promise = api.deleteSubmission(id);
            toast.promise(promise, {
              loading: "Deleting submission...",
              success: () => {
                setSubmissions(prev => prev.filter(sub => String(sub.id) !== String(id)));
                if (selectedSubmission && String(selectedSubmission.id) === String(id)) setSelectedSubmission(null);
                return "Submission deleted successfully";
              },
              error: "Failed to delete submission"
            });
            await promise;
          } catch (err) {
            console.error("Failed to delete submission:", err);
          }
        }
      }
    });
  };

  // ID Lockdown Guard: If the data doesn't match the requested ID, show loading state
  const isDataStale = problemData && String(problemId) !== String(problemData._id || problemData.id);

  if (loading || !problem || isDataStale) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse bg-[#0A0A0A]">
        <div className="p-4 bg-orange-500/10 rounded-full">
          <Loader2 size={32} className="text-orange-500 animate-spin" />
        </div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hydrating Description...</p>
      </div>
    );
  }

  return (
    <div ref={contentAreaRef} className="w-full flex flex-col h-full border-r border-zinc-800 bg-[#0F0F0F] overflow-hidden">
      {/* Tabs Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-2 bg-[#141414] shrink-0">
        <div className="flex items-center">
          <Tab icon={<FileText size={14} />} label="Description" active={activeTab === 'Description'} onClick={() => { setActiveTab('Description'); setSelectedSubmission(null); }} />
          {!isContestMode && (
            <Tab icon={<BookOpen size={14} />} label="Editorial" active={activeTab === 'Editorial'} onClick={() => { setActiveTab('Editorial'); setActiveEditorialType('BRUTE'); setSelectedSubmission(null); }} />
          )}
          {!isStudyMode && !isContestMode && (
            <Tab icon={<History size={14} />} label="Submission" active={activeTab === 'Submission'} onClick={() => { setActiveTab('Submission'); setSelectedSubmission(null); }} />
          )}
        </div>

        {/* Global Access Controls (Tab Bar Level) */}
        <div className="flex items-center gap-4 px-3">
          {activeTab === 'Editorial' && (
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shadow-2xl">
              {['BRUTE', 'BETTER', 'OPTIMAL'].map((type) => {
                const exists = (problem?.editorialSolutions || []).some((s: any) => s.type === type);
                if (!exists) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveEditorialType(type as any)}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                      activeEditorialType === type
                        ? "bg-zinc-800 text-orange-500 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {activeEditorialType === type && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 pr-2">
            <span className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500">
              Study view
              <button
                onClick={onToggleStudyMode}
                className={cn(
                  "w-8 h-4.5 rounded-full relative transition-all duration-300 p-0.5",
                  isStudyMode ? "bg-orange-600 shadow-[0_0_12px_rgba(234,88,12,0.3)]" : "bg-zinc-800"
                )}
              >
                <motion.div
                  animate={{ x: isStudyMode ? 14 : 0 }}
                  className="w-3.5 h-3.5 bg-white rounded-full shadow-md"
                />
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {activeTab === 'Description' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <h1 className={cn(
                  "font-bold text-zinc-100 transition-all duration-300",
                  isStudyMode ? "text-3xl" : "text-xl"
                )}>
                  {problem?.title || "Loading..."}
                </h1>
                {isSolved && !isContestMode && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 size={10} />
                    Solved
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6">
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded border",
                  problem?.difficulty === 'EASY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    problem?.difficulty === 'MEDIUM' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {problem?.difficulty || '...'}
                </span>
                <button className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded border border-zinc-700 transition-colors">
                  Hints
                </button>
                {problem?.tags && problem.tags.length > 0 && (
                  <div className="flex items-center gap-2 ml-2">
                    {problem.tags
                      .filter(tag => {
                        const tagStr = typeof tag === 'string' ? tag : tag.name;
                        // Filter out tags that are 24-char hex IDs (Problem IDs)
                        const isId = /^[0-9a-fA-F]{24}$/.test(tagStr);
                        return !isId;
                      })
                      .map((tag, idx) => (
                        <span key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900/50 text-zinc-500 text-[9px] font-bold rounded-full border border-zinc-800/50 uppercase tracking-tighter">
                          <TagIcon className="w-2.5 h-2.5 opacity-60" />
                          {typeof tag === 'string' ? tag : tag.name}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                {problem?.image && (
                  <div className="mb-8 flex justify-center">
                    <img
                      src={problem.image}
                      alt="Problem Context"
                      className="block cursor-zoom-in active:scale-[0.98] transition-transform"
                      style={{ width: `${problem.imageScale || 40}%` }}
                      onDoubleClick={() => setOverlayImage(problem.image!)}
                    />
                  </div>
                )}
                <div
                  className={cn(
                    "text-zinc-100 leading-relaxed mb-10 transition-all duration-300",
                    isStudyMode ? "text-lg max-w-4xl" : "text-sm"
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {problem?.description || ''}
                  </ReactMarkdown>
                </div>

                <div className="space-y-12">
                  {testCases.filter(tc => tc.isSample).map((testCase, index) => (
                    <div key={index} className="space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-orange-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                        <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Example {index + 1}</h3>
                      </div>

                      {testCase.image && (
                        <div className="mb-4 flex justify-center">
                          <img
                            src={testCase.image}
                            alt={`Example ${index + 1}`}
                            className="block cursor-zoom-in active:scale-[0.98] transition-transform"
                            style={{ width: `${testCase.imageScale || 40}%` }}
                            onDoubleClick={() => setOverlayImage(testCase.image!)}
                          />
                        </div>
                      )}

                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4 font-mono shadow-inner">
                        <div className={cn("flex flex-col gap-1 transition-all", isStudyMode ? "text-base" : "text-sm")}>
                          <span className="font-semibold text-zinc-500 text-[11px] tracking-wide">Input:</span>
                          <span className="text-zinc-100 break-all">{testCase.input}</span>
                        </div>
                        <div className={cn("flex flex-col gap-1 transition-all", isStudyMode ? "text-base" : "text-sm")}>
                          <span className="font-semibold text-zinc-500 text-[11px] tracking-wide">Output:</span>
                          <span className="text-zinc-100 break-all">{testCase.expectedOutput}</span>
                        </div>
                        {testCase.explanation && (
                          <div className={cn("flex flex-col gap-1 transition-all pt-4 border-t border-zinc-800/50", isStudyMode ? "text-base" : "text-sm")}>
                            <span className="font-semibold text-zinc-500 text-[11px] tracking-wide font-sans">Explanation:</span>
                            <div className="text-zinc-200 font-sans leading-relaxed">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    return (
                                      <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-zinc-700/50" {...props}>
                                        {children}
                                      </code>
                                    )
                                  },
                                }}
                              >
                                {testCase.explanation}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles size={16} className="text-orange-500" />
                    <h3 className="text-base font-bold text-zinc-100">{problem?.quizQuestion || "Conceptual Check"}</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-2 text-xs">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-zinc-500 min-w-[70px] tracking-wide">Question:</span>
                        <span className="text-zinc-100 font-mono">Select the correct complexity</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(problem?.quizOptions?.split(',') || ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)']).map((option) => (
                        <button
                          key={option}
                          onClick={() => setQuizAnswer(option.trim())}
                          className={cn(
                            "flex items-center gap-4 px-6 py-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden",
                            quizAnswer === option.trim()
                              ? (option.trim() === problem?.quizCorrectAnswer
                                ? "bg-emerald-500/5 border-emerald-500/40 text-emerald-500 ring-1 ring-emerald-500/20"
                                : "bg-red-500/5 border-red-500/40 text-red-500 ring-1 ring-red-500/20")
                              : "bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-300"
                          )}
                        >
                          {/* Radio style indicator */}
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
                            quizAnswer === option.trim()
                              ? (option.trim() === problem?.quizCorrectAnswer ? "border-emerald-500" : "border-red-500")
                              : "border-zinc-700 group-hover:border-zinc-500"
                          )}>
                            {quizAnswer === option.trim() && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  option.trim() === problem?.quizCorrectAnswer ? "bg-emerald-500" : "bg-orange-500"
                                )}
                              />
                            )}
                          </div>
                          <span className="font-bold text-sm tracking-tight">{option.trim()}</span>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {quizAnswer && quizAnswer !== problem?.quizCorrectAnswer && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-[0.2em] pt-4"
                        >
                          <AlertCircle size={16} />
                          <span>Incorrect. Try again!</span>
                        </motion.div>
                      )}
                      {quizAnswer === problem?.quizCorrectAnswer && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-[0.2em] pt-4"
                        >
                          <CheckCircle2 size={16} />
                          <span>Correct! Knowledge Mastered.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-zinc-800/50">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Constraints</h3>
                  <ul className="list-disc list-inside text-zinc-500 text-xs space-y-2">
                    <li>The outer class must contain a private field <code className="text-zinc-600 font-mono">x</code>.</li>
                    <li>The inner class must be non-static.</li>
                    <li><code className="text-zinc-600 font-mono">-10^4 &lt;= x, factor &lt;= 10^4</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Editorial' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
              <div className={cn(
                "transition-all duration-500 overflow-hidden",
                isStudyMode ? "h-0 opacity-0 mb-0 pointer-events-none" : "mb-8 opacity-100"
              )}>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{problem?.title} Editorial</h1>
                  <p className="text-[10px] font-semibold text-zinc-500 tracking-wide">Mastery Path • {problem?.difficulty || 'Medium'}</p>
                </div>
              </div>

              {(() => {
                const solution = (problem?.editorialSolutions || []).find((s: any) => s.type === activeEditorialType) ||
                  (problem?.editorialSolutions || [])[0];

                if (!solution && !problem?.editorialVideoUrl) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-80 flex flex-col items-center justify-center border border-zinc-800/50 rounded-3xl bg-gradient-to-b from-zinc-900/20 to-black/40 text-zinc-500 shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05)_0%,transparent_70%)]" />
                      <div className="relative z-10 flex flex-col items-center text-center px-8">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                          <Sparkles size={32} className="text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-200 mb-2 tracking-tight">Wisdom in the Works</h3>
                        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                          Our master architects are currently crafting a deep-dive editorial for this challenge. Check back soon for the optimized path!
                        </p>
                        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full">
                          <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Coming Soon</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div
                    ref={studyGridRef}
                    className={cn(
                      "transition-all duration-500",
                      isStudyMode ? "grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-120px)] overflow-visible relative z-0" : "space-y-12"
                    )}
                  >
                    {/* Hero Section: Video Tutorial (Left Column in Study Mode) */}
                    {(solution?.videoUrl || problem?.editorialVideoUrl) && (
                      <div className={cn(
                        "transition-all duration-500 z-10 overflow-visible",
                        isStudyMode ? "lg:sticky lg:top-6 p-6 flex flex-col" : "mb-12"
                      )}>
                        {isStudyMode ? (
                          <motion.div
                            drag={isStudyMode ? "y" : false}
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={studyGridRef}
                            dragMomentum={false}
                            dragElastic={0}
                            className="relative group h-fit"
                          >
                            {/* Unified Greyish-Orange Chassis Frame */}
                            <div className="relative rounded-[32px] p-1 pb-10 bg-gradient-to-br from-zinc-500/40 via-orange-950/20 to-zinc-800/40 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.9),0_0_40px_rgba(249,115,22,0.1)] overflow-hidden border-b-4 border-orange-500/20 hover:border-orange-500/40 transition-colors">
                              {/* Inner Surface Glass */}
                              <div className="absolute inset-0 bg-black rounded-[28px]" />

                              {/* Top Tagging Area */}
                              <div className="absolute top-4 left-5 z-20 pointer-events-none">
                                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-orange-500/20 shadow-2xl">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                  <span className="text-[10px] font-semibold text-zinc-100 tracking-wide">Tutorial</span>
                                </div>
                              </div>

                              {/* The Video content area */}
                              <div className="relative aspect-video rounded-[26px] overflow-hidden border border-white/5 bg-black mt-2 mx-1">
                                <VideoPlayer url={solution?.videoUrl || problem?.editorialVideoUrl} />
                              </div>

                              {/* Reinforced Bottom Drag Handle Bar */}
                              <div
                                onPointerDown={(e) => dragControls.start(e)}
                                className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-orange-500/5 transition-all group/handle"
                              >
                                <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/20 border border-transparent group-hover/handle:border-orange-500/20 transition-all">
                                  <Activity size={14} className="text-orange-500" />
                                  <span className="text-[10px] font-semibold text-zinc-400 tracking-widest uppercase">Reposition player</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-black shadow-2xl group/normal">
                            <VideoPlayer url={solution?.videoUrl || problem?.editorialVideoUrl} />
                            <div className="absolute top-4 left-4 pointer-events-none">
                              <div className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                <span className="text-[10px] font-semibold text-zinc-100 uppercase tracking-tighter opacity-80">Video Tutorial</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Section (Right Column in Study Mode) */}
                    <div className={cn(
                      "space-y-16",
                      isStudyMode ? "h-full overflow-y-auto custom-scrollbar p-6 lg:border-l border-zinc-800/50 bg-[#0A0A0A]" : ""
                    )}>
                      {isStudyMode && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                          {/* 1. Hero Content */}
                          <div className="space-y-6">
                            <h1 className="text-5xl font-bold text-white tracking-tight">
                              {problem?.title || "Problem Title"} <br />
                              <span className="text-orange-500 opacity-90 text-[0.8em] font-semibold">Mastery Path</span>
                            </h1>
                            <div className="flex items-center gap-4">
                              <span className={cn(
                                "text-[11px] font-semibold px-4 py-1.5 rounded-full tracking-wide transition-all duration-500",
                                problem?.difficulty === 'EASY' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]" :
                                  problem?.difficulty === 'MEDIUM' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]" :
                                    "bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                              )}>
                                {problem?.difficulty ? (problem.difficulty.charAt(0) + problem.difficulty.slice(1).toLowerCase()) : 'Medium'}
                              </span>
                              <div className="flex items-center gap-3">
                                {(problem?.tags || []).map((tag: any) => (
                                  <span key={tag.id || tag.name} className="text-[10px] font-semibold text-zinc-400 capitalize px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                                    {tag.name || tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 2. Main Description */}
                          <div className="text-zinc-100 max-w-none leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={markdownComponents}
                            >
                              {problem?.description || "Loading problem details..."}
                            </ReactMarkdown>
                          </div>

                          {/* 3. Sample Test Cases */}
                          <div className="space-y-6">
                            {(problem?.testCases?.filter(tc => tc.isSample) || []).map((tc: any, idx: number) => (
                              <section key={tc.id || idx} className="space-y-4">
                                <h3 className="text-[11px] font-semibold text-zinc-500 flex items-center gap-3 tracking-wide">
                                  Sample Test Case {idx + 1}
                                  <div className="h-px flex-1 bg-zinc-800/50" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                                  <div className="flex flex-col space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-500 px-1 tracking-wide uppercase">Input Data</label>
                                    <pre className="flex-1 bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl text-zinc-200 font-mono text-xs ring-1 ring-white/5 shadow-inner min-h-[3.5rem] whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                                      {tc.input}
                                    </pre>
                                  </div>
                                  <div className="flex flex-col space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-500 px-1 tracking-wide uppercase">Expected Output</label>
                                    <pre className="flex-1 bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl text-orange-400 font-mono text-xs ring-1 ring-orange-500/5 shadow-inner min-h-[3.5rem] whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                                      {tc.expectedOutput}
                                    </pre>
                                  </div>
                                </div>
                                {tc.explanation && (
                                  <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                                    <div className={cn("text-zinc-200 leading-relaxed", isStudyMode ? "text-[18px]" : "text-sm")}>
                                      <span className="text-orange-500 font-bold mr-2 tracking-wide uppercase text-[10px]">Explanation:</span>
                                      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                        {tc.explanation}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                )}
                              </section>
                            ))}
                          </div>

                          <div className="h-px bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 my-12" />
                        </div>
                      )}

                      <div className="space-y-10">
                        {/* 1. Intuition */}
                        {solution?.intuition && (
                          <section className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-1.5 h-7 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.6)]", isStudyMode ? "h-9" : "h-7")} />
                              <h2 className={cn("font-semibold text-white tracking-tight", isStudyMode ? "text-3xl" : "text-xl")}>Intuition</h2>
                            </div>
                            <div className={cn(
                              "text-zinc-200 prose prose-invert prose-sm max-w-none leading-relaxed",
                              isStudyMode ? "text-base" : ""
                            )}>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={markdownComponents}
                              >
                                {solution.intuition}
                              </ReactMarkdown>
                            </div>
                          </section>
                        )}

                        {/* 2. Approach */}
                        {solution?.approach && (
                          <section className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-1.5 h-7 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.6)]", isStudyMode ? "h-9" : "h-7")} />
                              <h2 className={cn("font-semibold text-white tracking-tight", isStudyMode ? "text-3xl" : "text-xl")}>Approach</h2>
                            </div>
                            <div className={cn(
                              "text-zinc-200 prose prose-invert prose-sm max-w-none leading-relaxed",
                              isStudyMode ? "text-base" : ""
                            )}>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={markdownComponents}
                              >
                                {solution.approach}
                              </ReactMarkdown>
                            </div>
                          </section>
                        )}

                        {/* 3. Presentation Viewer */}
                        {(solution?.pdfUrl || problem?.editorialPdfUrl) && (
                          <PdfViewer url={solution?.pdfUrl || problem?.editorialPdfUrl} />
                        )}
                      </div>

                      {/* 4. Implementation Code */}
                      {(solution?.implementations && solution.implementations.length > 0) && (
                        <section className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-1.5 h-7 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.6)]", isStudyMode ? "h-9" : "h-7")} />
                              <h2 className={cn("font-semibold text-white tracking-tight", isStudyMode ? "text-3xl" : "text-xl")}>Implementation</h2>
                            </div>

                            <div className="flex items-center gap-4">
                              <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 transition-all hover:border-zinc-700 shadow-sm"
                                title={`Switch Theme (Current: ${currentThemeLabel})`}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: THEME_OPTIONS.find(t => t.id === editorTheme)?.color }}
                                />
                                {currentThemeLabel}
                              </button>

                              <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5">
                                {(solution?.implementations || []).length > 0 ? (
                                  solution.implementations.map((impl: any) => (
                                    <button
                                      key={impl.language}
                                      onClick={() => setActiveImplLang(impl.language)}
                                      className={cn(
                                        "px-3 py-1 rounded-md text-[10px] font-semibold transition-all",
                                        activeImplLang === impl.language
                                          ? "bg-zinc-800 text-orange-500 shadow-lg"
                                          : "text-zinc-500 hover:text-zinc-300"
                                      )}
                                    >
                                      {impl.language.charAt(0).toUpperCase() + impl.language.slice(1).toLowerCase()}
                                    </button>
                                  ))
                                ) : (
                                  <span className="px-3 py-1 text-[10px] font-semibold text-zinc-600">Java</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="relative group rounded-2xl border border-zinc-800 overflow-hidden bg-[#0A0A0A] shadow-2xl">
                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  const code = solution?.implementations?.find((i: any) => i.language === (activeImplLang || 'java'))?.code;
                                  if (code) {
                                    navigator.clipboard.writeText(code);
                                    toast.success("Code copied to clipboard");
                                  }
                                }}
                                className="p-2 bg-zinc-800/80 backdrop-blur-md rounded-lg text-zinc-400 hover:text-white border border-white/5 transition-all shadow-xl"
                              >
                                <Copy size={14} />
                              </button>
                            </div>

                            <div className="h-[400px] font-mono text-sm leading-relaxed tracking-tight">
                              <Editor
                                height="100%"
                                language={activeImplLang || 'java'}
                                theme={editorTheme}
                                value={solution?.implementations?.find((i: any) => i.language === (activeImplLang || 'java'))?.code || "// Implementation code will appear here"}
                                beforeMount={registerCustomThemes}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 13,
                                  lineNumbers: 'on',
                                  scrollBeyondLastLine: false,
                                  padding: { top: 24, bottom: 24 },
                                  automaticLayout: true,
                                  scrollbar: {
                                    vertical: 'hidden',
                                    horizontal: 'hidden'
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </section>
                      )}

                      {/* 4. Complexity Analysis */}
                      {(solution?.complexity?.time || solution?.complexity?.space) && (
                        <section className="space-y-6 pt-4 pb-12">
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-1 h-6 bg-orange-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                            <h2 className="text-xl font-bold text-white tracking-tight">Complexity Analysis</h2>
                          </div>
                          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[32px] p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {solution?.complexity?.time && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-zinc-500 mb-1">
                                  <Clock size={isStudyMode ? 24 : 18} className="text-orange-500" />
                                  <span className={cn("font-black uppercase tracking-[0.2em]", isStudyMode ? "text-[14px]" : "text-[10px]")}>Time Complexity</span>
                                </div>
                                <p className={cn("font-black text-white tabular-nums tracking-tighter tabular-nums", isStudyMode ? "text-6xl" : "text-4xl")}>{solution.complexity.time}</p>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">The algorithm processes all elements exactly once, achieving maximum theoretical efficiency.</p>
                              </div>
                            )}

                            {solution?.complexity?.time && solution?.complexity?.space && (
                              <div className="h-px bg-gradient-to-r from-zinc-800/0 via-zinc-800 to-zinc-800/0" />
                            )}

                            {solution?.complexity?.space && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-zinc-500 mb-1">
                                  <Layers size={isStudyMode ? 24 : 18} className="text-orange-500" />
                                  <span className={cn("font-black uppercase tracking-[0.2em]", isStudyMode ? "text-[14px]" : "text-[10px]")}>Space Complexity</span>
                                </div>
                                <p className={cn("font-black text-white tabular-nums tracking-tighter tabular-nums", isStudyMode ? "text-6xl" : "text-4xl")}>{solution.complexity.space}</p>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Memory consumption is optimized by utilizing in-place operations and efficient data structures.</p>
                              </div>
                            )}
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'Submission' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {!selectedSubmission ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-zinc-100 uppercase tracking-tight">Past Submissions</h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={12} />
                      {submissions.filter(s => s.status === 'ACCEPTED').length} Accepted
                    </div>
                  </div>

                  <div className="grid gap-3 mb-8">
                    {submissions.map((sub, idx) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSelectSubmission(sub)}
                        className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-500/20 cursor-pointer transition-all duration-300 hover:bg-zinc-900/60"
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            sub.status === 'ACCEPTED' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {sub.status === 'ACCEPTED' ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                          </div>
                          <div>
                            <p className={cn(
                              "text-sm font-black uppercase tracking-tight",
                              sub.status === 'ACCEPTED' ? "text-emerald-500" : "text-red-500"
                            )}>
                              {sub.status.replace('_', ' ')}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold">{sub.language}</span>
                              <span className="text-[10px] text-zinc-600 font-bold tracking-tight">
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 text-zinc-400">
                              <Clock size={12} className="text-zinc-600" />
                              <span className="text-xs font-black">{sub.executionTimeMs}ms</span>
                            </div>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Runtime</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 text-zinc-400">
                              <Database size={12} className="text-zinc-600" />
                              <span className="text-xs font-black">{(sub.memoryKb / 1024).toFixed(1)}MB</span>
                            </div>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Memory</p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSubmission(e, sub.id)}
                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Submission"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {totalSubmissionPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8 pb-10">
                      <button
                        onClick={() => setSubmissionPage(p => Math.max(0, p - 1))}
                        disabled={submissionPage === 0}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalSubmissionPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSubmissionPage(i)}
                            className={cn(
                              "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                              submissionPage === i
                                ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setSubmissionPage(p => Math.min(totalSubmissionPages - 1, p + 1))}
                        disabled={submissionPage === totalSubmissionPages - 1}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-8">
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors group"
                    >
                      <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                      Back to Submissions
                    </button>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-[10px] font-bold rounded-lg transition-colors">
                        <Sparkles size={12} /> ANALYSIS
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-lg transition-colors">
                        <FileText size={12} /> SOLUTION
                      </button>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      selectedSubmission.status === 'ACCEPTED' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {selectedSubmission.status === 'ACCEPTED' ? (
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                      ) : (
                        <X size={32} strokeWidth={2.5} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className={cn(
                          "text-3xl font-black tracking-tight uppercase",
                          selectedSubmission.status === 'ACCEPTED' ? "text-emerald-500" : "text-red-500"
                        )}>
                          {selectedSubmission.status.replace('_', ' ')}
                        </h3>
                        <span className="text-xs bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full font-bold">
                          {selectedSubmission.passedTestCases || 0} / {selectedSubmission.totalTestCases || 0} passed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-[8px] font-bold text-orange-500 border border-orange-500/30 font-black">P</div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-tight">
                          <span className="text-zinc-300">USER</span> submitted at {new Date(selectedSubmission.submittedAt).toLocaleString(undefined, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Failed Test Case Card */}
                  {selectedSubmission.status !== 'ACCEPTED' && selectedSubmission.failedInput && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Failed Test Case</h3>
                      </div>

                      <div className="bg-red-500/5 border border-red-500/10 rounded-[28px] p-6">
                        {selectedSubmission.failedTestCaseImage && (
                          <div className="flex justify-center mb-8">
                            <img
                              src={selectedSubmission.failedTestCaseImage}
                              alt="Failed Test Case"
                              className="rounded-2xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] cursor-zoom-in active:scale-[0.98] transition-all"
                              style={{ width: `${selectedSubmission.failedTestCaseImageScale || 40}%` }}
                              onDoubleClick={() => setOverlayImage(selectedSubmission.failedTestCaseImage)}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Input</span>
                            <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl p-3 text-xs font-mono text-zinc-300 break-all">
                              {selectedSubmission.failedInput}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Expected</span>
                            <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl p-3 text-xs font-mono text-emerald-400 break-all">
                              {selectedSubmission.expectedOutput}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Actual</span>
                            <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl p-3 text-xs font-mono text-red-400 break-all">
                              {selectedSubmission.actualOutput}
                            </div>
                          </div>
                        </div>

                        {selectedSubmission.failedTestCaseExplanation && (
                          <div className="mt-6 pt-6 border-t border-red-500/10">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Explanation</span>
                            <p className="text-sm text-zinc-400 italic leading-relaxed">
                              {selectedSubmission.failedTestCaseExplanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Metrics Grid - Only shown for Accepted Submissions */}
                  {selectedSubmission.status === 'ACCEPTED' && (() => {
                    const timeValue = selectedSubmission.executionTimeMs || 0;
                    const memoryMb = (selectedSubmission.memoryKb || 0) / 1024;
                    const subIdNum = parseInt(selectedSubmission.id.toString().replace(/\D/g, '')) || 0;

                    // Time Calculation: Scale 0 to 200ms
                    const timePos = Math.min(98, Math.max(2, (timeValue / 200) * 100));
                    // Keep on curve (rough approximation of M0,40 C10,38 20,35 30,10 C40,5 50,25 60,30 C70,35 80,38 90,39 L100,40)
                    let timeY = 25;
                    if (timePos < 30) timeY = 40 - (timePos * 1);
                    else if (timePos < 40) timeY = 10 - (timePos - 30) * 0.5;
                    else if (timePos < 50) timeY = 5 + (timePos - 40) * 2;
                    else if (timePos < 60) timeY = 25 + (timePos - 50) * 0.5;
                    else timeY = 30 + (timePos - 60) * 0.25;

                    const timeBeatsValue = Math.max(1.1, Math.min(99.9, 100 - (timePos * 0.8) - (subIdNum % 5))).toFixed(1);

                    // Space Calculation: Scale 30MB to 70MB
                    const spacePos = Math.min(98, Math.max(2, ((memoryMb - 30) / 40) * 100));
                    // Keep on curve (rough approximation of M0,40 C10,39 20,38 30,35 C40,30 50,15 60,10 C70,15 80,30 90,35 L100,40)
                    let spaceY = 25;
                    if (spacePos < 30) spaceY = 40 - (spacePos * 0.16);
                    else if (spacePos < 60) spaceY = 35 - (spacePos - 30) * 0.83;
                    else if (spacePos < 90) spaceY = 10 + (spacePos - 60) * 0.83;
                    else spaceY = 35 + (spacePos - 90) * 0.5;

                    const spaceBeatsValue = Math.max(1.1, Math.min(99.9, 100 - (spacePos * 0.7) - (subIdNum % 8))).toFixed(1);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {/* Runtime Card */}
                        <div className="bg-[#0D0D0D] border border-zinc-800/80 rounded-[24px] p-6 group hover:border-orange-500/40 transition-all duration-700 relative overflow-hidden shadow-xl">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock size={60} strokeWidth={1} className="text-orange-500" />
                          </div>

                          <div className="flex items-center gap-2 text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-6 relative z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                            <span>Time Performance</span>
                          </div>

                          <div className="flex items-end gap-4 mb-8 relative z-10">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-5xl font-black text-white tracking-tighter leading-none" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{timeValue}</span>
                              <span className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1">ms</span>
                            </div>
                            <div className="h-10 w-px bg-zinc-800/60 mx-1"></div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em] mb-1">Beats</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-3xl font-black text-orange-400 tracking-tighter leading-none">{timeBeatsValue}</span>
                                <span className="text-lg font-black text-orange-400/40">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="relative h-24 w-full mt-2 group/graph">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                              <defs>
                                <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.01" />
                                </linearGradient>
                              </defs>
                              <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                                d="M0,40 C10,38 20,35 30,10 C40,5 50,25 60,30 C70,35 80,38 90,39 L100,40 L0,40 Z"
                                fill="url(#timeGradient)"
                                stroke="none"
                              />
                              <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d="M0,40 C10,38 20,35 30,10 C40,5 50,25 60,30 C70,35 80,38 90,39 L100,40"
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                              />
                              <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="2,2" />
                              <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="2,2" />
                            </svg>

                            <div
                              className="absolute -translate-x-1/2 -translate-y-1/2 group/marker transition-all duration-1000 ease-in-out"
                              style={{ left: `${timePos}%`, top: `${(timeY / 40) * 100}%` }}
                            >
                              <div className="relative">
                                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,1)] z-10 relative border-2 border-[#0D0D0D]"></div>
                                <div className="absolute -inset-1.5 bg-orange-500/20 rounded-full animate-ping"></div>

                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-100 scale-90 group-hover/marker:scale-100 transition-transform duration-300">
                                  <div className="px-2 py-1 bg-orange-500 rounded-lg shadow-2xl flex items-center gap-1.5 border border-orange-400/50">
                                    <span className="text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider">You</span>
                                    <div className="w-px h-2.5 bg-black/20"></div>
                                    <span className="text-[9px] font-black text-[#0A0A0A] uppercase">{timeValue}ms</span>
                                  </div>
                                  <div className="w-px h-3 bg-orange-500 mx-auto mt-0.5"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between mt-4 px-1 border-t border-zinc-800/40 pt-3 opacity-50">
                            <span className="text-[8px] font-black text-zinc-500" style={{ fontFamily: '"JetBrains Mono", monospace' }}>0ms</span>
                            <span className="text-[8px] font-black text-zinc-500" style={{ fontFamily: '"JetBrains Mono", monospace' }}>100ms</span>
                            <span className="text-[8px] font-black text-zinc-500" style={{ fontFamily: '"JetBrains Mono", monospace' }}>200ms+</span>
                          </div>
                        </div>

                        {/* Memory Card */}
                        <div className="bg-[#0D0D0D] border border-zinc-800/80 rounded-[24px] p-6 group hover:border-[#f69520]/40 transition-all duration-700 relative overflow-hidden shadow-xl">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <HardDrive size={60} strokeWidth={1} className="text-[#f69520]" />
                          </div>

                          <div className="flex items-center gap-2 text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-6 relative z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#f69520] shadow-[0_0_10px_rgba(246,149,32,0.8)]"></div>
                            <span>Space Efficiency</span>
                          </div>

                          <div className="flex items-end gap-4 mb-8 relative z-10">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-5xl font-black text-white tracking-tighter leading-none" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{memoryMb.toFixed(1)}</span>
                              <span className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1">MB</span>
                            </div>
                            <div className="h-10 w-px bg-zinc-800/60 mx-1"></div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em] mb-1">Beats</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-3xl font-black text-[#f69520] tracking-tighter leading-none">{spaceBeatsValue}</span>
                                <span className="text-lg font-black text-[#f69520]/60">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="relative h-24 w-full mt-2 group/graph">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                              <defs>
                                <linearGradient id="spaceGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f69520" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#f69520" stopOpacity="0.01" />
                                </linearGradient>
                              </defs>
                              <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                                d="M0,40 C10,39 20,38 30,35 C40,30 50,15 60,10 C70,15 80,30 90,35 L100,40 L0,40 Z"
                                fill="url(#spaceGradient)"
                                stroke="none"
                              />
                              <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d="M0,40 C10,39 20,38 30,35 C40,30 50,15 60,10 C70,15 80,30 90,35 L100,40"
                                fill="none"
                                stroke="#f69520"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                              />
                              <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="2,2" />
                              <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="2,2" />
                            </svg>

                            <div
                              className="absolute -translate-x-1/2 -translate-y-1/2 group/marker transition-all duration-1000 ease-in-out"
                              style={{ left: `${spacePos}%`, top: `${(spaceY / 40) * 100}%` }}
                            >
                              <div className="relative">
                                <div className="w-2.5 h-2.5 bg-[#f69520] rounded-full shadow-[0_0_15px_rgba(246,149,32,1)] z-10 relative border-2 border-[#0D0D0D]"></div>
                                <div className="absolute -inset-1.5 bg-[#f69520]/20 rounded-full animate-ping"></div>

                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-100 scale-90 group-hover/marker:scale-100 transition-transform duration-300">
                                  <div className="px-2 py-1 bg-[#f69520] rounded-lg shadow-2xl flex items-center gap-1.5 border border-[#f69520]/50">
                                    <span className="text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider">You</span>
                                    <div className="w-px h-2.5 bg-black/20"></div>
                                    <span className="text-[9px] font-black text-[#0A0A0A] uppercase">{memoryMb.toFixed(1)}MB</span>
                                  </div>
                                  <div className="w-px h-3 bg-[#f69520] mx-auto mt-0.5"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between mt-4 px-1 border-t border-zinc-800/40 pt-3 opacity-50">
                            <span className="text-[8px] font-black text-zinc-500" style={{ fontFamily: '"JetBrains Mono", monospace' }}>30MB</span>
                            <span className="text-[8px] font-black text-zinc-500" style={{ fontFamily: '"JetBrains Mono", monospace' }}>50MB</span>
                            <span className="text-[8px] font-black text-zinc-500" style={{ fontFamily: '"JetBrains Mono", monospace' }}>70MB+</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}


                  {/* Code Block */}
                  <div className="flex flex-col min-h-0 border border-zinc-800/50 rounded-3xl overflow-hidden bg-zinc-950/80 shadow-2xl">
                    <div className="h-12 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center px-6 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500/20 border border-orange-500/40"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
                        </div>
                        <div className="h-4 w-px bg-zinc-800 mx-2"></div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Source Code</span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold uppercase">{selectedSubmission.language}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button className="text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-2 text-[10px] font-bold">
                          <Copy size={14} /> COPY
                        </button>
                      </div>
                    </div>
                    <div className="h-[500px]">
                      <Editor
                        height="100%"
                        language={selectedSubmission.language.toLowerCase()}
                        theme={editorTheme}
                        value={selectedSubmission.sourceCode || "// Source code not available"}
                        beforeMount={registerCustomThemes}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: { top: 20 },
                          fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
                          renderLineHighlight: 'none',
                          scrollbar: {
                            vertical: 'hidden',
                            horizontal: 'hidden'
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Zen Mode Overlay */}
          <AnimatePresence>
            {isZenMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-[#0F0F0F] flex flex-col"
              >
                <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#141414]">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold text-zinc-200">Zen Mode</h2>
                    <div className="h-4 w-px bg-zinc-800"></div>
                    <span className="text-xs text-zinc-500 italic">Press ESC to exit</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 gap-3">
                      <Type size={14} className="text-zinc-500" />
                      <button onClick={() => setEditorFontSize(prev => Math.max(8, prev - 1))} className="text-zinc-400 hover:text-zinc-200 font-bold">-</button>
                      <span className="text-xs font-bold text-zinc-300 min-w-[24px] text-center">{editorFontSize}</span>
                      <button onClick={() => setEditorFontSize(prev => Math.min(32, prev + 1))} className="text-zinc-400 hover:text-zinc-200 font-bold">+</button>
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
                  <Editor
                    height="100%"
                    defaultLanguage="java"
                    theme={editorTheme}
                    beforeMount={registerCustomThemes}
                    value={`public class Example1 {
    public static void main(String[] args) {
        Outer1 instance1 = new Outer1();
        Outer1.Inner1 instance2 = instance1.new Inner1();
        instance2.method3();
    }
}`}
                    options={{
                      minimap: { enabled: true },
                      fontSize: editorFontSize + 2,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      readOnly: true,
                      padding: { top: 32 },
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {/* Interaction & Navigation Bar (Matches screenshot) */}
      <div className="h-11 border-t border-zinc-800 bg-[#0A0A0A] flex items-center justify-between px-4 shrink-0 transition-all duration-300 relative z-[100]">
        <div /> {/* Placeholder for left side alignment */}

        {/* Right: Navigation */}
        <div className="flex items-center gap-4">

          <div className="flex items-center gap-1">
            <button
              onClick={onPrevProblem}
              className="p-1 px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all"
              title="Previous Problem"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={onNextProblem}
              className="p-1 px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all"
              title="Next Problem"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <ImageOverlay
        src={overlayImage}
        isOpen={!!overlayImage}
        onClose={() => setOverlayImage(null)}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

function Tab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors relative h-full",
        active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}
