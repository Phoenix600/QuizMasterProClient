import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Code, BookOpen, FlaskConical, Lightbulb, RotateCcw } from 'lucide-react';
import { Course, Chapter, Quiz, Question, QuizMode } from '../../types';

interface QuizViewProps {
  questions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  answers: Record<string, number[]>;
  handleAnswer: (optionIndex: number) => void;
  timeLeft: number;
  quizDuration: number;
  isSubmitted: boolean;
  setIsSubmitted: (val: boolean) => void;
  setView: (view: 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login') => void;
  selectedCourse: Course | null;
  selectedChapter: Chapter | null;
  selectedQuiz: Quiz | null;
  formatTime: (seconds: number) => string;
  getLanguage: (subject: string | null, questionLanguage?: string) => string;
  submitQuiz: () => void;
  quizMode: QuizMode;
  retakeQuestion: (questionId: string) => void;
}

// Shake animation for wrong answer
const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -10, 10, -6, 6, -3, 3, 0],
    transition: { duration: 0.5, ease: 'easeInOut' as any },
  },
};

// Bounce / pop animation for correct answer
const bounceVariants = {
  idle: { scale: 1 },
  bounce: {
    scale: [1, 1.06, 0.97, 1.03, 1],
    transition: { duration: 0.45, ease: 'easeInOut' as any },
  },
};

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  handleAnswer,
  timeLeft,
  quizDuration,
  isSubmitted,
  setIsSubmitted,
  setView,
  selectedCourse,
  selectedChapter,
  selectedQuiz,
  formatTime,
  getLanguage,
  submitQuiz,
  quizMode,
  retakeQuestion,
}) => {
  // Training-mode state
  const [revealedQuestions, setRevealedQuestions] = useState<Set<string>>(new Set());
  // Per-option animation state: { questionId: optionIndex }
  const [animatingOption, setAnimatingOption] = useState<{ qId: string; idx: number; result: 'correct' | 'incorrect' } | null>(null);

  const handleRetake = () => {
    retakeQuestion(currentQuestion._id);
    setRevealedQuestions(prev => {
      const next = new Set(prev);
      next.delete(currentQuestion._id);
      return next;
    });
    setAnimatingOption(null);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswers = answers[currentQuestion._id] || [];
  const isRevealed = quizMode === 'training' && revealedQuestions.has(currentQuestion._id);

  const isOptionCorrect = (idx: number) => currentQuestion.options[idx]?.isCorrect;

  // ─── Training mode: click selects AND immediately reveals ───
  const handleTrainingAnswer = (optionIndex: number) => {
    if (isRevealed) return; // already answered
    handleAnswer(optionIndex); // record answer

    const correct = currentQuestion.options[optionIndex]?.isCorrect;
    setAnimatingOption({ qId: currentQuestion._id, idx: optionIndex, result: correct ? 'correct' : 'incorrect' });

    // After animation finishes, reveal the answer
    setTimeout(() => {
      setRevealedQuestions(prev => new Set(prev).add(currentQuestion._id));
      setAnimatingOption(null);
    }, 520);
  };

  // ─── Option colour logic ───
  const getOptionStyle = (idx: number) => {
    const isSelected = currentAnswers.includes(idx);

    if (!isRevealed) {
      // Pre-reveal: highlight selected, dim others if something is selected
      if (currentAnswers.length > 0 && !isSelected) return 'bg-white/5 border-white/5 text-gray-500 opacity-50 cursor-not-allowed';
      return isSelected
        ? 'bg-orange-500/10 border-orange-500 text-white'
        : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300';
    }

    // Post-reveal
    if (isOptionCorrect(idx)) return 'bg-emerald-500/15 border-emerald-500 text-white';
    if (isSelected && !isOptionCorrect(idx)) return 'bg-red-500/15 border-red-500 text-white opacity-90';
    return 'bg-white/5 border-white/10 text-gray-500 opacity-50';
  };

  const getIconForOption = (idx: number) => {
    const isSelected = currentAnswers.includes(idx);
    if (!isRevealed && isSelected) return <CheckCircle2 className="text-orange-500 shrink-0" size={20} />;
    if (isRevealed && isOptionCorrect(idx)) return <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />;
    if (isRevealed && isSelected && !isOptionCorrect(idx)) return <XCircle className="text-red-500 shrink-0" size={20} />;
    return null;
  };

  return (
    <motion.div
      key="quiz"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-8"
    >
      <div className="lg:col-span-3 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-white">Overview</h2>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
            quizMode === 'training'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
          }`}>
            {quizMode === 'training' ? <BookOpen size={12} /> : <FlaskConical size={12} />}
            {quizMode === 'training' ? 'Training Mode' : 'Test Mode'}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Total Questions</p>
            <p className="text-2xl font-bold text-white">{questions.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Attempted</p>
            <p className="text-2xl font-bold text-orange-500">{Object.keys(answers).length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Time Remaining</p>
            <p className={`text-2xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
              {formatTime(timeLeft)}
            </p>
            <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
              <motion.div
                className="h-full bg-orange-500"
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / quizDuration) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Status</p>
            <p className="text-2xl font-bold text-emerald-500">Active</p>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-full uppercase tracking-widest">
                {selectedCourse?.title}
              </span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400 text-sm font-medium">{selectedChapter?.title}</span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400 text-sm font-medium">{selectedQuiz?.title}</span>
            </div>
            <span className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-full uppercase tracking-widest">
              Question {currentQuestionIndex + 1}
            </span>
          </div>

          <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
            {currentQuestion.questionText}
          </h3>

          {currentQuestion.image && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">
              <img
                src={currentQuestion.image}
                alt="Question illustration"
                className="w-full h-auto max-h-[400px] object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {currentQuestion.codeSnippet && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Code size={14} />
                  {selectedCourse?.title} Snippet
                </div>
              </div>
              <div className="p-2">
                <SyntaxHighlighter
                  language={getLanguage(selectedCourse?.title || null, currentQuestion.programmingLanguage)}
                  style={atomDark}
                  customStyle={{ background: 'transparent', padding: '1.5rem', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}
                  codeTagProps={{ style: { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' } }}
                >
                  {currentQuestion.codeSnippet}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isThisAnimating =
                animatingOption?.qId === currentQuestion._id && animatingOption.idx === idx;
              const animResult = isThisAnimating ? animatingOption!.result : null;

              return (
                <motion.button
                  key={idx}
                  variants={animResult === 'incorrect' ? shakeVariants : animResult === 'correct' ? bounceVariants : {}}
                  animate={animResult === 'incorrect' ? 'shake' : animResult === 'correct' ? 'bounce' : 'idle'}
                  onClick={() =>
                    quizMode === 'training' ? handleTrainingAnswer(idx) : handleAnswer(idx)
                  }
                  disabled={isRevealed || (quizMode === 'training' && currentAnswers.length > 0 && !currentAnswers.includes(idx))}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${getOptionStyle(idx)}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      isRevealed && isOptionCorrect(idx)
                        ? 'bg-emerald-500 text-white'
                        : isRevealed && currentAnswers.includes(idx) && !isOptionCorrect(idx)
                          ? 'bg-red-500 text-white'
                          : currentAnswers.includes(idx)
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/10 text-gray-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-lg">{option.text}</span>
                  </div>
                  {getIconForOption(idx)}
                </motion.button>
              );
            })}
          </div>

          {/* ── Training: result flash + explanation ── */}
          {quizMode === 'training' && (
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  key="explanation-block"
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="mt-8 space-y-4"
                >
                  {/* Result banner */}
                  <div className="flex items-center justify-between gap-4">
                    {(() => {
                      const userGotItRight = currentAnswers.some(idx => currentQuestion.options[idx]?.isCorrect);
                      return userGotItRight ? (
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                          className="flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold"
                        >
                          <CheckCircle2 size={20} className="shrink-0" />
                          Correct! Well done 🎉
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                          className="flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold"
                        >
                          <XCircle size={20} className="shrink-0" />
                          Incorrect — check the highlighted answer above
                        </motion.div>
                      );
                    })()}

                    <button
                      onClick={handleRetake}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all text-sm font-bold shrink-0"
                    >
                      <RotateCcw size={16} />
                      Retake
                    </button>
                  </div>

                  {/* Explanation */}
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-widest">
                      <Lightbulb size={16} />
                      Explanation
                    </div>
                    {currentQuestion.explanation ? (
                      <p className="text-gray-300 leading-relaxed">{currentQuestion.explanation}</p>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No explanation provided for this question.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
              Prev
            </button>

            {quizMode === 'training' ? (
              currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  disabled={!isRevealed}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Finish Training
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={!isRevealed}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next Question
                  <ChevronRight size={20} />
                </button>
              )
            ) : (
              currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 transition-all"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                >
                  Next Question
                  <ChevronRight size={20} />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Question palette</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-3">
            {questions.map((q, idx) => {
              const isAnswered = answers[q._id] && answers[q._id].length > 0;
              const isCurrent = currentQuestionIndex === idx;
              const isRevealedQ = quizMode === 'training' && revealedQuestions.has(q._id);

              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    isCurrent
                      ? 'bg-orange-500 text-white ring-4 ring-orange-500/20'
                      : isRevealedQ
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : isAnswered
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-gray-500 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`rounded-3xl p-6 border ${
          quizMode === 'training'
            ? 'bg-blue-500/5 border-blue-500/10'
            : 'bg-orange-500/5 border-orange-500/10'
        }`}>
          <p className={`text-sm leading-relaxed ${quizMode === 'training' ? 'text-blue-400/80' : 'text-orange-500/80'}`}>
            {quizMode === 'training'
              ? '📖 Training mode: Click an option — you\'ll instantly see if you\'re right along with an explanation.'
              : '⏱ Test mode: Answer all questions then submit at the end.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
