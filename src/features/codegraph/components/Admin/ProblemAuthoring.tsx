import React, { useState, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { Problem, TestCase } from '../../types';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Save, ArrowLeft, Loader2, Search, Filter, Layers, Plus, FileCode, CheckCircle2, XCircle, PanelLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { PanelImperativeHandle } from 'react-resizable-panels';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type AuthoringMetadata = Omit<Partial<Problem>, 'tags'> & { tags: any };

interface ProblemAuthoringProps {
  onBack: () => void;
  problemId?: string | number;
  initialContext?: {
    courseId?: string | number;
    chapterId?: string | number;
    subChapterId?: string | number;
  };
  onProblemSelect?: (id: string | number) => void;
  onCreateNew?: () => void;
  onSuccess?: () => void;
}

export const ProblemAuthoring: React.FC<ProblemAuthoringProps> = ({ onBack, problemId, initialContext, onProblemSelect, onCreateNew, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState<Partial<TestCase>[]>([]);
  const [footer, setFooter] = useState('');
  const [metadata, setMetadata] = useState<AuthoringMetadata>({
    title: '',
    difficulty: 'MEDIUM',
    tags: '',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    image: '',
    imageScale: 40,
    driverCode: '',
    solutionTemplate: '',
    editorialVideoUrl: '',
    editorialPdfUrl: '',
    quizQuestion: '',
    quizOptions: '',
    quizCorrectAnswer: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | number | null>(null);
  const [selectedSubChapterId, setSelectedSubChapterId] = useState<string | number | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'editorial'>('description');
  const [activeEditorialType, setActiveEditorialType] = useState<'BRUTE' | 'BETTER' | 'OPTIMAL'>('OPTIMAL');
  
  // Sidebar states
  const [sidebarProblems, setSidebarProblems] = useState<any[]>([]);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showAllProblems, setShowAllProblems] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sidebarRef = React.useRef<PanelImperativeHandle>(null);
 
  const toggleSidebar = () => {
    if (sidebarRef.current) {
      setIsAnimating(true);
      if (isSidebarCollapsed) {
        sidebarRef.current.expand();
      } else {
        sidebarRef.current.collapse();
      }
      // Disable animation class after the transition finishes
      setTimeout(() => setIsAnimating(false), 400);
    }
  };

  useEffect(() => {
    fetchCourses();
    if (problemId) {
      fetchProblem();
    } else if (initialContext) {
      if (initialContext.courseId) setSelectedCourseId(initialContext.courseId);
      if (initialContext.chapterId) setSelectedChapterId(initialContext.chapterId);
      if (initialContext.subChapterId) setSelectedSubChapterId(initialContext.subChapterId);
      // Auto-enable "Filter by Related" if context exists
      setShowAllProblems(false);
    }
  }, [problemId, initialContext]);

  const fetchSidebarProblems = async () => {
    try {
      setIsSidebarLoading(true);
      const filters: any = {};
      if (!showAllProblems) {
        if (selectedSubChapterId) filters.chapterId = selectedSubChapterId;
        else if (selectedChapterId) filters.chapterId = selectedChapterId;
        else if (selectedCourseId) filters.courseId = selectedCourseId;
      }
      
      const response = await api.getProblems(0, 100, filters);
      setSidebarProblems(response.content || []);
    } catch (err) {
      console.error('Failed to fetch sidebar problems', err);
    } finally {
      setIsSidebarLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarProblems();
  }, [selectedCourseId, selectedChapterId, selectedSubChapterId, showAllProblems]);

  const fetchCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const fetchChapters = async (courseId: string | number) => {
    try {
      const data = await api.getChapters(courseId);
      setChapters(data);
    } catch (err) {
      console.error('Failed to fetch chapters', err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
       fetchChapters(selectedCourseId);
    } else {
       setChapters([]);
    }
  }, [selectedCourseId]);

  const fetchProblem = async () => {
    try {
      setIsLoading(true);
      const [problem, cases] = await Promise.all([
        api.getProblem(problemId!),
        api.admin.getAllTestCases(problemId!)
      ]);
      
      setMetadata(problem);
      setDescription(problem.description);
      setFooter(problem.footer || '');
      setTestCases(cases);

      // Restore Hierarchy State
      if (problem.chapterId) {
        const chapter = problem.chapterId;
        const courseId = chapter.courseId;
        
        setSelectedCourseId(courseId);
        
        // Fetch chapters immediately to avoid waiting for useEffect
        const chaptersData = await api.getChapters(courseId);
        setChapters(chaptersData);
        
        if (chapter.parentId) {
          // It's a sub-chapter
          setSelectedChapterId(chapter.parentId._id || chapter.parentId.id || chapter.parentId);
          setSelectedSubChapterId(chapter._id || chapter.id);
        } else {
          // It's a main chapter
          setSelectedChapterId(chapter._id || chapter.id);
          setSelectedSubChapterId(null);
        }
      }
    } catch (err) {
      toast.error('Failed to load problem details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (problemId) {
      fetchProblem();
    } else {
      setMetadata({
        title: '',
        difficulty: 'MEDIUM',
        tags: [],
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        active: true
      });
      setDescription('');
      setFooter('');
      setTestCases([]);
      setIsLoading(false);
    }
  }, [problemId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const chapterId = selectedSubChapterId || selectedChapterId;
      
      let processedTags = metadata.tags;
      if (typeof processedTags === 'string') {
        processedTags = processedTags.split(',').map(t => t.trim()).filter(t => t !== "");
      } else if (Array.isArray(processedTags)) {
        processedTags = processedTags.map(t => typeof t === 'string' ? t : t.name);
      }

      const problemData = {
        ...metadata,
        description,
        footer,
        chapterId,
        testCases,
        tags: processedTags
      };

      if (problemId) {
        const updated = await api.admin.updateProblem(problemId, problemData);
        setMetadata(updated);
        toast.success('Problem updated successfully');
        if (onSuccess) onSuccess();
      } else {
        await api.admin.createProblem(problemData);
        toast.success('Problem created successfully');
        if (onSuccess) onSuccess();
        onBack();
      }
    } catch (err) {
      toast.error('Failed to save problem');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = [];
    if (selectedCourseId) {
      const course = courses.find(c => c._id === selectedCourseId || c.id === selectedCourseId);
      if (course) crumbs.push({ id: selectedCourseId, title: course.title });
    }
    if (selectedChapterId) {
      const chapter = chapters.find(c => c._id === selectedChapterId || c.id === selectedChapterId);
      if (chapter) crumbs.push({ id: selectedChapterId, title: chapter.title });
    }
    if (selectedSubChapterId) {
       const sub = chapters.find(c => c._id === selectedSubChapterId || c.id === selectedSubChapterId);
       if (sub) crumbs.push({ id: selectedSubChapterId, title: sub.title });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-2 rounded-lg transition-all",
              isSidebarCollapsed ? "text-orange-500 bg-orange-500/10" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
            )}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-3">
            {problemId ? 'Edit Problem' : 'New Problem'}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-2 border-l border-zinc-800 ml-1 pl-4 h-4">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    <span className="text-[10px] text-zinc-500 font-bold hover:text-orange-400 transition-colors cursor-default">
                      {crumb.title}
                    </span>
                    {idx < breadcrumbs.length - 1 && (
                      <span className="text-zinc-700 text-[8px] mt-0.5">/</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                isSaving 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 active:scale-95"
            )}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {problemId ? 'Update' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal">
          {/* SIDEBAR PANEL */}
          <Panel 
            id="sidebar-panel"
            panelRef={sidebarRef}
            defaultSize={20} 
            minSize={15} 
            collapsible
            collapsedSize={0}
            onResize={(size: any) => {
              // Sync state with panel width for correct icon mapping
              const isCollapsed = typeof size === 'number' ? size === 0 : size.asPercentage === 0;
              if (isCollapsed) setIsSidebarCollapsed(true);
              else if (isSidebarCollapsed) setIsSidebarCollapsed(false);
            }}
            className={cn(
              "transition-colors duration-300",
              isAnimating && "sidebar-animate"
            )}
          >
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.div 
                  className="h-full flex flex-col bg-zinc-900/30 border-r border-zinc-800/50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
                      <input
                        type="text"
                        placeholder="Search library..."
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-zinc-200 outline-none focus:ring-1 focus:ring-orange-500/30 transition-all placeholder-zinc-700"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setShowAllProblems(!showAllProblems)}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-all",
                          showAllProblems 
                            ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200" 
                            : "bg-orange-500/10 text-orange-400 border border-orange-500/10"
                        )}
                      >
                        <Filter size={10} />
                        {showAllProblems ? 'Showing All' : 'Related Only'}
                      </button>
                      <button 
                        onClick={onCreateNew}
                        className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
                        title="New Problem"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 space-y-1">
                    {isSidebarLoading ? (
                      <div className="flex flex-col items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Syncing Problems...</span>
                      </div>
                    ) : sidebarProblems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 gap-2 opacity-30">
                        <Layers size={20} className="text-zinc-600" />
                        <span className="text-[10px] text-zinc-600 font-bold">Empty Library</span>
                      </div>
                    ) : (
                      sidebarProblems
                        .filter(p => p.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
                        .map((p) => {
                          const isActive = p._id === problemId;
                          return (
                            <button
                              key={p._id}
                              onClick={() => {
                                 if (p._id !== problemId && onProblemSelect) {
                                   onProblemSelect(p._id);
                                   // Auto-hide on selection
                                   if (sidebarRef.current) sidebarRef.current.collapse();
                                 }
                              }}
                              className={cn(
                                "w-full flex flex-col gap-1 p-2.5 rounded-xl transition-all text-left group",
                                isActive 
                                  ? "bg-orange-500/10 border border-orange-500/20" 
                                  : "hover:bg-zinc-800/50 border border-transparent"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                 <span className={cn(
                                   "text-[11px] font-bold leading-tight transition-colors",
                                   isActive ? "text-orange-400" : "text-zinc-400 group-hover:text-zinc-200"
                                 )}>
                                   {p.title}
                                 </span>
                                 {p.active ? (
                                   <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                                 ) : (
                                   <XCircle size={10} className="text-zinc-700 shrink-0" />
                                 )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest",
                                  p.difficulty === 'EASY' ? "text-emerald-500" :
                                  p.difficulty === 'MEDIUM' ? "text-orange-500" : "text-rose-500"
                                )}>
                                  {p.difficulty}
                                </span>
                                <span className="text-[8px] text-zinc-600 font-mono">#{p._id.toString().slice(-4)}</span>
                              </div>
                            </button>
                          );
                        })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          <Separator 
            className={cn(
              "bg-zinc-800 w-px transition-opacity duration-300",
              isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            )} 
          />

          <Panel id="editor-panel" defaultSize={40} minSize={30} className="transition-all duration-300 ease-in-out">
            <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950/20">
              <Editor 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                activeEditorialType={activeEditorialType}
                setActiveEditorialType={setActiveEditorialType}
                description={description}
                onDescriptionChange={setDescription}
                testCases={testCases}
                onTestCasesChange={setTestCases}
                footer={footer}
                onFooterChange={setFooter}
                metadata={metadata}
                onMetadataChange={setMetadata}
                courses={courses}
                selectedCourseId={selectedCourseId as any}
                onCourseChange={(id) => {
                  setSelectedCourseId(id as any);
                  setSelectedChapterId(null);
                  setSelectedSubChapterId(null);
                }}
                chapters={chapters}
                selectedChapterId={selectedChapterId as any}
                onChapterChange={(id) => {
                  setSelectedChapterId(id as any);
                  setSelectedSubChapterId(null);
                }}
                selectedSubChapterId={selectedSubChapterId as any}
                onSubChapterChange={setSelectedSubChapterId as any}
              />
            </div>
          </Panel>

          <Separator className="bg-zinc-800 w-px" />

          <Panel id="preview-panel" defaultSize={40} minSize={30} className="transition-all duration-300 ease-in-out">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <Preview 
                activeTab={activeTab}
                activeEditorialType={activeEditorialType}
                setActiveEditorialType={setActiveEditorialType}
                metadata={metadata}
                description={description}
                footer={footer}
                testCases={testCases}
                onTestCasesChange={setTestCases}
              />
            </div>
          </Panel>
        </Group>
      </div>
      <style>{`
        .sidebar-animate {
          transition: flex 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

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
