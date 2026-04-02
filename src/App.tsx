import React, { useState, useEffect } from 'react';
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
  UserPlus
} from 'lucide-react';
import * as api from './services/api';
import { HomeView } from './components/views/HomeView';
import { SelectionView } from './components/views/SelectionView';
import { QuizView } from './components/views/QuizView';
import { ResultsView } from './components/views/ResultsView';
import { LoginView } from './components/views/LoginView';
import { AdminView } from './components/views/AdminView';
import { User, Course, Chapter, Quiz, Question, Option, QuizResult, LeaderboardEntry } from './types';

type View = 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login';

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
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [view, setView] = useState<View>('home');
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
  
  // Selection state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  // Admin selection state
  const [adminSelectedCourse, setAdminSelectedCourse] = useState<Course | null>(null);
  const [adminSelectedChapter, setAdminSelectedChapter] = useState<Chapter | null>(null);
  const [adminSelectedQuiz, setAdminSelectedQuiz] = useState<Quiz | null>(null);
  const [adminView, setAdminView] = useState<'hierarchy' | 'questions'>('hierarchy');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizDuration, setQuizDuration] = useState(0);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizQuestionCounts, setQuizQuestionCounts] = useState<Record<string, number>>({});

  // New Admin Form States
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ title: '', description: '' });
  
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterData, setNewChapterData] = useState({ title: '', description: '' });
  
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({ title: '', description: '', passingScore: 70, timeLimit: 15 });
  const [courseSearch, setCourseSearch] = useState('');

  // Admin form state
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    quizId: '',
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
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
    }
    setIsAuthReady(true);
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      setIsLoading(false);
    }
  }, [isAuthReady]);

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

  const fetchInitialData = async () => {
    try {
      const coursesData = await api.getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
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
      
      // Fetch question counts for each quiz
      const counts = await Promise.all(quizzesData.map(async (quiz) => {
        const questions = await api.getQuestions(quiz._id);
        return { id: quiz._id, count: questions.length };
      }));
      
      setQuizQuestionCounts(prev => {
        const newCounts = { ...prev };
        counts.forEach(({ id, count }) => {
          newCounts[id] = count;
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

  const startQuiz = async (quizId: string) => {
    try {
      setIsLoading(true);
      const { quiz, questions: quizQuestions } = await api.getQuizWithQuestions(quizId);
      setQuestions(quizQuestions);
      setSelectedQuiz(quiz);
      
      const duration = quiz.timeLimit * 60;
      setTimeLeft(duration);
      setQuizDuration(duration);
      
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsSubmitted(false);
      setView('quiz');
    } catch (error) {
      console.error('Failed to start quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    try {
      setIsLoading(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions
      }));
      
      const result = await api.submitQuiz(selectedQuiz._id, formattedAnswers, quizDuration - timeLeft);
      setQuizResult(result);
      setIsSubmitted(true);
      setView('results');
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedQuiz) return;
    
    if (editingQuestionId) {
      handleUpdateQuestion(e);
      return;
    }
    
    try {
      setIsLoading(true);
      await api.createQuestion({
        ...newQuestion,
        quizId: adminSelectedQuiz._id
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
      
      const questionsData = await api.getQuestions(adminSelectedQuiz._id);
      setQuestions(questionsData);
      setQuizQuestionCounts(prev => ({ ...prev, [adminSelectedQuiz._id]: questionsData.length }));
    } catch (error) {
      console.error('Failed to add question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId || !adminSelectedQuiz) return;
    
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
      
      const questionsData = await api.getQuestions(adminSelectedQuiz._id);
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
    if (!adminSelectedQuiz) return;
    try {
      setIsLoading(true);
      await api.deleteQuestion(id);
      const questionsData = await api.getQuestions(adminSelectedQuiz._id);
      setQuestions(questionsData);
      setQuizQuestionCounts(prev => ({ ...prev, [adminSelectedQuiz._id]: questionsData.length }));
    } catch (error) {
      console.error('Failed to delete question:', error);
    } finally {
      setIsLoading(false);
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
    setView('home');
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
      setView(user.role === 'admin' ? 'admin' : 'home');
      setLoginEmail('');
      setLoginPassword('');
      setRegisterName('');
    } catch (error: any) {
      setLoginError(error.response?.data?.message || error.message || 'Authentication failed. Please try again.');
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
    if (accuracy >= 80) return "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlHFRbmaZtBRhXG/giphy.gif"; // High score
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

  return (
    <div className="min-h-screen bg-[#141414] text-gray-200 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">ProQuiz Master</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <button 
              onClick={() => setView('home')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'home' || view === 'selection' || view === 'quiz' || view === 'results' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <PlayCircle size={18} />
              <span className="hidden sm:inline">Quiz</span>
            </button>
            {isAdmin ? (
              <>
                <button 
                  onClick={() => setView('admin')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'admin' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                >
                  <Settings size={18} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:bg-red-500/10 text-red-500"
                >
                  <XCircle size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setView('login')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'login' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <UserIcon size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            {view !== 'home' && (
              <button 
                onClick={resetQuiz}
                className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
              >
                <RotateCcw size={18} />
                <span className="hidden sm:inline">Reset Quiz</span>
              </button>
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
            />
          )}

          {view === 'results' && (
            <ResultsView
              getAccuracy={getAccuracy}
              calculateScore={calculateScore}
              quizDuration={quizDuration}
              timeLeft={timeLeft}
              getResultGif={getResultGif}
              resetQuiz={resetQuiz}
              setView={setView}
              questionsLen={questions.length}
              formatTime={formatTime}
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
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2026 ProQuiz Master. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
