import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  LayoutDashboard,
  Edit,
  Save,
  PlayCircle,
  Settings,
  Code,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Layers,
  LogOut,
  User as UserIcon,
  Search,
  Filter,
  MoreVertical,
  PlusCircle,
  AlertCircle,
  UserPlus,
  Flag
} from 'lucide-react';
import * as api from './services/api';
import { HomeView } from './components/views/HomeView';
import { SelectionView } from './components/views/SelectionView';
import { QuizView } from './components/views/QuizView';
import { ResultsView } from './components/views/ResultsView';
import { LoginView } from './components/views/LoginView';
import { AdminView } from './components/views/AdminView';
import { DashboardView } from './components/views/DashboardView';
import { CodegraphWorkspace } from './features/codegraph/CodegraphWorkspace';
import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import { User, Course, Chapter, Quiz, Question, Option, QuizResult, LeaderboardEntry, QuizMode } from './types';

type View = 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login' | 'dashboard' | 'coding';
type AdminTab = 'hierarchy' | 'quizzes' | 'questions' | 'questionBank' | 'leaderboard' | 'logs' | 'bans' | 'problems' | 'contests';
type ToastType = 'success' | 'error' | 'loading';

interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-gray-400 text-sm">
              {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [view, setView] = useState<View>(() => {
    const savedView = localStorage.getItem('view');
    return (savedView as View) || 'home';
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Hierarchy state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseChapters, setCourseChapters] = useState<Record<string, Chapter[]>>({});
  const [chapterQuizzes, setChapterQuizzes] = useState<Record<string, Quiz[]>>({});
  
  const [summaryStats, setSummaryStats] = useState({ courses: 0, chapters: 0, quizzes: 0, questions: 0 });
  
  // Selection state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(() => {
    const saved = localStorage.getItem('selectedCourse');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(() => {
    const saved = localStorage.getItem('selectedChapter');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(() => {
    const saved = localStorage.getItem('selectedQuiz');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (selectedCourse) localStorage.setItem('selectedCourse', JSON.stringify(selectedCourse));
    else localStorage.removeItem('selectedCourse');
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedChapter) localStorage.setItem('selectedChapter', JSON.stringify(selectedChapter));
    else localStorage.removeItem('selectedChapter');
  }, [selectedChapter]);

  useEffect(() => {
    if (selectedQuiz) localStorage.setItem('selectedQuiz', JSON.stringify(selectedQuiz));
    else localStorage.removeItem('selectedQuiz');
  }, [selectedQuiz]);
  
  // Admin selection state
  const [adminSelectedCourse, setAdminSelectedCourse] = useState<Course | null>(null);
  const [adminSelectedChapter, setAdminSelectedChapter] = useState<Chapter | null>(null);
  const [adminSelectedSubFolder, setAdminSelectedSubFolder] = useState<Chapter | null>(null);
  const [adminSelectedQuiz, setAdminSelectedQuiz] = useState<Quiz | null>(null);
  const [adminView, setAdminView] = useState<AdminTab>('hierarchy');
  
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('questions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem('currentQuestionIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('currentQuestionIndex', currentQuestionIndex.toString());
  }, [currentQuestionIndex]);
  const [answers, setAnswers] = useState<Record<string, number[]>>(() => {
    const saved = localStorage.getItem('answers');
    return saved ? JSON.parse(saved) : {};
  });
  const [isSubmitted, setIsSubmitted] = useState(() => {
    return localStorage.getItem('isSubmitted') === 'true';
  });
  const [violationCount, setViolationCount] = useState(0);
  const violationCountRef = useRef(0);
  const [quizMode, setQuizMode] = useState<QuizMode>('test');
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('timeLeft');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [quizDuration, setQuizDuration] = useState(() => {
    const saved = localStorage.getItem('quizDuration');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(() => {
    const saved = localStorage.getItem('quizResult');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem('isSubmitted', isSubmitted.toString());
  }, [isSubmitted]);

  useEffect(() => {
    localStorage.setItem('timeLeft', timeLeft.toString());
  }, [timeLeft]);

  useEffect(() => {
    localStorage.setItem('quizDuration', quizDuration.toString());
  }, [quizDuration]);

  useEffect(() => {
    if (quizResult) {
      localStorage.setItem('quizResult', JSON.stringify(quizResult));
    } else {
      localStorage.removeItem('quizResult');
    }
  }, [quizResult]);

  useEffect(() => {
    if (currentUser) {
      const count = currentUser.violationCount || 0;
      setViolationCount(count);
      violationCountRef.current = count;
    } else {
      setViolationCount(0);
      violationCountRef.current = 0;
    }
  }, [currentUser?._id, currentUser?.violationCount]);

  const [quizQuestionCounts, setQuizQuestionCounts] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [pendingProblemId, setPendingProblemId] = useState<string | null>(null);

  // New Admin Form States
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ title: '', description: '' });
  
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterData, setNewChapterData] = useState({ title: '', description: '' });
  
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({
    title: '',
    description: '',
    questionCount: 0,
    passingScore: 70,
    timeLimit: 10
  });
  const [courseSearch, setCourseSearch] = useState('');

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const pushToast = (
    text: string,
    type: ToastType = 'success',
    durationMs: number = 2600
  ) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, text }]);
    if (durationMs > 0) {
      window.setTimeout(() => dismissToast(id), durationMs);
    }
    return id;
  };

  const updateToast = (
    id: number,
    text: string,
    type: ToastType = 'success',
    durationMs: number = 2600
  ) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, text, type } : toast))
    );
    if (durationMs > 0) {
      window.setTimeout(() => dismissToast(id), durationMs);
    }
  };

  // Admin form state
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    chapterId: '',
    courseId: '',
    questionText: '',
    image: '',
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Only restore user if both user AND token exist (both are required for auth)
    if (savedUser && token) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
    } else {
      // If either is missing, clear both to ensure clean state
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    
    setIsAuthReady(true);
    fetchInitialData();
    if (localStorage.getItem('token')) {
      fetchUserStats();
    }
  }, []);

  useEffect(() => {
    if (view === 'selection' || view === 'dashboard') {
      fetchInitialData();
      fetchUserStats();
    }
  }, [view]);

  useEffect(() => {
    if (isAuthReady) {
      setIsLoading(false);
    }
  }, [isAuthReady]);

  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'quiz' && timeLeft > 0 && !isSubmitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (view === 'quiz' && timeLeft === 0 && !isSubmitted) {
      submitQuiz();
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, isSubmitted]);

  // ACADEMIC INTEGRITY ENFORCEMENT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view === 'quiz') {
        const isRefresh = 
          (e.ctrlKey && e.key === 'r') || 
          (e.metaKey && e.key === 'r') || 
          e.key === 'F5';
        
        if (isRefresh) {
          e.preventDefault();
          pushToast('Refresh is disabled during the quiz for integrity protection.', 'error', 3000);
          return false;
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (view === 'quiz' && !isSubmitted && document.visibilityState === 'hidden') {
        const nextCount = violationCountRef.current + 1;
        violationCountRef.current = nextCount;
        setViolationCount(nextCount);
        
        if (nextCount < 4) {
          pushToast(`WARNING (${nextCount}/4): Tab switching detected. Your session WILL be banned after 4 attempts.`, 'error', 5000);
          try {
            const result = await api.reportViolation(`WARNING: User switched tabs (${nextCount}/4).`, false);
            if (result.user) {
              const updatedUser = { ...currentUser, ...result.user };
              setCurrentUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              violationCountRef.current = updatedUser.violationCount || 0;
            }
          } catch (e) { console.error(e); }
        } else {
          try {
            const toastId = pushToast('FINAL INTEGRITY VIOLATION: Exceeded switch limit.', 'loading', 0);
            const result = await api.reportViolation('FORCE BAN: User exceeded tab switch limit (4/4) during active quiz.', true);
            if (result.user) {
              const updatedUser = { ...currentUser, ...result.user };
              setCurrentUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              violationCountRef.current = updatedUser.violationCount || 0;
            }
            updateToast(toastId, 'ACCOUNT SUSPENDED: Please contact admin to unban.', 'error', 10000);
            setTimeout(() => {
              handleLogout();
            }, 3000);
          } catch (error) {
            console.error('Failed to report violation:', error);
          }
        }
      }
    };

    if (view === 'quiz') {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Also prevent context menu (right click)
      const preventDefault = (e: Event) => e.preventDefault();
      window.addEventListener('contextmenu', preventDefault);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('contextmenu', preventDefault);
      };
    }
  }, [view, isSubmitted]);

  useEffect(() => {
    if (isAuthReady && !currentUser && ['selection', 'quiz', 'admin', 'results'].includes(view)) {
      setView('login');
      pushToast('Please login to access this area', 'error', 3000);
    }
  }, [isAuthReady, currentUser, view]);

  const fetchInitialData = async () => {
    try {
      // Fetch stats summary (public-ish)
      api.getStatsSummary().then(setSummaryStats).catch(console.error);

      const token = localStorage.getItem('token');
      if (!token) {
        setCourses([]);
        return;
      }
      const coursesData = await api.getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setCourses([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      const stats = await api.getMyStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const fetchChaptersForCourse = async (courseId: string) => {
    try {
      const chaptersData = await api.getChapters(courseId);
      setCourseChapters(prev => ({ ...prev, [courseId]: chaptersData }));
      return chaptersData;
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
      return [];
    }
  };

  const fetchQuizzesForChapter = async (chapterId: string) => {
    try {
      const quizzesData = await api.getQuizzes(chapterId);
      setChapterQuizzes(prev => ({ ...prev, [chapterId]: quizzesData }));
      
      // Update question counts for each quiz from its internal questions array
      setQuizQuestionCounts(prev => {
        const newCounts = { ...prev };
        quizzesData.forEach((quiz) => {
          newCounts[quiz._id] = quiz.questions?.length || 0;
        });
        return newCounts;
      });
      
      return quizzesData;
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      return [];
    }
  };

  const toggleCourseExpansion = async (courseId: string) => {
    const isExpanding = !expandedCourses[courseId];
    setExpandedCourses(prev => ({ ...prev, [courseId]: isExpanding }));
    
    if (isExpanding && !courseChapters[courseId]) {
      await fetchChaptersForCourse(courseId);
    }
  };

  const toggleChapterExpansion = async (chapterId: string) => {
    const isExpanding = !expandedChapters[chapterId];
    setExpandedChapters(prev => ({ ...prev, [chapterId]: isExpanding }));
    
    if (isExpanding && !chapterQuizzes[chapterId]) {
      await fetchQuizzesForChapter(chapterId);
    }
  };

  const startQuiz = async (quizId: string, course?: Course | null, chapter?: Chapter | null, mode: QuizMode = 'test') => {
    // Check if user is authenticated before attempting to load
    const token = localStorage.getItem('token');
    if (!token) {
      setView('login');
      return;
    }
    
    try {
      setIsLoading(true);
      const { quiz, questions: quizQuestions } = await api.getQuizWithQuestions(quizId);
      setQuestions(quizQuestions);
      setSelectedQuiz(quiz);
      if (course) setSelectedCourse(course);
      if (chapter) setSelectedChapter(chapter);
      
      const duration = (quiz.timeLimit || 10) * 60;
      setTimeLeft(duration);
      setQuizDuration(duration);
      
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsSubmitted(false);
      setQuizMode(mode);
      setView('quiz');
    } catch (error: any) {
      console.error('Failed to start quiz:', error);
      // Show error only for non-auth errors since auth is already checked above
      const msg = error.response?.data?.message || error.message || 'Failed to load quiz';
      pushToast(msg === 'Quiz not found' ? 'This quiz is not published yet.' : msg, 'error', 3200);
    } finally {
      setIsLoading(false);
    }
  };


  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    const toastId = pushToast('Submitting quiz...', 'loading', 0);
    try {
      setIsLoading(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions
      }));
      
      const result = await api.submitQuiz(selectedQuiz._id, formattedAnswers, quizDuration - timeLeft, quizMode);
      setQuizResult(result);
      setIsSubmitted(true);
      
      // Invalidate caches to force refetch of progress
      if (selectedCourse) {
        setCourseChapters(prev => {
          const next = { ...prev };
          delete next[selectedCourse._id];
          return next;
        });
      }
      if (selectedChapter) {
        setChapterQuizzes(prev => {
          const next = { ...prev };
          delete next[selectedChapter._id];
          return next;
        });
      }

      updateToast(toastId, 'Quiz submitted successfully', 'success', 2300);
      setView('results');
    } catch (error: any) {
      console.error('Failed to submit quiz:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to submit quiz';
      updateToast(toastId, msg, 'error', 3800);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedChapter || !adminSelectedCourse) return;
    
    if (editingQuestionId) {
      handleUpdateQuestion(e);
      return;
    }
    
    try {
      setIsLoading(true);
      await api.createQuestion({
        ...newQuestion,
        chapterId: adminSelectedSubFolder?._id || adminSelectedChapter?._id || '',
        courseId: adminSelectedCourse?._id || ''
      });
      
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
        order: (questions.length + 1)
      });
      const targetChapterId = adminSelectedSubFolder?._id || adminSelectedChapter._id;
      const questionsData = await api.getQuestions(targetChapterId);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to add question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId || (!adminSelectedChapter && !adminSelectedSubFolder)) return;
    
    try {
      setIsLoading(true);
      await api.updateQuestion(editingQuestionId, newQuestion);
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
      
      const questionsData = await api.getQuestions(adminSelectedChapter._id);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestionId(q._id);
    setNewQuestion({
      questionText: q.questionText,
      codeSnippet: q.codeSnippet || '',
      programmingLanguage: q.programmingLanguage || 'javascript',
      options: q.options.map(o => ({ ...o })),
      numberOfCorrectAnswers: q.numberOfCorrectAnswers,
      order: q.order,
      image: q.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!adminSelectedChapter) return;
    try {
      setIsLoading(true);
      await api.deleteQuestion(id);
      const questionsData = await api.getQuestions(adminSelectedChapter._id);
      setQuestions(questionsData);
      fetchQuizzesForChapter(adminSelectedChapter._id);
    } catch (error) {
      console.error('Failed to delete question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishQuiz = async (quizId: string, chapterId: string, isPublished: boolean = true) => {
    const toastId = pushToast(isPublished ? 'Publishing quiz...' : 'Unpublishing quiz...', 'loading', 0);
    try {
      const updated = await api.publishQuiz(quizId, isPublished);
      fetchQuizzesForChapter(chapterId);
      if (adminSelectedQuiz?._id === quizId) {
        setAdminSelectedQuiz(updated);
      }
      updateToast(toastId, `Quiz ${isPublished ? 'published' : 'unpublished'} successfully!`, 'success', 2600);
    } catch (error: any) {
      updateToast(toastId, error.response?.data?.message || error.message || 'Failed to update quiz status', 'error', 3400);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (isSubmitted) return;
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion._id;
    const currentAnswers = answers[questionId] || [];
    
    let newAnswers: number[];
    if (currentQuestion.numberOfCorrectAnswers > 1) {
      // Multiple choice
      if (currentAnswers.includes(optionIndex)) {
        newAnswers = currentAnswers.filter(idx => idx !== optionIndex);
      } else {
        newAnswers = [...currentAnswers, optionIndex];
      }
    } else {
      // Single choice
      newAnswers = [optionIndex];
    }
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswers
    }));
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setSelectedCourse(null);
    setSelectedChapter(null);
    setSelectedQuiz(null);
    setQuestions([]);
    setTimeLeft(0);
    setQuizDuration(0);
    setQuizResult(null);
    setView('home');
  };

  const handleRetake = async () => {
    if (selectedQuiz) {
      await startQuiz(selectedQuiz._id, selectedCourse, selectedChapter, quizMode);
    } else {
      resetQuiz();
    }
  };

  const retakeQuestion = (questionId: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setLoginError('');
      
      let data;
      if (isRegistering) {
        data = await api.register(registerName, loginEmail, loginPassword);
      } else {
        data = await api.login(loginEmail, loginPassword);
      }
      
      const { user, token } = data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
      await fetchInitialData();
      await fetchUserStats();
      setView(user.role === 'admin' ? 'admin' : 'dashboard');
      setLoginEmail('');
      setLoginPassword('');
      setRegisterName('');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Authentication failed. Please try again.';
      setLoginError(msg);
      if (msg.toLowerCase().includes('banned')) {
        pushToast(msg, 'error', 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setLoginError('');
      
      const { user, token } = await api.googleLogin(credentialResponse.credential);
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
      await fetchInitialData();
      await fetchUserStats();
      setView(user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Google authentication failed.';
      setLoginError(msg);
      if (msg.toLowerCase().includes('banned')) {
        pushToast(msg, 'error', 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAdmin(false);
    setView('home');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleChapter = (subjectName: string, title: string) => {
    const key = `${subjectName}-${title}`;
    setExpandedChapters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectProblem = (problemId: string) => {
    setPendingProblemId(problemId);
    setView('coding');
  };

  const getLanguage = (subject: string | null, questionLanguage?: string) => {
    if (questionLanguage) return questionLanguage.toLowerCase();
    if (!subject) return 'javascript';
    const s = subject.toLowerCase();
    if (s.includes('java') && !s.includes('script')) return 'java';
    if (s.includes('js') || s.includes('react')) return 'javascript';
    if (s.includes('sql')) return 'sql';
    if (s.includes('python')) return 'python';
    if (s.includes('cpp') || s.includes('c++')) return 'cpp';
    if (s.includes('html')) return 'html';
    if (s.includes('css')) return 'css';
    return 'javascript';
  };

  const calculateScore = () => {
    if (!quizResult) return 0;
    return quizResult.score;
  };

  const getAccuracy = () => {
    if (!quizResult) return 0;
    return quizResult.percentage;
  };

  const getResultGif = (accuracy: number) => {
    if (accuracy >= 80) return "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlHFRbmaZtBRhXG/giphy.gif"; // High score
    if (accuracy >= 50) return "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7iM8FMEU24/giphy.gif"; // Medium score
    return "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/26ufcVAp3AiJJsrIs/giphy.gif"; // Low score
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  if (view === 'coding' && currentUser) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <CodegraphWorkspace 
          onBack={() => {
            setPendingProblemId(null);
            setView('dashboard');
          }} 
          user={currentUser} 
          initialProblemId={pendingProblemId || undefined}
        />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-[#141414] text-gray-200 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => view !== 'quiz' && setView('home')}>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">ProQuiz Master</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <button 
              disabled={view === 'quiz' && !isSubmitted}
              onClick={() => setView('home')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'home' || view === 'selection' || view === 'quiz' || view === 'results' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'} ${view === 'quiz' && !isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <PlayCircle size={18} />
              <span className="hidden sm:inline">Quiz</span>
            </button>
            {currentUser && !isAdmin && (
              <button 
                disabled={view === 'quiz' && !isSubmitted}
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'dashboard' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'} ${view === 'quiz' && !isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            {currentUser && (
               <button 
                disabled={view === 'quiz' && !isSubmitted}
                onClick={() => setView('coding')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'coding' ? 'bg-orange-500 text-white' : 'hover:bg-white/5 text-gray-400'} ${view === 'quiz' && !isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Code size={18} />
                <span className="hidden sm:inline">Coding</span>
              </button>
            )}
            {currentUser ? (
              <>
                {isAdmin && (
                  <button 
                    disabled={view === 'quiz' && !isSubmitted}
                    onClick={() => setView('admin')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'admin' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'} ${view === 'quiz' && !isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Settings size={18} />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white/90 hidden sm:inline">{currentUser.name}</span>
                </div>
                <button 
                  disabled={view === 'quiz' && !isSubmitted}
                  onClick={handleLogout}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:bg-red-500/10 text-red-400 ${view === 'quiz' && !isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button 
                disabled={view === 'quiz' && !isSubmitted}
                onClick={() => setView('login')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'login' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'} ${view === 'quiz' && !isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <UserIcon size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            {view === 'quiz' && (
              <>
                <button 
                  onClick={handleRetake}
                  className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                >
                  <RotateCcw size={18} />
                  <span className="hidden sm:inline">Reset Quiz</span>
                </button>
                <button 
                  onClick={resetQuiz}
                  className="ml-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg flex items-center gap-2 transition-all shadow-lg group-hover:shadow-red-500/20"
                >
                  <Flag size={18} />
                  <span className="hidden sm:inline">Surrender</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <HomeView 
              setView={setView}
              courses={courses}
              courseChapters={courseChapters}
              chapterQuizzes={chapterQuizzes}
              questions={questions}
              summaryStats={summaryStats}
              currentUser={currentUser}
              setSelectedCourse={setSelectedCourse}
              setSelectedChapter={setSelectedChapter}
              setSelectedQuiz={setSelectedQuiz}
            />
          )}

          {view === 'dashboard' && currentUser && (
            <DashboardView 
              stats={userStats} 
              userName={currentUser.name} 
              setView={setView} 
            />
          )}

          {view === 'selection' && (
            <SelectionView
              courses={courses}
              courseChapters={courseChapters}
              chapterQuizzes={chapterQuizzes}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              selectedChapter={selectedChapter}
              setSelectedChapter={setSelectedChapter}
              selectedQuiz={selectedQuiz}
              setSelectedQuiz={setSelectedQuiz}
              expandedChapters={expandedChapters}
              toggleChapterExpansion={toggleChapterExpansion}
              startQuiz={startQuiz}
              onSelectProblem={handleSelectProblem}
              fetchChaptersForCourse={fetchChaptersForCourse}
            />
          )}

          {view === 'quiz' && questions.length > 0 && (
            <QuizView
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              setCurrentQuestionIndex={setCurrentQuestionIndex}
              answers={answers}
              handleAnswer={handleAnswer}
              timeLeft={timeLeft}
              quizDuration={quizDuration}
              isSubmitted={isSubmitted}
              setIsSubmitted={setIsSubmitted}
              setView={setView}
              selectedCourse={selectedCourse}
              selectedChapter={selectedChapter}
              selectedQuiz={selectedQuiz}
              formatTime={formatTime}
              getLanguage={getLanguage}
              submitQuiz={submitQuiz}
              quizMode={quizMode}
              retakeQuestion={retakeQuestion}
            />
          )}

          {view === 'results' && (
            <ResultsView
              getAccuracy={getAccuracy}
              calculateScore={calculateScore}
              quizDuration={quizDuration}
              timeLeft={timeLeft}
              getResultGif={getResultGif}
              handleRetake={handleRetake}
              setView={setView}
              questionsLen={questions.length}
              formatTime={formatTime}
              questions={questions}
              answers={answers}
              quizMode={quizMode}
              getLanguage={getLanguage}
              selectedCourseTitle={selectedCourse?.title}
            />
          )}

          {view === 'login' && (
            <LoginView
              isRegistering={isRegistering}
              setIsRegistering={setIsRegistering}
              loginError={loginError}
              setLoginError={setLoginError}
              loginEmail={loginEmail}
              setLoginEmail={setLoginEmail}
              loginPassword={loginPassword}
              setLoginPassword={setLoginPassword}
              registerName={registerName}
              setRegisterName={setRegisterName}
              isLoading={isLoading}
              handleLogin={handleLogin}
              handleGoogleLogin={handleGoogleLogin}
              setView={setView}
            />
          )}

          {view === 'admin' && isAdmin && (
            <AdminView 
              adminView={adminView}
              setAdminView={setAdminView}
              courses={courses}
              courseChapters={courseChapters}
              chapterQuizzes={chapterQuizzes}
              adminSelectedCourse={adminSelectedCourse}
              setAdminSelectedCourse={setAdminSelectedCourse}
              adminSelectedChapter={adminSelectedChapter}
              setAdminSelectedChapter={setAdminSelectedChapter}
              adminSelectedSubFolder={adminSelectedSubFolder}
              setAdminSelectedSubFolder={setAdminSelectedSubFolder}
              adminSelectedQuiz={adminSelectedQuiz}
              setAdminSelectedQuiz={setAdminSelectedQuiz}
              expandedCourses={expandedCourses}
              toggleCourseExpansion={toggleCourseExpansion}
              expandedChapters={expandedChapters}
              toggleChapterExpansion={toggleChapterExpansion}
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              showAddCourse={showAddCourse}
              setShowAddCourse={setShowAddCourse}
              newCourseData={newCourseData}
              setNewCourseData={setNewCourseData}
              fetchInitialData={fetchInitialData}
              showAddChapter={showAddChapter}
              setShowAddChapter={setShowAddChapter}
              newChapterData={newChapterData}
              setNewChapterData={setNewChapterData}
              fetchChaptersForCourse={fetchChaptersForCourse}
              showAddQuiz={showAddQuiz}
              setShowAddQuiz={setShowAddQuiz}
              newQuizData={newQuizData}
              setNewQuizData={setNewQuizData}
              fetchQuizzesForChapter={fetchQuizzesForChapter}
              quizQuestionCounts={quizQuestionCounts}
              questions={questions}
              setQuestions={setQuestions}
              editingQuestionId={editingQuestionId}
              setEditingQuestionId={setEditingQuestionId}
              newQuestion={newQuestion}
              setNewQuestion={setNewQuestion}
              handleAddQuestion={handleAddQuestion}
              handleEditClick={handleEditClick}
              handleDeleteQuestion={handleDeleteQuestion}
              publishQuiz={handlePublishQuiz}
              pushToast={pushToast}
              updateToast={updateToast}
            />
          )}
        </AnimatePresence>
      </main>

      <div className="fixed top-6 right-6 z-[70] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 24, y: -8 }}
              className={`min-w-[260px] max-w-[340px] px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-xl pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : toast.type === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                    : 'bg-orange-500/10 border-orange-500/30 text-orange-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="mt-0.5">
                  {toast.type === 'success' && <CheckCircle2 size={18} />}
                  {toast.type === 'error' && <XCircle size={18} />}
                  {toast.type === 'loading' && <RotateCcw size={18} className="animate-spin" />}
                </div>
                <p className="text-sm font-medium leading-5">{toast.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2026 ProQuiz Master. All rights reserved.</p>
        </div>
      </footer>
    </div>
    </GoogleOAuthProvider>
  );
}
