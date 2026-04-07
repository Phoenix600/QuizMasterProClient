import React from 'react';
import { 
  Plus, Trash2, Edit, Save, PlusCircle, BookOpen, Layers, ChevronUp, ChevronDown, CheckCircle2, Settings, ChevronRight, Minimize2, Maximize2, AlertCircle, Search
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Chapter, Question } from '../../types';
import * as api from '../../services/api';

interface QuestionBankEditorProps {
  editingQuestionId: string | null;
  setEditingQuestionId: (val: string | null) => void;
  newQuestion: Partial<Question>;
  setNewQuestion: (val: Partial<Question>) => void;
  handleAddQuestion: (e: React.FormEvent) => void;
  handleEditClick: (q: Question) => void;
  handleDeleteQuestion: (id: string) => void;
  questions: Question[];
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  adminSelectedCourse: Course | null;
  setAdminSelectedCourse: (val: Course | null) => void;
  adminSelectedChapter: Chapter | null;
  setAdminSelectedChapter: (val: Chapter | null) => void;
  fetchChaptersForCourse: (id: string) => void;
  setQuestions: (val: Question[]) => void;
  showCourseDrop: boolean;
  setShowCourseDrop: (val: boolean) => void;
  showChapterDrop: boolean;
  setShowChapterDrop: (val: boolean) => void;
  poolSearch: string;
  setPoolSearch: (val: string) => void;
  poolChapterFilter: string;
  setPoolChapterFilter: (val: string) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  isCodeFullscreen: boolean;
  setIsCodeFullscreen: (val: boolean) => void;
}

export const QuestionBankEditor: React.FC<QuestionBankEditorProps> = ({
  editingQuestionId, setEditingQuestionId, newQuestion, setNewQuestion,
  handleAddQuestion, handleEditClick, handleDeleteQuestion,
  questions, courses, courseChapters,
  adminSelectedCourse, setAdminSelectedCourse,
  adminSelectedChapter, setAdminSelectedChapter,
  fetchChaptersForCourse, setQuestions,
  showCourseDrop, setShowCourseDrop,
  showChapterDrop, setShowChapterDrop,
  poolSearch, setPoolSearch,
  poolChapterFilter, setPoolChapterFilter,
  openConfirm, isCodeFullscreen, setIsCodeFullscreen
}) => {
  const [showLangDrop, setShowLangDrop] = React.useState(false);
  const [showFilterDrop, setShowFilterDrop] = React.useState(false);
  
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'sql', label: 'SQL' },
  ];
  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">
          {editingQuestionId ? 'Edit Pool Question' : 'Add New Question to Pool'}
        </h3>
      </div>
      <div className="space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-white/5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">
              <Settings size={12} className="text-orange-500" />
              Target Destination
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative z-[60] min-w-[280px]">
                <button
                  onClick={() => setShowCourseDrop(!showCourseDrop)}
                  className="w-full flex items-center justify-between bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-2xl pl-12 pr-6 py-3.5 transition-all group relative"
                >
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                  <span className="text-xs font-black text-white uppercase tracking-widest truncate max-w-[180px]">
                    {adminSelectedCourse?.title || 'Select Course'}
                  </span>
                  <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100">
                    <ChevronUp size={10} className="text-orange-500" />
                    <ChevronDown size={10} className="text-orange-500" />
                  </div>
                </button>
                
                <AnimatePresence>
                  {showCourseDrop && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCourseDrop(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-20 top-full left-0 right-0 mt-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
                      >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar-orange">
                          {courses.map(c => (
                            <button
                              key={c._id}
                              onClick={() => {
                                setAdminSelectedCourse(c);
                                fetchChaptersForCourse(c._id);
                                setAdminSelectedChapter(null);
                                api.getCourseQuestions(c._id).then(setQuestions);
                                setPoolChapterFilter('all');
                                setShowCourseDrop(false);
                              }}
                              className={`w-full text-left px-5 py-4 rounded-xl transition-all flex items-center justify-between group/item ${
                                adminSelectedCourse?._id === c._id ? 'bg-orange-500/10 text-orange-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="text-xs font-bold uppercase tracking-widest">{c.title}</span>
                              {adminSelectedCourse?._id === c._id && <CheckCircle2 size={14} />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <ChevronRight size={18} className="text-gray-800" />

              <div className="relative z-[50] min-w-[280px]">
                <button
                  onClick={() => setShowChapterDrop(!showChapterDrop)}
                  disabled={!adminSelectedCourse}
                  className={`w-full flex items-center justify-between border rounded-2xl pl-12 pr-6 py-3.5 transition-all group relative ${
                    !adminSelectedCourse 
                      ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed' 
                      : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 cursor-pointer'
                  }`}
                >
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                  <span className="text-xs font-black text-white uppercase tracking-widest truncate max-w-[180px]">
                    {adminSelectedChapter?.title || 'Select Chapter'}
                  </span>
                  <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100">
                    <ChevronUp size={10} className="text-blue-500" />
                    <ChevronDown size={10} className="text-blue-500" />
                  </div>
                </button>

                <AnimatePresence>
                  {showChapterDrop && adminSelectedCourse && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowChapterDrop(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-20 top-full left-0 right-0 mt-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
                      >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar-blue">
                          {(courseChapters[adminSelectedCourse?._id] || []).length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-[10px] font-bold uppercase">No chapters available</div>
                          )}
                          {(courseChapters[adminSelectedCourse?._id] || []).map(ch => (
                            <button
                              key={ch._id}
                              onClick={() => {
                                setAdminSelectedChapter(ch);
                                api.getQuestions(ch._id).then(setQuestions);
                                setShowChapterDrop(false);
                              }}
                              className={`w-full text-left px-5 py-4 rounded-xl transition-all flex items-center justify-between group/item ${
                                adminSelectedChapter?._id === ch._id ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="text-xs font-bold uppercase tracking-widest">{ch.title}</span>
                              {adminSelectedChapter?._id === ch._id && <CheckCircle2 size={14} />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Question List Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available in Pool</h4>
              <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-gray-400">
                {questions.length} Items
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input
                  type="text"
                  placeholder="Filter pool..."
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-all font-medium"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDrop(!showFilterDrop)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2 min-w-[140px] justify-between group"
                >
                  <span className="truncate max-w-[100px]">
                    {poolChapterFilter === 'all' 
                      ? 'All Channels' 
                      : (courseChapters[adminSelectedCourse?._id || ''] || []).find(ch => ch._id === poolChapterFilter)?.title || 'Filter'}
                  </span>
                  <ChevronDown size={12} className={`transition-transform duration-300 ${showFilterDrop ? 'rotate-180 text-orange-500' : 'text-gray-500 group-hover:text-gray-400'}`} />
                </button>

                <AnimatePresence>
                  {showFilterDrop && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setShowFilterDrop(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        className="absolute z-[101] top-full right-0 mt-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[200px] backdrop-blur-xl overflow-hidden"
                      >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar-orange pr-1 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPoolChapterFilter('all');
                              if (adminSelectedCourse) api.getCourseQuestions(adminSelectedCourse._id).then(setQuestions);
                              setShowFilterDrop(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group/item ${
                              poolChapterFilter === 'all' 
                                ? 'bg-orange-500/10 text-orange-500' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            All Channels
                            {poolChapterFilter === 'all' && <CheckCircle2 size={12} />}
                          </button>
                          
                          {adminSelectedCourse && (courseChapters[adminSelectedCourse._id] || []).map(ch => (
                            <button
                              key={ch._id}
                              type="button"
                              onClick={() => {
                                setPoolChapterFilter(ch._id);
                                api.getQuestions(ch._id).then(setQuestions);
                                setShowFilterDrop(false);
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group/item ${
                                poolChapterFilter === ch._id 
                                  ? 'bg-orange-500/10 text-orange-500' 
                                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {ch.title}
                              {poolChapterFilter === ch._id && <CheckCircle2 size={12} />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-3 h-[800px] overflow-y-auto pr-2 custom-scrollbar-orange">
              {questions
                .filter(q => q.questionText.toLowerCase().includes(poolSearch.toLowerCase()))
                .filter(q => poolChapterFilter === 'all' || q.chapterId === poolChapterFilter)
                .map((q, idx) => (
                <div key={q._id} className={`group bg-white/[0.02] border rounded-2xl p-4 flex items-center justify-between transition-all ${editingQuestionId === q._id ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5 hover:border-white/10'}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 text-gray-500 flex items-center justify-center text-[10px] font-black group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-all">{idx + 1}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[280px] leading-relaxed italic">"{q.questionText}"</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{q.options.length} Options</span>
                        <div className="w-1 h-1 rounded-full bg-white/10"></div>
                        <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">{q.numberOfCorrectAnswers} Correct</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditClick(q)}
                      className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      onClick={() => openConfirm('Delete Question', 'Permanently delete from pool?', () => handleDeleteQuestion(q._id))}
                      className="p-2 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Form Panel */}
          <div className="lg:col-span-7 bg-white/[0.02] rounded-[2rem] p-8 border border-white/5 shadow-2xl relative">
            <form onSubmit={handleAddQuestion} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-2">
                    <Plus size={12} className="text-orange-500" />
                    Question Content
                  </label>
                  {editingQuestionId && (
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase rounded-lg border border-blue-500/20">Editing Question</span>
                  )}
                </div>
                <textarea
                  required
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-orange-500 transition-all h-32 resize-none font-medium leading-relaxed"
                  placeholder="Craft your question here..."
                />
              </div>

              {/* Code Snippet Sector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Source Implementation (Optional)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLangDrop(!showLangDrop)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-white hover:bg-white/10 focus:outline-none focus:border-orange-500 transition-all flex items-center gap-2 min-w-[120px] justify-between group"
                      >
                        <span className="uppercase tracking-widest truncate max-w-[90px]">
                          {languages.find(l => l.value === newQuestion.programmingLanguage)?.label || 'Select'}
                        </span>
                        <ChevronDown size={10} className={`transition-transform duration-300 ${showLangDrop ? 'rotate-180 text-orange-500' : 'text-gray-500 group-hover:text-gray-300'}`} />
                      </button>

                      <AnimatePresence>
                        {showLangDrop && (
                          <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setShowLangDrop(false)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              className="absolute z-[101] bottom-full left-0 mb-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[160px] backdrop-blur-xl overflow-hidden"
                            >
                              <div className="max-h-[250px] overflow-y-auto custom-scrollbar-orange pr-1">
                                {languages.map(lang => (
                                  <button
                                    key={lang.value}
                                    type="button"
                                    onClick={() => {
                                      setNewQuestion({ ...newQuestion, programmingLanguage: lang.value });
                                      setShowLangDrop(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group/item ${
                                      newQuestion.programmingLanguage === lang.value 
                                        ? 'bg-orange-500/10 text-orange-500' 
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {lang.label}
                                    {newQuestion.programmingLanguage === lang.value && <CheckCircle2 size={12} />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCodeFullscreen(true)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-all"
                      title="Fullscreen Editor"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="border border-white/10 rounded-2xl overflow-hidden h-64 shadow-inner bg-black/20 focus-within:border-orange-500/50 transition-all">
                  <Editor
                    height="100%"
                    language={newQuestion.programmingLanguage}
                    theme="vs-dark"
                    value={newQuestion.codeSnippet}
                    onChange={(val) => setNewQuestion({ ...newQuestion, codeSnippet: val })}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 15, bottom: 15 },
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Question Explanation</label>
                <textarea
                  value={newQuestion.explanation || ''}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-orange-500 transition-all h-24 resize-none font-medium leading-relaxed italic"
                  placeholder="Explain the logic behind this question... (optional)"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Response Grid</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(newQuestion.options || []).map((option, idx) => (
                    <div key={idx} className="space-y-2 group">
                      <div className="flex items-center justify-between px-1">
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
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all font-medium"
                        placeholder={`Enter option ${idx + 1}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                >
                  {editingQuestionId ? <Save size={20} /> : <PlusCircle size={20} />}
                  {editingQuestionId ? 'Update Question' : 'Add Question to Pool'}
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
          </div>
        </div>
      </div>
      
      {/* Code Fullscreen Portal */}
      <AnimatePresence>
        {isCodeFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl p-6"
          >
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                    <Plus size={20} />
                  </div>
                  <h4 className="text-xl font-bold text-white uppercase tracking-widest">{newQuestion.programmingLanguage} Fullscreen Editor</h4>
                </div>
                <button
                  onClick={() => setIsCodeFullscreen(false)}
                  className="p-3 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-2xl transition-all flex items-center gap-2 font-black uppercase text-xs"
                >
                  <Minimize2 size={20} />
                  Exit Fullscreen
                </button>
              </div>
              <div className="flex-1 border border-white/5 rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                <Editor
                  height="100%"
                  language={newQuestion.programmingLanguage}
                  theme="vs-dark"
                  value={newQuestion.codeSnippet}
                  onChange={(val) => setNewQuestion({ ...newQuestion, codeSnippet: val })}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 16,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 30, bottom: 30 },
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
