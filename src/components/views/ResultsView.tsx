import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, LayoutDashboard } from 'lucide-react';

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
  formatTime
}) => {
  const accuracy = getAccuracy();
  
  return (
    <motion.div 
      key="results"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto text-center space-y-12 py-12"
    >
      <div className="space-y-4">
        <h2 className="text-5xl font-black text-white tracking-tight">Quiz Complete!</h2>
        <p className="text-gray-400 text-xl">Here's how you performed today.</p>
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
    </motion.div>
  );
};
