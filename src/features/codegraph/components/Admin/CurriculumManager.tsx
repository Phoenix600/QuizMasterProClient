import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { 
  Plus, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Edit2, 
  Trash2, 
  Loader2,
  Settings,
  MoreVertical,
  BookOpen,
  Brain,
  Hash,
  Code2,
  GripVertical,
  Save
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, Reorder, AnimatePresence, useDragControls } from 'motion/react';

interface CurriculumManagerProps {
  onBack: () => void;
  onCreateProblem?: (context: any) => void;
}

const updateNestedOrder = (list: any[], parentId: string, newList: any[]): any[] => {
  return list.map(item => {
    if (item._id === parentId) {
      return { ...item, subChapters: newList };
    }
    if (item.subChapters?.length) {
      return { ...item, subChapters: updateNestedOrder(item.subChapters, parentId, newList) };
    }
    return item;
  });
};

const DraggableChapter = React.memo(({ 
  chapter, 
  level = 0,
  isExpanded,
  isSelected,
  isOnActivePath,
  activePathIds,
  expandedFolders,
  toggleFolder,
  onReorder,
  onDelete,
  onEdit,
  onAddSubFolder,
  onAddProblem,
  onAddQuiz,
  selectedItemId,
  setSelectedItemId
}: any) => {
  const dragControls = useDragControls();
  const hasChildren = (chapter.subChapters && chapter.subChapters.length > 0) || (chapter.problems && chapter.problems.length > 0);

  return (
    <Reorder.Item 
      key={chapter._id} 
      value={chapter}
      dragListener={false}
      dragControls={dragControls}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={{ 
        scale: 1.02, 
        backgroundColor: "rgba(39, 39, 42, 0.5)",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        zIndex: 50
      }}
      className="select-none relative"
    >
      {/* Horizontal Connector Line for nested folders */}
      {level > 0 && (
        <div className={cn(
          "absolute left-0 top-[22px] w-4 h-[1.5px] transition-colors duration-300",
          isOnActivePath ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "bg-zinc-800/50"
        )} />
      )}
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer group transition-all",
          level > 0 && "ml-4",
          level === 0 && "bg-zinc-900/40 border border-zinc-800/50 mb-1 py-3 px-4",
          isSelected && "bg-orange-500/10 border-orange-500/20"
        )}
        onClick={() => toggleFolder(chapter._id)}
      >
        <div className="flex items-center gap-1">
           <div 
             className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-zinc-700 hover:text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity"
             onPointerDown={(e) => dragControls.start(e)}
           >
              <GripVertical size={14} />
           </div>
           {hasChildren ? (
            isExpanded ? <ChevronDown size={level === 0 ? 18 : 14} className={cn(isOnActivePath ? "text-orange-500" : "text-zinc-500")} /> : <ChevronRight size={level === 0 ? 18 : 14} className="text-zinc-500" />
          ) : (
            <div className={level === 0 ? "w-[18px]" : "w-[14px]"} />
          )}
        </div>
        <Folder 
          size={level === 0 ? 20 : 16} 
          fill={isSelected ? "currentColor" : (isOnActivePath ? "rgba(249, 115, 22, 0.2)" : "none")}
          className={cn(
            "transition-all duration-300",
            isOnActivePath ? "text-orange-500" : "text-orange-500/70",
            isSelected && "text-orange-400"
          )} 
        />
        <span className={cn(
          "font-medium flex-1 transition-colors",
          level === 0 ? "text-base font-semibold text-zinc-100" : "text-sm text-zinc-300",
          isOnActivePath && "text-orange-100"
        )}>
          {chapter.title}
        </span>
        
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          {level < 1 && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onAddQuiz(chapter._id);
                }}
                className="p-1 hover:text-orange-500 text-zinc-500"
                title="Add Quiz"
            >
              <Brain size={14} />
            </button>
          )}
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onAddProblem(chapter, level);
              }}
              className="p-1 hover:text-orange-500 text-zinc-500"
              title="Add Coding Problem"
          >
            <Code2 size={14} />
          </button>
          {level < 1 && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onAddSubFolder(chapter._id);
                }}
                className="p-1 hover:text-orange-500 text-zinc-500"
                title="Add Sub-folder"
            >
              <FolderPlus size={14} />
            </button>
          )}
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onEdit(chapter);
              }}
              className="p-1 hover:text-zinc-100 text-zinc-500" 
              title="Edit Folder"
          >
              <Edit2 size={12} />
          </button>
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chapter._id);
              }}
              className="p-1 hover:text-red-500 text-zinc-500"
              title="Delete Folder"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={cn(
          "border-l ml-[23px] mt-1 space-y-1 transition-colors duration-300",
          isOnActivePath ? "border-orange-500/50" : "border-zinc-800/50"
        )}>
          {chapter.subChapters && chapter.subChapters.length > 0 && (
            <Reorder.Group 
              axis="y" 
              values={chapter.subChapters} 
              onReorder={(newList) => onReorder(newList, chapter._id)}
              className="space-y-1"
            >
              <AnimatePresence mode="popLayout">
                {chapter.subChapters.map((sub: any) => (
                   <DraggableChapter 
                    key={sub._id}
                    chapter={sub}
                    level={level + 1}
                    isExpanded={expandedFolders.has(sub._id)}
                    isSelected={selectedItemId === sub._id}
                    isOnActivePath={activePathIds.has(sub._id)}
                    activePathIds={activePathIds}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    onReorder={onReorder}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onAddSubFolder={onAddSubFolder}
                    onAddProblem={onAddProblem}
                    onAddQuiz={onAddQuiz}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
          
          {/* Render Problems */}
          {chapter.problems?.map((prob: any) => {
            const itemIsSelected = selectedItemId === prob._id;
            const itemIsOnPath = activePathIds.has(prob._id);
            
            return (
              <div key={prob._id} className="relative group" onClick={(e) => { e.stopPropagation(); setSelectedItemId(prob._id); }}>
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px transition-colors duration-300",
                  itemIsOnPath ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "bg-zinc-800/50"
                )} />
                <div className={cn(
                  "flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer",
                  itemIsSelected ? "bg-orange-500/5 text-orange-400" : "text-zinc-500 hover:text-zinc-300"
                )}>
                  <FileText size={14} className={cn(itemIsSelected ? "text-orange-500" : "text-zinc-600")} />
                  <span className="text-xs font-medium">{prob.title}</span>
                  <div className="ml-auto flex items-center gap-2">
                      <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold",
                          prob.difficulty === 'EASY' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" :
                          prob.difficulty === 'MEDIUM' ? "border-orange-500/30 text-orange-500 bg-orange-500/5" :
                          "border-rose-500/30 text-rose-500 bg-rose-500/5"
                      )}>
                          {prob.difficulty}
                      </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Render Quizzes */}
          {chapter.quizzes?.map((quiz: any) => {
            const itemIsSelected = selectedItemId === quiz._id;
            const itemIsOnPath = activePathIds.has(quiz._id);

            return (
              <div key={quiz._id} className="relative group" onClick={(e) => { e.stopPropagation(); setSelectedItemId(quiz._id); }}>
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px transition-colors duration-300",
                  itemIsOnPath ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "bg-zinc-800/50"
                )} />
                <div className={cn(
                  "flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer",
                  itemIsSelected ? "bg-orange-500/5 text-orange-400" : "text-zinc-500 hover:text-zinc-300"
                )}>
                  <Brain size={14} className={cn(itemIsSelected ? "text-orange-500" : "text-zinc-600")} />
                  <span className="text-xs font-medium">{quiz.title}</span>
                  <div className="ml-auto flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700/50 text-zinc-500 uppercase font-bold">
                          {quiz.questionCount} Questions
                      </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Reorder.Item>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.chapter._id === nextProps.chapter._id &&
    prevProps.chapter.title === nextProps.chapter.title &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isOnActivePath === nextProps.isOnActivePath &&
    prevProps.chapter.subChapters?.length === nextProps.chapter.subChapters?.length &&
    prevProps.chapter.problems?.length === nextProps.chapter.problems?.length
  );
});

export const CurriculumManager: React.FC<CurriculumManagerProps> = ({ onBack, onCreateProblem }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activePathIds, setActivePathIds] = useState<Set<string>>(new Set());
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);

  // Form states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', type: 'MIXED' });
  
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterForm, setChapterForm] = useState({ title: '', description: '', parentId: null as string | null });
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState({ 
    title: '', 
    description: '', 
    timeLimit: 15, 
    passingScore: 70, 
    questionCount: 10 
  });
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCourses();
      // Filter for programming if needed, or show all
      setCourses(data);
    } catch (err) {
      toast.error('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChapters = async (courseId: string) => {
    try {
      setIsLoading(true);
      const data = await api.getChapters(courseId);
      setChapters(data);
    } catch (err) {
      toast.error('Failed to fetch curriculum');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchChapters(selectedCourseId);
    }
  }, [selectedCourseId]);

  const toggleFolder = React.useCallback((id: string) => {
    setSelectedItemId(id);
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const findPath = (items: any[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const item of items) {
      if (item._id === targetId) return [...currentPath, item._id];
      if (item.subChapters) {
        const res = findPath(item.subChapters, targetId, [...currentPath, item._id]);
        if (res) return res;
      }
      if (item.problems?.some((p: any) => p._id === targetId)) {
        return [...currentPath, item._id, targetId];
      }
      if (item.quizzes?.some((q: any) => q._id === targetId)) {
        return [...currentPath, item._id, targetId];
      }
    }
    return null;
  };

  // Update active path only when selection changes or chapters are freshly loaded
  // Avoid running this during every frame of a drag (onReorder)
  useEffect(() => {
    if (selectedItemId && chapters.length > 0) {
      const path = findPath(chapters, selectedItemId);
      const newPathSet = new Set(path || []);
      
      // Only update if the set is actually different to avoid extra renders
      setActivePathIds(prev => {
        if (prev.size !== newPathSet.size) return newPathSet;
        const areEqual = Array.from(newPathSet).every(id => prev.has(id));
        return areEqual ? prev : newPathSet;
      });
    } else if (!selectedItemId) {
      setActivePathIds(new Set());
    }
  }, [selectedItemId]); 
  
  // Also run when chapters change, but NOT during active reordering
  // We'll trust selection doesn't change hierarchy level during drag reorder
  useEffect(() => {
    if (selectedItemId && !hasOrderChanged) {
        const path = findPath(chapters, selectedItemId);
        setActivePathIds(new Set(path || []));
    }
  }, [chapters, selectedItemId, hasOrderChanged]);

  const handleCreateCourse = React.useCallback(async () => {
    try {
      await api.admin.createCourse(courseForm.title, courseForm.description, undefined, courseForm.type);
      toast.success('Course created');
      setShowCourseModal(false);
      fetchCourses();
    } catch (err) {
      toast.error('Failed to create course');
    }
  }, [courseForm, fetchCourses]);

  const handleCreateChapter = React.useCallback(async () => {
    if (!selectedCourseId) return;
    try {
      if (editingChapterId) {
        await api.admin.updateChapter(editingChapterId, { title: chapterForm.title, description: chapterForm.description });
        toast.success('Chapter updated');
      } else {
        await api.admin.createChapter(
          selectedCourseId, 
          chapterForm.title, 
          1, 
          chapterForm.parentId, 
          chapterForm.description
        );
        toast.success('Chapter created');
      }
      setShowChapterModal(false);
      setEditingChapterId(null);
      fetchChapters(selectedCourseId);
    } catch (err) {
      toast.error('Failed to save chapter');
    }
  }, [selectedCourseId, editingChapterId, chapterForm, fetchChapters]);

  const handleCreateQuiz = React.useCallback(async () => {
    if (!selectedCourseId || !targetChapterId) return;
    try {
      await api.admin.createQuiz({
        ...quizForm,
        courseId: selectedCourseId,
        chapterId: targetChapterId
      });
      toast.success('Quiz created');
      setShowQuizModal(false);
      fetchChapters(selectedCourseId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create quiz');
    }
  }, [selectedCourseId, targetChapterId, quizForm, fetchChapters]);

  const handleDeleteChapter = React.useCallback(async (chapterId: string) => {
    if (!window.confirm('Are you sure you want to delete this folder and EVERYTHING inside it (sub-folders, quizzes, problems)? This cannot be undone.')) return;
    try {
      setIsLoading(true);
      await api.admin.deleteChapter(chapterId);
      toast.success('Folder deleted');
      if (selectedCourseId) fetchChapters(selectedCourseId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete folder');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, fetchChapters]);

  const handleSaveOrder = async () => {
    if (!selectedCourseId) return;
    try {
      setIsSavingOrder(true);
      
      const flatUpdate: { _id: string; order: number }[] = [];
      const processLevel = (list: any[]) => {
        list.forEach((item, index) => {
          flatUpdate.push({ _id: item._id, order: index + 1 });
          if (item.subChapters?.length) processLevel(item.subChapters);
        });
      };
      
      processLevel(chapters);
      
      await api.admin.bulkUpdateChapters(flatUpdate);
      toast.success('Curriculum order saved successfully');
      setHasOrderChanged(false);
      fetchChapters(selectedCourseId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save order');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const onReorder = React.useCallback((newList: any[], parentId: string | null) => {
    if (parentId === null) {
      setChapters(newList);
    } else {
      setChapters(prev => updateNestedOrder(prev, parentId, newList));
    }
    setHasOrderChanged(true);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Curriculum Architect</h1>
              <p className="text-sm text-zinc-500">Design courses, chapters, and nested programming modules</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCourseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 transition-all"
            >
              <Plus size={14} />
              New Course
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Courses Sidebar */}
          <div className="col-span-4 space-y-4">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Select Library</span>
            <div className="space-y-2">
              {courses.map(course => (
                <button
                  key={course._id}
                  onClick={() => setSelectedCourseId(course._id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left group",
                    selectedCourseId === course._id 
                      ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                      : "bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    selectedCourseId === course._id ? "bg-orange-500/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                  )}>
                    <BookOpen size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{course.title}</div>
                    <div className="text-[10px] opacity-60 uppercase font-medium mt-0.5">{course.type}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Curriculum View */}
          <div className="col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Curriculum Structure</span>
                <div className="flex items-center gap-4">
                    {hasOrderChanged && (
                        <button
                            onClick={handleSaveOrder}
                            disabled={isSavingOrder}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-orange-900/20 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                        >
                            {isSavingOrder ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            SAVE ORDER
                        </button>
                    )}
                    {selectedCourseId && (
                        <button 
                            onClick={() => {
                                setChapterForm({ title: '', description: '', parentId: null });
                                setShowChapterModal(true);
                            }}
                            className="text-[10px] font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1.5 transition-colors"
                        >
                            <Plus size={12} />
                            Add Root Chapter
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-zinc-900/20 border border-zinc-800 rounded-2xl p-6 min-h-[400px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-zinc-800 animate-spin" />
                </div>
              ) : selectedCourseId ? (
                <div className="space-y-1">
                  {chapters.length > 0 ? (
                    <Reorder.Group 
                      axis="y" 
                      values={chapters} 
                      onReorder={(newList) => onReorder(newList, null)}
                      className="space-y-1"
                    >
                      <AnimatePresence mode="popLayout">
                        {chapters.map(chapter => (
                          <DraggableChapter 
                            key={chapter._id}
                            chapter={chapter}
                            isExpanded={expandedFolders.has(chapter._id)}
                            isSelected={selectedItemId === chapter._id}
                            isOnActivePath={activePathIds.has(chapter._id)}
                            activePathIds={activePathIds}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            onReorder={onReorder}
                            onDelete={handleDeleteChapter}
                            onEdit={React.useCallback((ch: any) => {
                              setEditingChapterId(ch._id);
                              setChapterForm({ title: ch.title, description: ch.description || '', parentId: ch.parentId });
                              setShowChapterModal(true);
                            }, [])}
                            onAddSubFolder={React.useCallback((parentId: string) => {
                              setChapterForm({ title: '', description: '', parentId: parentId });
                              setShowChapterModal(true);
                            }, [])}
                            onAddProblem={React.useCallback((ch: any, level: number) => {
                              if (!selectedCourseId) return;
                              const context = {
                                  courseId: selectedCourseId,
                                  chapterId: level === 0 ? ch._id : (ch.parentId?._id || ch.parentId),
                                  subChapterId: level > 0 ? ch._id : null
                              };
                              if (onCreateProblem) onCreateProblem(context);
                              else toast.info('Navigate to Problem Authoring to add problems');
                            }, [selectedCourseId, onCreateProblem])}
                            onAddQuiz={React.useCallback((chapterId: string) => {
                              setTargetChapterId(chapterId);
                              setQuizForm({ title: '', description: '', timeLimit: 15, passingScore: 70, questionCount: 10 });
                              setShowQuizModal(true);
                            }, [])}
                            selectedItemId={selectedItemId}
                            setSelectedItemId={setSelectedItemId}
                          />
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <div className="p-4 bg-zinc-800/50 rounded-full">
                            <Folder size={32} className="text-zinc-700" />
                        </div>
                        <div>
                            <p className="text-zinc-400 font-medium">No chapters defined</p>
                            <p className="text-xs text-zinc-600 mt-1">Start by adding a root chapter or folder to this course</p>
                        </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                   <p className="text-zinc-600 font-medium">Select a course to view and edit its structure</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Modals could be implemented here */}
      {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
              <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-zinc-800">
                      <h3 className="text-lg font-bold text-white">Create New Course</h3>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Title</label>
                          <input 
                            type="text" 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500/50"
                            value={courseForm.title}
                            onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                          <textarea 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500/50 min-h-[100px]"
                            value={courseForm.description}
                            onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="p-6 bg-zinc-900/50 flex gap-3 justify-end">
                      <button onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300">Cancel</button>
                      <button onClick={handleCreateCourse} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-orange-900/20">Create Course</button>
                  </div>
              </div>
          </div>
      )}

      {showChapterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
              <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-zinc-800">
                      <h3 className="text-lg font-bold text-white">
                        {editingChapterId ? 'Edit Folder' : (chapterForm.parentId ? 'Add Sub-folder' : 'New Root Chapter')}
                      </h3>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</label>
                          <input 
                            type="text" 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500/50"
                            value={chapterForm.title}
                            onChange={e => setChapterForm({...chapterForm, title: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="p-6 bg-zinc-900/50 flex gap-3 justify-end">
                      <button 
                        onClick={() => {
                            setShowChapterModal(false);
                            setEditingChapterId(null);
                        }} 
                        className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300"
                      >
                        Cancel
                      </button>
                      <button onClick={handleCreateChapter} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-orange-900/20">
                        {editingChapterId ? 'Save Changes' : 'Save Folder'}
                      </button>
                  </div>
              </div>
          </div>
      )}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-lg font-bold text-white">Create New Quiz</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Title</label>
                        <input 
                          type="text" 
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500/50"
                          value={quizForm.title}
                          onChange={e => setQuizForm({...quizForm, title: e.target.value})}
                          placeholder="Introduction to SQL"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time (Mins)</label>
                            <input 
                              type="number" 
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500/50"
                              value={quizForm.timeLimit}
                              onChange={e => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Passing %</label>
                            <input 
                              type="number" 
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500/50"
                              value={quizForm.passingScore}
                              onChange={e => setQuizForm({...quizForm, passingScore: parseInt(e.target.value) || 0})}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-zinc-900/50 flex gap-3 justify-end">
                    <button onClick={() => setShowQuizModal(false)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300">Cancel</button>
                    <button onClick={handleCreateQuiz} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-orange-900/20">Save Quiz</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
