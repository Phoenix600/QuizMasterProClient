import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './features/auth/hooks/useAuth';
import * as quizesApi from './features/quizes/quizes.api';
import * as adminApi from './features/admin/admin.api';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/layout/Header';
import Container from './components/layout/Container';
import Loader from './components/ui/Loader';
import LoginForm from './features/auth/components/LoginForm';
import Home from './features/dashboard/components/Home';
import CourseList from './features/courses/components/CourseList';
import ChapterList from './features/chapters/components/ChapterList';
import QuizPlayer from './features/quizes/components/QuizPlayer';
import QuizResults from './features/results/components/QuizResults';
import AdminDashboard from './features/admin/components/AdminDashboard';

type View = 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login';

export default function App() {
  const { currentUser, isAdmin, isLoading: isAuthLoading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection state
  const [courses, setCourses] = useState([]);
  const [courseChapters, setCourseChapters] = useState({});
  const [chapterQuizzes, setChapterQuizzes] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizDuration, setQuizDuration] = useState(0);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (!isAuthLoading) {
      if (currentUser && view === 'login') {
        setView(isAdmin ? 'admin' : 'home');
      }
      fetchCourses();
    }
  }, [isAuthLoading, currentUser]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'quiz' && timeLeft > 0 && !quizResult) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (view === 'quiz' && timeLeft === 0 && !quizResult) {
      handleSubmitQuiz();
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, quizResult]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    try {
      setIsLoading(true);
      const chapters = await adminApi.getChapters(course._id);
      setCourseChapters(prev => ({ ...prev, [course._id]: chapters }));
    } catch (err) {
      console.error('Failed to fetch chapters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChapter = async (chapterId) => {
    const isExpanding = !expandedChapters[chapterId];
    setExpandedChapters(prev => ({ ...prev, [chapterId]: isExpanding }));
    if (isExpanding && !chapterQuizzes[chapterId]) {
      try {
        const quizzes = await adminApi.getQuizzes(chapterId);
        setChapterQuizzes(prev => ({ ...prev, [chapterId]: quizzes }));
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
      }
    }
  };

  const handleStartQuiz = async (quizId) => {
    try {
      setIsLoading(true);
      const { quiz, questions: quizQuestions } = await quizesApi.getQuizWithQuestions(quizId);
      setQuestions(quizQuestions);
      setSelectedQuiz(quiz);
      
      const duration = quiz.timeLimit * 60;
      setTimeLeft(duration);
      setQuizDuration(duration);
      
      setCurrentQuestionIndex(0);
      setAnswers({});
      setQuizResult(null);
      setView('quiz');
    } catch (err) {
      console.error('Failed to start quiz:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (optionIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion._id;
    const currentAnswers = answers[questionId] || [];
    
    let newAnswers;
    if (currentQuestion.numberOfCorrectAnswers > 1) {
      if (currentAnswers.includes(optionIndex)) {
        newAnswers = currentAnswers.filter(idx => idx !== optionIndex);
      } else {
        newAnswers = [...currentAnswers, optionIndex];
      }
    } else {
      newAnswers = [optionIndex];
    }
    
    setAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;
    try {
      setIsLoading(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions
      }));
      
      const result = await quizesApi.submitQuiz(selectedQuiz._id, formattedAnswers, quizDuration - timeLeft);
      setQuizResult(result);
      setView('results');
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isAuthLoading) return <Loader fullScreen />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-orange-500/30">
        <Header 
          onNavigate={(v) => {
            if (v === 'home') {
              setSelectedCourse(null);
              setSelectedQuiz(null);
            }
            setView(v);
          }} 
          currentView={view} 
        />
        
        <main className="pt-32 pb-20">
          <Container>
            <AnimatePresence mode="wait">
              {isLoading && <Loader fullScreen />}
              
              {view === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <LoginForm onAuthSuccess={() => setView(isAdmin ? 'admin' : 'home')} />
                </motion.div>
              )}

              {view === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Home 
                    currentUser={currentUser} 
                    onStart={() => setView(currentUser ? 'selection' : 'login')} 
                  />
                </motion.div>
              )}

              {view === 'selection' && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  {!selectedCourse ? (
                    <div className="space-y-12">
                      <div className="text-center space-y-4">
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter">Available Courses</h2>
                        <p className="text-gray-400 font-medium max-w-2xl mx-auto">
                          Choose a course to begin your learning journey. Each course contains multiple chapters and quizzes.
                        </p>
                      </div>
                      <CourseList courses={courses} onSelectCourse={handleSelectCourse} />
                    </div>
                  ) : (
                    <div className="space-y-12">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedCourse(null)}
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
                        >
                          Back to Courses
                        </button>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">{selectedCourse.title}</h2>
                        <div className="w-20" />
                      </div>
                      <ChapterList 
                        chapters={courseChapters[selectedCourse._id] || []}
                        expandedChapters={expandedChapters}
                        toggleChapter={toggleChapter}
                        chapterQuizzes={chapterQuizzes}
                        onStartQuiz={handleStartQuiz}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {view === 'quiz' && selectedQuiz && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <QuizPlayer 
                    quiz={selectedQuiz}
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    answers={answers}
                    handleAnswer={handleAnswer}
                    timeLeft={timeLeft}
                    formatTime={formatTime}
                    onSubmit={handleSubmitQuiz}
                  />
                </motion.div>
              )}

              {view === 'results' && quizResult && selectedQuiz && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <QuizResults 
                    result={quizResult}
                    quiz={selectedQuiz}
                    onReset={() => handleStartQuiz(selectedQuiz._id)}
                    onHome={() => {
                      setSelectedCourse(null);
                      setSelectedQuiz(null);
                      setView('home');
                    }}
                  />
                </motion.div>
              )}

              {view === 'admin' && isAdmin && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AdminDashboard />
                </motion.div>
              )}
            </AnimatePresence>
          </Container>
        </main>
      </div>
    </ErrorBoundary>
  );
}
