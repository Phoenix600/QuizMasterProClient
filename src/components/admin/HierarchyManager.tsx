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
import { CurriculumTree, CurriculumNode } from './CurriculumTree';

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

type TreeNodeType = 'chapter' | 'quiz' | 'problem';

interface TreeNode {
  id: string;
  type: TreeNodeType;
  title: string;
  children?: TreeNode[];
  data?: any;
}

const getNormalizedId = (id: any): string => String(id);

const TreeItem = React.memo(({
  node, level, expandedFolders, toggleFolder, activePath, selectedId, setSelectedId,
  adminSelectedChapter, setAdminSelectedChapter, adminSelectedCourse,
  setAdminSelectedQuiz, adminSelectedQuiz, setAdminView, setShowAddChapter,
  setEditingChapterData, openConfirm, handleReorder,
  setAdminSelectedProblemId, setProblemInitialContext,
  fetchChaptersForCourse, pushToast
}: any) => {
  const isExpanded = !!expandedFolders[getNormalizedId(node.id)];
  const children = node.children || [];
  const hasChildren = node.type === 'chapter';
  const nid = getNormalizedId(node.id);
  const isSelected = selectedId === nid;
  const isOnActivePath = activePath.includes(nid);
  const isParentInPath = !isSelected && isOnActivePath;
  const dragControls = useDragControls();

  // All nodes in a Reorder.Group must be Reorder.Items to render correctly
  return (
    <Reorder.Item
      value={node}
      key={node.id}
      id={node.id}
      dragListener={node.type === 'chapter'}
      dragControls={dragControls}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={node.type === 'chapter' ? {
        scale: 1.02,
        backgroundColor: "rgba(39, 39, 42, 0.5)",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        zIndex: 50
      } : {}}
      className="select-none relative"
    >
      {node.type === 'chapter' ? (
        <>
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
            onClick={() => {
              // Sidebar pattern: click row → toggle + select in one action
              toggleFolder(nid);
              setSelectedId(nid);
            }}
          >
            <div
              className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-orange-400 p-1 -ml-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical size={16} />
            </div>

            {/* Chevron — visual only, rotation animated like Sidebar (no separate click handler) */}
            {hasChildren ? (
              <ChevronRight
                size={level === 0 ? 18 : 14}
                className={cn(
                  "flex-shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-90",
                  isSelected ? "text-orange-500" : (isOnActivePath ? "text-orange-500/40" : "text-zinc-600")
                )}
              />
            ) : (
              <div className={level === 0 ? "w-[18px]" : "w-[14px]"} />
            )}
            <Folder
              size={level === 0 ? 20 : 16}
              fill={isSelected ? "currentColor" : (isOnActivePath ? "rgba(249, 115, 22, 0.2)" : "none")}
              className={cn(
                "transition-all duration-300",
                isSelected && "text-orange-400",
                !isSelected && isOnActivePath && "text-orange-500/40",
                !isOnActivePath && "text-orange-500/70"
              )}
            />
            <span className={cn(
              "font-medium flex-1 transition-colors",
              level === 0 ? "text-base font-semibold text-zinc-100" : "text-sm text-zinc-300",
              isSelected && "text-orange-100 font-semibold",
              isParentInPath && "text-orange-400/40"
            )}>
              {node.title}
            </span>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-auto">
              {level < 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const item = node.data;
                    setAdminSelectedChapter(item);
                    setSelectedId(getNormalizedId(item._id));
                    setAdminSelectedQuiz({
                      _id: 'new',
                      title: 'New Quiz',
                      description: '',
                      chapterId: node.id,
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
                  const item = node.data;
                  setAdminSelectedChapter(item);
                  setSelectedId(getNormalizedId(item._id));
                  setProblemInitialContext({
                    courseId: adminSelectedCourse?._id,
                    chapterId: item.parentId?._id || item.parentId || node.id,
                    subChapterId: item.parentId ? node.id : undefined
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
                    setAdminSelectedChapter(node.data);
                    setSelectedId(getNormalizedId(node.id));
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
                  const item = node.data;
                  setAdminSelectedChapter(item);
                  setSelectedId(getNormalizedId(item._id));
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
                    await api.deleteChapter(node.id);
                    if (adminSelectedCourse) fetchChaptersForCourse(adminSelectedCourse._id);
                    if (adminSelectedChapter?._id === node.id) setAdminSelectedChapter(null);
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
                className="overflow-hidden ml-[23px] mt-1"
              >
                <div className="py-1 space-y-1">
                  <Reorder.Group
                    axis="y"
                    values={children}
                    onReorder={(newItems) => handleReorder(newItems, node.id)}
                    className="space-y-1"
                  >
                    {children.map((child: TreeNode, idx: number) => {
                      const childNid = getNormalizedId(child.id);
                      const isChildOrDescendantActive = activePath.includes(childNid) || selectedId === childNid ||
                        // Check if any later sibling or this child is on the active path
                        children.slice(idx).some((c: TreeNode) => activePath.includes(getNormalizedId(c.id)) || selectedId === getNormalizedId(c.id));

                      return (
                        <div key={child.id} className="relative">
                          {/* Vertical line segment — highlights orange if active path flows through this position */}
                          <div
                            className={cn(
                              "absolute w-[1px] transition-colors duration-300",
                              isChildOrDescendantActive ? "bg-orange-500" : "bg-zinc-800/50",
                              idx === children.length - 1 ? "h-[22px] top-0" : "h-full top-0"
                            )}
                            style={{ left: '-11px' }}
                          />
                          <TreeItem
                            node={child}
                            level={level + 1}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            activePath={activePath}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
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
                        </div>
                      );
                    })}
                  </Reorder.Group>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : node.type === 'problem' ? (
        <div className="relative group" onClick={(e) => {
          e.stopPropagation();
          setSelectedId(getNormalizedId(node.id));
          setAdminSelectedProblemId(node.id);
          setAdminView('problems');
        }}>
          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-[1px] w-4 h-[1.5px] transition-all duration-300",
            isOnActivePath
              ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)] scale-x-110 origin-left"
              : "bg-zinc-800/50"
          )} />
          <div className={cn(
            "flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer",
            isSelected ? "bg-orange-500/15 text-orange-400 border border-orange-500/30" : "text-zinc-500 hover:text-zinc-300"
          )}>
            <FileText size={14} className={cn(isSelected ? "text-orange-500" : "text-zinc-600")} />
            <span className="text-xs font-medium">{node.title}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold",
                node.data?.difficulty === 'EASY' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" :
                  node.data?.difficulty === 'MEDIUM' ? "border-orange-500/30 text-orange-500 bg-orange-500/5" :
                    "border-rose-500/30 text-rose-500 bg-rose-500/5"
              )}>
                {node.data?.difficulty}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative group" onClick={(e) => {
          e.stopPropagation();
          setSelectedId(getNormalizedId(node.id));
          setAdminSelectedQuiz(node.data);
          setAdminView('questions');
        }}>
          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-[1px] w-4 h-[1.5px] transition-all duration-300",
            isOnActivePath
              ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)] scale-x-110 origin-left"
              : "bg-zinc-800/50"
          )} />
          <div className={cn(
            "flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer",
            isSelected ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold" : "text-zinc-500 hover:text-zinc-300"
          )}>
            <Brain size={14} className={cn(isSelected ? "text-orange-500" : "text-zinc-600")} />
            <span className="text-xs font-medium">{node.title}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700/50 text-zinc-500 uppercase font-bold">
                {node.data?.questionCount} Questions
              </span>
            </div>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}, (prevProps, nextProps) => {
  const prevId = getNormalizedId(prevProps.node.id);
  const nextId = getNormalizedId(nextProps.node.id);

  return (
    prevId === nextId &&
    prevProps.node.title === nextProps.node.title &&
    !!prevProps.expandedFolders[prevId] === !!nextProps.expandedFolders[nextId] &&
    prevProps.activePath.includes(prevId) === nextProps.activePath.includes(nextId) &&
    prevProps.selectedId === nextProps.selectedId &&
    prevProps.node.children?.length === nextProps.node.children?.length
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
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [fetchedChapters, setFetchedChapters] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localChapterTree, setLocalChapterTree] = useState<TreeNode[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const chaptersInSelectedCourse = React.useMemo(() => {
    return adminSelectedCourse ? (courseChapters[adminSelectedCourse._id] || []) : [];
  }, [adminSelectedCourse, courseChapters]);

  const findPath = React.useCallback((items: TreeNode[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const item of items) {
      const itemId = getNormalizedId(item.id);
      const tid = getNormalizedId(targetId);

      // FIXED findPath: robust comparison
      if (itemId === tid) return [...currentPath, itemId];

      if (item.children && item.children.length > 0) {
        const res = findPath(item.children, targetId, [...currentPath, itemId]);
        if (res) return res;
      }
    }
    return null;
  }, []);

  const activePath = React.useMemo(() => {
    if (!selectedId) return [];
    return findPath(localChapterTree, selectedId) || [];
  }, [selectedId, localChapterTree, findPath]);

  // Exact Sidebar handleToggle pattern: { ...prev, [id]: !prev[id] }
  const toggleFolder = React.useCallback((id: string) => {
    const nid = getNormalizedId(id);

    setExpandedFolders(prev => ({ ...prev, [nid]: !prev[nid] }));

    // Fetch quiz data on first open
    if (!expandedFolders[nid]) {
      setFetchedChapters(fPrev => {
        if (!fPrev.has(nid)) {
          fetchQuizzesForChapter(nid);
          const fNext = new Set(fPrev);
          fNext.add(nid);
          return fNext;
        }
        return fPrev;
      });
    }

  }, [fetchQuizzesForChapter, expandedFolders]);

  const chapterTree = React.useMemo(() => {
    if (!chaptersInSelectedCourse || chaptersInSelectedCourse.length === 0) return [];

    const nodeMap: Record<string, TreeNode> = {};

    // Recursive function to create or get a node and process its nested structure
    const processChapter = (ch: any): TreeNode => {
      const id = getNormalizedId(ch._id);
      if (nodeMap[id]) return nodeMap[id];

      const node: TreeNode = {
        id,
        type: 'chapter',
        title: ch.title,
        children: [],
        data: { ...ch, _id: id }
      };
      nodeMap[id] = node;

      // Handle nested chapters if they exist in the input data
      const subChapters = ch.subChapters || ch.children || [];
      subChapters.forEach((sub: any) => {
        const subNode = processChapter(sub);
        if (!node.children?.find(c => c.id === subNode.id)) {
          node.children?.push(subNode);
        }
      });

      return node;
    };

    // First pass: Build the initial map and handle hierarchy from nested items
    chaptersInSelectedCourse.forEach(ch => processChapter(ch));

    // Second pass: Build hierarchy from flat list references (parentId)
    chaptersInSelectedCourse.forEach(ch => {
      const id = getNormalizedId(ch._id);
      const parentId = getNormalizedId(ch.parentId);

      if (parentId && nodeMap[parentId] && id !== parentId) {
        if (!nodeMap[parentId].children?.find(c => c.id === id)) {
          nodeMap[parentId].children?.push(nodeMap[id]);
        }
      }
    });

    // Third pass: Add Quizzes and Problems to all chapter nodes
    Object.values(nodeMap).forEach(node => {
      const chId = node.id;
      const chData = node.data;

      const quizzes = chapterQuizzes[chId] || [];
      quizzes.forEach(quiz => {
        const qId = getNormalizedId(quiz._id);
        if (!node.children?.find(c => c.id === qId)) {
          node.children?.push({
            id: qId,
            type: 'quiz',
            title: quiz.title,
            data: { ...quiz, _id: qId }
          });
        }
      });

      const problems = chData.problems || [];
      problems.forEach(prob => {
        const pId = getNormalizedId(prob._id);
        if (!node.children?.find(c => c.id === pId)) {
          node.children?.push({
            id: pId,
            type: 'problem',
            title: prob.title,
            data: { ...prob, _id: pId }
          });
        }
      });

      // Sort children: Chapters first, then Quizzes, then Problems
      node.children?.sort((a, b) => {
        if (a.type === b.type) return (a.data?.order || 0) - (b.data?.order || 0);
        const typeOrder = { chapter: 0, quiz: 1, problem: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });
    });

    // Identify roots: items that have no parent OR their parent is not in our course
    const roots = Object.values(nodeMap).filter(node => {
      const parentId = getNormalizedId(node.data?.parentId);
      return !parentId || !nodeMap[parentId];
    });

    return roots.sort((a, b) => (a.data?.order || 0) - (b.data?.order || 0));
  }, [chaptersInSelectedCourse, chapterQuizzes]);

  React.useEffect(() => {
    if (!hasUnsavedOrder) {
      setLocalChapterTree(chapterTree);
    }
  }, [chapterTree, hasUnsavedOrder]);

  React.useEffect(() => {
    setHasUnsavedOrder(false);
  }, [adminSelectedCourse?._id]);

  const handleReorder = React.useCallback((newItems: TreeNode[], parentId: string | null = null) => {
    setHasUnsavedOrder(true);
    setLocalChapterTree(prev => {
      if (!parentId) return [...newItems];

      const updateRecursive = (items: TreeNode[]): TreeNode[] => {
        return items.map(it => {
          if (it.id === parentId) {
            return { ...it, children: [...newItems] };
          }
          if (it.children && it.children.length > 0) {
            return { ...it, children: updateRecursive(it.children) };
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
      const updates: { _id: string, order: number }[] = [];
      const collectUpdates = (items: TreeNode[]) => {
        items.forEach((item, index) => {
          if (item.type === 'chapter') {
            updates.push({ _id: item.id, order: index + 1 });
          }
          if (item.children && item.children.length > 0) {
            collectUpdates(item.children);
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

  // Sync external selection with inner selectedId
  React.useEffect(() => {
    const targetId = adminSelectedQuiz?._id || adminSelectedChapter?._id;
    const normalized = targetId ? getNormalizedId(targetId) : null;
    setSelectedId(prev => {
      if (prev === normalized) return prev;
      return normalized;
    }
    );
  }, [adminSelectedChapter?._id, adminSelectedQuiz?._id])

  // Sync expansion with active path — expand parent folders on selection (mirrors Sidebar auto-expand on selectedProblemId)
  React.useEffect(() => {
    if (!activePath.length) return;

    // Build open state for all parent folders in the path (all except the leaf)
    const newOpenNodes: Record<string, boolean> = {};
    activePath.slice(0, -1).forEach(id => {
      newOpenNodes[getNormalizedId(id)] = true;
    });

    setExpandedFolders(prev => ({ ...prev, ...newOpenNodes }));

  }, [activePath]);


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

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mb-4">
                  {localChapterTree.length > 0 ? (
                    <CurriculumTree
                      nodes={localChapterTree.filter(node =>
                        node.title.toLowerCase().includes(chapterSearch.toLowerCase())
                      ) as CurriculumNode[]}
                      activeNodeId={adminSelectedQuiz?._id || adminSelectedChapter?._id}
                      fetchQuizzesForChapter={fetchQuizzesForChapter}
                      onReorder={handleReorder}
                      adminSelectedCourse={adminSelectedCourse}
                      adminSelectedChapter={adminSelectedChapter}
                      setAdminSelectedChapter={setAdminSelectedChapter}
                      setAdminSelectedQuiz={setAdminSelectedQuiz}
                      setAdminView={setAdminView}
                      setShowAddChapter={setShowAddChapter}
                      setEditingChapterData={setEditingChapterData}
                      setProblemInitialContext={setProblemInitialContext}
                      setAdminSelectedProblemId={setAdminSelectedProblemId}
                      openConfirm={openConfirm}
                      fetchChaptersForCourse={fetchChaptersForCourse}
                      pushToast={pushToast}
                    />
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
