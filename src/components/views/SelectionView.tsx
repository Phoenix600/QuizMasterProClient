import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Code, Layers, ChevronDown, Trophy, PlayCircle, BookOpen, FlaskConical, X, CheckCircle2, Terminal } from 'lucide-react';
import { Course, Chapter, Quiz, QuizMode, User, Problem } from '../../types';
import { cn } from '../../features/codegraph/lib/utils';

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
  onSelectProblem: (problemId: string) => void;
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
  onSelectProblem,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <button
                key={course._id}
                onClick={() => {
                  setSelectedCourse(course);
                  fetchChaptersForCourse(course._id);
                }}
                className="group relative flex flex-col h-full min-h-[320px] p-8 bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] hover:border-orange-500/40 hover:bg-white/[0.03] transition-all duration-500 text-left overflow-hidden shadow-2xl"
              >
                {/* Accent Background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.03] blur-[100px] -mr-24 -mt-24 rounded-full transition-all duration-700 group-hover:bg-orange-500/[0.1]"></div>
                
                {/* Icon Container */}
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 relative z-10 border ${
                  course.quizCount! > 0 && course.completedQuizCount === course.quizCount 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                    : 'bg-orange-500/10 text-orange-500 border-orange-500/10 group-hover:bg-orange-500/20'
                }`}>
                  {course.type === 'PROGRAMMING' ? <Terminal size={28} /> : <Code size={28} />}
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col items-stretch relative z-10">
                  {/* Top Section: Fixed height to keep everything below it aligned */}
                  <div className="min-h-[160px] flex flex-col">
                    <div className="flex items-start justify-between min-h-[80px]">
                      <h3 className="text-3xl font-black text-white leading-tight break-words group-hover:text-orange-500 transition-colors">
                        {course.title}
                      </h3>
                      {course.quizCount! > 0 && course.completedQuizCount === course.quizCount && (
                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1 shrink-0 ml-4">
                          <CheckCircle2 size={10} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Description with Hover Reveal */}
                    <div className="relative group/desc mt-2 cursor-help">
                      <p className="text-gray-500 text-sm leading-relaxed font-medium transition-all duration-300 line-clamp-2 group-hover/desc:line-clamp-none group-hover/desc:text-gray-300">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Stats Section: Pushed to bottom and aligned */}
                  <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
                    {/* Meta Stats Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center justify-center text-center px-1">
                        <div className="flex items-center gap-1">
                          <span className={`${course.completedChapterCount && course.completedChapterCount > 0 ? (course.completedChapterCount === course.chapterCount ? 'text-emerald-500' : 'text-orange-500') : 'text-white'} font-bold text-xl leading-none`}>
                            {course.completedChapterCount || 0}
                          </span>
                          <span className="text-gray-600 text-[11px] font-bold mt-1">/ {course.chapterCount || 0}</span>
                          {course.chapterCount! > 0 && course.completedChapterCount === course.chapterCount && (
                            <CheckCircle2 size={10} className="text-emerald-500 ml-0.5" />
                          )}
                        </div>
                        <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.15em] mt-1.5 opacity-60">Chapters</span>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center px-1 border-x border-white/5">
                        <div className="flex items-center gap-1">
                          <span className={`${(course.type === 'PROGRAMMING' ? course.completedProblemCount : course.completedQuizCount) && (course.type === 'PROGRAMMING' ? course.completedProblemCount : course.completedQuizCount) ! > 0 ? ((course.type === 'PROGRAMMING' ? course.completedProblemCount : course.completedQuizCount) === (course.type === 'PROGRAMMING' ? course.problemCount : course.quizCount) ? 'text-emerald-500' : 'text-orange-500') : 'text-white'} font-bold text-xl leading-none`}>
                            {course.type === 'PROGRAMMING' ? course.completedProblemCount || 0 : course.completedQuizCount || 0}
                          </span>
                          <span className="text-gray-600 text-[11px] font-bold mt-1">/ {course.type === 'PROGRAMMING' ? course.problemCount || 0 : course.quizCount || 0}</span>
                          {(course.type === 'PROGRAMMING' ? (course.problemCount! > 0 && course.completedProblemCount === course.problemCount) : (course.quizCount! > 0 && course.completedQuizCount === course.quizCount)) && (
                            <CheckCircle2 size={10} className="text-emerald-500 ml-0.5" />
                          )}
                        </div>
                        <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.15em] mt-1.5 opacity-60">
                          {course.type === 'PROGRAMMING' ? 'Problems' : 'Quizzes'}
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center px-1">
                        <span className="text-white font-bold text-xl leading-none">
                          {course.totalQuestions || 0}
                        </span>
                        <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.15em] mt-1.5 opacity-60">Questions</span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                        <span className="text-gray-500">Overall Progress</span>
                        <span className={`font-bold ${course.progress === 100 ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {course.progress || 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress || 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full shadow-[0_0_15px_rgba(249,115,22,0.4)] ${
                            course.progress === 100 ? 'bg-emerald-500' : 'bg-orange-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Indicator */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-orange-500/50 transition-colors">
                    <span>Explore Chapters</span>
                    <ChevronDown size={14} className="-rotate-90" />
                  </div>
                </div>
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      chapter.quizCount! > 0 && chapter.completedQuizCount === chapter.quizCount 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      <Layers size={20} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{chapter.title}</h3>
                        {chapter.isCompleted && (
                          <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-emerald-500 tracking-tighter uppercase mt-0.5">Chapter Completed</span>
                            <CheckCircle2 size={10} className="text-emerald-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          {selectedCourse.type === 'PROGRAMMING' 
                            ? `${chapter.problems?.length || 0} ${chapter.problems?.length === 1 ? 'Problem' : 'Problems'}`
                            : `${chapter.quizCount || 0} ${chapter.quizCount === 1 ? 'Quiz' : 'Quizzes'}`}
                        </span>
                        {((selectedCourse.type === 'PROGRAMMING' ? chapter.problemCount : chapter.quizCount) || 0) > 0 && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${chapter.isCompleted ? 'text-emerald-500' : 'text-orange-500/80'}`}>
                              {selectedCourse.type === 'PROGRAMMING' ? chapter.completedProblemCount || 0 : chapter.completedQuizCount || 0} Completed
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-1">{chapter.description}</p>
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
                        {selectedCourse.type === 'PROGRAMMING' ? (
                          chapter.problems?.map((problem) => (
                            <button
                              key={problem._id}
                              onClick={() => onSelectProblem(problem._id)}
                              className="flex items-center justify-between p-5 rounded-xl transition-all group relative overflow-hidden bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.08]"
                            >
                              <div className="flex items-center gap-4 flex-1 pr-6 pb-2">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all shrink-0 bg-blue-500/10 text-blue-500">
                                  <Code size={18} />
                                </div>
                                <div className="text-left min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-bold transition-colors line-clamp-2 text-white">
                                      {problem.title}
                                    </h4>
                                    <span className={cn(
                                      "text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                                      problem.difficulty === 'EASY' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" :
                                      problem.difficulty === 'MEDIUM' ? "border-orange-500/20 text-orange-500 bg-orange-500/5" :
                                      "border-red-500/20 text-red-500 bg-red-500/5"
                                    )}>
                                      {problem.difficulty}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 font-medium line-clamp-1">Coding Problem</p>
                                </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                                <PlayCircle size={20} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                              </div>
                            </button>
                          ))
                        ) : (
                          chapterQuizzes[chapter._id]?.map((quiz) => (
                            <button
                              key={quiz._id}
                              onClick={() => setPendingQuiz({ quiz, chapter })}
                              className={`flex items-center justify-between p-5 rounded-xl transition-all group relative overflow-hidden ${
                                quiz.isCompleted 
                                  ? 'bg-emerald-500/[0.03] border-emerald-500/20' 
                                  : 'bg-white/5 border-white/5 hover:border-orange-500/30 hover:bg-white/[0.08]'
                              } border`}
                            >
                              <div className="flex items-center gap-4 flex-1 pr-6 pb-2">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all shrink-0 ${
                                  quiz.isCompleted ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                                }`}>
                                  <Trophy size={18} />
                                </div>
                                <div className="text-left min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className={`font-bold transition-colors line-clamp-2 ${quiz.isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                      {quiz.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 font-medium">{quiz.timeLimit} mins • {quiz.passingScore}% to pass</p>
                                </div>
                              </div>
  
                              {quiz.isCompleted ? (
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">
                                      PASSED
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                                  <PlayCircle size={20} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                                </div>
                              )}
                            </button>
                          ))
                        )}
                        {((selectedCourse.type === 'PROGRAMMING' ? (!chapter.problems || chapter.problems.length === 0) : (!chapterQuizzes[chapter._id] || chapterQuizzes[chapter._id].length === 0))) && (
                          <div className="col-span-full py-8 text-center text-gray-600 italic">
                            No {selectedCourse.type === 'PROGRAMMING' ? 'problems' : 'quizzes'} available for this chapter yet.
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
