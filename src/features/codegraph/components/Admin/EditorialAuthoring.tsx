import React from 'react';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import { 
  Trash2, 
  Plus, 
  Video, 
  Clock, 
  Cpu, 
  BookOpen,
  FileText,
  Activity, 
  Layers, 
  Settings as SettingsIcon,
  X,
  Code,
  Eye,
  Edit2
} from 'lucide-react';
import { motion } from 'motion/react';
import MDEditor from '@uiw/react-md-editor';
import { cn } from '../../lib/utils';
import { EditorialSolution, SolutionType } from '../../types';
import { registerCustomThemes } from '../../lib/monaco-themes.ts';

interface EditorialAuthoringProps {
  solutions: EditorialSolution[];
  onChange: (solutions: EditorialSolution[]) => void;
  activeType: SolutionType;
  onTypeChange: (type: SolutionType) => void;
}

export default function EditorialAuthoring({ solutions, onChange, activeType, onTypeChange }: EditorialAuthoringProps) {
  const [fullscreenType, setFullscreenType] = React.useState<'intuition' | 'approach' | null>(null);

  // Ensure initial state has at least one tier if empty
  React.useEffect(() => {
    if (solutions.length === 0) {
      onChange([{
        type: 'OPTIMAL',
        title: 'Optimal Approach',
        videoUrl: '',
        pdfUrl: '',
        intuition: '',
        approach: '',
        complexity: { time: '', space: '' },
        implementations: [{ language: 'java', code: '' }]
      }]);
    }
  }, []);

  const activeSolution = solutions.find(s => s.type === activeType) || 
                         solutions[0] || 
                         { type: 'OPTIMAL', complexity: {}, implementations: [] } as EditorialSolution;

  const updateSolution = (updates: Partial<EditorialSolution>) => {
    const exists = solutions.some(s => s.type === activeType);
    if (!exists) {
      // If for some reason it doesn't exist, create it then update
      const newTier: EditorialSolution = {
        type: activeType,
        title: `${activeType.charAt(0) + activeType.slice(1).toLowerCase()} Approach`,
        videoUrl: '',
        pdfUrl: '',
        intuition: '',
        approach: '',
        complexity: { time: '', space: '' },
        implementations: [{ language: 'java', code: '' }],
        ...updates
      };
      onChange([...solutions, newTier]);
      return;
    }

    const newSolutions = solutions.map(s => 
      s.type === activeType ? { ...s, ...updates } : s
    );
    onChange(newSolutions);
  };

  const handleAddTier = (type: SolutionType) => {
    if (solutions.find(s => s.type === type)) {
      onTypeChange(type);
      return;
    }
    const newTier: EditorialSolution = {
      type,
      title: `${type.charAt(0) + type.slice(1).toLowerCase()} Approach`,
      videoUrl: '',
      pdfUrl: '',
      intuition: '',
      approach: '',
      complexity: { time: '', space: '' },
      implementations: [{ language: 'java', code: '' }]
    };
    onChange([...solutions, newTier]);
    onTypeChange(type);
  };

  const addImplementation = () => {
    const activeImpls = activeSolution.implementations || [];
    const usedLangs = activeImpls.map(i => i.language.toLowerCase());
    const availableLangs = ['java', 'cpp', 'python', 'javascript'].filter(l => !usedLangs.includes(l));
    
    if (availableLangs.length === 0) return;

    const newImpls = [
      ...activeImpls,
      { language: availableLangs[0], code: '' }
    ];
    updateSolution({ implementations: newImpls });
  };

  const removeImplementation = (lang: string) => {
    const newImpls = (activeSolution.implementations || []).filter(i => i.language !== lang);
    updateSolution({ implementations: newImpls });
  };

  const updateImplementation = (lang: string, code: string) => {
    const newImpls = (activeSolution.implementations || []).map(i => 
      i.language === lang ? { ...i, code } : i
    );
    updateSolution({ implementations: newImpls });
  };


  return (
    <div className="bg-[#0A0A0A] border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-orange-500 w-5 h-5" />
          <h2 className="text-xs font-black text-zinc-100 uppercase tracking-[0.2em]">Mastery Editorial</h2>
        </div>

        <div className="flex gap-2">
          {(['BRUTE', 'BETTER', 'OPTIMAL'] as SolutionType[]).map((type) => {
            const exists = solutions.some(s => s.type === type);
            return (
              <button
                key={type}
                onClick={() => exists ? onTypeChange(type) : handleAddTier(type)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border",
                  exists 
                    ? (activeType === type 
                        ? "bg-zinc-800 text-orange-500 border-zinc-700 shadow-lg" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300")
                    : "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500 hover:text-white"
                )}
              >
                {exists ? '' : '+ '}{type}
              </button>
            );
          })}
        </div>
      </div>

      {/* active Tier Tab Indicator */}
      <div className="bg-zinc-900/40 px-8 py-3.5 border-b border-zinc-800 flex justify-center">
        <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-[0.3em]">
          <Activity size={14} className={cn(activeType === 'BRUTE' ? "block" : "hidden")} />
          <Layers size={14} className={cn(activeType === 'BETTER' ? "block" : "hidden")} />
          <SettingsIcon size={14} className={cn(activeType === 'OPTIMAL' ? "block" : "hidden")} />
          {activeType}
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Solution Title */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Solution Title</label>
          <div className="relative group">
            <input
              type="text"
              value={activeSolution.title || ''}
              onChange={(e) => updateSolution({ title: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition-all font-medium"
              placeholder="Enter Approach Name..."
            />
            <button 
              onClick={() => onChange(solutions.filter(s => s.type !== activeType))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Video & PDF & Complexity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1 flex items-center gap-2">
              <Video size={12} className="opacity-50" /> Video URL
            </label>
            <input
              type="text"
              value={activeSolution.videoUrl || ''}
              onChange={(e) => updateSolution({ videoUrl: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 focus:outline-none focus:border-zinc-700 transition-all font-mono"
              placeholder="YouTube URL"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1 flex items-center gap-2">
              <FileText size={12} className="opacity-50" /> PDF URL
            </label>
            <input
              type="text"
              value={activeSolution.pdfUrl || ''}
              onChange={(e) => updateSolution({ pdfUrl: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 focus:outline-none focus:border-zinc-700 transition-all font-mono"
              placeholder="Google Drive PDF URL"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Time</label>
            <input
              type="text"
              value={activeSolution.complexity?.time || ''}
              onChange={(e) => updateSolution({ complexity: { ...activeSolution.complexity, time: e.target.value } })}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 focus:outline-none focus:border-zinc-700 transition-all font-mono"
              placeholder="O(N)"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Space</label>
            <input
              type="text"
              value={activeSolution.complexity?.space || ''}
              onChange={(e) => updateSolution({ complexity: { ...activeSolution.complexity, space: e.target.value } })}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 focus:outline-none focus:border-zinc-700 transition-all font-mono"
              placeholder="O(1)"
            />
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <Edit2 size={12} className="opacity-50" /> Intuition
              </label>
              <button 
                onClick={() => setFullscreenType('intuition')}
                className="text-[10px] font-bold text-zinc-500 hover:text-orange-500 transition-colors flex items-center gap-1.5"
              >
                <Plus size={12} className="rotate-45" /> Fullscreen
              </button>
            </div>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50" data-color-mode="dark">
              <MDEditor
                value={activeSolution.intuition || ''}
                onChange={(val) => updateSolution({ intuition: val || '' })}
                preview="edit"
                height={250}
                className="!bg-transparent !border-none custom-md-editor"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <Edit2 size={12} className="opacity-50" /> Approach
              </label>
              <button 
                onClick={() => setFullscreenType('approach')}
                className="text-[10px] font-bold text-zinc-500 hover:text-orange-500 transition-colors flex items-center gap-1.5"
              >
                <Plus size={12} className="rotate-45" /> Fullscreen
              </button>
            </div>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50" data-color-mode="dark">
              <MDEditor
                value={activeSolution.approach || ''}
                onChange={(val) => updateSolution({ approach: val || '' })}
                preview="edit"
                height={350}
                className="!bg-transparent !border-none custom-md-editor"
              />
            </div>
          </div>
        </div>

        {/* Code Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Implementation Code</label>
            <div className="flex bg-zinc-950/80 border border-zinc-800 rounded-xl p-1 gap-1">
              {(activeSolution.implementations || []).map((impl) => (
                <div key={impl.language} className="flex bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 items-center gap-2 group/impl">
                  <span className="text-[9px] font-black text-orange-500 uppercase">{impl.language}</span>
                  <button onClick={() => removeImplementation(impl.language)} className="text-zinc-600 hover:text-red-500 animate-in fade-in zoom-in">
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addImplementation}
                className="px-3 py-1.5 text-[9px] font-black text-zinc-500 hover:text-white uppercase transition-colors"
              >
                + Add Lang
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {(activeSolution.implementations || []).map((impl) => (
              <div key={impl.language} className="rounded-3xl border border-zinc-800 overflow-hidden bg-[#0A0A0A] shadow-2xl relative">
                <div className="absolute top-0 left-0 px-4 py-2 bg-zinc-900/80 border-b border-r border-zinc-800 rounded-br-2xl z-10">
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{impl.language}</span>
                </div>
                <div className="h-[280px] pt-8">
                  <Editor
                    height="100%"
                    language={impl.language.toLowerCase()}
                    theme="vs-dark"
                    value={impl.code}
                    onChange={(val) => updateImplementation(impl.language, val || '')}
                    beforeMount={registerCustomThemes}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      padding: { top: 20 },
                      automaticLayout: true,
                      fontFamily: "JetBrains Mono, monospace"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Fullscreen Markdown Editor Overlay */}
      {fullscreenType && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col animate-in fade-in duration-300">
           <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#0D0D0D]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <BookOpen size={16} />
                </div>
                <h2 className="text-xs font-black text-zinc-100 uppercase tracking-widest">
                  {fullscreenType === 'intuition' ? 'Editing Intuition' : 'Editing Approach'} — <span className="text-orange-500">{activeType}</span>
                </h2>
              </div>
              <button 
                onClick={() => setFullscreenType(null)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-lg border border-zinc-700"
              >
                <X size={14} /> Close Fullscreen
              </button>
           </div>
           <div className="flex-1 p-8 overflow-hidden bg-zinc-950" data-color-mode="dark">
              <MDEditor
                value={fullscreenType === 'intuition' ? activeSolution.intuition : activeSolution.approach}
                onChange={(val) => updateSolution({ [fullscreenType]: val || '' })}
                height="100%"
                preview="live"
                className="h-full"
              />
           </div>
           <div className="h-10 bg-zinc-900/50 border-t border-zinc-800 flex items-center px-8">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Press ESC or click close to exit</span>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
}
