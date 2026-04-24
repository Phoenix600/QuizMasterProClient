import Sidebar from './components/Sidebar.tsx';
import ContentArea from './components/ContentArea.tsx';
import EditorArea from './components/EditorArea.tsx';
import ProfileView from './components/ProfileView.tsx';
import ProfileDashboard from './components/ProfileDashboard.tsx';
import CreateCourseModal from './components/CreateCourseModal.tsx';
import { AdminDashboard } from './components/Admin/AdminDashboard.tsx';
import { Trophy, PanelLeftClose, PanelLeftOpen, BookOpen, Code2, ShieldAlert, Download, LogOut, ChevronLeft, RefreshCw, Layers, Loader2 } from 'lucide-react';
import { ExecutionEngineStatus } from './components/ExecutionEngineStatus.tsx';
import { DownloadCenter } from './components/DownloadCenter.tsx';
import { ContestLanding } from './components/ContestLanding.tsx';
import { ContestWorkspace } from './components/ContestWorkspace.tsx';
import React from 'react';
import { api } from './lib/api.ts';
import { Toaster, toast } from 'sonner';
import { ContestSummary } from './components/ContestSummary.tsx';
import { cn } from './lib/utils.ts';
import {
  Group,
  Panel,
  Separator
} from 'react-resizable-panels';

import { DUMMY_USER } from './constants.ts';
import { UserProfile } from './types.ts';

const CustomResizeHandle = ({ direction }: { direction: 'horizontal' | 'vertical' }) => (
  <Separator className={cn(
    "relative transition-all duration-300 group z-50",
    direction === 'horizontal' ? "w-1 hover:w-1.5 cursor-col-resize" : "h-1 hover:h-1.5 cursor-row-resize",
    "bg-transparent flex items-center justify-center p-0.5"
  )}>
    <div className={cn(
      "bg-zinc-800/30 transition-colors group-hover:bg-orange-500/50",
      direction === 'horizontal' ? "w-[1px] h-full" : "h-[1px] w-full"
    )} />
  </Separator>
);

export function CodegraphWorkspace({ onBack, user, initialProblemId }: { onBack: () => void, user?: UserProfile, initialProblemId?: string }) {
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(true);
  const [currentView, setCurrentView] = React.useState<'main' | 'profile' | 'profile-dashboard' | 'admin'>('main');
  const [adminTab, setAdminTab] = React.useState<'problems' | 'contests'>('problems');
  const [editingProblemId, setEditingProblemId] = React.useState<string | undefined>(undefined);
  const [userProfile, setUserProfile] = React.useState(user || DUMMY_USER);
  const [isCourseModalOpen, setIsCourseModalOpen] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [isStudyMode, setIsStudyMode] = React.useState(false);
  const [isDownloadCenterOpen, setIsDownloadCenterOpen] = React.useState(false);
  const [problems, setProblems] = React.useState<any[]>([]);
  const mainContainerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [chapters, setChapters] = React.useState<any[]>([]);
  const [solvedProblemIds, setSolvedProblemIds] = React.useState<Set<string>>(new Set());
  const [isCurriculumLoading, setIsCurriculumLoading] = React.useState(true);
  const [selectedProblemData, setSelectedProblemData] = React.useState<any>(null);
  const [selectedTestCases, setSelectedTestCases] = React.useState<any[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = React.useState<any[]>([]);
  const [isProblemLoading, setIsProblemLoading] = React.useState(false);

  const [selectedProblemId, setSelectedProblemId] = React.useState<string | null>(null);
  const [selectedContestId, setSelectedContestId] = React.useState<string | null>(null);
  const [isContestActive, setIsContestActive] = React.useState(false);
  const [contestResult, setContestResult] = React.useState<any | null>(null);

  const [courses, setCourses] = React.useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
  const prevProblemIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!mainContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    observer.observe(mainContainerRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarVisible(false);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarVisible(prev => !prev);
      }
    };

    const handleOpenModal = () => setIsCourseModalOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-course-modal', handleOpenModal);

    // Refresh solved state and sequence when a submission is successful
    const handleSubmissionSuccess = (e: any) => {
      const sub = e.detail;
      if (sub && sub.status === 'ACCEPTED') {
        setRefreshTrigger(prev => prev + 1);
      }
    };
    window.addEventListener('submission-success', handleSubmissionSuccess);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-course-modal', handleOpenModal);
      window.removeEventListener('submission-success', handleSubmissionSuccess);
    };
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    
    const fetchSequentialProblems = async () => {
      try {
        if (problems.length === 0) setIsCurriculumLoading(true);
        // Decouple Metadata (Node) from Execution State (Spring)
        const coursesPromise = api.getCourses();
        const springSolvedPromise = api.getSolvedProblems().catch(err => {
          console.warn("Could not fetch solved problems from Spring", err);
          return [] as string[];
        });
        const nodeSolvedPromise = api.getSolvedFromNode().catch(err => {
          console.warn("Could not fetch solved problems from Node", err);
          return [] as string[];
        });
        const profilePromise = api.getProfile().catch(err => {
          console.warn("Could not fetch fresh profile", err);
          return user || DUMMY_USER;
        });
        const resumeIdPromise = api.getResumeProblemId().catch(err => {
          console.warn("Could not fetch resume ID", err);
          return null;
        });

        const [fetchedCourses, springSolved, nodeSolved, resumeId, freshProfile] = await Promise.all([
          coursesPromise,
          springSolvedPromise,
          nodeSolvedPromise,
          resumeIdPromise,
          profilePromise
        ]);
  
        if (controller.signal.aborted) return;
        
        setCourses(fetchedCourses);
        setUserProfile(freshProfile);

        // Merge solving data from both sources
        const combinedSolved = new Set<string>([
          ...(springSolved || []),
          ...(nodeSolved || [])
        ]);
        setSolvedProblemIds(combinedSolved);
  
        const courseIdToLoad = selectedCourseId || (fetchedCourses.length > 0 ? (fetchedCourses[0]._id || fetchedCourses[0].id) : null);
        
        if (courseIdToLoad) {
          if (!selectedCourseId) setSelectedCourseId(courseIdToLoad);
          
          const chaptersData = await api.getChapters(courseIdToLoad);
          if (controller.signal.aborted) return;
          
          // Normalize Chapters and Problems to use id instead of _id
          const normalizedChapters = chaptersData.map((ch: any) => {
            const normalize = (c: any) => ({
              ...c,
              id: c._id || c.id,
              problems: c.problems?.map((p: any) => ({ ...p, id: p._id || p.id })),
              subChapters: c.subChapters?.map(normalize)
            });
            return normalize(ch);
          });

          setChapters(normalizedChapters);
  
          // Flatten problems from chapters in order
          const flattened: any[] = [];
          const extractProblems = (chapterList: any[]) => {
            chapterList.forEach(ch => {
              if (ch.problems?.length) flattened.push(...ch.problems);
              if (ch.subChapters?.length) extractProblems(ch.subChapters);
            });
          };
          
          extractProblems(normalizedChapters);
          setProblems(flattened);
          
          if (flattened.length > 0 && selectedProblemId === null) {
            // Prioritize initialProblemId, then resumeId, fallback to first problem
            if (initialProblemId && initialProblemId !== 'undefined' && flattened.some(p => String(p.id) === String(initialProblemId))) {
                setSelectedProblemId(String(initialProblemId));
            } else if (resumeId && resumeId !== 'undefined' && flattened.some(p => String(p.id) === String(resumeId))) {
              setSelectedProblemId(String(resumeId));
            } else if (flattened[0] && flattened[0].id) {
              setSelectedProblemId(String(flattened[0].id));
            }
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch sequential problems:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCurriculumLoading(false);
        }
      }
    };
    fetchSequentialProblems();
    return () => controller.abort();
  }, [refreshTrigger, selectedCourseId]);

  // Fetch Problem Details when ID changes
  React.useEffect(() => {
    if (!selectedProblemId) return;
    
    // ONLY clear state if the problem ID actually changed (prevents flicker/reset on submission refresh)
    const isNewProblem = prevProblemIdRef.current !== String(selectedProblemId);
    if (isNewProblem) {
      setSelectedProblemData(null);
      setSelectedTestCases([]);
      setSelectedSubmissions([]);
      prevProblemIdRef.current = String(selectedProblemId);
    }
    
    const controller = new AbortController();
    const fetchProblemDetails = async () => {
      try {
        if (!selectedProblemData) setIsProblemLoading(true);
        const problemPromise = api.getProblem(selectedProblemId);
        const historyPromise = api.getProblemSubmissions(selectedProblemId).catch(err => {
          console.warn("Could not fetch submissions (Execution Engine offline)", err);
          return { content: [] };
        });

        const [problem, history] = await Promise.all([
          problemPromise,
          historyPromise
        ]);
        
        if (controller.signal.aborted) return;
        
        setSelectedProblemData(problem);
        setSelectedTestCases(problem.testCases || []);
        setSelectedSubmissions(history.content || []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch problem details:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsProblemLoading(false);
        }
      }
    };
    fetchProblemDetails();
    return () => controller.abort();
  }, [selectedProblemId, refreshTrigger]);

  const handlePrevProblem = () => {
    if (!Array.isArray(problems) || problems.length === 0) return;
    const currentIndex = problems.findIndex(p => String(p.id) === String(selectedProblemId));
    if (currentIndex > 0) {
      const nextProb = problems[currentIndex - 1];
      toast.info(`Moving to: ${nextProb.title}`);
      setSelectedProblemId(nextProb.id);
    }
  };

  const handleNextProblem = () => {
    if (!Array.isArray(problems) || problems.length === 0) return;
    const currentIndex = problems.findIndex(p => String(p.id) === String(selectedProblemId));
    if (currentIndex < problems.length - 1) {
      const nextProb = problems[currentIndex + 1];
      toast.info(`Moving to: ${nextProb.title}`);
      setSelectedProblemId(nextProb.id);
    }
  };

  if (currentView === 'admin') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#0A0A0A]">
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
        <AdminDashboard
          initialProblemId={editingProblemId}
          initialTab={adminTab}
          onBack={() => {
            setCurrentView('main');
            setEditingProblemId(undefined);
            setAdminTab('problems');
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      </div>
    );
  }

  if (currentView === 'profile-dashboard') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#0A0A0A]">
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
        <ProfileDashboard
          user={userProfile}
          onBack={() => setCurrentView('main')}
          onEdit={() => setCurrentView('profile')}
        />
      </div>
    );
  }

  if (currentView === 'profile') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#0A0A0A]">
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
        <ProfileView
          user={userProfile}
          onSave={async (updatedUser) => {
            try {
              const savedUser = await api.updateProfile(updatedUser);
              setUserProfile(savedUser);
              toast.success('Profile updated successfully!');
              setCurrentView('profile-dashboard');
            } catch (err) {
              toast.error('Failed to update profile. Please try again.');
            }
          }}
          onBack={() => setCurrentView('profile-dashboard')}
        />
      </div>
    );
  }

  if (isContestActive && selectedContestId) {
    return (
      <div className="flex h-screen bg-[#0A0A0A] text-zinc-300 font-sans overflow-hidden">
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
        <ContestWorkspace 
          contestId={selectedContestId}
          onFinish={(result) => {
            setIsContestActive(false);
            setContestResult(result);
          }}
        />
      </div>
    );
  }

  if (contestResult && selectedContestId) {
    return (
      <div className="flex h-screen bg-[#0A0A0A] text-zinc-300 font-sans overflow-hidden">
         <Toaster theme="dark" position="bottom-right" richColors closeButton />
         <ContestSummary 
           result={contestResult}
           onClose={() => {
             setContestResult(null);
             setSelectedContestId(null);
           }}
         />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-300 font-sans overflow-hidden">
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
      <CreateCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
      <DownloadCenter
        isOpen={isDownloadCenterOpen}
        onClose={() => setIsDownloadCenterOpen(false)}
      />

      <Sidebar
        isVisible={isSidebarVisible}
        onToggle={() => setIsSidebarVisible(!isSidebarVisible)}
        onProfileClick={() => setCurrentView('profile-dashboard')}
        onSelectProblem={(id) => {
          setSelectedProblemId(id);
          setSelectedContestId(null);
          setIsContestActive(false);
          setContestResult(null);
        }}
        onSelectContest={(id) => {
          setSelectedContestId(id);
          setSelectedProblemId(null);
          setIsContestActive(false);
          setContestResult(null);
        }}
        selectedProblemId={selectedProblemId}
        chapters={chapters}
        solvedProblemIds={solvedProblemIds}
        loading={isCurriculumLoading}
        onAddProblem={() => {
          setEditingProblemId(undefined);
          setAdminTab('problems');
          setCurrentView('admin');
        }}
        onEditProblem={(id) => {
          setEditingProblemId(id);
          setAdminTab('problems');
          setCurrentView('admin');
        }}
        onOpen={() => setIsSidebarVisible(true)}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={(id) => {
          setSelectedCourseId(id);
          setSelectedProblemId(null);
        }}
        user={userProfile}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#0A0A0A] shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarVisible && (
              <button
                onClick={() => setIsSidebarVisible(true)}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-all"
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <button
               onClick={onBack}
               className="p-1.5 text-orange-500 hover:text-orange-400 transition-colors rounded-md hover:bg-orange-500/10 flex items-center gap-1.5"
               title="Exit Workspace"
            >
               <ChevronLeft size={18} />
               <span className="text-[10px] font-bold tracking-tight">Exit</span>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <ExecutionEngineStatus onOpenDownloadCenter={() => setIsDownloadCenterOpen(true)} />
            </div>
          </div>
        </header>

        {/* Main Content Split */}
        <div ref={mainContainerRef} className="flex-1 overflow-hidden bg-[#0A0A0A] flex flex-col">
          {isCurriculumLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="p-4 bg-orange-500/10 rounded-full">
                    <Loader2 size={32} className="text-orange-500 animate-spin" />
                </div>
                <div className="space-y-1 text-center">
                    <p className="text-sm font-semibold text-zinc-100">Synchronizing Course Curriculum</p>
                    <p className="text-[10px] text-zinc-500 tracking-tight font-semibold">Fetching secure challenge data...</p>
                </div>
            </div>
          ) : selectedContestId && !isContestActive ? (
            <div className="flex-1 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
               <ContestLanding 
                 contestId={selectedContestId}
                 onStart={() => setIsContestActive(true)}
                 onBack={() => setSelectedContestId(null)}
               />
            </div>
          ) : problems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full" />
                    <div className="relative p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] shadow-2xl">
                        <Layers size={48} className="text-orange-500/80" />
                    </div>
                </div>
                
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Curriculum Empty</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                            This course doesn't have any challenges published yet. Please contact your instructor or check back later.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col items-center gap-3">
                        <button 
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            className="group flex items-center gap-2 px-8 py-3 bg-zinc-100 hover:bg-white rounded-full text-black text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
                        >
                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                            Refresh Curriculum
                        </button>
                    </div>
                </div>
            </div>
          ) : selectedProblemId && containerWidth > 0 ? (
            isStudyMode ? (
              <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300">
                <ContentArea 
                  key={`content-study-${selectedProblemId}`}
                  problemId={selectedProblemId} 
                  problemData={selectedProblemData}
                  isStudyMode={isStudyMode}
                  onToggleStudyMode={() => setIsStudyMode(!isStudyMode)}
                  onPrevProblem={handlePrevProblem}
                  onNextProblem={handleNextProblem}
                />
              </div>
            ) : (
              <Group
                key={containerWidth > 0 ? "measured" : "initial"}
                id="main-group"
                orientation="horizontal"
                defaultLayout={{ "problem-panel": 45, "editor-panel": 55 }}
                onLayoutChanged={(layout) => {
                  const values = Array.isArray(layout) ? layout : Object.values(layout);
                  if (!values || typeof values[0] !== 'number' || typeof values[1] !== 'number' || containerWidth === 0) return;
                  
                  const problemWidth = (values[0] * containerWidth) / 100;
                  const editorWidth = (values[1] * containerWidth) / 100;
                  console.log(`Layout Settled: Problem=${problemWidth.toFixed(0)}px (${values[0].toFixed(1)}%), Editor=${editorWidth.toFixed(0)}px (${values[1].toFixed(1)}%)`);
                }}
              >
                <Panel 
                  id="problem-panel" 
                  defaultSize={45} 
                  minSize={250} 
                  maxSize={containerWidth - 300}
                  collapsible={false}
                  className="overflow-hidden border-r border-zinc-800/50"
                >
                  <ContentArea 
                    key={`content-standard-${selectedProblemId}`}
                    problemId={selectedProblemId} 
                    problemData={selectedProblemData}
                    isStudyMode={isStudyMode}
                    onToggleStudyMode={() => setIsStudyMode(!isStudyMode)}
                    onPrevProblem={handlePrevProblem}
                    onNextProblem={handleNextProblem}
                  />
                </Panel>

                <CustomResizeHandle direction="horizontal" />

                <Panel 
                  id="editor-panel" 
                  defaultSize={55} 
                  minSize={300}
                  collapsible={false}
                  className="overflow-hidden"
                >
                  <EditorArea 
                    key={`editor-${selectedProblemId}`}
                    problemId={selectedProblemId} 
                    problemData={selectedProblemData}
                    testCases={selectedTestCases}
                    initialSubmissions={selectedSubmissions}
                    onRefreshHistory={() => setRefreshTrigger(prev => prev + 1)}
                  />
                </Panel>
              </Group>
            )
          ) : null}
        </div>
      </main>

      <style>{`
        /* Global Text Selection */
        ::selection {
          background: rgba(234, 88, 12, 0.3); /* orange-600 with opacity */
          color: #fff;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
        
        /* PDF Viewer Styles */
        .react-pdf__Page {
          margin: 0 auto;
        }
        .react-pdf__Document {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        canvas {
          max-width: 100%;
          height: auto !important;
        }
      `}</style>
    </div>
  );
}
