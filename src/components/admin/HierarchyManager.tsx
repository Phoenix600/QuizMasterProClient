import React, { useState } from 'react';
import {
  Folder, ChevronDown, Brain, Search, FileText, Code, Trash2, FolderPlus, ChevronRight, Code2, Edit2, Loader2, ArrowUp, ArrowDown, MoreVertical,
  BookOpen,
  CheckCircle2,
  Edit,
  Layers,
  Plus,
  Trophy,
  GripVertical,
  Save
} from 'lucide-react';
import { motion, Reorder, useDragControls, AnimatePresence } from 'motion/react';
import { cn } from '../../features/codegraph/lib/utils';
import * as api from '../../services/api';
import { Course, Chapter, Quiz, Question } from '../../types';

interface HierarchyManagerProps {
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  chapterQuizzes: Record<string, Quiz[]>;
  adminSelectedCourse: Course | null;
  setAdminSelectedCourse: (val: Course | null) => void;
  adminSelectedChapter: Chapter | null;
  setAdminSelectedChapter: (val: Chapter | null) => void;
  adminSelectedQuiz: Quiz | null;
  setAdminSelectedQuiz: (val: Quiz | null) => void;
  courseSearch: string;
  setCourseSearch: (val: string) => void;
  fetchInitialData: () => void;
  fetchChaptersForCourse: (id: string) => void;
  fetchQuizzesForChapter: (id: string) => void;
  quizQuestionCounts: Record<string, number>;
  setAdminView: (val: any) => void;
  setQuestions: (val: Question[]) => void;
  setShowAddCourse: (val: boolean) => void;
  setShowAddChapter: (val: boolean) => void;
  setShowAddQuiz: (val: boolean) => void;
  setNewQuizData: (val: any) => void;
  setEditingCourseData: (val: any) => void;
  setEditingChapterData: (val: any) => void;
  setEditingQuizData: (val: any) => void;
  setFormError: (val: string) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
  updateToast: (id: number, text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => void;
  publishQuiz: (quizId: string, chapterId: string, isPublished?: boolean) => void;
  setAdminSelectedProblemId: (val: string | number | undefined) => void;
  setProblemInitialContext: (val: any) => void;
}

const TreeItem = React.memo(({
    item, level, expandedFolders, toggleFolder, activePathIds,
    adminSelectedChapter, setAdminSelectedChapter, adminSelectedCourse,
    setAdminSelectedQuiz, adminSelectedQuiz, setAdminView, setShowAddChapter,
    setEditingChapterData, openConfirm, handleReorder,
    setAdminSelectedProblemId, setProblemInitialContext,
    fetchChaptersForCourse, pushToast
  }: any) => {
    const isExpanded = expandedFolders.has(item._id);
    const hasChildren = (item.subChapters && item.subChapters.length > 0) || (item.problems && item.problems.length > 0) || (item.quizzes && item.quizzes.length > 0);
    const isOnActivePath = activePathIds.has(item._id);
    const isSelected = adminSelectedChapter?._id === item._id;
    const dragControls = useDragControls();

    return (
      <Reorder.Item
        value={item}
        key={item._id}
        id={item._id}
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
            "absolute left-0 top-6 -translate-y-[1.5px] w-4 h-[1.5px] transition-all duration-300",
            isOnActivePath 
              ? "bg-orange-500 scale-x-110 origin-left" 
              : "bg-zinc-800/50"
          )} />
        )}
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer group transition-all",
            level > 0 && "ml-4",
            level === 0 && "bg-zinc-900/40 border border-zinc-800/50 mb-1 py-3 px-4",
            isSelected && "bg-orange-500/15 border-orange-500/40"
          )}
          onClick={() => toggleFolder(item._id)}
        >
          {/* Drag Handle */}
          <div 
            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-orange-400 p-1 -ml-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical size={16} />
          </div>

          {hasChildren ? (
            isExpanded ? <ChevronDown size={level === 0 ? 18 : 14} className={cn(isOnActivePath ? "text-orange-500" : "text-zinc-500")} /> : <ChevronRight size={level === 0 ? 18 : 14} className="text-zinc-500" />
          ) : (
            <div className={level === 0 ? "w-[18px]" : "w-[14px]"} />
          )}
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
            {item.title}
          </span>


          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-auto">
            {level < 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAdminSelectedChapter(item);
                  setAdminSelectedQuiz({
                    _id: 'new',
                    title: 'New Quiz',
                    description: '',
                    chapterId: item._id,
                    courseId: adminSelectedCourse!._id,
                    questions: [],
                    questionCount: 0,
                    passingScore: 70,
                    timeLimit: 15,
                    isPublished: false
                  } as Quiz);
                  setAdminView('questions');
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
                setAdminSelectedChapter(item);
                setProblemInitialContext({
                  courseId: adminSelectedCourse?._id,
                  chapterId: item.parentId?._id || item.parentId || item._id,
                  subChapterId: item.parentId ? item._id : undefined
                });
                setAdminView('problems');
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
                  setAdminSelectedChapter(item);
                  setShowAddChapter(true);
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
                setAdminSelectedChapter(item);
                setEditingChapterData({ ...item, parentId: item.parentId?._id || item.parentId });
              }}
              className="p-1 hover:text-zinc-100 text-zinc-500"
              title="Edit Folder"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm('Delete Folder', 'Are you sure? This will remove all child items (sub-folders, quizzes, problems).', async () => {
                  await api.deleteChapter(item._id);
                  if (adminSelectedCourse) fetchChaptersForCourse(adminSelectedCourse._id);
                  if (adminSelectedChapter?._id === item._id) setAdminSelectedChapter(null);
                  pushToast('Folder deleted', 'success');
                });
              }}
              className="p-1 hover:text-red-500 text-zinc-500"
              title="Delete Folder"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={cn(
                "border-l ml-[23px] mt-1 overflow-hidden transition-colors duration-300",
                isOnActivePath ? "border-orange-500" : "border-zinc-800/50"
              )}
            >
              <div className="py-1 space-y-1">
            <Reorder.Group
              axis="y"
              values={item.subChapters || []}
              onReorder={(newItems) => handleReorder(newItems, item._id)}
              className="space-y-1"
            >
              {item.subChapters?.map((sub: any) => (
                <TreeItem
                  key={sub._id}
                  item={sub}
                  level={level + 1}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  activePathIds={activePathIds}
                  adminSelectedChapter={adminSelectedChapter}
                  setAdminSelectedChapter={setAdminSelectedChapter}
                  adminSelectedCourse={adminSelectedCourse}
                  setAdminSelectedQuiz={setAdminSelectedQuiz}
                  adminSelectedQuiz={adminSelectedQuiz}
                  setAdminView={setAdminView}
                  setShowAddChapter={setShowAddChapter}
                  setEditingChapterData={setEditingChapterData}
                  openConfirm={openConfirm}
                  handleReorder={handleReorder}
                  setAdminSelectedProblemId={setAdminSelectedProblemId}
                  setProblemInitialContext={setProblemInitialContext}
                  fetchChaptersForCourse={fetchChaptersForCourse}
                  pushToast={pushToast}
                />
              ))}
            </Reorder.Group>

            {/* Render Problems - Keep static as they are not folders */}
            {(item.problems || []).map((prob: any) => {
              const itemIsOnPath = activePathIds.has(prob._id);
              const isSelected = adminSelectedChapter?._id === prob._id || adminSelectedChapter?._id === prob.id;

              return (
                <div key={prob._id} className="relative group" onClick={(e) => {
                  e.stopPropagation();
                  setAdminSelectedProblemId(prob._id);
                  setAdminView('problems');
                }}>
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-[1px] w-4 h-[1.5px] transition-all duration-300",
                    itemIsOnPath 
                      ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)] scale-x-110 origin-left" 
                      : "bg-zinc-800/50"
                  )} />
                  <div className={cn(
                    "flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer",
                    isSelected ? "bg-orange-500/15 text-orange-400 border border-orange-500/30" : "text-zinc-500 hover:text-zinc-300"
                  )}>
                    <FileText size={14} className={cn(isSelected ? "text-orange-500" : "text-zinc-600")} />
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

            {/* Render Quizzes - Keep static */}
            {(item.quizzes || []).map((quiz: any) => {
              const quizIsSelected = adminSelectedQuiz?._id === quiz._id;
              const quizIsOnPath = activePathIds.has(quiz._id);

              return (
                <div key={quiz._id} className="relative group" onClick={(e) => {
                  e.stopPropagation();
                  setAdminSelectedQuiz(quiz);
                  setAdminSelectedChapter(item); // Highlight the parent chapter too
                  setAdminView('questions');
                }}>
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-[1px] w-4 h-[1.5px] transition-all duration-300",
                    quizIsOnPath 
                      ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)] scale-x-110 origin-left" 
                      : "bg-zinc-800/50"
                  )} />
                  <div className={cn(
                    "flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer",
                    quizIsSelected ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold" : "text-zinc-500 hover:text-zinc-300"
                  )}>
                    <Brain size={14} className={cn(quizIsSelected ? "text-orange-500" : "text-zinc-600")} />
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
            </motion.div>
          )}
        </AnimatePresence>
      </Reorder.Item>
    );
}, (prevProps, nextProps) => {
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.expandedFolders.has(prevProps.item._id) === nextProps.expandedFolders.has(nextProps.item._id) &&
    prevProps.activePathIds.has(prevProps.item._id) === nextProps.activePathIds.has(nextProps.item._id) &&
    prevProps.adminSelectedChapter?._id === nextProps.adminSelectedChapter?._id &&
    prevProps.adminSelectedQuiz?._id === nextProps.adminSelectedQuiz?._id &&
    prevProps.item.subChapters?.length === nextProps.item.subChapters?.length &&
    prevProps.item.problems?.length === nextProps.item.problems?.length &&
    prevProps.item.quizzes?.length === nextProps.item.quizzes?.length
  );
});

export const HierarchyManager: React.FC<HierarchyManagerProps> = ({

  courses, courseChapters, chapterQuizzes,
  adminSelectedCourse, setAdminSelectedCourse,
  adminSelectedChapter, setAdminSelectedChapter,
  adminSelectedQuiz, setAdminSelectedQuiz,
  courseSearch, setCourseSearch,
  fetchInitialData, fetchChaptersForCourse, fetchQuizzesForChapter,
  quizQuestionCounts, setAdminView, setQuestions,
  setShowAddCourse, setShowAddChapter, setShowAddQuiz, setNewQuizData,
  setEditingCourseData, setEditingChapterData, setEditingQuizData,
  setFormError, openConfirm, pushToast, updateToast, publishQuiz,
  setAdminSelectedProblemId, setProblemInitialContext
}) => {
  const [chapterSearch, setChapterSearch] = useState('');
  const [quizSearch, setQuizSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activePathIds, setActivePathIds] = useState<Set<string>>(new Set());
  const [localChapterTree, setLocalChapterTree] = useState<any[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const chaptersInSelectedCourse = React.useMemo(() => {
    return adminSelectedCourse ? (courseChapters[adminSelectedCourse._id] || []) : [];
  }, [adminSelectedCourse, courseChapters]);

  const toggleFolder = React.useCallback((id: string) => {
    const findChapter = (items: any[], targetId: string): any | null => {
      for (const it of items) {
        if (String(it._id) === String(targetId)) return it;
        const children = it.subChapters || it.children || [];
        const res = findChapter(children, targetId);
        if (res) return res;
      }
      return null;
    };

    const chapter = findChapter(chaptersInSelectedCourse, id);
    setAdminSelectedChapter(chapter || null);
    setAdminSelectedQuiz(null);
    fetchQuizzesForChapter(id);
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, [chaptersInSelectedCourse, setAdminSelectedChapter, setAdminSelectedQuiz, fetchQuizzesForChapter]);

  const findPath = (items: any[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const item of items) {
      const itemId = String(item._id);
      const tid = String(targetId);

      if (itemId === tid) return [...currentPath, itemId];

      const children = item.subChapters || item.children || [];
      if (children.length > 0) {
        const res = findPath(children, targetId, [...currentPath, itemId]);
        if (res) return res;
      }

      if (item.problems?.some((p: any) => String(p._id) === tid)) {
        return [...currentPath, itemId, tid];
      }
      if (item.quizzes?.some((q: any) => String(q._id) === tid)) {
        return [...currentPath, itemId, tid];
      }
    }
    return null;
  };

  const chapterTree = React.useMemo(() => {
    // If chaptersInSelectedCourse is already a tree (has subChapters/children property on items)
    // we just return it. If it's a flat list, we build it.
    if (!chaptersInSelectedCourse || chaptersInSelectedCourse.length === 0) return [];

    // Check if it's already a tree by looking at the first item
    const firstItem = chaptersInSelectedCourse[0] as any;
    const isAlreadyTree = (firstItem.subChapters && firstItem.subChapters.length > 0) ||
      (firstItem.children && firstItem.children.length > 0);

    // If it's a tree, we just ensure subChapters is the consistent property name
    if (isAlreadyTree) {
      const normalize = (items: any[]): any[] => items.map(it => ({
        ...it,
        _id: String(it._id),
        subChapters: normalize(it.subChapters || it.children || []),
        quizzes: it.quizzes || chapterQuizzes[String(it._id)] || []
      })).sort((a, b) => (a.order || 0) - (b.order || 0));
      return normalize(chaptersInSelectedCourse);
    }

    const map: Record<string, any> = {};
    const roots: any[] = [];

    // First pass: Create clean nodes
    chaptersInSelectedCourse.forEach(ch => {
      map[String(ch._id)] = {
        ...ch,
        _id: String(ch._id),
        subChapters: [],
        problems: ch.problems || [],
        quizzes: chapterQuizzes[String(ch._id)] || []
      };
    });

    // Second pass: Build hierarchy
    chaptersInSelectedCourse.forEach(ch => {
      const rawParent = ch.parentId;
      let parentId = null;
      if (typeof rawParent === 'string') parentId = rawParent;
      else if (rawParent?._id) parentId = String(rawParent._id);
      else if (rawParent?.$oid) parentId = String(rawParent.$oid);

      if (parentId && map[parentId]) {
        map[parentId].subChapters.push(map[String(ch._id)]);
      } else {
        roots.push(map[String(ch._id)]);
      }
    });

    roots.sort((a, b) => (a.order || 0) - (b.order || 0));
    roots.forEach(r => r.subChapters.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));

    return roots;
  }, [chaptersInSelectedCourse, chapterQuizzes]);

  // Sync local tree when backend data changes, but only if no unsaved changes
  React.useEffect(() => {
    if (!hasUnsavedOrder) {
      setLocalChapterTree(chapterTree);
    }
  }, [chapterTree, hasUnsavedOrder]);

  // Reset unsaved state when course changes
  React.useEffect(() => {
    setHasUnsavedOrder(false);
  }, [adminSelectedCourse?._id]);

  const handleReorder = React.useCallback((newItems: any[], parentId: string | null = null) => {
    setHasUnsavedOrder(true);
    setLocalChapterTree(prev => {
      if (!parentId) return [...newItems];
      
      const updateRecursive = (items: any[]): any[] => {
        return items.map(it => {
          if (it._id === parentId) {
            return { ...it, subChapters: [...newItems] };
          }
          if (it.subChapters && it.subChapters.length > 0) {
            return { ...it, subChapters: updateRecursive(it.subChapters) };
          }
          return it;
        });
      };
      
      return updateRecursive(prev);
    });
  }, []);

  const handleSaveOrder = async () => {
    if (!adminSelectedCourse) return;
    
    setIsSavingOrder(true);
    const toastId = pushToast('Saving new order...', 'loading', 0);
    
    try {
      // Flatten the tree to get all chapters with their new orders
      const updates: { _id: string, order: number }[] = [];
      
      const collectUpdates = (items: any[]) => {
        items.forEach((item, index) => {
          updates.push({ _id: item._id, order: index + 1 });
          if (item.subChapters && item.subChapters.length > 0) {
            collectUpdates(item.subChapters);
          }
        });
      };
      
      collectUpdates(localChapterTree);
      
      await api.bulkUpdateChapters(updates);
      updateToast(toastId, 'Hierarchy updated successfully', 'success', 2500);
      setHasUnsavedOrder(false);
      fetchChaptersForCourse(adminSelectedCourse._id);
    } catch (err: any) {
      updateToast(toastId, err.response?.data?.message || 'Failed to save order', 'error', 3500);
    } finally {
      setIsSavingOrder(false);
    }
  };

  React.useEffect(() => {
    const targetId = adminSelectedQuiz?._id || adminSelectedChapter?._id;
    if (targetId) {
      const path = findPath(chapterTree, String(targetId));
      const pathSet = new Set(path || []);
      setActivePathIds(pathSet);
      
      // Auto-expand Parents on path
      if (path && path.length > 1) {
        setExpandedFolders(prev => {
          const next = new Set(prev);
          // Expand everything EXCEPT the last item (if it's the target folder)
          // so that the toggleFolder logic can control its expansion state.
          // However, if the target is a Quiz or Problem, we DO want to expand its folder.
          const isFolder = chapterTree.some(it => String(it._id) === targetId) || 
                           path.length > 0; // Simplified check
          
          path.forEach((id, index) => {
            if (index < path.length - 1) {
              next.add(id);
            }
          });
          return next;
        });
      }
    } else {
      setActivePathIds(new Set());
    }
  }, [adminSelectedChapter?._id, adminSelectedQuiz?._id, chapterTree]);






  return (
    <div className="space-y-8">
      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Courses</h3>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search courses..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses
            .filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
            .map((course) => (
              <div
                key={course._id}
                onClick={() => {
                  setAdminSelectedCourse(course);
                  setAdminSelectedChapter(null);
                  setAdminSelectedQuiz(null);
                  fetchChaptersForCourse(course._id);
                }}
                className={`relative p-5 rounded-2xl border transition-all group cursor-pointer ${adminSelectedCourse?._id === course._id
                  ? 'bg-orange-500/10 border-orange-500/50'
                  : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
              >
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${course.isPublished ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                  }`}>
                  {course.isPublished ? 'Live' : 'Draft'}
                </span>

                <div className="flex items-start gap-3 min-w-0 pr-14">
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${adminSelectedCourse?._id === course._id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/10 text-gray-500'
                    }`}>
                    <Code size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{course.title}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{course.description || 'No description yet'}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const toastId = pushToast(course.isPublished ? 'Taking offline...' : 'Publishing...', 'loading', 0);
                      try {
                        const updated = await api.updateCourse(course._id, { isPublished: !course.isPublished });
                        updateToast(toastId, updated.isPublished ? 'Course is now Live' : 'Course set to Draft', 'success', 2500);
                        fetchInitialData();
                        if (adminSelectedCourse?._id === course._id) setAdminSelectedCourse(updated);
                      } catch (err: any) {
                        updateToast(toastId, err.response?.data?.message || 'Failed', 'error', 3000);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${course.isPublished
                      ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                      : 'bg-yellow-500/10 text-yellow-400 hover:bg-green-500/10 hover:text-green-400'
                      }`}
                  >
                    <CheckCircle2 size={12} />
                    {course.isPublished ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCourseData({ courseId: course._id, title: course.title, description: course.description });
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                  >
                    <Edit size={12} />
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirm(
                        'Delete Course',
                        'This will permanently delete this course and all its underlying data. This action is irreversible.',
                        async () => {
                          await api.deleteCourse(course._id);
                          if (adminSelectedCourse?._id === course._id) setAdminSelectedCourse(null);
                          fetchInitialData();
                        }
                      );
                    }}
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            ))}

          {!courseSearch && (
            <button
              onClick={() => setShowAddCourse(true)}
              className="p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-3 text-gray-600 hover:text-orange-400 min-h-[110px] group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-orange-500/10 flex items-center justify-center transition-all">
                <Plus size={18} />
              </div>
              <span className="text-xs font-bold">New Course</span>
            </button>
          )}
        </div>

        {courses.filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase())).length === 0 && courseSearch && (
          <div className="text-center py-6 text-gray-600 text-sm italic">
            No courses found.
          </div>
        )}
      </div>

      <div className="space-y-6">
        {adminSelectedCourse ? (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/10 transition-all duration-700" />
              <div className="relative flex items-center gap-6">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 ring-1 ring-orange-500/20">
                  <BookOpen size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tight">{adminSelectedCourse.title}</h3>
                  <p className="text-gray-500 text-sm font-medium">{adminSelectedCourse.description}</p>
                </div>
              </div>
              <div className="relative flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setEditingCourseData({ courseId: adminSelectedCourse._id, title: adminSelectedCourse.title, description: adminSelectedCourse.description })}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-white/5"
                >
                  <Edit size={16} />
                  Edit Course
                </button>
                <button
                  onClick={async () => {
                    const newStatus = !adminSelectedCourse.isPublished;
                    const toastId = pushToast(newStatus ? 'Publishing course...' : 'Unpublishing...', 'loading', 0);
                    try {
                      const updated = await api.updateCourse(adminSelectedCourse._id, { isPublished: newStatus });
                      updateToast(toastId, `Course ${newStatus ? 'published' : 'unpublished'}`, 'success', 2500);
                      setAdminSelectedCourse(updated);
                      fetchInitialData();
                    } catch (err: any) {
                      updateToast(toastId, 'Failed to update status', 'error', 3000);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${adminSelectedCourse.isPublished
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                    : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                    }`}
                >
                  <CheckCircle2 size={16} />
                  {adminSelectedCourse.isPublished ? 'Published' : 'Publish Course'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Panel: Chapters (66.6%) */}
              <div className="lg:col-span-8 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Curriculum Structure</h4>
                    {hasUnsavedOrder && (
                      <button
                        onClick={handleSaveOrder}
                        disabled={isSavingOrder}
                        className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white text-[10px] font-black rounded-xl transition-all hover:bg-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 disabled:opacity-50 border border-orange-400/30 uppercase tracking-wider"
                      >
                        {isSavingOrder ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save Order
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => { setAdminSelectedChapter(null); setShowAddChapter(true); }}
                    className="text-[10px] font-black text-orange-500 hover:text-orange-400 flex items-center gap-2 transition-all uppercase tracking-widest active:scale-95"
                  >
                    <Plus size={12} strokeWidth={3} />
                    Add Root Chapter
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search chapters..."
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar mb-4">
                  {localChapterTree.length > 0 ? (
                    <Reorder.Group
                      axis="y"
                      values={localChapterTree}
                      onReorder={(newItems) => handleReorder(newItems)}
                      className="space-y-1"
                    >
                      {localChapterTree
                        .filter(ch => ch.title.toLowerCase().includes(chapterSearch.toLowerCase()))
                        .map(chapter => (
                          <TreeItem
                            key={chapter._id}
                            item={chapter}
                            level={0}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            activePathIds={activePathIds}
                            adminSelectedChapter={adminSelectedChapter}
                            setAdminSelectedChapter={setAdminSelectedChapter}
                            adminSelectedCourse={adminSelectedCourse}
                            setAdminSelectedQuiz={setAdminSelectedQuiz}
                            adminSelectedQuiz={adminSelectedQuiz}
                            setAdminView={setAdminView}
                            setShowAddChapter={setShowAddChapter}
                            setEditingChapterData={setEditingChapterData}
                            openConfirm={openConfirm}
                            handleReorder={handleReorder}
                            setAdminSelectedProblemId={setAdminSelectedProblemId}
                            setProblemInitialContext={setProblemInitialContext}
                            fetchChaptersForCourse={fetchChaptersForCourse}
                            pushToast={pushToast}
                          />
                        ))}
                    </Reorder.Group>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="p-4 bg-white/5 rounded-full">
                        <Folder size={32} className="text-gray-700" />
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">No chapters defined</p>
                        <p className="text-xs text-gray-600 mt-1">Start by adding a root chapter or folder</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Right Panel: Quizzes (33.3%) */}
              <div className="lg:col-span-4 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">


                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest">
                    Quizzes {adminSelectedChapter && `— ${adminSelectedChapter.title}`}
                  </h4>
                </div>

                {!adminSelectedChapter ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600">
                      <Layers size={24} />
                    </div>
                    <p className="text-gray-500 text-xs italic">Select a chapter to manage its quizzes.</p>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                      <input
                        type="text"
                        placeholder="Search quizzes..."
                        value={quizSearch}
                        onChange={(e) => setQuizSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar mb-4 py-1">
                      {(chapterQuizzes[adminSelectedChapter._id] || [])
                        .filter(quiz => quiz.title.toLowerCase().includes(quizSearch.toLowerCase()))
                        .map((quiz) => (
                          <div
                            key={quiz._id}
                            onClick={async () => {
                              try {
                                const { quiz: quizData, questions: quizQuestions } = await api.getQuizWithQuestions(quiz._id);
                                setAdminSelectedQuiz({ ...quizData, questions: quizQuestions });
                              } catch (err) {
                                setAdminSelectedQuiz(quiz);
                              }
                              setAdminView('questions');
                            }}
                            className={`relative w-full p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${adminSelectedQuiz?._id === quiz._id
                              ? 'bg-orange-500/10 border-orange-500/40'
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${adminSelectedQuiz?._id === quiz._id
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/10 text-gray-500'
                                }`}>
                                <Trophy size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-white truncate">{quiz.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-hidden">
                                  <span className="text-[10px] text-gray-500">{quiz.timeLimit}m</span>
                                  <span className="text-[10px] text-gray-600">•</span>
                                  <span className="text-[10px] text-gray-500">{quiz.passingScore}% pass</span>
                                  <span className="text-[10px] text-gray-600">•</span>
                                  <span className={`text-[10px] ${quizQuestionCounts[quiz._id] === quiz.questionCount ? 'text-gray-500' : 'text-red-400 font-bold'}`}>
                                    {quizQuestionCounts[quiz._id] || 0}/{quiz.questionCount} Qs
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingQuizData({
                                    quizId: quiz._id,
                                    chapterId: adminSelectedChapter._id,
                                    title: quiz.title,
                                    description: quiz.description || '',
                                    questionCount: quiz.questionCount || quizQuestionCounts[quiz._id] || 1,
                                    passingScore: quiz.passingScore,
                                    timeLimit: quiz.timeLimit,
                                  });
                                  setFormError('');
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                              >
                                <Edit size={10} />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  publishQuiz(quiz._id, adminSelectedChapter._id, !quiz.isPublished);
                                }}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${quiz.isPublished
                                  ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                                  : 'bg-yellow-500/10 text-yellow-400 hover:bg-green-500/10 hover:text-green-400'
                                  }`}
                              >
                                <CheckCircle2 size={10} />
                                {quiz.isPublished ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openConfirm(
                                    'Delete Quiz',
                                    'This quiz and all associated results will be permanently deleted.',
                                    async () => {
                                      await api.deleteQuiz(quiz._id);
                                      fetchQuizzesForChapter(adminSelectedChapter._id);
                                    }
                                  );
                                }}
                                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                              >
                                <Trash2 size={10} />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <button
                      onClick={() => {
                        setNewQuizData({ title: '', description: '', questionCount: 1, passingScore: 70, timeLimit: 30 });
                        setAdminSelectedQuiz({
                          _id: 'new',
                          title: 'New Quiz',
                          description: '',
                          chapterId: adminSelectedChapter!._id,
                          courseId: adminSelectedCourse!._id,
                          questions: [],
                          questionCount: 0,
                          passingScore: 70,
                          timeLimit: 30,
                          isPublished: false
                        } as Quiz);
                        setAdminView('questions');
                      }}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-orange-400 group flex-shrink-0"
                    >
                      <Plus size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">New Quiz</span>
                    </button>
                  </>
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
              <p className="text-gray-500 max-w-xs mx-auto">Select a course card above to manage its chapters and quizzes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
