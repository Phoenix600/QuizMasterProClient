import React from 'react';
import { motion } from 'motion/react';
import { Trophy, CheckCircle2, XCircle, RotateCcw, Home, Clock, AlertCircle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

const QuizResults = ({ result, quiz, onReset, onHome }) => {
  const isPassed = result.score >= quiz.passingScore;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="p-12 text-center space-y-8 overflow-hidden relative" hover={false}>
        {/* Background Glow */}
        <div className={`absolute inset-0 opacity-10 blur-3xl pointer-events-none ${isPassed ? 'bg-green-500' : 'bg-red-500'}`} />
        
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
              isPassed ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-red-500 text-white shadow-red-500/20'
            }`}
          >
            {isPassed ? <Trophy size={48} /> : <AlertCircle size={48} />}
          </motion.div>

          <div className="space-y-4">
            <h2 className={`text-4xl font-black uppercase italic tracking-tighter ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
              {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
            </h2>
            <p className="text-gray-400 text-lg font-medium">
              {isPassed 
                ? `You've successfully passed the ${quiz.title} quiz.` 
                : `You didn't reach the passing score for ${quiz.title}.`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Score</div>
              <div className={`text-3xl font-black ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                {result.score}%
              </div>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Correct</div>
              <div className="text-3xl font-black text-white">
                {result.correctAnswers} / {result.totalQuestions}
              </div>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Time Taken</div>
              <div className="text-3xl font-black text-white">
                {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              variant="primary" 
              onClick={onReset}
              icon={RotateCcw}
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>
            <Button 
              variant="secondary" 
              onClick={onHome}
              icon={Home}
              className="w-full sm:w-auto"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </Card>

      {/* Detailed Breakdown */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
            <CheckCircle2 size={18} />
          </div>
          Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8" hover={false}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <Clock size={20} />
              </div>
              <h4 className="text-lg font-bold text-white">Speed Analysis</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              You averaged {Math.round(result.timeTaken / result.totalQuestions)} seconds per question. 
              {result.timeTaken < quiz.timeLimit * 30 ? ' You finished very quickly!' : ' You took your time to consider each answer.'}
            </p>
          </Card>

          <Card className="p-8" hover={false}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                <Trophy size={20} />
              </div>
              <h4 className="text-lg font-bold text-white">Accuracy</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your accuracy rate was {result.score}%. 
              {result.score >= 90 ? ' Excellent mastery of the subject!' : result.score >= 70 ? ' Good understanding, but some room for improvement.' : ' Consider reviewing the course material again.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
