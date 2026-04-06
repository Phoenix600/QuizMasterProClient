import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, LayoutDashboard, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Lightbulb, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Question } from '../../types';

interface ResultsViewProps {
  getAccuracy: () => number;
  calculateScore: () => number;
  quizDuration: number;
  timeLeft: number;
  getResultGif: (accuracy: number) => string;
  resetQuiz: () => void;
  setView: (view: 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login') => void;
  questionsLen: number;
  formatTime: (seconds: number) => string;
  questions: Question[];
  answers: Record<string, number[]>;
  quizMode: 'test' | 'training';
  getLanguage: (subject: string | null, questionLanguage?: string) => string;
  selectedCourseTitle?: string | null;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  getAccuracy,
  calculateScore,
  quizDuration,
  timeLeft,
  getResultGif,
  resetQuiz,
  setView,
  questionsLen,
  formatTime,
  questions,
  answers,
  quizMode,
  getLanguage,
  selectedCourseTitle
}) => {
  const accuracy = getAccuracy();
  const [showReview, setShowReview] = React.useState(false);
  const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(new Set());

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedQuestions.size === questions.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(questions.map(q => q._id)));
    }
  };

  const getQuestionStatus = (question: Question) => {
    const userAnswers = answers[question._id] || [];
    if (userAnswers.length === 0) return 'skipped';

    const correctIndices = question.options
      .map((opt, idx) => (opt.isCorrect ? idx : -1))
      .filter((idx) => idx !== -1);

    const isCorrect =
      correctIndices.length === userAnswers.length &&
      correctIndices.every((idx) => userAnswers.includes(idx));

    return isCorrect ? 'correct' : 'incorrect';
  };

  return (
    <motion.div 
      key="results"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto text-center space-y-12 py-12"
    >
      <div className="space-y-4">
        <div className={`mx-auto w-fit px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border mb-4 ${
          quizMode === 'training'
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        }`}>
          {quizMode === 'training' ? 'Training Session Complete' : 'Test Session Complete'}
        </div>
        <h2 className="text-5xl font-black text-white tracking-tight leading-tight">Quiz Results</h2>
        <p className="text-gray-400 text-xl">Here's a detailed breakdown of your performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl space-y-2">
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Accuracy</p>
          <p className="text-5xl font-bold text-orange-500">{accuracy}%</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl space-y-2">
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Score</p>
          <p className="text-5xl font-bold text-emerald-500">{calculateScore()} / {questionsLen}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl space-y-2">
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Time Taken</p>
          <p className="text-5xl font-bold text-blue-500">{formatTime(quizDuration - timeLeft)}</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <img 
          src={getResultGif(accuracy)} 
          alt="Result Animation" 
          className="w-full h-80 object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="p-8 bg-gradient-to-t from-[#1a1a1a] to-transparent -mt-20 relative z-10">
          <h3 className="text-3xl font-bold text-white mb-4">
            {accuracy >= 80 ? "Outstanding Performance!" : accuracy >= 50 ? "Good Job!" : "Keep Practicing!"}
          </h3>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            {accuracy >= 80 
              ? "You've mastered these concepts. Your understanding of the subject is exceptional." 
              : accuracy >= 50 
                ? "You have a solid foundation, but there's still room for improvement in some areas." 
                : "Don't get discouraged! Review the material and try again to improve your score."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={resetQuiz}
              className="w-full sm:w-auto px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Retake Quiz
            </button>
            <button 
              onClick={() => setView('home')}
              className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={20} />
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Question Performance List */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl text-left">
        <button 
          onClick={() => setShowReview(!showReview)}
          className="w-full p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all group"
        >
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shrink-0 ${
              showReview ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/5 text-gray-500'
            }`}>
              <CheckCircle2 size={28} />
            </div>
            <div className="flex flex-col items-start justify-center text-left">
              <h3 className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors leading-none mb-2">Review Your Answers</h3>
              <p className="text-gray-500 text-sm font-medium leading-none">Detailed breakdown of each question in this session.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {showReview && (
              <button 
                onClick={toggleAll}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest relative z-10"
              >
                {expandedQuestions.size === questions.length ? 'Collapse All Details' : 'Reveal All Details'}
              </button>
            )}
            {showReview ? <ChevronUp className="text-gray-500" size={24} /> : <ChevronDown className="text-gray-500" size={24} />}
          </div>
        </button>
        
        {showReview && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="divide-y divide-white/5 border-t border-white/5"
          >
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q);
              const isExpanded = expandedQuestions.has(q._id);
              
              return (
                <div key={q._id} className="transition-all">
                  <button 
                    onClick={() => toggleQuestion(q._id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
                  >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      status === 'correct' 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : status === 'incorrect'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium line-clamp-1">{q.questionText}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {status === 'correct' && (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-emerald-500">
                            <CheckCircle2 size={12} /> Correct
                          </span>
                        )}
                        {status === 'incorrect' && (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-red-500">
                            <XCircle size={12} /> Incorrect
                          </span>
                        )}
                        {status === 'skipped' && (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-orange-500">
                            <AlertCircle size={12} /> Skipped
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="text-gray-500" size={20} /> : <ChevronDown className="text-gray-500" size={20} />}
                </button>

                {isExpanded && (
                  <div className="p-8 bg-white/[0.01] border-t border-white/5 space-y-6">
                    <div className="space-y-4">
                      <p className="text-white text-lg leading-relaxed">{q.questionText}</p>
                      
                      {q.codeSnippet && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                              <Code size={14} />
                              Source Snippet
                            </div>
                          </div>
                          <div className="p-2">
                            <SyntaxHighlighter
                              language={getLanguage(selectedCourseTitle || null, q.programmingLanguage)}
                              style={atomDark}
                              customStyle={{ background: 'transparent', padding: '1.5rem', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}
                              codeTagProps={{ style: { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' } }}
                            >
                              {q.codeSnippet}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-3">
                        {q.options.map((opt, optIdx) => {
                          const userSelected = answers[q._id]?.includes(optIdx);
                          const isCorrect = opt.isCorrect;
                          
                          let style = "bg-white/5 border-white/5 text-gray-400";
                          if (isCorrect) style = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                          else if (userSelected && !isCorrect) style = "bg-red-500/10 border-red-500/30 text-red-400";
                          
                          return (
                            <div key={optIdx} className={`p-4 rounded-xl border flex items-center justify-between ${style}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                  isCorrect ? 'bg-emerald-500 text-white' : userSelected ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-500'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="text-sm font-medium">{opt.text}</span>
                              </div>
                              {isCorrect && <CheckCircle2 size={16} />}
                              {userSelected && !isCorrect && <XCircle size={16} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
                          <Lightbulb size={16} />
                          Explanation
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

