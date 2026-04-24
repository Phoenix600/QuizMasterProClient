import React from 'react';
import { 
  Trophy, Clock, Save, Trash2, Eye, Maximize2, ChevronDown, CheckCircle2, BookOpen, Layers, ChevronRight, Filter, Edit, X, Plus, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import * as api from '../../services/api';
import { Quiz, Question, Course, Chapter } from '../../types';

interface QuestionAssignmentHubProps {
  adminSelectedQuiz: Quiz;
  adminSelectedChapter: Chapter | null;
  adminSelectedCourse: Course | null;
  adminSelectedSubFolder: Chapter | null;
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  questions: Question[];
  previewQuestion: Question | null;
  setPreviewQuestion: (val: Question | null) => void;
  setAdminSelectedQuiz: (val: any) => void;
  setAdminSelectedCourse: (val: Course | null) => void;
  setAdminSelectedChapter: (val: Chapter | null) => void;
  setAdminSelectedSubFolder: (val: Chapter | null) => void;
  setAdminView: (val: any) => void;
  setQuestions: (val: Question[]) => void;
  fetchQuizzesForChapter: (id: string) => void;
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
  updateToast: (id: number, text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => void;
  publishQuiz: (quizId: string, chapterId: string, isPublished?: boolean) => void;
  setIsCodeFullscreen: (val: boolean) => void;
}

export const QuestionAssignmentHub: React.FC<QuestionAssignmentHubProps> = ({
  adminSelectedQuiz, adminSelectedChapter, adminSelectedCourse, adminSelectedSubFolder,
  courses, courseChapters, questions,
  previewQuestion, setPreviewQuestion, setAdminSelectedQuiz,
  setAdminSelectedCourse, setAdminSelectedChapter, setAdminSelectedSubFolder, setAdminView, setQuestions,
  fetchQuizzesForChapter, pushToast, updateToast, publishQuiz,
  setIsCodeFullscreen
}) => {
  const [showCourseDrop, setShowCourseDrop] = React.useState(false);
  const [showChapterDrop, setShowChapterDrop] = React.useState(false);
  const [showSubFolderDrop, setShowSubFolderDrop] = React.useState(false);
  const [poolChapterFilter, setPoolChapterFilter] = React.useState<string>('all');
  const [showPoolFilter, setShowPoolFilter] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  
  // Quick Edit State
  const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);
  const [isSavingQuestion, setIsSavingQuestion] = React.useState(false);

  const isCreationMode = adminSelectedQuiz._id === 'new';

  // COURSE-WIDE POOL: Fetch all questions for the course when selected
  React.useEffect(() => {
    if (adminSelectedCourse) {
      api.getCourseQuestions(adminSelectedCourse._id).then(setQuestions);
    }
  }, [adminSelectedCourse?._id]);

  const handleCreateOrUpdate = async (shouldPublish: boolean = false) => {
    if (!adminSelectedQuiz.title.trim()) {
      setFormError('Quiz title is required');
      return;
    }
    if (!adminSelectedChapter) {
      setFormError('Target Chapter must be selected');
      return;
    }
    setFormError('');

    const toastId = pushToast(isCreationMode ? 'Creating Quiz...' : 'Flushing data...', 'loading', 0);
    try {
      let result;
      const payload = {
        title: adminSelectedQuiz.title.trim(),
        description: adminSelectedQuiz.description || '',
        questionCount: Math.max(adminSelectedQuiz.questionCount || 0, adminSelectedQuiz.questions?.length || 0),
        passingScore: adminSelectedQuiz.passingScore || 70,
        timeLimit: adminSelectedQuiz.timeLimit || 30,
        questions: adminSelectedQuiz.questions?.map((id: any) => typeof id === 'string' ? id : id._id) || []
      };

      if (isCreationMode) {
        result = await api.createQuiz({
          ...payload,
          courseId: adminSelectedCourse!._id,
          chapterId: adminSelectedChapter._id,
          subChapterId: adminSelectedSubFolder?._id || null
        });
      } else {
        result = await api.updateQuiz(adminSelectedQuiz._id, payload);
      }
      
      if (shouldPublish) {
        result = await api.publishQuiz(result._id, !adminSelectedQuiz.isPublished);
        updateToast(toastId, `Quiz ${result.isPublished ? 'Published Live' : 'Reverted to Draft'}`, 'success', 2000);
      } else {
        updateToast(toastId, isCreationMode ? 'Quiz Created Successfully' : 'In-memory changes saved', 'success', 2000);
      }
      
      setAdminSelectedQuiz(result);
      fetchQuizzesForChapter(adminSelectedChapter._id);
    } catch (err: any) {
      updateToast(toastId, err.response?.data?.message || 'Flush failed', 'error', 3000);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    setIsSavingQuestion(true);
    const toastId = pushToast('Updating question...', 'loading', 0);
    try {
      const updated = await api.updateQuestion(editingQuestion._id, editingQuestion);
      
      // Update global questions state
      setQuestions(questions.map(q => q._id === updated._id ? updated : q));
      
      // Update preview if it's the same question
      if (previewQuestion?._id === updated._id) {
        setPreviewQuestion(updated);
      }
      
      // Update lineup if it's there
      if (adminSelectedQuiz.questions?.some((id: any) => (typeof id === 'string' ? id : id._id) === updated._id)) {
        const newLineup = (adminSelectedQuiz.questions || []).map((q: any) => {
          const id = typeof q === 'string' ? q : q._id;
          return id === updated._id ? updated : q;
        });
        setAdminSelectedQuiz({ ...adminSelectedQuiz, questions: newLineup });
      }

      updateToast(toastId, 'Question Updated Successfully', 'success', 2000);
      setEditingQuestion(null);
    } catch (err: any) {
      updateToast(toastId, 'Failed to update question', 'error', 3000);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const filteredPool = questions.filter(q => {
    const isAlreadyInQuiz = ((adminSelectedQuiz.questions as any[]) || []).find(id => (typeof id === 'string' ? id : (id as any)._id) === q._id);
    if (isAlreadyInQuiz) return false;
    if (poolChapterFilter !== 'all' && q.chapterId !== poolChapterFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* SELECTION FALLBACKS */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[10px] font-semibold text-zinc-500 tracking-tight">Target Destination</h4>
            <p className="text-xs text-zinc-400 mt-1">Assign this quiz to a specific chapter</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowCourseDrop(!showCourseDrop)}
                className={`bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-xs font-semibold text-white hover:bg-white/10 transition-all flex items-center gap-4 min-w-[240px] justify-between group ${adminSelectedCourse ? 'border-orange-500/20 bg-orange-500/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className={adminSelectedCourse ? 'text-orange-500' : 'text-zinc-500'} />
                  <span className="tracking-tight truncate max-w-[150px]">
                    {adminSelectedCourse?.title || 'Select Course'}
                  </span>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showCourseDrop ? 'rotate-180 text-orange-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              </button>
              
              <AnimatePresence>
                {showCourseDrop && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowCourseDrop(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute z-[101] top-full left-0 mt-4 bg-[#1a1a1a] border border-white/10 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[300px] backdrop-blur-xl overflow-hidden"
                    >
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar-orange pr-2 space-y-1">
                        {courses.map(course => (
                          <button
                            key={course._id}
                            onClick={() => {
                              setAdminSelectedCourse(course);
                              setAdminSelectedChapter(null);
                              setShowCourseDrop(false);
                            }}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-semibold tracking-tight transition-all flex items-center justify-between group/item ${
                              adminSelectedCourse?._id === course._id 
                                ? 'bg-orange-500/10 text-orange-500' 
                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {course.title}
                            {adminSelectedCourse?._id === course._id && <CheckCircle2 size={14} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <ChevronRight size={16} className="text-gray-800" />

            <div className="relative">
              <button
                disabled={!adminSelectedCourse}
                onClick={() => setShowChapterDrop(!showChapterDrop)}
                className={`bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all flex items-center gap-4 min-w-[240px] justify-between group ${adminSelectedChapter ? 'border-blue-500/20 bg-blue-500/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Layers size={16} className={adminSelectedChapter ? 'text-blue-500' : 'text-zinc-500'} />
                  <span className="tracking-tight truncate max-w-[150px]">
                    {adminSelectedChapter?.title || 'Select Chapter'}
                  </span>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showChapterDrop ? 'rotate-180 text-blue-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              </button>

              <AnimatePresence>
                {showChapterDrop && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowChapterDrop(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute z-[101] top-full right-0 mt-4 bg-[#1a1a1a] border border-white/10 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[300px] backdrop-blur-xl overflow-hidden"
                    >
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar-orange pr-2 space-y-1">
                        {(courseChapters[adminSelectedCourse?._id || ''] || [])
                          .filter(ch => !ch.parentId) // Only root level
                          .map(ch => (
                          <button
                            key={ch._id}
                            onClick={() => {
                              setAdminSelectedChapter(ch);
                              setAdminSelectedSubFolder(null); // Reset sub-folder when chapter changes
                              setShowChapterDrop(false);
                            }}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-semibold tracking-tight transition-all flex items-center justify-between group/item ${
                              adminSelectedChapter?._id === ch._id 
                                ? 'bg-blue-500/10 text-blue-500' 
                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {ch.title}
                            {adminSelectedChapter?._id === ch._id && <CheckCircle2 size={14} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <ChevronRight size={16} className="text-gray-800" />

            <div className="relative">
              <button
                disabled={!adminSelectedChapter}
                onClick={() => setShowSubFolderDrop(!showSubFolderDrop)}
                className={`bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all flex items-center gap-4 min-w-[240px] justify-between group ${adminSelectedSubFolder ? 'border-amber-500/20 bg-amber-500/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Layers size={16} className={adminSelectedSubFolder ? 'text-amber-500' : 'text-zinc-500'} />
                  <span className="tracking-tight truncate max-w-[150px]">
                    {adminSelectedSubFolder?.title || 'Select Sub-folder'}
                  </span>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showSubFolderDrop ? 'rotate-180 text-amber-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              </button>

              <AnimatePresence>
                {showSubFolderDrop && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowSubFolderDrop(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute z-[101] top-full right-0 mt-4 bg-[#1a1a1a] border border-white/10 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[300px] backdrop-blur-xl overflow-hidden"
                    >
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar-orange pr-2 space-y-1">
                        <button
                          onClick={() => {
                            setAdminSelectedSubFolder(null);
                            setShowSubFolderDrop(false);
                          }}
                          className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-semibold tracking-tight transition-all ${
                            !adminSelectedSubFolder ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 hover:text-white'
                          }`}
                        >
                          None (Root Chapter)
                        </button>
                        {(courseChapters[adminSelectedCourse?._id || ''] || [])
                          .filter(ch => String(ch.parentId?._id || ch.parentId) === String(adminSelectedChapter?._id))
                          .map(sub => (
                          <button
                            key={sub._id}
                            onClick={() => {
                              setAdminSelectedSubFolder(sub);
                              setShowSubFolderDrop(false);
                            }}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-semibold tracking-tight transition-all flex items-center justify-between group/item ${
                              adminSelectedSubFolder?._id === sub._id 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {sub.title}
                            {adminSelectedSubFolder?._id === sub._id && <CheckCircle2 size={14} />}
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

      <div className={`space-y-6 transition-all duration-500 ${!adminSelectedChapter ? 'opacity-30 pointer-events-none filter grayscale' : 'opacity-100'}`}>
        {/* GLOBAL HUB HEADER / METADATA */}
        <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6 flex-1 min-w-[300px]">
              <div className="w-16 h-16 bg-orange-500/10 rounded-[2rem] flex items-center justify-center text-orange-500 border border-orange-500/10 shrink-0">
                <Trophy size={32} />
              </div>
              <div className="flex-1 space-y-3">
                <input 
                  type="text"
                  placeholder="Quiz Title"
                  value={adminSelectedQuiz.title}
                  onChange={(e) => setAdminSelectedQuiz({ ...adminSelectedQuiz, title: e.target.value })}
                  className="w-full bg-transparent text-2xl font-semibold text-white focus:outline-none placeholder:text-zinc-700"
                />
                <textarea 
                  placeholder="Enter quiz description..."
                  value={adminSelectedQuiz.description}
                  onChange={(e) => setAdminSelectedQuiz({ ...adminSelectedQuiz, description: e.target.value })}
                  className="w-full bg-transparent text-[11px] font-semibold text-zinc-500 tracking-tight focus:outline-none placeholder:text-zinc-800 resize-none h-6 overflow-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="p-2.5 bg-white/5 rounded-xl text-zinc-400 font-semibold text-xs">
                  {adminSelectedQuiz.questions?.length || 0}
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold tracking-tight">Lineup</p>
                  <p className="text-[11px] font-semibold text-white tracking-tight">Questions</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="p-2.5 bg-white/5 rounded-xl text-orange-500">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold tracking-tight">Timer</p>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      value={adminSelectedQuiz.timeLimit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setAdminSelectedQuiz({ ...adminSelectedQuiz, timeLimit: parseInt(val || '0', 10) });
                      }}
                      className="w-8 bg-transparent text-xs font-semibold text-white focus:outline-none text-center"
                    />
                    <span className="text-[10px] font-semibold text-zinc-600">min</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="p-2.5 bg-white/5 rounded-xl text-amber-500">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold tracking-tight">Pass %</p>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      value={adminSelectedQuiz.passingScore}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setAdminSelectedQuiz({ ...adminSelectedQuiz, passingScore: Math.min(100, parseInt(val || '0', 10)) });
                      }}
                      className="w-8 bg-transparent text-xs font-semibold text-white focus:outline-none text-center"
                    />
                    <span className="text-[10px] font-semibold text-zinc-600">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => handleCreateOrUpdate(false)}
                  className="px-8 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-[1.5rem] text-xs font-semibold tracking-tight transition-all active:scale-95 flex items-center gap-3 border border-emerald-500/30 backdrop-blur-md"
                >
                  <Save size={18} />
                  {isCreationMode ? 'Create & Sync' : 'Apply & Sync'}
                </button>
                {!isCreationMode && (
                  <button
                    onClick={() => handleCreateOrUpdate(true)}
                    className={`px-8 py-4 rounded-[1.5rem] text-xs font-semibold tracking-tight transition-all backdrop-blur-md active:scale-95 border ${
                      adminSelectedQuiz.isPublished 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border-red-500/30' 
                        : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 hover:text-orange-400 border-orange-500/30'
                    }`}
                  >
                    {adminSelectedQuiz.isPublished ? 'Go Draft' : 'Go Live'}
                  </button>
                )}
              </div>
            </div>
          </div>
          {formError && <p className="text-red-400 text-xs font-semibold tracking-tight">{formError}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* PANE 1: POOL */}
          <div 
            className="lg:col-span-3 space-y-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              const qId = e.dataTransfer.getData('questionId');
              const source = e.dataTransfer.getData('source');
              if (source === 'quiz') {
                const newSelection = adminSelectedQuiz.questions?.filter((id: any) => (typeof id === 'string' ? id : id._id) !== qId);
                setAdminSelectedQuiz({
                  ...adminSelectedQuiz,
                  questions: newSelection,
                  questionCount: Math.max(adminSelectedQuiz.questionCount || 0, newSelection.length)
                });
                pushToast('Returned to Pool', 'success', 1000);
              }
            }}
          >
            <div className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] p-6 h-[750px] flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Course Pool</h3>
                  <p className="text-zinc-500 text-[10px] font-semibold tracking-tight mt-1">
                    {filteredPool.length} Available
                  </p>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowPoolFilter(!showPoolFilter)}
                    className={`p-2 rounded-xl transition-all ${poolChapterFilter !== 'all' ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                  >
                    <Filter size={16} />
                  </button>
                  <AnimatePresence>
                    {showPoolFilter && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowPoolFilter(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-50 top-full right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 w-[200px] shadow-2xl"
                        >
                          <button 
                            onClick={() => { setPoolChapterFilter('all'); setShowPoolFilter(false); }}
                            className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-semibold tracking-tight ${poolChapterFilter === 'all' ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-400 hover:bg-white/5'}`}
                          >
                            All Chapters
                          </button>
                          {(courseChapters[adminSelectedCourse?._id || ''] || []).map(ch => (
                            <button 
                              key={ch._id}
                              onClick={() => { setPoolChapterFilter(ch._id); setShowPoolFilter(false); }}
                              className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-semibold tracking-tight mt-1 truncate ${poolChapterFilter === ch._id ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-400 hover:bg-white/5'}`}
                            >
                              {ch.title}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {filteredPool.map((q) => (
                    <div 
                      key={q._id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('questionId', q._id);
                        e.dataTransfer.setData('source', 'pool');
                      }}
                      onClick={() => setPreviewQuestion(q)}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer ${previewQuestion?._id === q._id ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                    >
                      <p className="text-xs font-medium text-white line-clamp-2 leading-relaxed">{q.questionText}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[9px] font-semibold text-zinc-500 tracking-tight">{q.options.length} Options</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-semibold text-amber-500/60">Pool</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* PANE 2: SELECTED */}
          <div className="lg:col-span-5 space-y-6">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                const qId = e.dataTransfer.getData('questionId');
                const source = e.dataTransfer.getData('source');
                if (source === 'pool') {
                  if (adminSelectedQuiz.questions?.some((id: any) => (typeof id === 'string' ? id : id._id) === qId)) {
                    pushToast('Already in Quiz', 'error', 2000);
                    return;
                  }
                  const fullQ = questions.find(q => q._id === qId);
                  const newQuestions = [...(adminSelectedQuiz.questions || []), fullQ || qId];
                  setAdminSelectedQuiz({
                    ...adminSelectedQuiz,
                    questions: newQuestions,
                    questionCount: Math.max(adminSelectedQuiz.questionCount || 0, newQuestions.length)
                  });
                  pushToast('Added (In-Memory)', 'success', 1000);
                }
              }}
              className="space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar min-h-[200px]"
            >
              {(adminSelectedQuiz.questions || []).map((qObj: any, idx: number) => {
                const qData = typeof qObj === 'string' ? questions.find(item => item._id === qObj) : qObj;
                if (!qData) return null;
                return (
                  <div 
                    key={qData._id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('questionId', qData._id);
                      e.dataTransfer.setData('source', 'quiz');
                    }}
                    onClick={() => setPreviewQuestion(qData)}
                    className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer flex items-center justify-between group ${previewQuestion?._id === qData._id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#1a1a1a] border-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-[10px] text-zinc-500 font-semibold">
                        {idx + 1}
                      </div>
                      <p className="text-xs font-semibold text-white line-clamp-1 max-w-[240px]">{qData.questionText}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelection = adminSelectedQuiz.questions?.filter((id: any) => (typeof id === 'string' ? id : id._id) !== qData._id);
                        setAdminSelectedQuiz({
                          ...adminSelectedQuiz,
                          questions: newSelection,
                          questionCount: Math.max(adminSelectedQuiz.questionCount || 0, newSelection.length)
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
              {(adminSelectedQuiz.questions?.length || 0) === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <p className="text-gray-500 text-xs italic">Drag or click questions from the pool to build your quiz lineup.</p>
                </div>
              )}
            </div>
          </div>

          {/* PANE 3: PREVIEW */}
          <div className="lg:col-span-4 sticky top-6">
            {previewQuestion ? (
              <div className="bg-[#1a1a1a] border border-orange-500/20 rounded-[2.5rem] p-8 space-y-6 overflow-hidden relative">
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/10">
                      <Eye size={16} />
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-500 tracking-tight">Question Preview</h4>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingQuestion(previewQuestion)}
                      className="p-2.5 bg-white/5 hover:bg-orange-500/10 text-gray-500 hover:text-orange-500 rounded-xl transition-all border border-white/5 hover:border-orange-500/20 shadow-sm"
                      title="Quick Edit Question"
                    >
                      <Edit size={16} />
                    </button>
                    <span className="px-4 py-2 bg-orange-500/10 text-orange-500 text-[10px] font-semibold rounded-xl border border-orange-500/10 shadow-sm">
                      {previewQuestion.numberOfCorrectAnswers} Correct
                    </span>
                  </div>
                </div>
                
                <div className="space-y-8 pt-4">
                  <div className="space-y-6">
                    <p className="text-xl font-bold text-white leading-snug tracking-tight">{previewQuestion.questionText}</p>
                    
                    {previewQuestion.codeSnippet && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-[10px] text-zinc-500 font-semibold tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            {previewQuestion.programmingLanguage || 'Source Code'}
                          </span>
                          <button
                            onClick={() => setIsCodeFullscreen(true)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all flex items-center gap-1.5 text-[9px] font-semibold tracking-tight"
                          >
                            <Maximize2 size={12} />
                            Expand
                          </button>
                        </div>
                        <div className="border border-white/10 rounded-2xl overflow-hidden h-64 shadow-inner bg-black/20">
                          <Editor
                            height="100%"
                            language={previewQuestion.programmingLanguage}
                            theme="vs-dark"
                            value={previewQuestion.codeSnippet}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 13,
                              lineNumbers: 'on',
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              padding: { top: 15, bottom: 15 },
                              renderLineHighlight: 'none'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-3 mt-8">
                    {previewQuestion.options.map((option: any, oIdx: number) => (
                      <div 
                        key={oIdx}
                        className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${option.isCorrect ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-gray-400'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-semibold text-[10px] ${option.isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/5'}`}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="text-sm font-semibold">{option.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

                {previewQuestion.explanation && (
                  <div className="mt-8 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                    <p className="text-[10px] font-semibold text-zinc-500 tracking-tight mb-2">Explanation</p>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">{previewQuestion.explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-12 text-center h-[750px] flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-600">
                  <Eye size={32} />
                </div>
                <div>
                  <p className="text-white font-bold">Select a Question</p>
                  <p className="text-gray-500 text-xs mt-1">Preview its full details and answers here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK EDIT MODAL */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/10">
                    <Edit size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white tracking-tight">Global Edit</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold tracking-tight mt-1">Updating Pool Question Content</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-3 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar-orange">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 font-semibold tracking-tight flex items-center gap-2 italic">
                      <AlertCircle size={12} className="text-orange-500" />
                      Question Context
                    </label>
                    <textarea
                      value={editingQuestion.questionText}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-orange-500 transition-all h-48 resize-none font-medium leading-relaxed shadow-inner"
                      placeholder="Refine the question text..."
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 font-semibold tracking-tight">Source Implementation (Monaco)</label>
                    <div className="border border-white/10 rounded-3xl overflow-hidden h-48 bg-black/40 shadow-inner group focus-within:border-orange-500/40 transition-all">
                      <Editor
                        height="100%"
                        language={editingQuestion.programmingLanguage || 'javascript'}
                        theme="vs-dark"
                        value={editingQuestion.codeSnippet}
                        onChange={(val) => setEditingQuestion({ ...editingQuestion, codeSnippet: val || '' })}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: { top: 15, bottom: 15 },
                          renderLineHighlight: 'all',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-zinc-500 font-semibold tracking-tight">Response Grid Configuration</label>
                    <p className="text-[10px] text-orange-500/50 font-semibold italic">Check box to set correct answer</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {editingQuestion.options.map((option, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={option.isCorrect}
                              onChange={(e) => {
                                const newOptions = [...editingQuestion.options];
                                newOptions[idx].isCorrect = e.target.checked;
                                setEditingQuestion({ 
                                  ...editingQuestion, 
                                  options: newOptions,
                                  numberOfCorrectAnswers: newOptions.filter(o => o.isCorrect).length
                                });
                              }}
                              className="hidden"
                            />
                            <div className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${option.isCorrect ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white/20 group-hover:border-white/40'}`}>
                              {option.isCorrect && <CheckCircle2 size={16} className="text-white" />}
                            </div>
                            <span className={`text-[10px] font-semibold tracking-tight ${option.isCorrect ? 'text-emerald-500' : 'text-zinc-500'}`}>
                              Choice {idx + 1}
                            </span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options];
                            newOptions[idx].text = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOptions });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-all font-semibold shadow-sm"
                          placeholder={`Option ${idx + 1}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-zinc-500 font-semibold tracking-tight">Global Explanation</label>
                  <textarea
                    value={editingQuestion.explanation || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/50 focus:outline-none focus:border-orange-500 transition-all h-24 resize-none font-medium leading-relaxed italic"
                    placeholder="Provide context for the correct answer..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-4 shrink-0">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-8 py-4 text-zinc-500 hover:text-white text-xs font-semibold tracking-tight transition-all"
                >
                  Discard Changes
                </button>
                <button
                  disabled={isSavingQuestion}
                  onClick={handleUpdateQuestion}
                  className="px-10 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold tracking-tight rounded-2xl transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 active:scale-95"
                >
                  {isSavingQuestion ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : <Save size={18} />}
                  Commit Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
