import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Layers, Trophy, Clock, AlertCircle, Search, Code, BookOpen, PlusCircle, Users
} from 'lucide-react';
import * as api from '../../services/api';
import Editor from '@monaco-editor/react';
import { Course, Chapter, Quiz, Question } from '../../types';

// Sub-components
import { Leaderboard } from '../admin/Leaderboard';
import { LoginLogs } from '../admin/LoginLogs';
import { SuspensionManager } from '../admin/SuspensionManager';
import { HierarchyManager } from '../admin/HierarchyManager';
import { QuestionAssignmentHub } from '../admin/QuestionAssignmentHub';
import { QuestionBankEditor } from '../admin/QuestionBankEditor';
import { BatchManager } from '../admin/BatchManager';
import { UserManager } from '../admin/UserManager';
import { AdminModals } from '../admin/AdminModals';
import { AdminDashboard } from '../../features/codegraph/components/Admin/AdminDashboard';

type AdminTab = 'hierarchy' | 'quizzes' | 'questions' | 'questionBank' | 'leaderboard' | 'logs' | 'bans' | 'problems' | 'contests' | 'batches' | 'users';

interface AdminViewProps {
  adminView: AdminTab;
  setAdminView: (val: AdminTab) => void;
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  chapterQuizzes: Record<string, Quiz[]>;
  adminSelectedCourse: Course | null;
  setAdminSelectedCourse: (val: Course | null) => void;
  adminSelectedChapter: Chapter | null;
  setAdminSelectedChapter: (val: Chapter | null) => void;
  adminSelectedSubFolder: Chapter | null;
  setAdminSelectedSubFolder: (val: Chapter | null) => void;
  adminSelectedQuiz: Quiz | null;
  setAdminSelectedQuiz: (val: Quiz | null) => void;
  expandedCourses: Record<string, boolean>;
  toggleCourseExpansion: (id: string) => void;
  expandedChapters: Record<string, boolean>;
  toggleChapterExpansion: (id: string) => void;
  courseSearch: string;
  setCourseSearch: (val: string) => void;
  showAddCourse: boolean;
  setShowAddCourse: (val: boolean) => void;
  newCourseData: { title: string; description: string };
  setNewCourseData: (val: { title: string; description: string }) => void;
  fetchInitialData: () => void;
  showAddChapter: boolean;
  setShowAddChapter: (val: boolean) => void;
  newChapterData: { title: string; description: string };
  setNewChapterData: (val: { title: string; description: string }) => void;
  fetchChaptersForCourse: (id: string) => void;
  showAddQuiz: boolean;
  setShowAddQuiz: (val: boolean) => void;
  newQuizData: any;
  setNewQuizData: (val: any) => void;
  fetchQuizzesForChapter: (id: string) => void;
  quizQuestionCounts: Record<string, number>;
  questions: Question[];
  setQuestions: (val: Question[]) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (val: string | null) => void;
  newQuestion: Partial<Question>;
  setNewQuestion: (val: Partial<Question>) => void;
  handleAddQuestion: (e: React.FormEvent) => void;
  handleEditClick: (q: Question) => void;
  handleDeleteQuestion: (id: string) => void;
  publishQuiz: (quizId: string, chapterId: string, isPublished?: boolean) => void;
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
  updateToast: (id: number, text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => void;
}

export const AdminView: React.FC<AdminViewProps> = (props) => {
  const { adminView, setAdminView, pushToast, ...hProps } = props;
  const [formError, setFormError] = useState<string>('');
  const [editingQuizData, setEditingQuizData] = useState<any>(null);
  const [editingChapterData, setEditingChapterData] = useState<any>(null);
  const [editingCourseData, setEditingCourseData] = useState<any>(null);
  const [adminSelectedProblemId, setAdminSelectedProblemId] = useState<string | number | undefined>(undefined);
  const [problemInitialContext, setProblemInitialContext] = useState<any>(null);
  
  // Modals / Dropdowns / Local state
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [poolChapterFilter, setPoolChapterFilter] = useState<string>('all');
  const [poolSearch, setPoolSearch] = useState('');
  const [showCourseDrop, setShowCourseDrop] = useState(false);
  const [showChapterDrop, setShowChapterDrop] = useState(false);
  const [isCodeFullscreen, setIsCodeFullscreen] = useState(false);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    countdown?: number;
  } | null>(null);

  const openConfirm = (title: string, message: string, onConfirm: () => void, countdown: number = 8) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
      countdown
    });
  };

  // Keyboard Listener for ESC (Code expansion exit)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCodeFullscreen) {
        setIsCodeFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isCodeFullscreen]);

  const ConfirmModalUI = () => {
    if (!confirmModal) return null;
    const [timeLeft, setTimeLeft] = useState(confirmModal.countdown || 8);
    
    useEffect(() => {
      if (timeLeft <= 0) {
        confirmModal.onCancel();
        return;
      }
      const timer = setInterval(() => setTimeLeft(t => t - 0.1), 100);
      return () => clearInterval(timer);
    }, [timeLeft]);
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          onClick={confirmModal.onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 10, opacity: 0 }}
            className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 h-1 bg-red-500/50 transition-all duration-100" style={{ width: `${(timeLeft / (confirmModal.countdown || 8)) * 100}%` }} />
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-2xl font-bold text-white">{confirmModal.title}</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={confirmModal.onCancel}
                className="py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-semibold rounded-2xl transition-all tracking-wide text-xs"
              >
                Cancel ({Math.ceil(timeLeft)}s)
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-2xl transition-all tracking-wide text-xs shadow-lg shadow-red-500/20"
              >
                Yes, Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <motion.div 
      key="admin"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-12"
    >
      {/* Header section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/5 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wide text-orange-500/80">Command Center</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">
              {adminView === 'problems' ? 'Problem Authoring' :
               adminView === 'contests' ? 'Contest Management' :
               adminView === 'questionBank' ? 'Question Pool' : 
               adminView === 'batches' ? 'Cohort Management' :
               adminView === 'users' ? 'User Directory' : 'Courses & Curriculum'}
            </h2>
            <p className="text-gray-500 font-medium text-sm">
              {adminView === 'hierarchy' ? 'Architect your library of courses and learning materials.' :
               adminView === 'leaderboard' ? 'Live student performance metrics and global rankings.' :
               adminView === 'logs' ? 'Security audit: login history, metadata, and device tracking.' :
               adminView === 'bans' ? 'Integrity management and suspension control center.' :
               adminView === 'problems' ? 'Design and deploy sophisticated algorithmic challenges.' :
               adminView === 'contests' ? 'Orchestrate and monitor high-stakes competitive events.' :
               adminView === 'questionBank' ? `Central Repository for Chapter: ${props.adminSelectedChapter?.title || 'None Selected'}` :
               `Assignment Hub: ${props.adminSelectedQuiz?.title || 'No Quiz Active'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {(['questions', 'problems', 'contests', 'questionBank', 'leaderboard', 'logs', 'bans', 'batches', 'users'] as string[]).includes(adminView) && (
            <button 
              onClick={() => setAdminView('hierarchy')}
              className="px-5 py-3 bg-[#1a1a1a] hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl text-sm font-semibold transition-all flex items-center gap-3 border border-white/5 tracking-normal group shadow-xl active:scale-95"
            >
              <div className="p-1 bg-white/5 rounded-lg group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-colors">
                <ChevronLeft size={14} />
              </div>
              Return
            </button>
          )}
          
          <div className="flex items-center bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-[1.75rem] p-1.5 gap-1 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'hierarchy', label: 'Courses', icon: <Layers size={14} />, activeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              { id: 'problems', label: 'Problems', icon: <Code size={14} />, activeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
              { id: 'contests', label: 'Contests', icon: <Trophy size={14} />, activeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { id: 'batches', label: 'Batches', icon: <PlusCircle size={14} />, activeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
              { id: 'users', label: 'Users', icon: <Users size={14} />, activeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
              { id: 'divider-1', isDivider: true },
              { id: 'questionBank', label: 'Question Pool', icon: <Search size={14} />, activeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={14} />, activeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
              { id: 'logs', label: 'Logs', icon: <Clock size={14} />, activeColor: 'bg-zinc-500/10 text-white border-zinc-500/20' },
              { id: 'bans', label: 'Bans', icon: <AlertCircle size={14} />, activeColor: 'bg-red-500/10 text-red-400 border-red-500/20' },
            ].map((tab) => {
              if (tab.isDivider) return <div key={tab.id} className="w-[1px] h-4 bg-white/5 -mx-[2.5px]" />;
              
              const isActive = adminView === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'questionBank') {
                       if (props.adminSelectedChapter) {
                          api.getQuestions(props.adminSelectedChapter._id).then(props.setQuestions);
                        } else if (props.adminSelectedCourse) {
                          api.getCourseQuestions(props.adminSelectedCourse._id).then(props.setQuestions);
                        }
                    }
                    setAdminView(tab.id as AdminTab);
                  }}
                  className={`relative px-3.5 py-2.5 rounded-2xl text-sm font-semibold tracking-normal transition-all flex items-center gap-2 border group whitespace-nowrap ${
                    isActive 
                      ? `${tab.activeColor} shadow-lg` 
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 border border-current opacity-20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {adminView === 'hierarchy' ? (
        <HierarchyManager 
          {...hProps}
          setAdminView={setAdminView}
          setFormError={setFormError}
          openConfirm={openConfirm}
          pushToast={pushToast}
          updateToast={props.updateToast}
          setEditingCourseData={setEditingCourseData}
          setEditingChapterData={setEditingChapterData}
          setEditingQuizData={setEditingQuizData}
          setAdminSelectedProblemId={setAdminSelectedProblemId}
          setProblemInitialContext={setProblemInitialContext}
        />
      ) : adminView === 'leaderboard' ? (
        <Leaderboard pushToast={pushToast} openConfirm={openConfirm} />
      ) : adminView === 'logs' ? (
        <LoginLogs pushToast={pushToast} openConfirm={openConfirm} />
      ) : adminView === 'bans' ? (
        <SuspensionManager pushToast={pushToast} />
      ) : adminView === 'batches' ? (
        <BatchManager pushToast={pushToast} />
      ) : adminView === 'users' ? (
        <UserManager pushToast={pushToast} />
      ) : adminView === 'questions' ? (
        <QuestionAssignmentHub 
          adminSelectedQuiz={props.adminSelectedQuiz!}
          adminSelectedChapter={props.adminSelectedChapter}
          adminSelectedCourse={props.adminSelectedCourse}
          adminSelectedSubFolder={props.adminSelectedSubFolder}
          courses={props.courses}
          courseChapters={props.courseChapters}
          questions={props.questions}
          previewQuestion={previewQuestion}
          setPreviewQuestion={setPreviewQuestion}
          setAdminSelectedQuiz={props.setAdminSelectedQuiz}
          setAdminSelectedCourse={props.setAdminSelectedCourse}
          setAdminSelectedChapter={props.setAdminSelectedChapter}
          setAdminSelectedSubFolder={props.setAdminSelectedSubFolder}
          setAdminView={props.setAdminView}
          setQuestions={props.setQuestions}
          fetchQuizzesForChapter={props.fetchQuizzesForChapter}
          pushToast={pushToast}
          updateToast={props.updateToast}
          publishQuiz={props.publishQuiz}
          setIsCodeFullscreen={setIsCodeFullscreen}
        />
      ) : adminView === 'questionBank' ? (
        <QuestionBankEditor 
          {...hProps}
          adminSelectedCourse={props.adminSelectedCourse}
          setAdminSelectedCourse={props.setAdminSelectedCourse}
          adminSelectedChapter={props.adminSelectedChapter}
          setAdminSelectedChapter={props.setAdminSelectedChapter}
          adminSelectedSubFolder={props.adminSelectedSubFolder}
          setAdminSelectedSubFolder={props.setAdminSelectedSubFolder}
          editingQuestionId={props.editingQuestionId}
          setEditingQuestionId={props.setEditingQuestionId}
          newQuestion={props.newQuestion}
          setNewQuestion={props.setNewQuestion}
          handleAddQuestion={props.handleAddQuestion}
          handleEditClick={props.handleEditClick}
          handleDeleteQuestion={props.handleDeleteQuestion}
          questions={props.questions}
          poolSearch={poolSearch}
          setPoolSearch={setPoolSearch}
          poolChapterFilter={poolChapterFilter}
          setPoolChapterFilter={setPoolChapterFilter}
          showCourseDrop={showCourseDrop}
          setShowCourseDrop={setShowCourseDrop}
          showChapterDrop={showChapterDrop}
          setShowChapterDrop={setShowChapterDrop}
          openConfirm={openConfirm}
          isCodeFullscreen={isCodeFullscreen}
          setIsCodeFullscreen={setIsCodeFullscreen}
        />
      ) : (['problems', 'contests'] as string[]).includes(adminView) ? (
        <AdminDashboard 
          initialTab={adminView as 'problems' | 'contests'}
          onBack={() => {
            setAdminView('hierarchy');
            setAdminSelectedProblemId(undefined);
            setProblemInitialContext(null);
          }}
          initialProblemId={adminSelectedProblemId}
          initialContext={problemInitialContext}
          onSuccess={() => {
            if (props.adminSelectedCourse?._id) {
              props.fetchChaptersForCourse(props.adminSelectedCourse._id);
            }
          }}
        />
      ) : null}

      <AdminModals 
        {...hProps}
        formError={formError}
        setFormError={setFormError}
        editingCourseData={editingCourseData}
        setEditingCourseData={setEditingCourseData}
        editingChapterData={editingChapterData}
        setEditingChapterData={setEditingChapterData}
        editingQuizData={editingQuizData}
        setEditingQuizData={setEditingQuizData}
        pushToast={pushToast}
        updateToast={props.updateToast}
      />

      <ConfirmModalUI />

      {/* Fullscreen code overlay */}
      <AnimatePresence>
        {isCodeFullscreen && previewQuestion?.codeSnippet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-[#0a0a0a]/95 backdrop-blur-2xl flex flex-col p-8"
            onClick={() => setIsCodeFullscreen(false)}
          >
            <div 
              className="flex flex-col h-full w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto w-full shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/10">
                  <Code size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white tracking-tight leading-none">Code Expansion</h4>
                  <p className="text-[10px] text-zinc-500 font-bold tracking-tight mt-2">
                    {previewQuestion.programmingLanguage || 'Plain Source'} • Review Mode
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCodeFullscreen(false)}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-bold tracking-widest rounded-2xl transition-all border border-white/5 active:scale-95"
              >
                Exit View
              </button>
            </div>
            
            <div className="flex-1 max-w-7xl mx-auto w-full border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
              <Editor
                height="100%"
                language={(previewQuestion.programmingLanguage || 'javascript').toLowerCase()}
                theme="vs-dark"
                value={previewQuestion.codeSnippet}
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  fontSize: 16,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 30, bottom: 30 },
                  renderLineHighlight: 'all',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  cursorBlinking: 'smooth',
                  smoothScrolling: true
                }}
              />
            </div>

            <div className="max-w-7xl mx-auto w-full mt-8 flex items-center justify-between text-zinc-600 font-bold text-[10px] tracking-tight px-4">
              <span>Lines: {previewQuestion.codeSnippet.split('\n').length}</span>
              <span className="text-orange-500/50">ProQuizMaster Code Revision Environment</span>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
