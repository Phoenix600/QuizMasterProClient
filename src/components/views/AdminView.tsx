import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import { 
  ChevronLeft, ChevronRight, Plus, Search, Code, Trash2, Layers, ChevronDown, Trophy, 
  AlertCircle, CheckCircle2, Save, PlusCircle, Edit, Users, Clock, Medal,
  RefreshCw, Filter, BookOpen, Laptop, Smartphone, Tablet, Eye, Maximize2, Minimize2, X,
  Settings, ChevronUp
} from 'lucide-react';
import * as api from '../../services/api';
import { Course, Chapter, Quiz, Question, GlobalLeaderboardEntry } from '../../types';

interface AdminViewProps {
  adminView: 'hierarchy' | 'quizzes' | 'questions' | 'questionBank' | 'leaderboard' | 'logs' | 'bans';
  setAdminView: (val: 'hierarchy' | 'quizzes' | 'questions' | 'questionBank' | 'leaderboard' | 'logs' | 'bans') => void;
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  chapterQuizzes: Record<string, Quiz[]>;
  adminSelectedCourse: Course | null;
  setAdminSelectedCourse: (val: Course | null) => void;
  adminSelectedChapter: Chapter | null;
  setAdminSelectedChapter: (val: Chapter | null) => void;
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
  newQuizData: {
    title: string;
    description: string;
    questionCount: number;
    passingScore: number;
    timeLimit: number;
  };
  setNewQuizData: (val: {
    title: string;
    description: string;
    questionCount: number;
    passingScore: number;
    timeLimit: number;
  }) => void;
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

export const AdminView: React.FC<AdminViewProps> = ({
  adminView, setAdminView, courses, courseChapters, chapterQuizzes,
  adminSelectedCourse, setAdminSelectedCourse,
  adminSelectedChapter, setAdminSelectedChapter,
  adminSelectedQuiz, setAdminSelectedQuiz,
  expandedCourses, toggleCourseExpansion,
  expandedChapters, toggleChapterExpansion,
  courseSearch, setCourseSearch,
  showAddCourse, setShowAddCourse, newCourseData, setNewCourseData, fetchInitialData,
  showAddChapter, setShowAddChapter, newChapterData, setNewChapterData, fetchChaptersForCourse,
  showAddQuiz, setShowAddQuiz, newQuizData, setNewQuizData, fetchQuizzesForChapter,
  quizQuestionCounts,
  questions, setQuestions,
  editingQuestionId, setEditingQuestionId,
  newQuestion, setNewQuestion,
  handleAddQuestion, handleEditClick, handleDeleteQuestion,
  publishQuiz,
  pushToast,
  updateToast
}) => {
  const [formError, setFormError] = useState<string>('');
  const [editingQuizData, setEditingQuizData] = useState<{
    quizId: string;
    chapterId: string;
    title: string;
    description: string;
    questionCount: number;
    passingScore: number;
    timeLimit: number;
  } | null>(null);

  // Leaderboard state
  const [lbEntries, setLbEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbSearch, setLbSearch] = useState('');
  const [lbQuizFilter, setLbQuizFilter] = useState('');
  const [lbModeFilter, setLbModeFilter] = useState<string>(''); // 'test', 'training', or ''
  const [lbDateFrom, setLbDateFrom] = useState('');
  const [lbDateTo, setLbDateTo] = useState('');
  const [lbSort, setLbSort] = useState<'merit' | 'date'>('merit');
  const [lbPage, setLbPage] = useState(1);
  const LB_PAGE_SIZE = 10;

  const [chapterSearch, setChapterSearch] = useState('');
  const [quizSearch, setQuizSearch] = useState('');

  const [editingChapterData, setEditingChapterData] = useState<{
    chapterId: string;
    courseId: string;
    title: string;
    description: string;
  } | null>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    countdown?: number;
  } | null>(null);
  const [courseHierarchyTab, setCourseHierarchyTab] = useState<'quizzes' | 'pool'>('quizzes');
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [poolChapterFilter, setPoolChapterFilter] = useState<string>('all');
  const [poolSearch, setPoolSearch] = useState('');

  const [showCourseDrop, setShowCourseDrop] = useState(false);
  const [showChapterDrop, setShowChapterDrop] = useState(false);

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
            {/* Auto-cancel progress bar */}
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
                Yes, Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const loadLeaderboard = async () => {
    setLbLoading(true);
    try {
      const data = await api.getAllLeaderboard(lbModeFilter);
      setLbEntries(data);
    } catch {
      // silent
    } finally {
      setLbLoading(false);
    }
  };

  useEffect(() => {
    if (adminView === 'leaderboard') {
      loadLeaderboard();
    }
  }, [adminView, lbModeFilter]);

  const handleDeleteRecord = async (resultId: string) => {
    openConfirm('Delete Record', 'Are you sure you want to delete this leaderboard entry? This action is permanent.', async () => {
      try {
        await api.deleteLeaderboardRecord(resultId);
        setLbEntries(prev => prev.filter(e => e.resultId !== resultId));
        pushToast('Record deleted', 'success');
      } catch (e) {
        pushToast('Delete failed', 'error');
      }
    });
  };

  // Reset to page 1 whenever any filter or sort changes
  useEffect(() => { setLbPage(1); }, [lbSearch, lbQuizFilter, lbDateFrom, lbDateTo, lbSort]);

  const filteredLBEntries = React.useMemo(() => {
    return lbEntries.filter(e => {
      const matchSearch = e.userName.toLowerCase().includes(lbSearch.toLowerCase()) ||
        e.userEmail.toLowerCase().includes(lbSearch.toLowerCase());
      const matchQuiz = !lbQuizFilter || e.quizTitle === lbQuizFilter;
      const entryDate = new Date(e.createdAt);
      const matchFrom = !lbDateFrom || entryDate >= new Date(lbDateFrom);
      const matchTo = !lbDateTo || entryDate <= new Date(lbDateTo + 'T23:59:59');
      return matchSearch && matchQuiz && matchFrom && matchTo;
    }).sort((a, b) => {
      if (lbSort === 'merit') {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [lbEntries, lbSearch, lbQuizFilter, lbDateFrom, lbDateTo, lbSort]);

  const handleDeleteAllRecords = async () => {
    const isFiltered = lbSearch || lbQuizFilter || lbDateFrom || lbDateTo;
    const targetCount = filteredLBEntries.length;
    
    if (targetCount === 0) return;

    const msg = isFiltered 
      ? `Are you sure you want to delete ALL ${targetCount} filtered records? This CANNOT be undone.`
      : `Are you sure you want to delete ALL ${lbEntries.length} records in the system? THIS WILL CLEAR THE ENTIRE LEADERBOARD.`;

    openConfirm('Bulk Clear Leaderboard', msg, async () => {
      try {
        const idsToDelete = isFiltered ? filteredLBEntries.map(e => e.resultId) : [];
        await api.deleteLeaderboardBulk(idsToDelete);
        
        if (isFiltered) {
          setLbEntries(prev => prev.filter(e => !idsToDelete.includes(e.resultId)));
        } else {
          setLbEntries([]);
        }
        pushToast('Records deleted successfully', 'success');
      } catch (e) {
        pushToast('Action failed', 'error');
      }
    }, 15); // Longer countdown for mass actions
  };

  // User Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [expandedIpLogId, setExpandedIpLogId] = useState<string | null>(null);
  const [logsSearch, setLogsSearch] = useState('');
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [isCodeFullscreen, setIsCodeFullscreen] = useState(false);

  const loadLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const data = await api.getLoginLogs(page, 10, logsSearch);
      setLogs(data.logs);
      setLogsTotalPages(data.pages);
      setLogsPage(data.page);
    } catch (e) {
      pushToast('Failed to load logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (adminView === 'logs') {
      loadLogs(1); // Reset to page 1 on search
    }
  }, [adminView, logsSearch]);

  const handleDeleteLog = async (id: string) => {
    openConfirm('Delete Login Log', 'Are you sure you want to delete this specific login session? This action is permanent.', async () => {
      try {
        await api.deleteLoginLog(id);
        loadLogs(logsPage);
        pushToast('Log deleted', 'success');
      } catch (e) {
        pushToast('Delete failed', 'error');
      }
    });
  };

  const handleDeleteSelectedLogs = async () => {
    const isFiltered = logsSearch.trim() !== '';
    const msg = isFiltered 
      ? `Are you sure you want to delete ALL logs matching "${logsSearch}"? This action cannot be reversed.`
      : `Are you sure you want to delete ALL login logs in the system? THIS WILL CLEAR ALL AUDIT DATA.`;
    
    openConfirm('Bulk Clear Logs', msg, async () => {
      try {
        await api.deleteLoginLogsBulk([], logsSearch);
        setLogsSearch('');
        loadLogs(1);
        pushToast('Logs cleared successfully', 'success');
      } catch (e) {
        pushToast('Bulk delete failed', 'error');
      }
    }, 12);
  };

  const toggleLogSelection = (id: string) => {
    setSelectedLogs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const closeEditCourseModal = () => setEditingCourseData(null);

  const closeEditQuizModal = () => {
    setEditingQuizData(null);
    setFormError('');
  };

  const [editingCourseData, setEditingCourseData] = useState<{
    courseId: string;
    title: string;
    description: string;
  } | null>(null);

  // Ban Logs State
  const [banLogs, setBanLogs] = useState<any[]>([]);
  const [banLogsLoading, setBanLogsLoading] = useState(false);
  const [banLogsPage, setBanLogsPage] = useState(1);
  const [banLogsTotalPages, setBanLogsTotalPages] = useState(1);
  const [banLogsSearch, setBanLogsSearch] = useState('');

  const loadBanLogs = async (page = 1) => {
    setBanLogsLoading(true);
    try {
      const data = await api.getBanLogs(page, 10, banLogsSearch);
      setBanLogs(data.logs);
      setBanLogsTotalPages(data.pages);
      setBanLogsPage(data.page);
    } catch (e) {
      pushToast('Failed to load ban logs', 'error');
    } finally {
      setBanLogsLoading(false);
    }
  };

  useEffect(() => {
    if (adminView === 'bans') {
      loadBanLogs(1);
    }
  }, [adminView, banLogsSearch]);

  const handleUnbanUser = async (userId: string) => {
    try {
      await api.unbanUser(userId);
      pushToast('User unbanned successfully', 'success');
      loadBanLogs(banLogsPage);
    } catch (e) {
      pushToast('Failed to unban user', 'error');
    }
  };

  return (
    <motion.div 
      key="admin"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-12"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight">
            {adminView === 'hierarchy' ? 'Manage Hierarchy' : 
             adminView === 'leaderboard' ? 'Leaderboard' : 
             adminView === 'logs' ? 'User Login Logs' : 
             adminView === 'bans' ? 'Suspensions & Bans' :
             'Manage Questions'}
          </h2>
          <p className="text-gray-400">
            {adminView === 'hierarchy' 
              ? 'Manage your courses, chapters, and quizzes.'
              : adminView === 'leaderboard'
              ? 'View all student quiz submissions and rankings.'
              : adminView === 'logs'
              ? 'Trace user login history, IP addresses, and devices.'
              : adminView === 'bans'
              ? 'Track integrity violations and manage student bans.'
              : adminView === 'questionBank'
              ? `Question Pool for Chapter: ${adminSelectedChapter?.title || 'Not Selected'}`
              : `Select Questions for Quiz: ${adminSelectedQuiz?.title || 'Not Selected'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {adminView === 'questions' && (
            <button 
              onClick={() => setAdminView('hierarchy')}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => setAdminView('hierarchy')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                adminView === 'hierarchy' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Layers size={14} />
              Hierarchy
            </button>
            <button
              onClick={() => setAdminView('leaderboard')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                adminView === 'leaderboard' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Trophy size={14} />
              Leaderboard
            </button>
            <button
              onClick={() => setAdminView('logs')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                adminView === 'logs' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Clock size={14} />
              User Logs
            </button>
            <button
              onClick={() => setAdminView('bans')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                adminView === 'bans' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <AlertCircle size={14} />
              Suspensions
            </button>
          </div>
        </div>
      </div>

      {adminView === 'hierarchy' ? (
        <div className="space-y-8">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Courses</h3>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses
                .filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                .map((course) => (
                  <div
                    key={course._id}
                    onClick={() => {
                      setAdminSelectedCourse(course);
                      setAdminSelectedChapter(null);
                      setAdminSelectedQuiz(null);
                      fetchChaptersForCourse(course._id);
                    }}
                    className={`relative p-5 rounded-2xl border transition-all group cursor-pointer ${
                      adminSelectedCourse?._id === course._id
                        ? 'bg-orange-500/10 border-orange-500/50'
                        : 'bg-white/5 border-white/5 hover:border-white/15'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setAdminSelectedCourse(course);
                        setAdminSelectedChapter(null);
                        setAdminSelectedQuiz(null);
                        fetchChaptersForCourse(course._id);
                      }
                    }}
                  >
                    {/* Live / Draft badge */}
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      course.isPublished ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {course.isPublished ? 'Live' : 'Draft'}
                    </span>

                    <div className="flex items-start gap-3 min-w-0 pr-14">
                      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                        adminSelectedCourse?._id === course._id
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/10 text-gray-500'
                      }`}>
                        <Code size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{course.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{course.description || 'No description yet'}</p>
                      </div>
                    </div>

                    {/* Hover actions row */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {/* Live toggle */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const toastId = pushToast(course.isPublished ? 'Taking offline...' : 'Publishing...', 'loading', 0);
                          try {
                            const updated = await api.updateCourse(course._id, { isPublished: !course.isPublished });
                            updateToast(toastId, updated.isPublished ? 'Course is now Live' : 'Course set to Draft', 'success', 2500);
                            fetchInitialData();
                            if (adminSelectedCourse?._id === course._id) setAdminSelectedCourse(updated);
                          } catch (err: any) {
                            updateToast(toastId, err.response?.data?.message || 'Failed', 'error', 3000);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          course.isPublished
                            ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400 hover:bg-green-500/10 hover:text-green-400'
                        }`}
                        title={course.isPublished ? 'Take offline' : 'Publish course'}
                      >
                        <CheckCircle2 size={12} />
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourseData({ courseId: course._id, title: course.title, description: course.description });
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                        title="Edit course"
                      >
                        <Edit size={12} />
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirm(
                            'Delete Course',
                            'This will permanently delete this course and all its underlying data. This action is irreversible.',
                            async () => {
                              await api.deleteCourse(course._id);
                              if (adminSelectedCourse?._id === course._id) setAdminSelectedCourse(null);
                              fetchInitialData();
                            }
                          );
                        }}
                        className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

              {/* Dotted "create course" card */}
              {!courseSearch && (
                <button
                  onClick={() => setShowAddCourse(true)}
                  className="p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-3 text-gray-600 hover:text-orange-400 min-h-[110px] group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-orange-500/10 flex items-center justify-center transition-all">
                    <Plus size={18} />
                  </div>
                  <span className="text-xs font-bold">New Course</span>
                </button>
              )}
            </div>

            {courses.filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase())).length === 0 && courseSearch && (
              <div className="text-center py-6 text-gray-600 text-sm italic">
                No courses found.
              </div>
            )}
          </div>

          <div className="space-y-6">
            {adminSelectedCourse ? (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/10 transition-all duration-700" />
                  <div className="relative flex items-center gap-6">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 ring-1 ring-orange-500/20">
                      <BookOpen size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white tracking-tight">{adminSelectedCourse.title}</h3>
                      <p className="text-gray-500 text-sm font-medium">{adminSelectedCourse.description}</p>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setEditingCourseData({ courseId: adminSelectedCourse._id, title: adminSelectedCourse.title, description: adminSelectedCourse.description })}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-white/5"
                    >
                      <Edit size={16} />
                      Edit Course
                    </button>
                    <button
                      onClick={async () => {
                        const newStatus = !adminSelectedCourse.isPublished;
                        const toastId = pushToast(newStatus ? 'Publishing course...' : 'Unpublishing...', 'loading', 0);
                        try {
                          const updated = await api.updateCourse(adminSelectedCourse._id, { isPublished: newStatus });
                          updateToast(toastId, `Course ${newStatus ? 'published' : 'unpublished'}`, 'success', 2500);
                          setAdminSelectedCourse(updated);
                          fetchInitialData();
                        } catch (err: any) {
                          updateToast(toastId, 'Failed to update status', 'error', 3000);
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                        adminSelectedCourse.isPublished
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                          : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      <CheckCircle2 size={16} />
              {adminSelectedCourse.isPublished ? 'Published' : 'Publish Course'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Panel: Chapters (40%) */}
                  <div className="lg:col-span-5 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Chapters</h4>
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                      <input
                        type="text"
                        placeholder="Search chapters..."
                        value={chapterSearch}
                        onChange={(e) => setChapterSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar mb-4">
                      {(courseChapters[adminSelectedCourse._id] || [])
                        .filter(ch => ch.title.toLowerCase().includes(chapterSearch.toLowerCase()))
                        .map((chapter) => (
                        <div
                          key={chapter._id}
                          onClick={() => {
                            setAdminSelectedChapter(chapter);
                            setAdminSelectedQuiz(null);
                            if (courseHierarchyTab === 'pool') {
                              setAdminView('questionBank');
                              api.getQuestions(chapter._id).then(setQuestions);
                            } else {
                              fetchQuizzesForChapter(chapter._id);
                            }
                          }}
                          className={`relative p-4 rounded-xl border cursor-pointer transition-all group ${
                            adminSelectedChapter?._id === chapter._id
                              ? 'bg-blue-500/10 border-blue-500/40'
                              : 'bg-white/5 border-white/5 hover:border-white/15 shadow-lg'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 pr-8">
                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                              adminSelectedChapter?._id === chapter._id
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-gray-500'
                            }`}>
                              <Layers size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-white truncate">{chapter.title}</p>
                              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{chapter.description || 'No description'}</p>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdminSelectedChapter(chapter);
                                setAdminView('questionBank');
                                api.getQuestions(chapter._id).then(setQuestions);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all border border-orange-500/10"
                            >
                              <Code size={10} />
                              Question Pool
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChapterData({ 
                                  chapterId: chapter._id, 
                                  courseId: adminSelectedCourse._id,
                                  title: chapter.title, 
                                  description: chapter.description 
                                });
                                setFormError('');
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                            >
                              <Edit size={10} />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openConfirm(
                                  'Delete Chapter',
                                  'Deleting this chapter will also remove all quizzes and questions within it. This action is irreversible.',
                                  async () => {
                                    await api.deleteChapter(chapter._id);
                                    if (adminSelectedChapter?._id === chapter._id) {
                                      setAdminSelectedChapter(null);
                                      setAdminSelectedQuiz(null);
                                    }
                                    fetchChaptersForCourse(adminSelectedCourse._id);
                                  }
                                );
                              }}
                              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowAddChapter(true)}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-blue-400 group flex-shrink-0"
                    >
                      <Plus size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">New Chapter</span>
                    </button>
                  </div>

                  {/* Right Panel: Quizzes or Questions Pool (60%) */}
                  <div className="lg:col-span-7 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
                        <button
                          onClick={() => setCourseHierarchyTab('quizzes')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            courseHierarchyTab === 'quizzes' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Trophy size={14} />
                          Quizzes
                        </button>
                        <button
                          onClick={() => {
                            setCourseHierarchyTab('pool');
                            api.getCourseQuestions(adminSelectedCourse._id).then(setQuestions);
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            courseHierarchyTab === 'pool' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Layers size={14} />
                          Question Bank
                        </button>
                      </div>
                      
                      {courseHierarchyTab === 'pool' && (
                        <button 
                          onClick={() => {
                            setAdminView('questionBank');
                            // If a chapter is selected, make sure its questions are loaded
                            if (adminSelectedChapter) {
                              api.getQuestions(adminSelectedChapter._id).then(setQuestions);
                            }
                          }}
                          className="px-4 py-2 bg-orange-500/10 text-orange-400 rounded-xl text-xs font-bold border border-orange-500/10 flex items-center gap-2 hover:bg-orange-500/20 transition-all"
                        >
                          <PlusCircle size={14} />
                          Add Question
                        </button>
                      )}
                    </div>

                    {courseHierarchyTab === 'quizzes' ? (
                      <>
                        {!adminSelectedChapter ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 mb-4">
                              <Trophy size={24} />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Select a chapter from the left to view or create quizzes.</p>
                          </div>
                        ) : (
                          <>
                            <div className="relative mb-4">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                              <input
                                type="text"
                                placeholder="Search quizzes..."
                                value={quizSearch}
                                onChange={(e) => setQuizSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                              />
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar mb-4">
                              {(chapterQuizzes[adminSelectedChapter._id] || [])
                                .filter(qz => qz.title.toLowerCase().includes(quizSearch.toLowerCase()))
                                .map((quiz) => (
                                <div
                                  key={quiz._id}
                                  onClick={() => {
                                    setAdminSelectedQuiz(quiz);
                                    setAdminView('questions');
                                    api.getQuestions(adminSelectedChapter._id).then(setQuestions);
                                  }}
                                  className={`relative p-4 rounded-xl border cursor-pointer transition-all group ${
                                    adminSelectedQuiz?._id === quiz._id
                                      ? 'bg-amber-500/10 border-amber-500/40'
                                      : 'bg-white/5 border-white/5 hover:border-white/15 shadow-lg'
                                  }`}
                                >
                                  <span className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                    quiz.isPublished ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                                  }`}>
                                    {quiz.isPublished ? 'Live' : 'Draft'}
                                  </span>

                                  <div className="flex items-start gap-3 min-w-0 pr-12">
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                      adminSelectedQuiz?._id === quiz._id
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-white/10 text-gray-500'
                                    }`}>
                                      <Trophy size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-white truncate">{quiz.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-hidden">
                                        <span className="text-[10px] text-gray-500">{quiz.timeLimit}m</span>
                                        <span className="text-[10px] text-gray-600">•</span>
                                        <span className="text-[10px] text-gray-500">{quiz.passingScore}% pass</span>
                                        <span className="text-[10px] text-gray-600">•</span>
                                        <span className={`text-[10px] ${quizQuestionCounts[quiz._id] === quiz.questionCount ? 'text-gray-500' : 'text-red-400 font-bold'}`}>
                                          {quizQuestionCounts[quiz._id] || 0}/{quiz.questionCount} Qs
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingQuizData({
                                          quizId: quiz._id,
                                          chapterId: adminSelectedChapter._id,
                                          title: quiz.title,
                                          description: quiz.description || '',
                                          questionCount: quiz.questionCount || quizQuestionCounts[quiz._id] || 1,
                                          passingScore: quiz.passingScore,
                                          timeLimit: quiz.timeLimit,
                                        });
                                        setFormError('');
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                                    >
                                      <Edit size={10} />
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        publishQuiz(quiz._id, adminSelectedChapter._id, !quiz.isPublished);
                                      }}
                                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                        quiz.isPublished
                                          ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                                          : 'bg-yellow-500/10 text-yellow-400 hover:bg-green-500/10 hover:text-green-400'
                                      }`}
                                    >
                                      <CheckCircle2 size={10} />
                                      {quiz.isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openConfirm(
                                          'Delete Quiz',
                                          'This quiz and all associated results will be permanently deleted.',
                                          async () => {
                                            await api.deleteQuiz(quiz._id);
                                            fetchQuizzesForChapter(adminSelectedChapter._id);
                                          }
                                        );
                                      }}
                                      className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                    >
                                      <Trash2 size={10} />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => setShowAddQuiz(true)}
                              className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-orange-400 group flex-shrink-0"
                            >
                              <Plus size={16} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">New Quiz</span>
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input
                              type="text"
                              placeholder="Search pool questions..."
                              value={poolSearch}
                              onChange={(e) => setPoolSearch(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                            />
                          </div>
                          <select
                            value={poolChapterFilter}
                            onChange={(e) => setPoolChapterFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-gray-400 focus:outline-none focus:border-orange-500"
                          >
                            <option value="all">All Chapters</option>
                            {(courseChapters[adminSelectedCourse._id] || []).map(ch => (
                              <option key={ch._id} value={ch._id}>{ch.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                          {questions
                            .filter(q => q.questionText.toLowerCase().includes(poolSearch.toLowerCase()))
                            .filter(q => poolChapterFilter === 'all' || q.chapterId === poolChapterFilter)
                            .map((q, idx) => {
                              const chapterTitle = (courseChapters[adminSelectedCourse._id] || []).find(ch => ch._id === q.chapterId)?.title || 'N/A';
                              return (
                                <div key={q._id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/15 transition-all">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white truncate max-w-md">{q.questionText}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded">{chapterTitle}</span>
                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{q.options.length} Options • {q.numberOfCorrectAnswers} Correct</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setAdminSelectedChapter((courseChapters[adminSelectedCourse._id] || []).find(ch => ch._id === q.chapterId) || null);
                                        handleEditClick(q);
                                        setAdminView('questionBank');
                                      }}
                                      className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button 
                                      onClick={() => openConfirm('Delete Question', 'Permanently delete from pool?', () => handleDeleteQuestion(q._id))}
                                      className="p-2 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          }
                          {questions.length === 0 && (
                            <div className="text-center py-12 text-gray-600 text-xs italic">
                              No questions in the pool for this course.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-600">
                  <Layers size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">No Course Selected</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Select a course card above to manage its chapters and quizzes.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : adminView === 'leaderboard' ? (
        <div className="space-y-6">
          {/* Stats bar */}
          {lbEntries.length > 0 && (() => {
            const total = lbEntries.length;
            const passed = lbEntries.filter(e => e.isPassed).length;
            const avgPct = Math.round(lbEntries.reduce((s, e) => s + e.percentage, 0) / total);
            return (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Attempts', value: total, icon: <Users size={18} />, color: 'text-blue-400' },
                  { label: 'Avg Score', value: `${avgPct}%`, icon: <Medal size={18} />, color: 'text-amber-400' },
                  { label: 'Pass Rate', value: `${Math.round((passed / total) * 100)}%`, icon: <CheckCircle2 size={18} />, color: 'text-green-400' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>{icon}</div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{label}</p>
                      <p className="text-2xl font-black text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Filters + refresh */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
              <input
                type="text"
                placeholder="Search by student name..."
                value={lbSearch}
                onChange={(e) => setLbSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <div className="relative min-w-[150px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={15} />
              <select
                value={lbQuizFilter}
                onChange={(e) => setLbQuizFilter(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
              >
                <option value="">All Quizzes</option>
                {[...new Map(lbEntries.map(e => [e.quizTitle, e.quizTitle])).values()].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="relative min-w-[150px]">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={15} />
              <select
                value={lbModeFilter}
                onChange={(e) => setLbModeFilter(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
              >
                <option value="">All Modes</option>
                <option value="test">Test Mode</option>
                <option value="training">Training Mode</option>
              </select>
            </div>
            <input
              type="date"
              value={lbDateFrom}
              onChange={(e) => setLbDateFrom(e.target.value)}
              title="From date"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
            />
            <input
              type="date"
              value={lbDateTo}
              onChange={(e) => setLbDateTo(e.target.value)}
              title="To date"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
            />
            <button
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setLbDateFrom(today);
                setLbDateTo(today);
              }}
              className="px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            >
              Today
            </button>
            {(lbSearch || lbQuizFilter || lbDateFrom || lbDateTo) && (
              <button
                onClick={() => { setLbSearch(''); setLbQuizFilter(''); setLbDateFrom(''); setLbDateTo(''); }}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Clear
              </button>
            )}
            <button
              onClick={loadLeaderboard}
              disabled={lbLoading}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={lbLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {lbEntries.length > 0 && adminView === 'leaderboard' && (
              <button
                onClick={handleDeleteAllRecords}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              >
                <Trash2 size={14} />
                {(lbSearch || lbQuizFilter || lbDateFrom || lbDateTo) ? `Delete Filtered (${filteredLBEntries.length})` : 'Clear All'}
              </button>
            )}
          </div>

          {/* Sort mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sort by:</span>
            <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
              <button
                onClick={() => setLbSort('merit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  lbSort === 'merit' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Medal size={12} />
                Merit (Score → Earliest Submit)
              </button>
              <button
                onClick={() => setLbSort('date')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  lbSort === 'date' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Clock size={12} />
                Latest Submitted
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden">
            {lbLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
                <RefreshCw size={20} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (() => {
              if (filteredLBEntries.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600">
                      <Trophy size={28} />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {lbEntries.length === 0 ? 'No quiz submissions yet.' : 'No results match the current filters.'}
                    </p>
                  </div>
                );
              }

              const totalPages = Math.max(1, Math.ceil(filteredLBEntries.length / LB_PAGE_SIZE));
              const safePage = Math.min(lbPage, totalPages);
              const paginated = filteredLBEntries.slice((safePage - 1) * LB_PAGE_SIZE, safePage * LB_PAGE_SIZE);

              return (
                <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['#', 'Student', 'Quiz', 'Score', '% Score', 'Status', 'Mode', 'Time', 'Date', 'Action'].map(h => (
                          <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((entry, idx) => {
                        const globalIdx = (safePage - 1) * LB_PAGE_SIZE + idx;
                        const mins = Math.floor(entry.timeTaken / 60);
                        const secs = entry.timeTaken % 60;
                        const timeStr = mins > 0
                          ? `${mins}m ${secs}s`
                          : `${secs}s`;
                        const d = new Date(entry.createdAt);
                        const date = d.toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        });
                        const time = d.toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit', second: '2-digit',
                        });
                        return (
                          <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                            <td className="px-5 py-4">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                globalIdx === 0 ? 'bg-amber-500/20 text-amber-400' :
                                globalIdx === 1 ? 'bg-gray-400/10 text-gray-300' :
                                globalIdx === 2 ? 'bg-orange-700/20 text-orange-500' :
                                'bg-white/5 text-gray-500'
                              }`}>{globalIdx + 1}</span>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-bold text-white">{entry.userName}</p>
                              <p className="text-[11px] text-gray-500">{entry.userEmail}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-gray-300 font-medium max-w-[180px] truncate">{entry.quizTitle}</p>
                            </td>
                            <td className="px-5 py-4 text-gray-300 font-bold">{entry.score}/{entry.totalQuestions}</td>
                            <td className="px-5 py-4 font-black text-white">{Math.round(entry.percentage)}%</td>
                            <td className="px-5 py-4">
                              {entry.isPassed ? (
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-500/20">PASSED</span>
                              ) : (
                                <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-red-500/20">FAILED</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border ${
                                entry.mode === 'training' 
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              }`}>
                                {entry.mode || 'test'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-400 font-medium">{timeStr}</td>
                            <td className="px-5 py-4">
                              <p className="text-white font-bold">{date}</p>
                              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-tighter">{time}</p>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => handleDeleteRecord(entry.resultId)}
                                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination bar */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                    <p className="text-xs text-gray-500">
                      Showing {(safePage - 1) * LB_PAGE_SIZE + 1}–{Math.min(safePage * LB_PAGE_SIZE, filteredLBEntries.length)} of {filteredLBEntries.length} results
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setLbPage(1)}
                        disabled={safePage === 1}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >«</button>
                      <button
                        onClick={() => setLbPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .reduce<(number | '…')[]>((acc, p, i, arr) => {
                          if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, i) =>
                          item === '…' ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-xs">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setLbPage(item as number)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                safePage === item
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                              }`}
                            >{item}</button>
                          )
                        )}
                      <button
                        onClick={() => setLbPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >›</button>
                      <button
                        onClick={() => setLbPage(totalPages)}
                        disabled={safePage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >»</button>
                    </div>
                  </div>
                )}
                </>
              );
            })()}
          </div>
        </div>
      ) : adminView === 'logs' ? (
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Login Sessions</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Real-time security auditing</p>
                </div>
              </div>

              <div className="flex flex-1 max-w-2xl items-center gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-orange-500/50 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none transition-all"
                  />
                  {logsSearch && (
                    <button 
                      onClick={() => setLogsSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <Plus className="rotate-45" size={20} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleDeleteSelectedLogs}
                  className="px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 text-white rounded-2xl text-sm font-black transition-all flex items-center gap-2 border border-red-500/20"
                >
                  <Trash2 size={18} />
                  Clear Results
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-gray-600 text-[11px] font-black uppercase tracking-widest px-5">
                    <th className="px-6 py-3">Device</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3 text-center">Login Method</th>
                    <th className="px-6 py-3">System</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3 text-right pr-10">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {logsLoading ? (
                    <tr><td colSpan={7} className="text-center py-20 text-gray-500 animate-pulse font-bold">Scanning secure logs...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-24 text-gray-600 italic font-medium">No sessions found for this search.</td></tr>
                  ) : logs.map((log, idx) => (
                    <tr key={log._id} className="group hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-5 bg-white/[0.015] rounded-l-2xl border-l border-t border-b border-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-500/5 text-gray-500 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-all">
                            {log.deviceType?.includes('iPad') || log.deviceType?.includes('Tablet') ? <Tablet size={18} /> : 
                             log.deviceType?.includes('Phone') ? <Smartphone size={18} /> : <Laptop size={18} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-gray-200 group-hover:text-white transition-all">{log.deviceType || 'Desktop Device'}</span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">{new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-white">{log.userName}</span>
                          <span className="text-[11px] text-gray-500 font-medium">{log.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02] text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.loginType === 'Google' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                          {log.loginType || 'Email'}
                        </span>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                        <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5">
                          {log.deviceOS || 'Unknown OS'}
                        </span>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-gray-300 font-bold">{log.location}</span>
                          <span className="text-[10px] text-gray-600 font-medium tracking-tight">LAT: {log.coordinates?.split(',')[1]} LON: {log.coordinates?.split(',')[0]}</span>
                        </div>
                      </td>
                      <td 
                        className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]"
                      >
                        <button 
                          onClick={() => setExpandedIpLogId(expandedIpLogId === log._id ? null : log._id)}
                          className={`flex items-center gap-2 group/ip transition-all ${expandedIpLogId === log._id ? 'bg-orange-500/10 rounded-xl p-2 -ml-2 border border-orange-500/20' : ''}`}
                        >
                          <span className={`text-[13px] text-gray-400 font-mono tracking-tighter ${expandedIpLogId === log._id ? 'text-white' : ''}`}>
                            {expandedIpLogId === log._id 
                              ? log.ipAddress 
                              : (log.ipAddress?.split(',')[0].length > 15 ? log.ipAddress?.split(',')[0].substring(0, 15) + '...' : log.ipAddress?.split(',')[0])
                            }
                          </span>
                          {log.ipAddress?.includes(',') && expandedIpLogId !== log._id && (
                            <span className="px-1.5 py-0.5 bg-gray-500/10 text-gray-400 text-[9px] font-bold rounded group-hover/ip:bg-orange-500/20 group-hover/ip:text-orange-500 transition-all">
                              +{log.ipAddress.split(',').length - 1}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] rounded-r-2xl border-r border-t border-b border-white/[0.02] text-right pr-6">
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all group-hover:scale-105 active:scale-95"
                          title="Permanently remove this session log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Premium Pagination Footer */}
            {logs.length > 0 && (
              <div className="flex items-center justify-between mt-12 px-4 py-6 border-t border-white/[0.03]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    Showing <span className="text-white">{logs.length}</span> Active Logs
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => loadLogs(logsPage - 1)}
                    disabled={logsPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all disabled:opacity-10"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="px-6 py-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    Page <span className="text-orange-500">{logsPage}</span> <span className="mx-2 opacity-30">|</span> Total {Math.max(1, logsTotalPages)}
                  </div>
                  <button
                    onClick={() => loadLogs(logsPage + 1)}
                    disabled={logsPage === logsTotalPages || logsTotalPages === 0}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all disabled:opacity-10"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : adminView === 'bans' ? (
        <div className="space-y-12">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-red-500/10 transition-all duration-700" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-[0.3em] ml-1">
                  <AlertCircle size={14} />
                  Academic Integrity
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">Suspension Logs</h3>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative group/search">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/search:text-red-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or reason..."
                    value={banLogsSearch}
                    onChange={(e) => setBanLogsSearch(e.target.value)}
                    className="bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all w-80 shadow-inner group-focus-within/search:bg-white/[0.04]"
                  />
                </div>
                
                <button
                  onClick={() => loadBanLogs(1)}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-2xl transition-all active:scale-95"
                >
                  <RefreshCw size={20} className={banLogsLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-left">
                    <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest pl-20">Student</th>
                    <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Violation Reason</th>
                    <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
                    <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Source</th>
                    <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right pr-12">Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {banLogs.map((log) => (
                    <tr key={log._id} className="group hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-5 bg-white/[0.015] rounded-l-2xl border-l border-t border-b border-white/[0.02]">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${log.action === 'ban' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-gray-200 group-hover:text-white transition-all">{log.userName}</span>
                            <span className="text-[10px] text-gray-600 font-bold tracking-tight">{log.userEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                        <p className="text-[13px] text-gray-300 font-bold line-clamp-1 max-w-[200px]" title={log.reason}>{log.reason}</p>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.action === 'ban' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                        <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5">
                          {log.performedBy}
                        </span>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                        <span className="text-[11px] text-gray-500 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.015] rounded-r-2xl border-r border-t border-b border-white/[0.02] text-right pr-6">
                        {log.action === 'ban' && (
                          <button
                            onClick={() => handleUnbanUser(log.userId)}
                            className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20 active:scale-95"
                          >
                            Unban Student
                          </button>
                        )}
                        {log.action === 'unban' && (
                          <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest italic mr-3">Restored</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {banLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <CheckCircle2 size={48} className="text-gray-500" />
                          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">No violations recorded</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {banLogs.length > 0 && (
              <div className="flex items-center justify-between mt-12 px-4 py-6 border-t border-white/[0.03]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    Showing <span className="text-white">{banLogs.length}</span> Integrity Logs
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => loadBanLogs(banLogsPage - 1)}
                    disabled={banLogsPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-10"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="px-6 py-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    Page <span className="text-red-500">{banLogsPage}</span> <span className="mx-2 opacity-30">|</span> Total {Math.max(1, banLogsTotalPages)}
                  </div>
                  <button
                    onClick={() => loadBanLogs(banLogsPage + 1)}
                    disabled={banLogsPage === banLogsTotalPages || banLogsTotalPages === 0}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-10"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (adminView === 'questionBank' || adminView === 'questions') ? (
        <div className="space-y-12">
          {adminView === 'questionBank' && (
            <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  {editingQuestionId ? 'Edit Pool Question' : 'Add New Question to Pool'}
                </h3>
              </div>
              <div className="space-y-10">
                <div className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">
                      <Settings size={12} className="text-orange-500" />
                      Target Destination
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Custom Course Selection */}
                      <div className="relative z-[60] min-w-[280px]">
                        <button
                          onClick={() => setShowCourseDrop(!showCourseDrop)}
                          className="w-full flex items-center justify-between bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-2xl pl-12 pr-6 py-3.5 transition-all group relative"
                        >
                          <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                          <span className="text-xs font-black text-white uppercase tracking-widest truncate max-w-[180px]">
                            {adminSelectedCourse?.title || 'Select Course'}
                          </span>
                          <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100">
                            <ChevronUp size={10} className="text-orange-500" />
                            <ChevronDown size={10} className="text-orange-500" />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {showCourseDrop && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowCourseDrop(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute z-20 top-full left-0 right-0 mt-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
                              >
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar-orange">
                                  {courses.map(c => (
                                    <button
                                      key={c._id}
                                      onClick={() => {
                                        setAdminSelectedCourse(c);
                                        fetchChaptersForCourse(c._id);
                                        setAdminSelectedChapter(null);
                                        setQuestions([]);
                                        setShowCourseDrop(false);
                                      }}
                                      className={`w-full text-left px-5 py-4 rounded-xl transition-all flex items-center justify-between group/item ${
                                        adminSelectedCourse?._id === c._id ? 'bg-orange-500/10 text-orange-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                      }`}
                                    >
                                      <span className="text-xs font-bold uppercase tracking-widest">{c.title}</span>
                                      {adminSelectedCourse?._id === c._id && <CheckCircle2 size={14} />}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      <ChevronRight size={18} className="text-gray-800" />

                      {/* Custom Chapter Selection */}
                      <div className="relative z-[50] min-w-[280px]">
                        <button
                          onClick={() => setShowChapterDrop(!showChapterDrop)}
                          disabled={!adminSelectedCourse}
                          className={`w-full flex items-center justify-between border rounded-2xl pl-12 pr-6 py-3.5 transition-all group relative ${
                            !adminSelectedCourse 
                              ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed' 
                              : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 cursor-pointer'
                          }`}
                        >
                          <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                          <span className="text-xs font-black text-white uppercase tracking-widest truncate max-w-[180px]">
                            {adminSelectedChapter?.title || 'Select Chapter'}
                          </span>
                          <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100">
                            <ChevronUp size={10} className="text-blue-500" />
                            <ChevronDown size={10} className="text-blue-500" />
                          </div>
                        </button>

                        <AnimatePresence>
                          {showChapterDrop && adminSelectedCourse && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowChapterDrop(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute z-20 top-full left-0 right-0 mt-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
                              >
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar-blue">
                                  {(courseChapters[adminSelectedCourse?._id] || []).length === 0 && (
                                    <div className="p-8 text-center text-gray-500 text-[10px] font-bold uppercase">No chapters available</div>
                                  )}
                                  {(courseChapters[adminSelectedCourse?._id] || []).map(ch => (
                                    <button
                                      key={ch._id}
                                      onClick={() => {
                                        setAdminSelectedChapter(ch);
                                        api.getQuestions(ch._id).then(setQuestions);
                                        setShowChapterDrop(false);
                                      }}
                                      className={`w-full text-left px-5 py-4 rounded-xl transition-all flex items-center justify-between group/item ${
                                        adminSelectedChapter?._id === ch._id ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                      }`}
                                    >
                                      <span className="text-xs font-bold uppercase tracking-widest">{ch.title}</span>
                                      {adminSelectedChapter?._id === ch._id && <CheckCircle2 size={14} />}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`transition-all duration-700 ${!adminSelectedChapter ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
                  {!adminSelectedChapter && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div className="bg-[#1a1a1a]/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
                        <AlertCircle className="text-orange-500" size={24} />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Select a destination above to begin</span>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleAddQuestion} className="space-y-8 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question Text</label>
                      <textarea
                        required
                        value={newQuestion.questionText}
                        onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-orange-500 transition-all min-h-[150px]"
                        placeholder="Enter your question here..."
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Code Snippet (Optional)</label>
                      <div className="border border-white/10 rounded-2xl overflow-hidden h-[250px]">
                        <Editor
                          height="100%"
                          language={newQuestion.programmingLanguage}
                          theme="vs-dark"
                          value={newQuestion.codeSnippet}
                          onChange={(value) => setNewQuestion({ ...newQuestion, codeSnippet: value })}
                          onMount={(editor, monaco) => {
                            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                              noSemanticValidation: true,
                              noSyntaxValidation: true,
                            });
                            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                              noSemanticValidation: true,
                              noSyntaxValidation: true,
                            });
                          }}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 10, bottom: 10 },
                            wordWrap: 'on'
                          }}
                        />
                      </div>
                      <div className="flex gap-4">
                        <select
                          value={newQuestion.programmingLanguage}
                          onChange={(e) => setNewQuestion({ ...newQuestion, programmingLanguage: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="java">Java</option>
                          <option value="python">Python</option>
                          <option value="sql">SQL</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      Explanation <span className="text-gray-600 normal-case font-normal">(optional — shown in Training mode)</span>
                    </label>
                    <textarea
                      value={newQuestion.explanation || ''}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      placeholder="Explain why the correct answer is correct..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-orange-500 placeholder-gray-600 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {newQuestion.options?.map((option, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Option {idx + 1}</label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={option.isCorrect}
                              onChange={(e) => {
                                const updatedOptions = [...(newQuestion.options || [])];
                                updatedOptions[idx].isCorrect = e.target.checked;
                                setNewQuestion({ 
                                  ...newQuestion, 
                                  options: updatedOptions,
                                  numberOfCorrectAnswers: updatedOptions.filter(o => o.isCorrect).length
                                });
                              }}
                              className="hidden"
                            />
                            <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${option.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'}`}>
                              {option.isCorrect && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${option.isCorrect ? 'text-emerald-500' : 'text-gray-500'}`}>
                              Correct Answer
                            </span>
                          </label>
                        </div>
                        <input
                          type="text"
                          required
                          value={option.text}
                          onChange={(e) => {
                            const updatedOptions = [...(newQuestion.options || [])];
                            updatedOptions[idx].text = e.target.value;
                            setNewQuestion({ ...newQuestion, options: updatedOptions });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                          placeholder={`Enter option ${idx + 1}...`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                    >
                      {editingQuestionId ? <Save size={20} /> : <PlusCircle size={20} />}
                      {editingQuestionId ? 'Update Question' : 'Add Question to Pool'}
                    </button>
                    {editingQuestionId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionId(null);
                          setNewQuestion({
                            questionText: '',
                            codeSnippet: '',
                            programmingLanguage: 'javascript',
                            options: [
                              { text: '', isCorrect: true },
                              { text: '', isCorrect: false },
                              { text: '', isCorrect: false },
                              { text: '', isCorrect: false }
                            ],
                            numberOfCorrectAnswers: 1,
                            order: 1
                          });
                        }}
                        className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {adminView === 'questions' && adminSelectedQuiz && (
            <div className="space-y-6">
              {/* GLOBAL HUB HEADER */}
              <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-orange-500/10 rounded-[1.5rem] flex items-center justify-center text-orange-500 border border-orange-500/10">
                    <Trophy size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white tracking-tight">{adminSelectedQuiz.title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Quiz Configuration Hub</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="p-2 bg-white/5 rounded-lg text-gray-400 font-black text-[10px]">
                      {adminSelectedQuiz.questions?.length || 0}
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">Lineup</p>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Questions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">Time Limit</p>
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={adminSelectedQuiz.timeLimit}
                          onChange={async (e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const updated = { ...adminSelectedQuiz, timeLimit: parseInt(val || '1', 10) };
                            setAdminSelectedQuiz(updated);
                          }}
                          className="w-8 bg-transparent text-sm font-black text-white focus:outline-none text-center"
                        />
                        <span className="text-[10px] font-black text-gray-600 uppercase">min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={async () => {
                        const toastId = pushToast('Saving lineup...', 'loading', 0);
                        try {
                          const updated = await api.updateQuiz(adminSelectedQuiz._id, { 
                            questions: adminSelectedQuiz.questions,
                            questionCount: Math.max(adminSelectedQuiz.questionCount || 0, adminSelectedQuiz.questions?.length || 0),
                            timeLimit: adminSelectedQuiz.timeLimit
                          });
                          setAdminSelectedQuiz(updated);
                          fetchQuizzesForChapter(adminSelectedChapter._id);
                          updateToast(toastId, 'Quiz Assignments Saved', 'success', 2000);
                        } catch (err) {
                          updateToast(toastId, 'Failed to save', 'error', 2000);
                        }
                      }}
                      className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-2xl text-xs font-black uppercase transition-all active:scale-95 flex items-center gap-2 border border-emerald-500/30 backdrop-blur-md"
                    >
                      <Save size={16} />
                      Apply & Sync
                    </button>
                    <button
                      onClick={() => publishQuiz(adminSelectedQuiz._id, adminSelectedChapter._id, !adminSelectedQuiz.isPublished)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all backdrop-blur-md active:scale-95 border ${
                        adminSelectedQuiz.isPublished 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border-red-500/30' 
                          : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 hover:text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {adminSelectedQuiz.isPublished ? 'Live' : 'Draft'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div 
                  className="lg:col-span-3 space-y-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    const qId = e.dataTransfer.getData('questionId');
                    const source = e.dataTransfer.getData('source');
                    if (source === 'quiz') {
                      const newSelection = adminSelectedQuiz.questions?.filter((id: any) => (typeof id === 'string' ? id : id._id) !== qId);
                      setAdminSelectedQuiz({
                        ...adminSelectedQuiz,
                        questions: newSelection,
                        questionCount: Math.max(adminSelectedQuiz.questionCount || 0, newSelection.length)
                      });
                      pushToast('Returned to Pool', 'success', 1000);
                    }
                  }}
                >
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] p-6 h-[750px] flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white">Question Pool</h3>
                      <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-1">
                        {questions.filter(q => !((adminSelectedQuiz.questions as any[]) || []).find(id => (typeof id === 'string' ? id : (id as any)._id) === q._id)).length} Available
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {questions
                        .filter(q => !((adminSelectedQuiz.questions as any[]) || []).find(id => (typeof id === 'string' ? id : (id as any)._id) === q._id))
                        .map((q) => (
                          <div 
                            key={q._id} 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('questionId', q._id);
                              e.dataTransfer.setData('source', 'pool');
                            }}
                            onClick={() => setPreviewQuestion(q)}
                            className={`group p-4 rounded-2xl border transition-all cursor-pointer ${previewQuestion?._id === q._id ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                          >
                            <p className="text-xs font-medium text-white line-clamp-2 leading-relaxed">{q.questionText}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{q.options.length} Options</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-amber-500/60 uppercase">Pool</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* PANE 2: SELECTED QUESTIONS (QUIZ MANAGEMENT) */}
                <div className="lg:col-span-5 space-y-6">

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    const qId = e.dataTransfer.getData('questionId');
                    const source = e.dataTransfer.getData('source');
                    if (source === 'pool') {
                      if (adminSelectedQuiz.questions?.some((id: any) => (typeof id === 'string' ? id : id._id) === qId)) {
                        pushToast('Already in Quiz', 'error', 2000);
                        return;
                      }
                      const newQuestions = [...(adminSelectedQuiz.questions || []), qId];
                      setAdminSelectedQuiz({
                        ...adminSelectedQuiz,
                        questions: newQuestions,
                        questionCount: Math.max(adminSelectedQuiz.questionCount || 0, newQuestions.length)
                      });
                      pushToast('Added (Unsaved)', 'success', 1000);
                    }
                  }}
                  className="space-y-4 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar min-h-[200px]"
                >
                  {(adminSelectedQuiz.questions || []).map((qObj: any, idx: number) => {
                    const qData = typeof qObj === 'string' ? questions.find(item => item._id === qObj) : qObj;
                    if (!qData) return null;
                    return (
                      <div 
                        key={qData._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('questionId', qData._id);
                          e.dataTransfer.setData('source', 'quiz');
                        }}
                        onClick={() => setPreviewQuestion(qData)}
                        className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer flex items-center justify-between group ${previewQuestion?._id === qData._id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#1a1a1a] border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-[10px] text-gray-500 font-black">
                            {idx + 1}
                          </div>
                          <p className="text-xs font-semibold text-white line-clamp-1 max-w-[240px]">{qData.questionText}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newSelection = adminSelectedQuiz.questions?.filter((id: any) => (typeof id === 'string' ? id : id._id) !== qData._id);
                            setAdminSelectedQuiz({
                              ...adminSelectedQuiz,
                              questions: newSelection,
                              questionCount: Math.max(adminSelectedQuiz.questionCount || 0, newSelection.length)
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {(adminSelectedQuiz.questions?.length || 0) === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                      <p className="text-gray-500 text-xs italic">Drag or click questions from the pool to build your quiz.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PANE 3: QUESTION PREVIEW */}
              <div className="lg:col-span-4 sticky top-6">
                {previewQuestion ? (
                  <div className="bg-[#1a1a1a] border border-orange-500/20 rounded-[2.5rem] p-8 space-y-6 overflow-hidden">
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Question Preview</h4>
                      <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase rounded-lg border border-orange-500/10">
                        {previewQuestion.numberOfCorrectAnswers} Correct
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <p className="text-lg font-bold text-white leading-tight">{previewQuestion.questionText}</p>
                        
                        {previewQuestion.codeSnippet && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                {previewQuestion.programmingLanguage || 'Source Code'}
                              </span>
                              <button
                                onClick={() => setIsCodeFullscreen(true)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter"
                                title="Fullscreen Preview"
                              >
                                <Maximize2 size={12} />
                                Expand
                              </button>
                            </div>
                            <div className="border border-white/10 rounded-2xl overflow-hidden h-64 shadow-inner bg-black/20">
                              <Editor
                                height="100%"
                                language={previewQuestion.programmingLanguage}
                                theme="vs-dark"
                                value={previewQuestion.codeSnippet}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 13,
                                  lineNumbers: 'on',
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                  padding: { top: 15, bottom: 15 },
                                  renderLineHighlight: 'none',
                                  scrollbar: {
                                    vertical: 'hidden',
                                    horizontal: 'hidden'
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-3 mt-8">
                        {previewQuestion.options.map((option: any, oIdx: number) => (
                          <div 
                            key={oIdx}
                            className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${option.isCorrect ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-gray-400'}`}
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${option.isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/5'}`}>
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span className="text-sm font-semibold">{option.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                    {previewQuestion.explanation && (
                      <div className="mt-8 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Explanation</p>
                        <p className="text-xs text-gray-400 leading-relaxed italic">{previewQuestion.explanation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-12 text-center h-[750px] flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-600">
                      <Eye size={32} />
                    </div>
                    <div>
                      <p className="text-white font-bold">Select a Question</p>
                      <p className="text-gray-500 text-xs mt-1">Preview its full details and answers here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      ) : null}

      <AnimatePresence>
        {showAddCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowAddCourse(false); setFormError(''); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Course</h4>
                <button
                  onClick={() => { setShowAddCourse(false); setFormError(''); }}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Course title"
                  value={newCourseData.title}
                  onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <textarea
                  placeholder="Course description"
                  value={newCourseData.description}
                  onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors h-28 resize-none"
                />
              </div>

              {formError && (
                <p className="text-red-400 text-xs font-medium">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!newCourseData.title.trim()) {
                      setFormError('Course title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Creating course...', 'loading', 0);
                    try {
                      await api.createCourse(newCourseData.title.trim(), newCourseData.description.trim());
                      updateToast(toastId, 'Course created successfully', 'success', 2600);
                      setShowAddCourse(false);
                      setNewCourseData({ title: '', description: '' });
                      fetchInitialData();
                    } catch (err: any) {
                      const message = err.response?.data?.message || err.message || 'Failed to create course';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm"
                >
                  Create Course
                </button>
                <button
                  onClick={() => { setShowAddCourse(false); setFormError(''); }}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingCourseData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setEditingCourseData(null);
              setFormError('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Edit Course</h4>
                <button
                  onClick={() => {
                    setEditingCourseData(null);
                    setFormError('');
                  }}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Course title"
                  value={editingCourseData.title}
                  onChange={(e) =>
                    setEditingCourseData({ ...editingCourseData, title: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <textarea
                  placeholder="Course description"
                  value={editingCourseData.description}
                  onChange={(e) =>
                    setEditingCourseData({
                      ...editingCourseData,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none"
                />
              </div>

              {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!editingCourseData.title.trim()) {
                      setFormError('Course title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Updating course...', 'loading', 0);
                    try {
                      const updated = await api.updateCourse(editingCourseData.courseId, {
                        title: editingCourseData.title.trim(),
                        description: editingCourseData.description.trim(),
                      });

                      updateToast(toastId, 'Course updated', 'success', 2500);
                      if (adminSelectedCourse?._id === updated._id) {
                        setAdminSelectedCourse(updated);
                      }
                      setEditingCourseData(null);
                      fetchInitialData();
                    } catch (err: any) {
                      const message =
                        err.response?.data?.message || err.message || 'Failed to update course';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingCourseData(null);
                    setFormError('');
                  }}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingQuizData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeEditQuizModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Edit Quiz Details</h4>
                <button
                  onClick={closeEditQuizModal}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Quiz Title</label>
                  <input
                    type="text"
                    value={editingQuizData.title}
                    onChange={(e) =>
                      setEditingQuizData({ ...editingQuizData, title: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Description</label>
                  <textarea
                    value={editingQuizData.description}
                    onChange={(e) =>
                      setEditingQuizData({ ...editingQuizData, description: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">No. of Questions</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuizData.questionCount}
                    onChange={(e) =>
                      setEditingQuizData({
                        ...editingQuizData,
                        questionCount: parseInt(e.target.value || '1', 10),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Duration (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuizData.timeLimit}
                    onChange={(e) =>
                      setEditingQuizData({
                        ...editingQuizData,
                        timeLimit: parseInt(e.target.value || '1', 10),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Passing %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingQuizData.passingScore}
                    onChange={(e) =>
                      setEditingQuizData({
                        ...editingQuizData,
                        passingScore: parseInt(e.target.value || '0', 10),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!editingQuizData.title.trim()) {
                      setFormError('Quiz title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Updating quiz details...', 'loading', 0);
                    try {
                      const updated = await api.updateQuiz(editingQuizData.quizId, {
                        title: editingQuizData.title.trim(),
                        description: editingQuizData.description.trim(),
                        questionCount: editingQuizData.questionCount,
                        passingScore: editingQuizData.passingScore,
                        timeLimit: editingQuizData.timeLimit,
                      });

                      if (adminSelectedQuiz?._id === updated._id) {
                        setAdminSelectedQuiz(updated);
                      }
                      await fetchQuizzesForChapter(editingQuizData.chapterId);
                      updateToast(toastId, 'Quiz details updated', 'success', 2600);
                      closeEditQuizModal();
                    } catch (err: any) {
                      const message =
                        err.response?.data?.message || err.message || 'Failed to update quiz details';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 4200);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={closeEditQuizModal}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showAddChapter && adminSelectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddChapter(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Chapter</h4>
                <button
                  onClick={() => setShowAddChapter(false)}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Chapter title"
                  value={newChapterData.title}
                  onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <textarea
                  placeholder="Chapter description"
                  value={newChapterData.description}
                  onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none"
                />
              </div>

              {formError && (
                <p className="text-red-400 text-xs font-medium">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!newChapterData.title.trim()) {
                      setFormError('Chapter title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Adding chapter...', 'loading', 0);
                    try {
                      await api.createChapter(adminSelectedCourse._id, newChapterData.title.trim(), newChapterData.description.trim());
                      updateToast(toastId, 'Chapter added successfully', 'success', 2600);
                      setShowAddChapter(false);
                      setNewChapterData({ title: '', description: '' });
                      fetchChaptersForCourse(adminSelectedCourse._id);
                    } catch (err: any) {
                      const message = err.response?.data?.message || err.message || 'Failed to add chapter';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
                >
                  Create Chapter
                </button>
                <button
                  onClick={() => setShowAddChapter(false)}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAddQuiz && adminSelectedChapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddQuiz(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Quiz</h4>
                <button
                  onClick={() => setShowAddQuiz(false)}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Quiz Title</label>
                  <input
                    type="text"
                    placeholder="E.g. Advanced Java Streams"
                    value={newQuizData.title}
                    onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Description</label>
                  <textarea
                    placeholder="Short description of the quiz..."
                    value={newQuizData.description}
                    onChange={(e) => setNewQuizData({ ...newQuizData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-all h-24 resize-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold text-center block">Draft quiz will be created without questions. You can add them in the next step.</label>
                </div>
              </div>

              {formError && (
                <p className="text-red-400 text-xs font-medium">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!newQuizData.title.trim()) {
                      setFormError('Quiz title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Creating quiz...', 'loading', 0);
                    try {
                      const createdQuiz = await api.createQuiz(
                        adminSelectedChapter._id,
                        adminSelectedCourse._id,
                        newQuizData.title.trim(),
                        newQuizData.description.trim(),
                        0, // questionCount
                        70, // passingScore
                        15 // timeLimit
                      );
                      updateToast(toastId, 'Quiz created successfully', 'success', 2600);
                      setShowAddQuiz(false);
                      setNewQuizData({
                        title: '',
                        description: '',
                        questionCount: 0,
                        passingScore: 70,
                        timeLimit: 15,
                      });
                      
                      // Auto-select and switch to management view
                      setAdminSelectedQuiz(createdQuiz);
                      setAdminView('questions');
                      fetchQuizzesForChapter(adminSelectedChapter._id);
                    } catch (err: any) {
                      const message = err.response?.data?.message || err.message || 'Failed to create quiz';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm"
                >
                  Create Quiz
                </button>
                <button
                  onClick={() => setShowAddQuiz(false)}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* PREMIUM FULLSCREEN CODE MODAL */}
      <AnimatePresence>
        {isCodeFullscreen && previewQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 md:p-12"
            onClick={() => setIsCodeFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-6xl h-full bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                    <Code size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-none">Code Insight</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                       {previewQuestion.programmingLanguage || 'plaintext'} mode • Ready-only
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button
                    onClick={() => setIsCodeFullscreen(false)}
                    className="p-4 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-2xl transition-all border border-white/5"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content - Editor */}
              <div className="flex-1 min-h-0 relative">
                <Editor
                  height="100%"
                  language={previewQuestion.programmingLanguage}
                  theme="vs-dark"
                  value={previewQuestion.codeSnippet}
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    fontSize: 15,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 30, bottom: 30 },
                    cursorStyle: 'line',
                    folding: true,
                    glyphMargin: true,
                    wordWrap: 'on'
                  }}
                />
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest italic flex items-center gap-2">
                  <AlertCircle size={12} />
                  Viewing original source snippet
                </p>
                <div className="flex items-center gap-2">
                   <button
                    onClick={() => setIsCodeFullscreen(false)}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-all border border-white/5 flex items-center gap-2"
                  >
                    <Minimize2 size={16} />
                    Close Insight
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModalUI />
    </motion.div>
  );
};
