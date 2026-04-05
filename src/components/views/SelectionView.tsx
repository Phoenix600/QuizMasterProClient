import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Code, Layers, ChevronDown, Trophy, PlayCircle, BookOpen, FlaskConical, X } from 'lucide-react';
import { Course, Chapter, Quiz, QuizMode } from '../../types';

interface SelectionViewProps {
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  chapterQuizzes: Record<string, Quiz[]>;
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  selectedChapter: Chapter | null;
  setSelectedChapter: (chapter: Chapter | null) => void;
  selectedQuiz: Quiz | null;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  expandedChapters: Record<string, boolean>;
  toggleChapterExpansion: (chapterId: string) => void;
  startQuiz: (quizId: string, course?: Course | null, chapter?: Chapter | null, mode?: QuizMode) => void;
  fetchChaptersForCourse: (courseId: string) => void;
}

export const SelectionView: React.FC<SelectionViewProps> = ({
  courses,
  courseChapters,
  chapterQuizzes,
  selectedCourse,
  setSelectedCourse,
  selectedChapter,
  setSelectedChapter,
  selectedQuiz,
  setSelectedQuiz,
  expandedChapters,
  toggleChapterExpansion,
  startQuiz,
  fetchChaptersForCourse
}) => {
  const [pendingQuiz, setPendingQuiz] = useState<{ quiz: Quiz; chapter: Chapter } | null>(null);

  const handleModeSelect = (mode: QuizMode) => {
    if (!pendingQuiz) return;
    startQuiz(pendingQuiz.quiz._id, selectedCourse, pendingQuiz.chapter, mode);
    setPendingQuiz(null);
  };

  return (
    <>
    <motion.div
      key="selection"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          {selectedCourse && (
            <button 
              onClick={() => {
                setSelectedCourse(null);
                setSelectedChapter(null);
                setSelectedQuiz(null);
              }}
              className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h2 className="text-4xl font-bold text-white">
            {!selectedCourse ? 'Select Subject' : selectedCourse.title}
          </h2>
        </div>
        <p className="text-gray-400">
          {!selectedCourse 
            ? 'Choose a subject to start your learning journey' 
            : 'Select a chapter and quiz to test your knowledge'}
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {!selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <button
                key={course._id}
                onClick={() => {
                  setSelectedCourse(course);
                  fetchChaptersForCourse(course._id);
                }}
                className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl hover:border-orange-500/30 transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                  <Code size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{course.title}</h3>
                <p className="text-gray-500 text-sm relative z-10">{course.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {courseChapters[selectedCourse._id]?.map((chapter) => (
              <div key={chapter._id} className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleChapterExpansion(chapter._id)}
                  className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                      <Layers size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white">{chapter.title}</h3>
                      <p className="text-gray-500 text-sm">{chapter.description}</p>
                    </div>
                  </div>
                  <div className={`transition-transform duration-300 ${expandedChapters[chapter._id] ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} className="text-gray-500" />
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedChapters[chapter._id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {chapterQuizzes[chapter._id]?.map((quiz) => (
                          <button
                            key={quiz._id}
                            onClick={() => setPendingQuiz({ quiz, chapter })}
                            className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-xl hover:border-orange-500/30 hover:bg-white/[0.08] transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Trophy size={18} />
                              </div>
                              <div className="text-left">
                                <h4 className="font-bold text-white">{quiz.title}</h4>
                                <p className="text-xs text-gray-500">{quiz.timeLimit} mins • {quiz.passingScore}% to pass</p>
                              </div>
                            </div>
                            <PlayCircle size={20} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                          </button>
                        ))}
                        {(!chapterQuizzes[chapter._id] || chapterQuizzes[chapter._id].length === 0) && (
                          <div className="col-span-full py-8 text-center text-gray-600 italic">
                            No quizzes available for this chapter yet.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {(!courseChapters[selectedCourse._id] || courseChapters[selectedCourse._id].length === 0) && (
              <div className="py-20 text-center text-gray-500">
                No chapters found for this subject.
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>

      {/* Mode picker modal */}
      <AnimatePresence>
        {pendingQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mb-1">Choose Mode</p>
                  <h3 className="text-xl font-bold text-white">{pendingQuiz.quiz.title}</h3>
                </div>
                <button onClick={() => setPendingQuiz(null)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Training Mode */}
                <button
                  id="mode-training-btn"
                  onClick={() => handleModeSelect('training')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/60 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="text-blue-400" size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">Training</p>
                    <p className="text-gray-500 text-xs mt-1">See answers & explanations after each question</p>
                  </div>
                </button>

                {/* Test Mode */}
                <button
                  id="mode-test-btn"
                  onClick={() => handleModeSelect('test')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/60 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FlaskConical className="text-orange-400" size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">Test</p>
                    <p className="text-gray-500 text-xs mt-1">Get scored at the end — like a real exam</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
