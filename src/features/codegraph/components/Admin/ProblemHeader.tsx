import React from 'react';
import { Problem, Difficulty } from '../../types';
import { cn } from '../../lib/utils';
import { Type, Layers, Tag as TagIcon, Hash, Clock } from 'lucide-react';

interface ProblemHeaderProps {
  metadata: any;
  content: string;
  editable: boolean;
  onChange: (meta: any) => void;
  courses: any[];
  selectedCourseId: string | number | null;
  onCourseChange: (id: string | number | null) => void;
  chapters: any[];
  selectedChapterId: string | number | null;
  onChapterChange: (id: string | number | null) => void;
  selectedSubChapterId: string | number | null;
  onSubChapterChange: (id: string | number | null) => void;
}

export const ProblemHeader: React.FC<ProblemHeaderProps> = ({ 
    metadata, 
    content,
    editable, 
    onChange,
    courses,
    selectedCourseId,
    onCourseChange,
    chapters,
    selectedChapterId,
    onChapterChange,
    selectedSubChapterId,
    onSubChapterChange
}) => {
  const handleUpdate = (field: keyof Problem, value: any) => {
    onChange({ ...metadata, [field]: value });
  };

  const selectedChapter = chapters.find(c => (c._id || c.id) === selectedChapterId);
  const subChapters = selectedChapter?.subChapters || [];


  return (
    <div className="mb-10 space-y-6">
      <div className="space-y-6">
        <label className="block">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Problem Title</span>
          </div>
          <input
            type="text"
            value={metadata.title || ''}
            onChange={(e) => handleUpdate('title', e.target.value)}
            disabled={!editable}
            placeholder="Enter problem title..."
            className="w-full bg-transparent text-3xl font-bold text-zinc-100 placeholder-zinc-800 border-none focus:ring-0 outline-none p-0 tracking-tight leading-none"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</span>
            </div>
            <div className="flex gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleUpdate('difficulty', level)}
                  disabled={!editable}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all",
                    metadata.difficulty === level 
                      ? (level === 'EASY' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" :
                         level === 'MEDIUM' ? "bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" :
                         "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15_px_rgba(244,63,94,0.1)]")
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <TagIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tags (Comma Sep)</span>
            </div>
            <input
              type="text"
              value={Array.isArray(metadata.tags) ? metadata.tags.map((t: any) => t.name).join(', ') : (metadata.tags || '')}
              onChange={(e) => handleUpdate('tags', e.target.value)}
              disabled={!editable}
              placeholder="array, string, math..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all placeholder-zinc-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-800/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Course</span>
            </div>
            <select
                value={selectedCourseId || ''}
                onChange={(e) => onCourseChange(e.target.value || null)}
                disabled={!editable}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all cursor-pointer hover:border-zinc-700"
            >
                <option value="">Select Course...</option>
                {courses.map(course => (
                    <option key={course._id || course.id} value={course._id || course.id}>{course.title}</option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chapter</span>
            </div>
            <select
                value={selectedChapterId || ''}
                onChange={(e) => onChapterChange(e.target.value || null)}
                disabled={!editable || !selectedCourseId}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all cursor-pointer hover:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">Select Chapter...</option>
                {chapters.map(chapter => (
                    <option key={chapter._id || chapter.id} value={chapter._id || chapter.id}>{chapter.title}</option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sub-folder</span>
            </div>
            <select
                value={selectedSubChapterId || ''}
                onChange={(e) => onSubChapterChange(e.target.value || null)}
                disabled={!editable || !selectedChapterId || subChapters.length === 0}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all cursor-pointer hover:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">Select Sub-folder...</option>
                {subChapters.map(sub => (
                    <option key={sub._id || sub.id} value={sub._id || sub.id}>{sub.title}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time Limit (ms)</span>
            </div>
            <input
              type="number"
              value={metadata.timeLimitMs || 2000}
              onChange={(e) => handleUpdate('timeLimitMs', parseInt(e.target.value))}
              disabled={!editable}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Memory Limit (MB)</span>
            </div>
            <input
              type="number"
              value={metadata.memoryLimitMb || 256}
              onChange={(e) => handleUpdate('memoryLimitMb', parseInt(e.target.value))}
              disabled={!editable}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all"
            />
          </div>
        </div>
      </div>
      
      <div className="h-px bg-gradient-to-r from-zinc-800 via-zinc-800 to-transparent" />
    </div>
  );
};
