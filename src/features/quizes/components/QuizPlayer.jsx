import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Trophy, AlertCircle, Code } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

const QuizPlayer = ({ 
  quiz, 
  questions, 
  currentQuestionIndex, 
  setCurrentQuestionIndex, 
  answers, 
  handleAnswer, 
  timeLeft, 
  formatTime, 
  onSubmit 
}) => {
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Quiz Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform rotate-12">
            <Trophy className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
              {quiz.title}
            </h2>
            <div className="flex items-center gap-4">
              <Badge variant="neutral" icon={Clock}>
                {formatTime(timeLeft)} Remaining
              </Badge>
              <Badge variant="secondary" icon={AlertCircle}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="primary" 
            onClick={onSubmit}
            icon={CheckCircle2}
          >
            Submit Quiz
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20"
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="p-10" hover={false}>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-orange-500 uppercase tracking-widest">
                  <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    {currentQuestionIndex + 1}
                  </span>
                  Question
                </div>
                <h3 className="text-2xl font-bold text-white leading-relaxed">
                  {currentQuestion.questionText}
                </h3>
              </div>

              {currentQuestion.image && (
                <div className="rounded-2xl overflow-hidden border border-white/5">
                  <img 
                    src={currentQuestion.image} 
                    alt="Question" 
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {currentQuestion.codeSnippet && (
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] p-6 group relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg">
                    <Code size={12} />
                    {currentQuestion.programmingLanguage}
                  </div>
                  <SyntaxHighlighter
                    language={currentQuestion.programmingLanguage}
                    style={atomDark}
                    customStyle={{ background: 'transparent', padding: 0, margin: 0, fontSize: '14px' }}
                  >
                    {currentQuestion.codeSnippet}
                  </SyntaxHighlighter>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion._id]?.includes(index);
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className={`p-6 rounded-2xl border text-left transition-all group relative overflow-hidden ${
                        isSelected 
                          ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500' 
                          : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                          isSelected ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 group-hover:bg-white/10'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className={`font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                          {option.text}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div 
                          layoutId="selected-bg"
                          className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="secondary"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentQuestionIndex ? 'bg-orange-500 w-8' : 'bg-white/10 hover:bg-white/20'
              }`}
            />
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
          icon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default QuizPlayer;
