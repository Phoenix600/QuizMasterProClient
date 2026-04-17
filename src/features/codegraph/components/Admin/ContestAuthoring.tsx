import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  Search, 
  CheckCircle2, 
  FileCode, 
  HelpCircle,
  AlertCircle,
  Globe,
  Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface ContestAuthoringProps {
  contest?: any;
  onBack: () => void;
}

const toLocalDatetimeString = (dateInput: string | Date) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset(); // in minutes
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};

export const ContestAuthoring: React.FC<ContestAuthoringProps> = ({ contest, onBack }) => {
  const [formData, setFormData] = useState({
    title: contest?.title || '',
    description: contest?.description || '',
    courseId: contest?.courseId?._id || contest?.courseId || '',
    chapterId: contest?.chapterId?._id || contest?.chapterId || '',
    startTime: contest?.startTime ? toLocalDatetimeString(contest.startTime) : '',
    endTime: contest?.endTime ? toLocalDatetimeString(contest.endTime) : '',
    duration: contest?.duration || 60,
    isPublished: contest?.isPublished || false,
    mcqQuestions: (contest?.mcqQuestions || []).map((q: any) => typeof q === 'object' ? q._id : q),
    codingProblems: (contest?.codingProblems || []).map((p: any) => typeof p === 'object' ? p._id : p),
    quizId: contest?.quizId?._id || contest?.quizId || null
  });

  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);
  const [rootChapters, setRootChapters] = useState<any[]>([]);
  const [subFolders, setSubFolders] = useState<any[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [availableProblems, setAvailableProblems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.courseId) {
       fetchChapters(formData.courseId);
    } else {
       setAvailableChapters([]);
       setRootChapters([]);
       setSubFolders([]);
    }
  }, [formData.courseId]);

  // Effect: Fetch resources whenever scope (Chapter) changes
  useEffect(() => {
    if (formData.chapterId) {
       console.log(`[ContestAuthoring] Fetching resources for chapter: ${formData.chapterId}`);
       fetchQuestions(formData.chapterId);
       fetchQuizzes(formData.chapterId);
    } else {
       setAvailableQuestions([]);
       setAvailableQuizzes([]);
    }
  }, [formData.chapterId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [courses, problemsData] = await Promise.all([
        api.getCourses(),
        api.getProblems(0, 100)
      ]);
      setAvailableCourses(courses);
      const problemsArray = problemsData.content || problemsData.problems || (Array.isArray(problemsData) ? problemsData : []);
      setAvailableProblems(problemsArray);
    } catch (err) {
      console.error("Initial data fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (chapterId: string) => {
     try {
       const questions = await api.admin.getQuestions(chapterId);
       setAvailableQuestions(questions || []);
     } catch (err) {
       console.error("Questions fetch failed", err);
     }
  };
  
  const fetchQuizzes = async (chapterId: string) => {
     try {
        const quizzes = await api.admin.getChapterQuizzes(chapterId);
        setAvailableQuizzes(quizzes || []);
     } catch (err) {
        console.error("Quizzes fetch failed", err);
     }
  };

  const fetchChapters = async (courseId: string) => {
     if (!courseId) return;
     try {
       const chapters = await api.getChapters(courseId);
       setAvailableChapters(chapters || []);
       
       // Filter root chapters (Level 0)
       const roots = chapters.filter((ch: any) => !ch.parentId).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
       setRootChapters(roots);
       
       // If editing, find relevant sub-folders for existing chapter
       if (formData.chapterId) {
          const current = findChapterDeep(chapters, formData.chapterId);
          if (current && current.parentId) {
             // Find the root ancestor to populate sub-folders
             let ancestor = current;
             while (ancestor.parentId) {
                const parent = findChapterDeep(chapters, ancestor.parentId);
                if (!parent) break;
                ancestor = parent;
             }
             handleMajorAreaChange(ancestor._id || ancestor.id, chapters);
          }
       }
     } catch (err) {
       console.error("Chapter fetch failed", err);
     }
  };

  const findChapterDeep = (list: any[], id: string): any => {
     for (const ch of list) {
        if ((ch._id || ch.id) === id) return ch;
        if (ch.subChapters?.length) {
           const found = findChapterDeep(ch.subChapters, id);
           if (found) return found;
        }
     }
     return null;
  };

  const getRootAncestorId = (id: string) => {
     let current = findChapterDeep(availableChapters, id);
     if (!current) return '';
     while (current && current.parentId) {
        const parent = findChapterDeep(availableChapters, current.parentId);
        if (!parent) break;
        current = parent;
     }
     return current ? (current._id || current.id) : '';
  };

  const handleMajorAreaChange = (majorId: string, customList?: any[]) => {
     const list = customList || availableChapters;
     const major = findChapterDeep(list, majorId);
     
     if (major) {
        const flattened: any[] = [];
        const flatten = (items: any[], level = 1) => {
           items.forEach(child => {
              flattened.push({ id: child._id || child.id, title: child.title, level });
              if (child.subChapters?.length) flatten(child.subChapters, level + 1);
           });
        };
        flatten(major.subChapters || []);
        setSubFolders(flattened);
        
        // If the user manually changed major area, update chapterId to the major area itself initially
        if (!customList) {
           setFormData({ ...formData, chapterId: majorId });
        }
     } else {
        setSubFolders([]);
        if (!customList) {
           setFormData({ ...formData, chapterId: '' });
        }
     }
  };

  const addQuizQuestions = (quiz: any) => {
    // Ensure we handle both object-style and ID-style questions from the quiz
    const questionIds = (quiz.questions || []).map((q: any) => typeof q === 'object' ? (q._id || q.id) : q);
    
    setFormData(prev => ({ 
      ...prev, 
      mcqQuestions: questionIds, 
      quizId: quiz._id || quiz.id 
    }));
    
    toast.success(`Imported ${questionIds.length} questions from quiz: ${quiz.title}`);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime || !formData.courseId || !formData.chapterId) {
      toast.error("Please fill all required fields, including Course and Chapter");
      return;
    }

    if (formData.codingProblems.length !== 2) {
       toast.warning("A contest usually requires exactly two coding problems.");
    }

    try {
      setIsSaving(true);
      const payload = {
         ...formData,
         startTime: new Date(formData.startTime),
         endTime: new Date(formData.endTime)
      };

      if (contest) {
        await api.updateContest(contest._id, payload);
        toast.success("Contest updated successfully");
      } else {
        await api.createContest(payload);
        toast.success("Contest created successfully");
      }
      onBack();
    } catch (err: any) {
      toast.error(err.message || "Failed to save contest");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (id: string, type: 'mcq' | 'coding') => {
    const field = type === 'mcq' ? 'mcqQuestions' : 'codingProblems';
    const current = formData[field];
    
    if (current.includes(id)) {
      setFormData({ ...formData, [field]: current.filter((x: string) => x !== id) });
    } else {
      if (type === 'coding' && current.length >= 2) {
         toast.error("Maximum 2 coding problems allowed");
         return;
      }
      setFormData({ ...formData, [field]: [...current, id] });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <h1 className="text-sm font-bold text-white uppercase tracking-widest">
            {contest ? 'Edit Contest' : 'Create New Contest'}
          </h1>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-900/20 shadow-orange-500/10 active:scale-95"
        >
          {isSaving ? <HelpCircle className="animate-spin" size={16} /> : <Save size={16} />}
          SAVE CONTEST
        </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: General Info */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Contest Title</label>
                  <input 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Weekly Algorithm Sprit #1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="What is this contest about?"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Course Association</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value, chapterId: '' })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                    >
                      <option value="">Select Course...</option>
                      {availableCourses.map(course => (
                        <option key={course._id || course.id} value={course._id || course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Major Area (Level 1)</label>
                    <select
                      value={getRootAncestorId(formData.chapterId)}
                      disabled={!formData.courseId}
                      onChange={(e) => handleMajorAreaChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark] disabled:opacity-50"
                    >
                      <option value="">Select Chapter...</option>
                      {rootChapters.map(chapter => (
                        <option key={chapter._id || chapter.id} value={chapter._id || chapter.id}>
                          {chapter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Sub Topic (Level 2+)</label>
                    <select
                      value={subFolders.some(f => f.id === formData.chapterId) ? formData.chapterId : ''}
                      disabled={!subFolders.length}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setFormData({ ...formData, chapterId: newId ? newId : getRootAncestorId(formData.chapterId) });
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark] disabled:opacity-50"
                    >
                      <option value="">Select Sub-Topic...</option>
                      {subFolders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {'\u00A0'.repeat((folder.level - 1) * 4)}{folder.level > 1 ? '└ ' : ''}{folder.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Start Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Duration (Minutes)</label>
                <input 
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>

              <div className="pt-2">
                 <button 
                   onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                   className={cn(
                     "flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all w-full",
                     formData.isPublished ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                   )}
                 >
                   {formData.isPublished ? <Globe size={18} /> : <Lock size={18} />}
                   <span className="text-sm font-bold uppercase tracking-wider">{formData.isPublished ? "Published / Visible" : "Draft / Hidden"}</span>
                 </button>
              </div>
            </section>
          </div>

          {/* Right Column: Resource Selection */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-8 space-y-8">
              <section className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <FileCode size={20} className="text-orange-500" />
                      Select Coding Problems ({formData.codingProblems.length}/2)
                    </h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableProblems.slice(0, 10).map((problem) => {
                      const id = problem.id || problem._id;
                      const isSelected = formData.codingProblems.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => toggleSelection(id, 'coding')}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group",
                            isSelected ? "bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/5" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5",
                            isSelected ? "border-orange-500 bg-orange-500" : "border-zinc-800 text-transparent"
                          )}>
                             <CheckCircle2 size={12} className="text-white" />
                          </div>
                          <div className="space-y-1">
                             <p className={cn("text-xs font-bold transition-colors", isSelected ? "text-white" : "text-zinc-300 group-hover:text-white")}>{problem.title}</p>
                             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{problem.difficulty}</p>
                          </div>
                        </button>
                      );
                    })}
                 </div>
              </section>

              <div className="h-px bg-zinc-800/50" />

              <section className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <HelpCircle size={20} className="text-orange-500" />
                      Add MCQs Questions ({formData.mcqQuestions.length})
                    </h3>
                 </div>
                 
                 {!formData.chapterId ? (
                   <div className="p-8 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-2">
                       <AlertCircle size={24} className="text-zinc-600" />
                       <p className="text-sm text-zinc-500 font-medium">Select a chapter/folder first to see available resources.</p>
                   </div>
                 ) : (
                    <div className="space-y-8">
                       {/* Import from Quizzes Section */}
                       {availableQuizzes.length > 0 && (
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Import from Quiz</label>
                             <div className="grid grid-cols-1 gap-2">
                                {availableQuizzes.map((quiz) => (
                                   <button
                                      key={quiz._id}
                                      onClick={() => addQuizQuestions(quiz)}
                                      className="flex items-center justify-between p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all group"
                                   >
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/10">
                                            <Save size={18} />
                                         </div>
                                         <div className="text-left">
                                            <p className="text-xs font-bold text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{quiz.title}</p>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{quiz.questions?.length || 0} Questions</p>
                                         </div>
                                      </div>
                                      <div className="w-8 h-8 rounded-full border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                         <Plus size={14} />
                                      </div>
                                   </button>
                                ))}
                             </div>
                          </div>
                       )}

                       {/* Individual Pool Section */}
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Individual Pool ({availableQuestions.length})</label>
                          {availableQuestions.length === 0 ? (
                             <div className="p-6 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">No individual questions in this chapter</p>
                             </div>
                          ) : (
                             <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableQuestions.map((q) => {
                                   const id = q._id || q.id;
                                   const isSelected = formData.mcqQuestions.includes(id);
                                   return (
                                     <button
                                       key={id}
                                       onClick={() => toggleSelection(id, 'mcq')}
                                       className={cn(
                                         "flex items-start gap-4 p-3 rounded-2xl border transition-all text-left group",
                                         isSelected ? "bg-orange-500/10 border-orange-500/30" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                       )}
                                     >
                                        <div className={cn(
                                          "w-4 h-4 rounded border flex items-center justify-center mt-1 shrink-0 transition-all",
                                          isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-zinc-700 text-transparent"
                                        )}>
                                           <CheckCircle2 size={10} />
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                           <p className="text-[11px] text-zinc-300 font-medium line-clamp-2 leading-relaxed group-hover:text-white transition-colors">{q.questionText}</p>
                                        </div>
                                     </button>
                                   );
                                })}
                             </div>
                          )}
                       </div>
                    </div>
                 )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
