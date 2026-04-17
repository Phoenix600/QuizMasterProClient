import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Problem } from '../../types';
import { Search, Edit2, Trash2, Plus, AlertCircle, ChevronLeft, ChevronRight, Hash, Layers, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface ProblemListProps {
  onEdit: (id: string | number) => void;
  onCreate: () => void;
  onBack: () => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({ onEdit, onCreate, onBack }) => {
  const [problems, setProblems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [subFolders, setSubFolders] = useState<any[]>([]);
  const [selectedSubFolderId, setSelectedSubFolderId] = useState<string>('');

  // Helper to extract string ID from various formats
  const normalizeId = (idObj: any): string => {
    if (!idObj) return '';
    if (typeof idObj === 'string') return idObj;
    if (typeof idObj === 'number') return String(idObj);
    if (idObj.$oid) return String(idObj.$oid);
    if (idObj._id) return normalizeId(idObj._id);
    if (Array.isArray(idObj) && idObj.length > 0) return normalizeId(idObj[0]);
    if (typeof idObj === 'object' && Object.keys(idObj).length === 0) return '';
    return typeof idObj === 'object' ? '' : String(idObj);
  };

  // Helper to flatten nested chapter tree from API
  const flattenChapters = (tree: any[], pId: string = ''): any[] => {
    let result: any[] = [];
    tree.forEach(chapter => {
      const chapterId = normalizeId(chapter._id);
      const { subChapters, ...chapterData } = chapter;
      
      // Normalize parentId: use existing if it's explicitly set, otherwise use the passed parent
      const currentParentId = normalizeId(chapterData.parentId) || pId;
      
      result.push({ 
        ...chapterData, 
        _id: chapterId, 
        parentId: currentParentId 
      });
      
      if (subChapters && subChapters.length > 0) {
        result = [...result, ...flattenChapters(subChapters, chapterId)];
      }
    });
    return result;
  };

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await api.getCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to fetch courses', err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch chapters when course changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedCourseId) {
        setChapters([]);
        setSelectedChapterId('');
        return;
      }
      try {
        const data = await api.getChapters(selectedCourseId);
        const flattened = Array.isArray(data) ? flattenChapters(data) : [];
        setChapters(flattened);
        setSelectedChapterId(''); // Reset chapter when course changes
      } catch (err) {
        console.error('Failed to fetch chapters', err);
      }
    };
    fetchChapters();
  }, [selectedCourseId]);

  // Update subfolders when chapter changes
  useEffect(() => {
    if (!selectedChapterId) {
      setSubFolders([]);
      setSelectedSubFolderId('');
      return;
    }
    const children = chapters.filter(ch => {
      const pId = normalizeId(ch.parentId);
      const cId = normalizeId(ch._id);
      // It's a subfolder if its parent matches the selection
      // AND it's not the same item (to prevent cycles if any)
      return pId && pId === selectedChapterId && cId !== selectedChapterId;
    });
    setSubFolders(children);
    setSelectedSubFolderId(''); // Reset subfolder when chapter changes
  }, [selectedChapterId, chapters]);

  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      // Use the most specific ID available
      const chapterId = selectedSubFolderId || selectedChapterId;
      const data = await api.getProblems(page, 10, {
        courseId: selectedCourseId || undefined,
        chapterId: chapterId || undefined
      });
      setProblems(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Failed to fetch problems');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [page, selectedCourseId, selectedChapterId, selectedSubFolderId]);

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this problem? This will also remove all test cases and submissions.')) return;
    
    try {
      setIsDeleting(id);
      await api.admin.deleteProblem(id);
      toast.success('Problem deleted successfully');
      fetchProblems();
    } catch (err) {
      toast.error('Failed to delete problem');
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredProblems = problems.filter(p => {
    const pId = (p._id || p.id).toString();
    return p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           pId.includes(searchTerm);
  });

  return (
    <div className="h-full bg-[#0A0A0A] overflow-y-auto custom-scrollbar">
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Problem Management</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage, edit, and curate your coding challenges library.</p>
            </div>
          </div>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            Create New Problem
          </button>
        </div>

        {/* Filters and Search Row */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title or problem ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all placeholder-zinc-700"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedChapterId('');
                  setSelectedSubFolderId('');
                  setPage(0);
                }}
                className="flex-1 lg:flex-none min-w-[140px] bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-300 focus:outline-none focus:border-orange-500/50 hover:bg-zinc-800/50 transition-all outline-none cursor-pointer appearance-none"
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, #71717a 50%), linear-gradient(135deg, #71717a 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={normalizeId(course._id)} value={normalizeId(course._id)}>{course.title}</option>
                ))}
              </select>

              <select
                value={selectedChapterId}
                onChange={(e) => {
                  setSelectedChapterId(e.target.value);
                  setSelectedSubFolderId('');
                  setPage(0);
                }}
                disabled={!selectedCourseId}
                className="flex-1 lg:flex-none min-w-[140px] bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-300 focus:outline-none focus:border-orange-500/50 hover:bg-zinc-800/50 transition-all outline-none disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer appearance-none"
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, #71717a 50%), linear-gradient(135deg, #71717a 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">All Chapters</option>
                {chapters
                  .filter(ch => !normalizeId(ch.parentId))
                  .map(chapter => (
                    <option key={normalizeId(chapter._id)} value={normalizeId(chapter._id)}>{chapter.title}</option>
                  ))}
              </select>

              <select
                value={selectedSubFolderId}
                onChange={(e) => {
                  setSelectedSubFolderId(e.target.value);
                  setPage(0);
                }}
                disabled={!selectedChapterId || subFolders.length === 0}
                className="flex-1 lg:flex-none min-w-[140px] bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-300 focus:outline-none focus:border-orange-500/50 hover:bg-zinc-800/50 transition-all outline-none disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer appearance-none"
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, #71717a 50%), linear-gradient(135deg, #71717a 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">All Sub-folders</option>
                {subFolders.map(folder => (
                  <option key={normalizeId(folder._id)} value={normalizeId(folder._id)}>{folder.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Problem Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 animate-pulse">
                    Loading problems...
                  </td>
                </tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 opacity-20" />
                        <span>No problems found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProblems.map((problem) => {
                  const pId = problem._id || problem.id;
                  return (
                    <tr key={pId} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-4">
                          <span className="font-mono text-zinc-500 text-xs">#{pId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-100 group-hover:text-orange-500 transition-colors">{problem.title}</span>
                          <div className="flex gap-1 mt-1">
                              {problem.tags?.slice(0, 3).map((tag: any) => (
                                  <span key={tag._id || tag.id} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">
                                      {tag.name}
                                  </span>
                              ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border leading-tight inline-block",
                          problem.difficulty === 'EASY' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                          problem.difficulty === 'MEDIUM' ? "text-orange-500 border-orange-500/20 bg-orange-500/5" :
                          "text-rose-500 border-rose-500/20 bg-rose-500/5"
                        )}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                          <span className={cn(
                              "flex items-center gap-1.5",
                              problem.active ? "text-emerald-500" : "text-zinc-600"
                          )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", problem.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")} />
                              {problem.active ? 'Active' : 'Archived'}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(pId)}
                            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
                            title="Edit Problem"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(pId)}
                            disabled={isDeleting === pId}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete Problem"
                          >
                            {isDeleting === pId ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!isLoading && totalPages > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/20">
              <span className="text-xs text-zinc-500">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
};
