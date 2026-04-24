import React from 'react';
import { Code2, Search, ChevronRight, Loader2, Trophy, CheckCircle2, Folder, FolderCheck, Bookmark, Plus, PanelLeftClose } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { Chapter } from '../types';

import { DUMMY_USER } from '../constants';

interface SidebarNodeData {
  id: string | number;
  label: string;
  type: 'folder' | 'item' | 'contest';
  children?: SidebarNodeData[];
  completed?: boolean;
  active?: boolean;
  isOnActivePath?: boolean;
}

interface SidebarNodeProps {
  node: SidebarNodeData;
  level: number;
  openNodes: Record<string, boolean>;
  onToggle: (id: string | number) => void;
  onItemClick: (id: string) => void;
  isLast?: boolean;
  isActivePath?: boolean;
  onEdit?: (id: string) => void;
  isAdmin?: boolean;
}


const getSubfolderColor = (label: string) => {
  return 'text-orange-500';
};

const SidebarNode = ({ node, level, openNodes, onToggle, onItemClick, isLast = false, isActivePath = false, onEdit, isAdmin }: SidebarNodeProps) => {
  const isOpen = openNodes[node.id];
  const isFolder = node.type === 'folder';

  return (
    <div className="relative flex flex-col">
      <div
        id={`sidebar-item-${node.id}`}
        role="button"
        tabIndex={0}
        onClick={() => isFolder ? onToggle(node.id) : onItemClick(String(node.id))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            isFolder ? onToggle(node.id) : onItemClick(String(node.id));
          }
        }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 transition-all duration-200 group relative cursor-pointer outline-none',
          node.active ? 'bg-orange-500/10 text-white' : 'text-zinc-300',
          isFolder
            ? level === 0
              ? 'bg-zinc-900/50 hover:bg-zinc-800/50'
              : 'hover:bg-zinc-800/10'
            : 'hover:bg-zinc-800/20',
          !isFolder && node.active && 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-orange-500 before:rounded-r-full'
        )}
      >
        {/* Tree Connectors */}
        {level > 0 && (
          <div
            className={cn(
              "absolute top-[18px] w-[9px] h-[1px] transition-colors duration-300",
              isActivePath || node.active ? "bg-orange-500" : "bg-zinc-800"
            )}
            style={{ left: '-11px' }}
          />
        )}

        <div className="flex items-start gap-2 min-w-0 flex-1 py-0.5">
          {isFolder ? (
            <>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                {node.completed ? (
                  <FolderCheck size={16} className={cn(level === 0 ? "text-orange-500" : "text-yellow-500")} />
                ) : (
                  <Folder size={16} className={cn(level === 0 ? "text-orange-500" : "text-yellow-500")} />
                )}
              </div>
              <span className={cn('text-[13px] whitespace-normal leading-tight text-left mt-0.5', node.active ? 'font-semibold text-white' : 'text-zinc-300')}>{node.label}</span>
            </>
          ) : node.type === 'contest' ? (
             <>
               <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Trophy size={14} className="text-orange-500" />
               </div>
               <span className={cn('text-[12.5px] whitespace-normal leading-tight text-left mt-0.5 font-bold text-orange-400 group-hover:text-orange-500 transition-colors duration-200')}>
                  {node.label}
               </span>
             </>
          ) : (
            <>
              <div className="w-1" />
              <span className={cn('text-[12.5px] whitespace-normal leading-tight text-left mt-0.5 transition-colors duration-200', node.active ? 'font-bold text-white' : 'text-zinc-400 group-hover:text-zinc-200')}>{node.label}</span>
            </>
          )}
        </div>

        {isFolder && (
          <ChevronRight size={14} className={cn('flex-shrink-0 text-zinc-600 transition-transform duration-200 mt-1', isOpen && 'rotate-90')} />
        )}

        {!isFolder && (
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(String(node.id));
                }}
                className="p-1 text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 rounded transition-all"
              >
                <Code2 size={12} />
              </button>
            )}
            {node.completed && (
              <CheckCircle2 size={14} className="text-orange-500/80" />
            )}
            <Bookmark size={14} className={cn('transition-colors duration-200', node.completed ? 'text-orange-500' : 'text-zinc-600 group-hover:text-zinc-400')} />
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isFolder && isOpen && node.children && node.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className={cn(
              "flex flex-col ml-[22px] transition-all duration-300",
              level === 0 ? "mb-1" : "ml-[22px]"
            )}>
              {node.children.map((child, idx) => (
                <div key={child.id} className="relative">
                  {/* Vertical line segment that stops at the last child */}
                  {level >= 0 && (
                    <div
                      className={cn(
                        "absolute left-0 w-[1px] transition-colors duration-300",
                        // Continuous flow: highlight vertical line if this child OR any LATER sibling is active
                        node.children!.slice(idx).some(c => c.active || c.isOnActivePath)
                          ? "bg-orange-500"
                          : "bg-zinc-800",
                        idx === node.children!.length - 1 ? "h-[18px] top-0" : "h-full top-0"
                      )}
                      style={{ left: '-11px' }}
                    />
                  )}
                    <SidebarNode
                      node={child}
                      level={level + 1}
                      openNodes={openNodes}
                      onToggle={onToggle}
                      onItemClick={onItemClick}
                      isLast={idx === node.children!.length - 1}
                      isActivePath={child.isOnActivePath || child.active}
                      onEdit={onEdit}
                      isAdmin={isAdmin}
                    />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
interface SidebarProps {
  isVisible: boolean;
  selectedProblemId?: string | null;
  onToggle: () => void;
  onProfileClick?: () => void;
  onSelectContest?: (id: string) => void;
  onSelectProblem?: (id: string) => void;
  chapters: Chapter[];
  solvedProblemIds: Set<string>;
  loading: boolean;
  onAddProblem?: () => void;
  onAddQuiz?: () => void;
  onEditProblem?: (id: string) => void;
  onOpen?: () => void;
  courses?: any[];
  selectedCourseId?: string | null;
  onSelectCourse?: (id: string) => void;
  user?: any;
}

export default function Sidebar({ isVisible, selectedProblemId, onToggle, onProfileClick, onSelectContest, onSelectProblem, chapters, solvedProblemIds, loading, onAddProblem, onAddQuiz, onEditProblem, onOpen, courses = [], selectedCourseId, onSelectCourse, user }: SidebarProps) {
  const [openNodes, setOpenNodes] = React.useState<Record<string | number, boolean>>({});
  const [search, setSearch] = React.useState('');
  const isAdmin = user?.role === 'ADMIN';
  const searchInputRef = React.useRef<HTMLInputElement>(null);



  // Auto-expand/scroll separately to avoid re-fetching
  React.useEffect(() => {
    if (selectedProblemId && chapters.length > 0) {
      const findChapterPath = (chapterList: Chapter[], path: string[] = []): string[] | null => {
        for (const ch of chapterList) {
          const currentId = `chapter-${ch.id}`;
          if (ch.problems?.some(p => String(p.id) === String(selectedProblemId))) {
            return [...path, currentId];
          }
          if (ch.subChapters?.length) {
            const found = findChapterPath(ch.subChapters, [...path, currentId]);
            if (found) return found;
          }
        }
        return null;
      };

      const path = findChapterPath(chapters);
      if (path) {
        const newOpenNodes: Record<string, boolean> = {};
        path.forEach(id => { newOpenNodes[id] = true; });
        setOpenNodes(newOpenNodes);
      }

      setTimeout(() => {
        const activeElement = document.getElementById(`sidebar-item-${selectedProblemId}`);
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [selectedProblemId, chapters]);

  const buildTree = React.useCallback((chapter: Chapter): SidebarNodeData => {
    const children: SidebarNodeData[] = [];

    if (chapter.subChapters?.length) {
      children.push(...chapter.subChapters.map((sub) => buildTree(sub)));
    }

    if (chapter.problems?.length) {
      children.push(...chapter.problems.map((problem): SidebarNodeData => ({
        id: problem.id,
        label: problem.title,
        type: 'item',
        completed: solvedProblemIds.has(problem.id),
        active: selectedProblemId === problem.id,
        isOnActivePath: selectedProblemId === problem.id,
      })));
    }

    if (chapter.contests?.length) {
      children.push(...chapter.contests.map((contest): SidebarNodeData => ({
        id: `contest-${contest._id || contest.id}`,
        label: contest.title,
        type: 'contest',
        completed: false,
        active: false,
        isOnActivePath: false,
      })));
    }

    const folderCompleted = children.length > 0 && children.every((child) => child.completed);
    const anyChildActive = children.some(child => child.active || child.isOnActivePath);

    return {
      id: `chapter-${chapter.id}`,
      label: chapter.title,
      type: 'folder',
      children,
      completed: folderCompleted,
      isOnActivePath: anyChildActive,
    };
  }, [selectedProblemId, solvedProblemIds]);

  const filterTree = React.useCallback((node: SidebarNodeData): SidebarNodeData | null => {
    if (!search.trim()) return node;

    const query = search.trim().toLowerCase();
    if (node.type === 'item') {
      return node.label.toLowerCase().includes(query) ? node : null;
    }

    const children = node.children?.map(filterTree).filter(Boolean) as SidebarNodeData[];
    if ((children && children.length > 0) || node.label.toLowerCase().includes(query)) {
      return { ...node, children };
    }

    return null;
  }, [search]);

  // Auto-expand all filtered nodes when searching
  React.useEffect(() => {
    if (search.trim()) {
      const newOpenNodes: Record<string | number, boolean> = { ...openNodes };
      const expandAll = (nodes: SidebarNodeData[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder' && node.children && node.children.length > 0) {
            newOpenNodes[node.id] = true;
            expandAll(node.children);
          }
        });
      };

      const filteredChapters = chapters
        .map(buildTree)
        .map(filterTree)
        .filter(Boolean) as SidebarNodeData[];

      expandAll(filteredChapters);
      setOpenNodes(newOpenNodes);
    }
  }, [search, chapters, buildTree, filterTree]);

  const treeData = React.useMemo(() => {
    return chapters
      .map(buildTree)
      .map((node) => filterTree(node))
      .filter(Boolean) as SidebarNodeData[];
  }, [chapters, buildTree, filterTree]);

  const handleToggle = (id: string | number) => {
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-[#0A0A0A] border-r border-zinc-800 flex flex-col h-screen sticky top-0 overflow-hidden whitespace-nowrap group/sidebar"
        >
          <div className="flex flex-col h-full overflow-hidden" style={{ width: 256 }}>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
                    <Code2 size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-zinc-100">Code Graph</span>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-all"
                  title="Close Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-600 tracking-wider px-1">Curriculum</span>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={onAddProblem}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 rounded transition-all border border-orange-500/20"
                    >
                      <Plus size={12} />
                      New Problem
                    </button>
                  )}
                </div>
              </div>

              {courses.length > 0 && (
                <div className="px-1 relative group">
                  <select
                    value={selectedCourseId || ''}
                    onChange={(e) => onSelectCourse?.(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md py-2 px-3 pr-8 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-orange-500/50 transition-all cursor-pointer appearance-none hover:bg-zinc-800/50"
                  >
                    {courses.map((course) => (
                      <option key={course._id || course.id} value={course._id || course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <ChevronRight size={12} className="rotate-90" />
                  </div>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value.trim() && !isVisible) onOpen?.();
                  }}
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>
            </div>

            <div className="mt-2" />
            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar py-2">
              {loading ? (
                <div className="px-4 py-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <span className="text-[10px] font-semibold text-zinc-600 tracking-wider">Loading...</span>
                </div>
              ) : treeData.length > 0 ? (
                <div className="border border-zinc-800/50 rounded-xl bg-zinc-900/20 overflow-hidden divide-y divide-zinc-800/50">
                  {treeData.map((node, index) => (
                    <div key={node.id} className="transition-all duration-300">
                      <SidebarNode
                        node={node}
                        level={0}
                        openNodes={openNodes}
                        onToggle={handleToggle}
                        onItemClick={(id) => {
                          if (String(id).startsWith('contest-')) {
                             onSelectContest?.(String(id).replace('contest-', ''));
                          } else {
                             onSelectProblem?.(id);
                          }
                        }}
                        onEdit={onEditProblem}
                        isAdmin={isAdmin}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-xs text-zinc-500">No results found.</div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 space-y-2">
              <div
                className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors overflow-hidden">
                  <img
                    src={user?.avatarUrl || DUMMY_USER.avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate">{user?.name || DUMMY_USER.name}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
