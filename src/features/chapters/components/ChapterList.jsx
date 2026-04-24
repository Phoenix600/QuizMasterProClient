import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, ChevronDown, ChevronUp, PlayCircle, Trophy, Clock } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

const ChapterList = ({ 
  chapters, 
  expandedChapters, 
  toggleChapter, 
  chapterQuizzes, 
  onStartQuiz 
}) => {
  return (
    <div className="space-y-6">
      {chapters.map((chapter, index) => (
        <motion.div
          key={chapter._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card 
            className="p-0 overflow-hidden" 
            hover={false}
          >
            <div 
              onClick={() => toggleChapter(chapter._id)}
              className="p-8 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Layers size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-orange-500 transition-colors">
                    {chapter.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {chapter.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge variant="neutral" icon={Trophy}>
                  {chapterQuizzes[chapter._id]?.length || 0} Quizzes
                </Badge>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  {expandedChapters[chapter._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedChapters[chapter._id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 bg-white/[0.02]"
                >
                  <div className="p-8 space-y-4">
                    {chapterQuizzes[chapter._id]?.length > 0 ? (
                      chapterQuizzes[chapter._id].map((quiz) => (
                        <div 
                          key={quiz._id}
                          className="p-6 bg-[#1a1a1a] border border-white/5 rounded-2xl flex items-center justify-between hover:border-orange-500/50 transition-all group/quiz"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover/quiz:text-orange-500 transition-colors">
                              <Trophy size={20} />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white mb-2">{quiz.title}</h4>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-2 text-xs font-bold text-zinc-500 tracking-tight">
                                  <Clock size={14} />
                                  {quiz.timeLimit} mins
                                </span>
                                <span className="flex items-center gap-2 text-xs font-bold text-zinc-500 tracking-tight">
                                  <Trophy size={14} />
                                  Pass: {quiz.passingScore}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => onStartQuiz(quiz._id)}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                          >
                            <PlayCircle size={18} />
                            Start Quiz
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-500 font-bold text-sm tracking-tight">
                        No quizzes available for this chapter
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ChapterList;
