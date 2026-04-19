/**
 * CurriculumTree — Exact port of Sidebar.tsx tree pattern for the Admin Curriculum Structure.
 *
 * Key patterns taken directly from Sidebar.tsx:
 *  1. openNodes: Record<string, boolean>  (not a Set)
 *  2. handleToggle: setOpenNodes(prev => ({ ...prev, [id]: !prev[id] }))
 *  3. Per-child vertical line segments with active-path orange highlight
 *  4. Single row click = toggle + select (no separate chevron handler)
 *  5. ChevronRight with rotate-90 CSS animation (not ChevronDown swap)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ChevronRight, Folder, Brain, FileText, Code2, FolderPlus,
  Edit2, Trash2, GripVertical, Plus,
} from 'lucide-react';
import { motion, Reorder, useDragControls, AnimatePresence } from 'motion/react';
import { cn } from '../../features/codegraph/lib/utils';
import * as api from '../../services/api';
import { Quiz } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CurriculumNodeType = 'chapter' | 'quiz' | 'problem';

export interface CurriculumNode {
  id: string;
  type: CurriculumNodeType;
  title: string;
  children?: CurriculumNode[];
  data?: any;
}

interface CurriculumNodeProps {
  node: CurriculumNode;
  level: number;
  /** Exact Sidebar pattern: Record<string, boolean> */
  openNodes: Record<string, boolean>;
  onToggle: (id: string) => void;
  activePath: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  // Admin callbacks
  adminSelectedCourse: any;
  adminSelectedChapter: any;
  setAdminSelectedChapter: (v: any) => void;
  setAdminSelectedQuiz: (v: any) => void;
  setAdminView: (v: any) => void;
  setShowAddChapter: (v: boolean) => void;
  setEditingChapterData: (v: any) => void;
  setProblemInitialContext: (v: any) => void;
  setAdminSelectedProblemId: (v: any) => void;
  openConfirm: (title: string, msg: string, fn: () => void) => void;
  fetchChaptersForCourse: (id: string) => void;
  pushToast: (text: string, type?: any) => void;
  handleReorder: (items: CurriculumNode[], parentId?: string) => void;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const nid = (id: any): string => String(id);

// ─── CurriculumNodeItem (mirrors SidebarNode) ─────────────────────────────────

const CurriculumNodeItem = React.memo(({
  node, level, openNodes, onToggle, activePath, selectedId, onSelect,
  adminSelectedCourse, adminSelectedChapter, setAdminSelectedChapter,
  setAdminSelectedQuiz, setAdminView, setShowAddChapter, setEditingChapterData,
  setProblemInitialContext, setAdminSelectedProblemId, openConfirm,
  fetchChaptersForCourse, pushToast, handleReorder,
}: CurriculumNodeProps) => {
  const nodeId = nid(node.id);
  /** Exact Sidebar: const isOpen = openNodes[node.id] */
  const isOpen = !!openNodes[nodeId];
  const isFolder = node.type === 'chapter';
  const isSelected = selectedId === nodeId;
  const isOnActivePath = activePath.includes(nodeId);
  const isParentInPath = !isSelected && isOnActivePath;
  const children = node.children || [];
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={node}
      id={node.id}
      dragListener={isFolder}
      dragControls={dragControls}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={isFolder ? {
        scale: 1.02,
        backgroundColor: 'rgba(39, 39, 42, 0.5)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        zIndex: 50,
      } : {}}
      className="select-none relative"
    >
      {isFolder ? (
        <div className="relative flex flex-col">
          {/* Horizontal connector tick for sub-folders (mirrors Sidebar tree tick) */}
          {level > 0 && (
            <div
              className={cn(
                'absolute top-[22px] w-[10px] h-[1px] transition-colors duration-300',
                isOnActivePath ? 'bg-orange-500' : 'bg-zinc-800',
              )}
              style={{ left: '-11px' }}
            />
          )}

          {/* ── Folder Row (exact Sidebar onClick: isFolder ? onToggle : onItemClick) ── */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              onToggle(nodeId);   // Exact Sidebar: onToggle(node.id)
              onSelect(nodeId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(nodeId);
                onSelect(nodeId);
              }
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-200 outline-none',
              level > 0 && 'ml-4',
              level === 0 && 'bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 mb-1 py-3 px-4',
              level > 0 && 'hover:bg-zinc-800/20',
              isSelected && 'bg-orange-500/10 border-orange-500/30',
            )}
          >
            {/* Drag handle */}
            <div
              className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-orange-400 p-1 -ml-1 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical size={14} />
            </div>

            {/* Chevron — exact Sidebar: rotate-90 when open, no separate click */}
            <ChevronRight
              size={level === 0 ? 16 : 13}
              className={cn(
                'flex-shrink-0 transition-transform duration-200 mt-0.5',
                isOpen && 'rotate-90',
                isSelected ? 'text-orange-500' : (isOnActivePath ? 'text-orange-500/40' : 'text-zinc-600'),
              )}
            />

            {/* Folder icon */}
            <Folder
              size={level === 0 ? 17 : 14}
              fill={isSelected ? 'currentColor' : (isOnActivePath ? 'rgba(249,115,22,0.2)' : 'none')}
              className={cn(
                'transition-all duration-300 flex-shrink-0',
                isSelected ? 'text-orange-400' : (isOnActivePath ? 'text-orange-500/50' : 'text-orange-500/70'),
              )}
            />

            {/* Label */}
            <span className={cn(
              'flex-1 text-left leading-tight transition-colors duration-200 truncate',
              level === 0 ? 'text-sm font-semibold text-zinc-100' : 'text-xs text-zinc-300',
              isSelected && 'text-orange-100 font-semibold',
              isParentInPath && 'text-orange-400/60',
            )}>
              {node.title}
            </span>

            {/* Admin action buttons */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-auto flex-shrink-0">
              {level < 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const item = node.data;
                    setAdminSelectedChapter(item);
                    onSelect(nid(item._id));
                    setAdminSelectedQuiz({
                      _id: 'new', title: 'New Quiz', description: '',
                      chapterId: node.id, courseId: adminSelectedCourse?._id,
                      questions: [], questionCount: 0, passingScore: 70,
                      timeLimit: 15, isPublished: false,
                    } as Quiz);
                    setAdminView('questions');
                  }}
                  className="p-1 hover:text-orange-500 text-zinc-500 rounded transition-all"
                  title="Add Quiz"
                >
                  <Brain size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const item = node.data;
                  setAdminSelectedChapter(item);
                  onSelect(nid(item._id));
                  setProblemInitialContext({
                    courseId: adminSelectedCourse?._id,
                    chapterId: item.parentId?._id || item.parentId || node.id,
                    subChapterId: item.parentId ? node.id : undefined,
                  });
                  setAdminView('problems');
                }}
                className="p-1 hover:text-orange-500 text-zinc-500 rounded transition-all"
                title="Add Problem"
              >
                <Code2 size={12} />
              </button>
              {level < 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminSelectedChapter(node.data);
                    onSelect(nodeId);
                    setShowAddChapter(true);
                  }}
                  className="p-1 hover:text-orange-500 text-zinc-500 rounded transition-all"
                  title="Add Sub-folder"
                >
                  <FolderPlus size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const item = node.data;
                  setAdminSelectedChapter(item);
                  onSelect(nid(item._id));
                  setEditingChapterData({ ...item, parentId: item.parentId?._id || item.parentId });
                }}
                className="p-1 hover:text-zinc-100 text-zinc-500 rounded transition-all"
                title="Edit"
              >
                <Edit2 size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirm('Delete Folder', 'This will remove all child items.', async () => {
                    await api.deleteChapter(node.id);
                    if (adminSelectedCourse) fetchChaptersForCourse(adminSelectedCourse._id);
                    if (adminSelectedChapter?._id === node.id) setAdminSelectedChapter(null);
                    pushToast('Folder deleted', 'success');
                  });
                }}
                className="p-1 hover:text-red-500 text-zinc-500 rounded transition-all"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* ── Children (exact Sidebar AnimatePresence + per-child vertical line) ── */}
          <AnimatePresence initial={false}>
            {isFolder && isOpen && children.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className={cn('flex flex-col ml-[22px]', level === 0 ? 'mb-1' : 'ml-[22px]')}>
                  <Reorder.Group
                    axis="y"
                    values={children}
                    onReorder={(newItems) => handleReorder(newItems as CurriculumNode[], node.id)}
                    className="flex flex-col"
                  >
                    {children.map((child, idx) => {
                      const childNid = nid(child.id);
                      /**
                       * Exact Sidebar vertical line logic:
                       * highlight if THIS child or any LATER sibling is on the active path.
                       */
                      const isActiveFlow = children
                        .slice(idx)
                        .some((c) => activePath.includes(nid(c.id)) || selectedId === nid(c.id));

                      return (
                        <div key={child.id} className="relative">
                          {/* Vertical line segment — exact Sidebar pattern */}
                          <div
                            className={cn(
                              'absolute w-[1px] transition-colors duration-300',
                              isActiveFlow ? 'bg-orange-500' : 'bg-zinc-800',
                              idx === children.length - 1 ? 'h-[20px] top-0' : 'h-full top-0',
                            )}
                            style={{ left: '-11px' }}
                          />
                          <CurriculumNodeItem
                            node={child}
                            level={level + 1}
                            openNodes={openNodes}
                            onToggle={onToggle}
                            activePath={activePath}
                            selectedId={selectedId}
                            onSelect={onSelect}
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
                            handleReorder={handleReorder}
                          />
                        </div>
                      );
                    })}
                  </Reorder.Group>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : node.type === 'problem' ? (
        /* ── Problem leaf ── */
        <div
          className="relative group"
          onClick={() => {
            onSelect(nodeId);
            setAdminSelectedProblemId(node.id);
            setAdminView('problems');
          }}
        >
          {/* Horizontal tick */}
          <div
            className={cn(
              'absolute top-[18px] w-[10px] h-[1px] transition-colors duration-300',
              isOnActivePath ? 'bg-orange-500' : 'bg-zinc-800',
            )}
            style={{ left: '-11px' }}
          />
          <div className={cn(
            'flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer',
            isSelected ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'text-zinc-500 hover:text-zinc-300',
          )}>
            <FileText size={13} className={isSelected ? 'text-orange-500' : 'text-zinc-600'} />
            <span className="text-xs font-medium flex-1 truncate">{node.title}</span>
            {node.data?.difficulty && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold flex-shrink-0',
                node.data.difficulty === 'EASY' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                  node.data.difficulty === 'MEDIUM' ? 'border-orange-500/30 text-orange-500 bg-orange-500/5' :
                    'border-rose-500/30 text-rose-500 bg-rose-500/5',
              )}>
                {node.data.difficulty}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* ── Quiz leaf ── */
        <div
          className="relative group"
          onClick={() => {
            onSelect(nodeId);
            setAdminSelectedQuiz(node.data);
            setAdminView('questions');
          }}
        >
          {/* Horizontal tick */}
          <div
            className={cn(
              'absolute top-[18px] w-[10px] h-[1px] transition-colors duration-300',
              isOnActivePath ? 'bg-orange-500' : 'bg-zinc-800',
            )}
            style={{ left: '-11px' }}
          />
          <div className={cn(
            'flex items-center gap-2 py-1.5 px-3 ml-4 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer',
            isSelected ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold' : 'text-zinc-500 hover:text-zinc-300',
          )}>
            <Brain size={13} className={isSelected ? 'text-orange-500' : 'text-zinc-600'} />
            <span className="text-xs font-medium flex-1 truncate">{node.title}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700/50 text-zinc-500 uppercase font-bold flex-shrink-0">
              {node.data?.questionCount ?? 0}Q
            </span>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}, (p, n) => {
  const pid = nid(p.node.id);
  const nxtid = nid(n.node.id);
  return (
    pid === nxtid &&
    p.node.title === n.node.title &&
    !!p.openNodes[pid] === !!n.openNodes[nxtid] &&
    p.activePath.includes(pid) === n.activePath.includes(nxtid) &&
    p.selectedId === n.selectedId &&
    p.node.children?.length === n.node.children?.length
  );
});

CurriculumNodeItem.displayName = 'CurriculumNodeItem';

// ─── CurriculumTree (mirrors Sidebar component) ────────────────────────────────

export interface CurriculumTreeProps {
  nodes: CurriculumNode[];
  /** Called when a node is selected */
  onNodeSelect?: (id: string, node: CurriculumNode) => void;
  /** IDs to auto-reveal on mount / when they change */
  activeNodeId?: string | null;
  fetchQuizzesForChapter: (id: string) => void;
  onReorder: (items: CurriculumNode[], parentId?: string) => void;
  // Admin callbacks (forwarded to tree nodes)
  adminSelectedCourse: any;
  adminSelectedChapter: any;
  setAdminSelectedChapter: (v: any) => void;
  setAdminSelectedQuiz: (v: any) => void;
  setAdminView: (v: any) => void;
  setShowAddChapter: (v: boolean) => void;
  setEditingChapterData: (v: any) => void;
  setProblemInitialContext: (v: any) => void;
  setAdminSelectedProblemId: (v: any) => void;
  openConfirm: (title: string, msg: string, fn: () => void) => void;
  fetchChaptersForCourse: (id: string) => void;
  pushToast: (text: string, type?: any) => void;
}

const findPathInTree = (nodes: CurriculumNode[], targetId: string, path: string[] = []): string[] | null => {
  for (const node of nodes) {
    const id = nid(node.id);
    if (id === targetId) return [...path, id];
    if (node.children?.length) {
      const found = findPathInTree(node.children, targetId, [...path, id]);
      if (found) return found;
    }
  }
  return null;
};

export const CurriculumTree: React.FC<CurriculumTreeProps> = ({
  nodes,
  onNodeSelect,
  activeNodeId,
  fetchQuizzesForChapter,
  onReorder,
  adminSelectedCourse,
  adminSelectedChapter,
  setAdminSelectedChapter,
  setAdminSelectedQuiz,
  setAdminView,
  setShowAddChapter,
  setEditingChapterData,
  setProblemInitialContext,
  setAdminSelectedProblemId,
  openConfirm,
  fetchChaptersForCourse,
  pushToast,
}) => {
  /** Exact Sidebar state: openNodes Record<string, boolean> */
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fetchedIds, setFetchedIds] = useState<Set<string>>(new Set());

  // Derived active path (computed, not stored state)
  const activePath = useMemo(() => {
    if (!selectedId) return [];
    return findPathInTree(nodes, selectedId) ?? [];
  }, [selectedId, nodes]);

  /** Exact Sidebar handleToggle: setOpenNodes(prev => ({ ...prev, [id]: !prev[id] })) */
  const handleToggle = useCallback((id: string) => {
    setOpenNodes(prev => ({ ...prev, [id]: !prev[id] }));

    // Fetch quiz data on first expand
    if (!openNodes[id]) {
      setFetchedIds(prev => {
        if (!prev.has(id)) {
          fetchQuizzesForChapter(id);
          return new Set(prev).add(id);
        }
        return prev;
      });
    }
  }, [openNodes, fetchQuizzesForChapter]);

  const handleSelect = useCallback((id: string, node?: CurriculumNode) => {
    setSelectedId(id);
    if (node) onNodeSelect?.(id, node);
  }, [onNodeSelect]);

  /** Exact Sidebar auto-expand: on activeNodeId change, open parent chain  */
  useEffect(() => {
    if (!activeNodeId || !nodes.length) return;

    const path = findPathInTree(nodes, nid(activeNodeId));
    if (!path) return;

    const newOpen: Record<string, boolean> = {};
    path.forEach(id => { newOpen[id] = true; });
    setOpenNodes(prev => ({ ...prev, ...newOpen }));
    setSelectedId(nid(activeNodeId));
  }, [activeNodeId, nodes]);

  if (!nodes.length) return null;

  return (
    <div className="border border-zinc-800/50 rounded-xl bg-zinc-900/20 overflow-hidden">
      <Reorder.Group
        axis="y"
        values={nodes}
        onReorder={(items) => onReorder(items as CurriculumNode[])}
        className="divide-y divide-zinc-800/30 p-1 space-y-0.5"
      >
        {nodes.map((node, idx) => {
          const nodeNid = nid(node.id);
          const isActiveFlow = nodes
            .slice(idx)
            .some((c) => activePath.includes(nid(c.id)) || selectedId === nid(c.id));

          return (
            <div key={node.id} className={cn('relative transition-all duration-300', idx > 0 && 'border-t border-zinc-800/30')}>
              {/* Top-level vertical line (not shown for root, only inside children) */}
              <CurriculumNodeItem
                node={node}
                level={0}
                openNodes={openNodes}
                onToggle={handleToggle}
                activePath={activePath}
                selectedId={selectedId}
                onSelect={handleSelect}
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
                handleReorder={onReorder}
              />
            </div>
          );
        })}
      </Reorder.Group>
    </div>
  );
};
