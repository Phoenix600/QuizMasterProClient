import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Layers, Trophy, Clock, AlertCircle, Search, Code, BookOpen
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
import { AdminModals } from '../admin/AdminModals';
import { AdminDashboard } from '../../features/codegraph/components/Admin/AdminDashboard';

interface AdminViewProps {
  adminView: 'hierarchy' | 'quizzes' | 'questions' | 'questionBank' | 'leaderboard' | 'logs' | 'bans' | 'problems' | 'contests';
  setAdminView: (val: 'hierarchy' | 'quizzes' | 'questions' | 'questionBank' | 'leaderboard' | 'logs' | 'bans' | 'problems' | 'contests') => void;
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
              <h4 className="text-2xl font-black text-white">{confirmModal.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={confirmModal.onCancel}
                className="py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
              >
                Cancel ({Math.ceil(timeLeft)}s)
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-red-500/20"
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
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tight">
              {adminView === 'problems' ? 'Problem Authoring' :
               adminView === 'contests' ? 'Contest Management' :
               adminView === 'questionBank' ? 'Question Pool' : 'Courses & Curriculum'}
            </h2>
            <p className="text-gray-400 font-medium">
              {adminView === 'hierarchy' ? 'Manage your library of courses and learning materials.' :
               adminView === 'leaderboard' ? 'View all student quiz submissions and rankings.' :
               adminView === 'logs' ? 'Trace user login history, IP addresses, and devices.' :
               adminView === 'bans' ? 'Track integrity violations and manage student bans.' :
               adminView === 'problems' ? 'Create and manage complex coding challenges.' :
               adminView === 'contests' ? 'Organize and schedule competitive programming events.' :
               adminView === 'questionBank' ? `Question Pool for Chapter: ${props.adminSelectedChapter?.title || 'Recursion'}` :
               `Select Questions for Quiz: ${props.adminSelectedQuiz?.title || 'Not Selected'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {['questions', 'problems', 'contests', 'questionBank', 'leaderboard', 'logs', 'bans'].includes(adminView) && (
            <button 
              onClick={() => setAdminView('hierarchy')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 border border-white/5 uppercase tracking-widest"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          
          <div className="flex items-center bg-[#1a1a1a] border border-white/5 rounded-[1.25rem] p-1.5 gap-1 shadow-2xl">
            <button
              onClick={() => setAdminView('hierarchy')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                adminView === 'hierarchy' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Layers size={14} />
              Courses
            </button>
            <button
              onClick={() => setAdminView('problems')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                adminView === 'problems' ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'text-gray-500 hover:text-gray-300 border-transparent'
              }`}
            >
              <Code size={14} />
              Problems
            </button>
            <button
              onClick={() => setAdminView('contests')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                adminView === 'contests' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'text-gray-500 hover:text-gray-300 border-transparent'
              }`}
            >
              <Trophy size={14} />
              Contests
            </button>
            
            <div className="w-[1px] h-4 bg-white/5 mx-2" />
            
            <button
              onClick={() => {
                setAdminView('questionBank');
                if (props.adminSelectedChapter) {
                  api.getQuestions(props.adminSelectedChapter._id).then(props.setQuestions);
                } else if (props.adminSelectedCourse) {
                  api.getCourseQuestions(props.adminSelectedCourse._id).then(props.setQuestions);
                }
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                adminView === 'questionBank' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'text-gray-500 hover:text-gray-300 border-transparent'
              }`}
            >
              <Search size={14} />
              Question Pool
            </button>
            <button
              onClick={() => setAdminView('leaderboard')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                adminView === 'leaderboard' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'text-gray-500 hover:text-gray-300 border-transparent'
              }`}
            >
              <Trophy size={14} />
              Leaderboard
            </button>
            <button
              onClick={() => setAdminView('logs')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                adminView === 'logs' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'text-gray-500 hover:text-gray-300 border-transparent'
              }`}
            >
              <Clock size={14} />
              Logs
            </button>
            <button
              onClick={() => setAdminView('bans')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                adminView === 'bans' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'text-gray-500 hover:text-gray-300 border-transparent'
              }`}
            >
              <AlertCircle size={14} />
              Bans
            </button>
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
      ) : adminView === 'questions' ? (
        <QuestionAssignmentHub 
          adminSelectedQuiz={props.adminSelectedQuiz!}
          adminSelectedChapter={props.adminSelectedChapter}
          adminSelectedCourse={props.adminSelectedCourse}
          courses={props.courses}
          courseChapters={props.courseChapters}
          questions={props.questions}
          previewQuestion={previewQuestion}
          setPreviewQuestion={setPreviewQuestion}
          setAdminSelectedQuiz={props.setAdminSelectedQuiz}
          setAdminSelectedCourse={props.setAdminSelectedCourse}
          setAdminSelectedChapter={props.setAdminSelectedChapter}
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
      ) : ['problems', 'contests'].includes(adminView) ? (
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

      {/* FULLSCREEN CODE OVERLAY */}
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
                  <h4 className="text-xl font-black text-white uppercase tracking-widest leading-none">Code Expansion</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">
                    {previewQuestion.programmingLanguage || 'Plain Source'} • REVIEW MODE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCodeFullscreen(false)}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 active:scale-95"
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

            <div className="max-w-7xl mx-auto w-full mt-8 flex items-center justify-between text-gray-600 font-black text-[10px] uppercase tracking-widest px-4">
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
