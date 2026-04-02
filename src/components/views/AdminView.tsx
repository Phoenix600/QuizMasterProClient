import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import { 
  ChevronLeft, Plus, Search, Code, Trash2, Layers, ChevronDown, Trophy, 
  AlertCircle, CheckCircle2, Save, PlusCircle, Edit 
} from 'lucide-react';
import * as api from '../../services/api';
import { Course, Chapter, Quiz, Question } from '../../types';

interface AdminViewProps {
  adminView: 'hierarchy' | 'questions';
  setAdminView: (val: 'hierarchy' | 'questions') => void;
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  chapterQuizzes: Record<string, Quiz[]>;
  adminSelectedCourse: Course | null;
  setAdminSelectedCourse: (val: Course | null) => void;
  adminSelectedChapter: Chapter | null;
  setAdminSelectedChapter: (val: Chapter | null) => void;
  adminSelectedQuiz: Quiz | null;
  setAdminSelectedQuiz: (val: Quiz | null) => void;
  expandedCourses: Record<string, boolean>;
  toggleCourseExpansion: (id: string) => void;
  expandedChapters: Record<string, boolean>;
  toggleChapterExpansion: (id: string) => void;
  courseSearch: string;
  setCourseSearch: (val: string) => void;
  showAddCourse: boolean;
  setShowAddCourse: (val: boolean) => void;
  newCourseData: { title: string; description: string };
  setNewCourseData: (val: { title: string; description: string }) => void;
  fetchInitialData: () => void;
  showAddChapter: boolean;
  setShowAddChapter: (val: boolean) => void;
  newChapterData: { title: string; description: string };
  setNewChapterData: (val: { title: string; description: string }) => void;
  fetchChaptersForCourse: (id: string) => void;
  showAddQuiz: boolean;
  setShowAddQuiz: (val: boolean) => void;
  newQuizData: { title: string; description: string; passingScore: number; timeLimit: number };
  setNewQuizData: (val: { title: string; description: string; passingScore: number; timeLimit: number }) => void;
  fetchQuizzesForChapter: (id: string) => void;
  quizQuestionCounts: Record<string, number>;
  questions: Question[];
  setQuestions: (val: Question[]) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (val: string | null) => void;
  newQuestion: Partial<Question>;
  setNewQuestion: (val: Partial<Question>) => void;
  handleAddQuestion: (e: React.FormEvent) => void;
  handleEditClick: (q: Question) => void;
  handleDeleteQuestion: (id: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  adminView, setAdminView, courses, courseChapters, chapterQuizzes,
  adminSelectedCourse, setAdminSelectedCourse,
  adminSelectedChapter, setAdminSelectedChapter,
  adminSelectedQuiz, setAdminSelectedQuiz,
  expandedCourses, toggleCourseExpansion,
  expandedChapters, toggleChapterExpansion,
  courseSearch, setCourseSearch,
  showAddCourse, setShowAddCourse, newCourseData, setNewCourseData, fetchInitialData,
  showAddChapter, setShowAddChapter, newChapterData, setNewChapterData, fetchChaptersForCourse,
  showAddQuiz, setShowAddQuiz, newQuizData, setNewQuizData, fetchQuizzesForChapter,
  quizQuestionCounts,
  questions, setQuestions,
  editingQuestionId, setEditingQuestionId,
  newQuestion, setNewQuestion,
  handleAddQuestion, handleEditClick, handleDeleteQuestion
}) => {
  return (
    <motion.div 
      key="admin"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-12"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight">
            {adminView === 'hierarchy' ? 'Manage Hierarchy' : 'Manage Questions'}
          </h2>
          <p className="text-gray-400">
            {adminView === 'hierarchy' 
              ? 'Manage your courses, chapters, and quizzes.' 
              : `Editing questions for ${adminSelectedQuiz?.title}`}
          </p>
        </div>
        {adminView === 'questions' && (
          <button 
            onClick={() => setAdminView('hierarchy')}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Back to Hierarchy
          </button>
        )}
      </div>

      {adminView === 'hierarchy' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Courses</h3>
                <button 
                  onClick={() => setShowAddCourse(true)}
                  className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-all"
                  title="Add Course"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="space-y-2 h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                {courses
                  .filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                  .map((course) => (
                    <div
                      key={course._id}
                      onClick={() => {
                        setAdminSelectedCourse(course);
                        if (!expandedCourses[course._id]) {
                          toggleCourseExpansion(course._id);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden cursor-pointer ${
                        adminSelectedCourse?._id === course._id 
                          ? 'bg-orange-500/10 border-orange-500/50 text-white' 
                          : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-400'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setAdminSelectedCourse(course);
                          if (!expandedCourses[course._id]) {
                            toggleCourseExpansion(course._id);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            adminSelectedCourse?._id === course._id ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-500'
                          }`}>
                            <Code size={16} />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-sm truncate">{course.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">{course.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this course?')) {
                                await api.deleteCourse(course._id);
                                if (adminSelectedCourse?._id === course._id) setAdminSelectedCourse(null);
                                fetchInitialData();
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {courses.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-sm italic">
                    No courses found.
                  </div>
                )}
              </div>
            </div>

            {showAddCourse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-6 space-y-4"
              >
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Course</h4>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Title"
                    value={newCourseData.title}
                    onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <textarea 
                    placeholder="Description"
                    value={newCourseData.description}
                    onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors h-20 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      if (newCourseData.title) {
                        await api.createCourse(newCourseData.title, newCourseData.description);
                        setShowAddCourse(false);
                        setNewCourseData({ title: '', description: '' });
                        fetchInitialData();
                      }
                    }}
                    className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-xs"
                  >
                    Create
                  </button>
                  <button 
                    onClick={() => setShowAddCourse(false)}
                    className="px-4 py-2 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {adminSelectedCourse ? (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
                        <Code size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{adminSelectedCourse.title}</h3>
                        <p className="text-gray-500 text-sm">{adminSelectedCourse.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddChapter(true)}
                      className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add Chapter
                    </button>
                  </div>

                  <div className="space-y-4 h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                    {courseChapters[adminSelectedCourse._id]?.map((chapter) => (
                      <div key={chapter._id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden group/chapter">
                        <div className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                              <Layers size={20} />
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg font-bold text-white">{chapter.title}</h4>
                              <p className="text-gray-500 text-xs">{chapter.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this chapter?')) {
                                  await api.deleteChapter(chapter._id);
                                  fetchChaptersForCourse(adminSelectedCourse._id);
                                }
                              }}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              onClick={() => toggleChapterExpansion(chapter._id)}
                              className={`p-2 rounded-lg transition-all ${expandedChapters[chapter._id] ? 'bg-blue-500/10 text-blue-500' : 'text-gray-500 hover:bg-white/5'}`}
                            >
                              <ChevronDown size={20} className={`transition-transform duration-300 ${expandedChapters[chapter._id] ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedChapters[chapter._id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-white/5 bg-black/20"
                            >
                              <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quizzes</h5>
                                  <button 
                                    onClick={() => {
                                      setAdminSelectedChapter(chapter);
                                      setShowAddQuiz(true);
                                    }}
                                    className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors"
                                  >
                                    + Add Quiz
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {chapterQuizzes[chapter._id]?.map((quiz) => (
                                    <div 
                                      key={quiz._id} 
                                      onClick={() => {
                                        setAdminSelectedQuiz(quiz);
                                        setAdminView('questions');
                                        api.getQuestions(quiz._id).then(setQuestions);
                                      }}
                                      className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl group/quiz cursor-pointer hover:border-orange-500/30 hover:bg-white/[0.08] transition-all"
                                    >
                                      <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
                                        <Trophy size={18} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-200 truncate group-hover/quiz:text-white transition-colors">
                                          {quiz.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                          {quiz.timeLimit}m • {quiz.passingScore}% pass • {quizQuestionCounts[quiz._id] || 0} Questions
                                        </p>
                                      </div>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm('Are you sure you want to delete this quiz?')) {
                                            api.deleteQuiz(quiz._id).then(() => fetchQuizzesForChapter(chapter._id));
                                          }
                                        }}
                                        className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover/quiz:opacity-100 transition-all"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  {(!chapterQuizzes[chapter._id] || chapterQuizzes[chapter._id].length === 0) && (
                                    <div className="col-span-full py-4 text-center text-gray-600 text-xs italic">
                                      No quizzes added yet.
                                    </div>
                                  )}
                                </div>

                                {showAddQuiz && adminSelectedChapter?._id === chapter._id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/5 border border-orange-500/30 rounded-2xl p-6 space-y-4 mt-4"
                                  >
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Quiz</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-3 md:col-span-2">
                                        <input 
                                          type="text" 
                                          placeholder="Quiz Title"
                                          value={newQuizData.title}
                                          onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                        <textarea 
                                          placeholder="Description"
                                          value={newQuizData.description}
                                          onChange={(e) => setNewQuizData({ ...newQuizData, description: e.target.value })}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors h-20 resize-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Time (mins)</label>
                                        <input 
                                          type="number" 
                                          value={newQuizData.timeLimit}
                                          onChange={(e) => setNewQuizData({ ...newQuizData, timeLimit: parseInt(e.target.value) })}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Pass Score %</label>
                                        <input 
                                          type="number" 
                                          value={newQuizData.passingScore}
                                          onChange={(e) => setNewQuizData({ ...newQuizData, passingScore: parseInt(e.target.value) })}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={async () => {
                                          if (newQuizData.title && adminSelectedCourse) {
                                            await api.createQuiz(chapter._id, adminSelectedCourse._id, newQuizData.title, newQuizData.description, newQuizData.passingScore, newQuizData.timeLimit);
                                            setShowAddQuiz(false);
                                            setNewQuizData({ title: '', description: '', passingScore: 70, timeLimit: 15 });
                                            fetchQuizzesForChapter(chapter._id);
                                          }
                                        }}
                                        className="flex-1 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-xs uppercase tracking-widest"
                                      >
                                        Create Quiz
                                      </button>
                                      <button 
                                        onClick={() => setShowAddQuiz(false)}
                                        className="px-6 py-2.5 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {showAddChapter ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-blue-500/30 rounded-3xl p-8 space-y-6"
                      >
                        <h4 className="text-lg font-bold text-white">New Chapter</h4>
                        <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="Chapter Title"
                            value={newChapterData.title}
                            onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <textarea 
                            placeholder="Description"
                            value={newChapterData.description}
                            onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={async () => {
                              if (newChapterData.title && adminSelectedCourse) {
                                await api.createChapter(adminSelectedCourse._id, newChapterData.title, newChapterData.description);
                                setShowAddChapter(false);
                                setNewChapterData({ title: '', description: '' });
                                fetchChaptersForCourse(adminSelectedCourse._id);
                              }
                            }}
                            className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all"
                          >
                            Create Chapter
                          </button>
                          <button 
                            onClick={() => setShowAddChapter(false)}
                            className="px-6 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setShowAddChapter(true)}
                        className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all group"
                      >
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={20} />
                        </div>
                        <span className="font-bold">Add New Chapter</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-600">
                  <Layers size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">No Course Selected</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Select a course from the left panel to manage its chapters and quizzes.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {editingQuestionId ? 'Edit Question' : 'Add New Question'}
              </h3>
              {adminSelectedQuiz && (
                <div className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-sm font-bold">
                  Quiz: {adminSelectedQuiz.title}
                </div>
              )}
            </div>

            {!adminSelectedQuiz ? (
              <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <AlertCircle className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">Please select a quiz from the Hierarchy tab first.</p>
                <button 
                  onClick={() => setAdminView('hierarchy')}
                  className="mt-6 px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                >
                  Go to Hierarchy
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddQuestion} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question Text</label>
                    <textarea
                      required
                      value={newQuestion.questionText}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-orange-500 transition-all min-h-[150px]"
                      placeholder="Enter your question here..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Code Snippet (Optional)</label>
                    <div className="border border-white/10 rounded-2xl overflow-hidden h-[250px]">
                      <Editor
                        height="100%"
                        language={newQuestion.programmingLanguage}
                        theme="vs-dark"
                        value={newQuestion.codeSnippet}
                        onChange={(value) => setNewQuestion({ ...newQuestion, codeSnippet: value })}
                        onMount={(editor, monaco) => {
                          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                            noSemanticValidation: true,
                            noSyntaxValidation: true,
                          });
                          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                            noSemanticValidation: true,
                            noSyntaxValidation: true,
                          });
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: { top: 10, bottom: 10 },
                          wordWrap: 'on'
                        }}
                      />
                    </div>
                    <div className="flex gap-4">
                      <select
                        value={newQuestion.programmingLanguage}
                        onChange={(e) => setNewQuestion({ ...newQuestion, programmingLanguage: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                        <option value="sql">SQL</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {newQuestion.options?.map((option, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Option {idx + 1}</label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => {
                              const updatedOptions = [...(newQuestion.options || [])];
                              updatedOptions[idx].isCorrect = e.target.checked;
                              setNewQuestion({ 
                                ...newQuestion, 
                                options: updatedOptions,
                                numberOfCorrectAnswers: updatedOptions.filter(o => o.isCorrect).length
                              });
                            }}
                            className="hidden"
                          />
                          <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${option.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'}`}>
                            {option.isCorrect && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${option.isCorrect ? 'text-emerald-500' : 'text-gray-500'}`}>
                            Correct Answer
                          </span>
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        value={option.text}
                        onChange={(e) => {
                          const updatedOptions = [...(newQuestion.options || [])];
                          updatedOptions[idx].text = e.target.value;
                          setNewQuestion({ ...newQuestion, options: updatedOptions });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                        placeholder={`Enter option ${idx + 1}...`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                  >
                    {editingQuestionId ? <Save size={20} /> : <PlusCircle size={20} />}
                    {editingQuestionId ? 'Update Question' : 'Add Question'}
                  </button>
                  {editingQuestionId && (
                    <button
                      type="button"
                      onClick={() => {
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
                      }}
                      className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {adminSelectedQuiz && questions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Existing Questions ({questions.length})</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {questions.map((q, idx) => (
                  <div key={q._id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium line-clamp-1 max-w-xl">{q.questionText}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{q.options.length} Options</span>
                          <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            {q.numberOfCorrectAnswers} Correct
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(q)}
                        className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="p-3 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
