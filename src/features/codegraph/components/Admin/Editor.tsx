import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ProblemHeader } from './ProblemHeader.tsx';
import { Problem, TestCase, SolutionType } from '../../types';
import { Plus, Trash2, Image as ImageIcon, Code, Paperclip, X, Settings, Microscope, BookOpen, FileText, Edit2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import MonacoEditor from '@monaco-editor/react';
import MDEditor from '@uiw/react-md-editor';
import { registerCustomThemes, THEME_OPTIONS } from '../../lib/monaco-themes.ts';
import { api } from '../../lib/api';
import rehypeRaw from 'rehype-raw';
import { toast } from 'sonner';
import { ImageOverlay } from '../Common/ImageOverlay';
import EditorialAuthoring from './EditorialAuthoring.tsx';

interface EditorProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  testCases: Partial<TestCase>[];
  onTestCasesChange: (cases: Partial<TestCase>[]) => void;
  footer: string;
  onFooterChange: (value: string) => void;
  metadata: any;
  onMetadataChange: (meta: any) => void;
  courses: any[];
  selectedCourseId: number | null;
  onCourseChange: (id: number | null) => void;
  chapters: any[];
  selectedChapterId: number | null;
  onChapterChange: (id: number | null) => void;
  selectedSubChapterId: number | null;
  onSubChapterChange: (id: number | null) => void;
  activeTab: 'description' | 'editorial';
  setActiveTab: (tab: 'description' | 'editorial') => void;
  activeEditorialType: 'BRUTE' | 'BETTER' | 'OPTIMAL';
  setActiveEditorialType: (type: 'BRUTE' | 'BETTER' | 'OPTIMAL') => void;
}

const HIGHLIGHT_CLASS = "bg-zinc-800 text-zinc-100 px-1 py-0.5 rounded text-xs font-mono border border-zinc-700";

export const Editor: React.FC<EditorProps> = ({
  description, onDescriptionChange,
  testCases, onTestCasesChange,
  footer, onFooterChange,
  metadata, onMetadataChange,
  courses, selectedCourseId, onCourseChange,
  chapters, selectedChapterId, onChapterChange,
  selectedSubChapterId, onSubChapterChange,
  activeTab, setActiveTab,
  activeEditorialType, setActiveEditorialType
}) => {

  const [overlayImage, setOverlayImage] = React.useState<string | null>(null);
  const [fullscreenType, setFullscreenType] = React.useState<'description' | 'footer' | null>(null);
  const [editorTheme, setEditorTheme] = React.useState(() => {
    return localStorage.getItem('codegraph-theme') || 'vs-dark';
  });

  // Sync theme
  React.useEffect(() => {
    localStorage.setItem('codegraph-theme', editorTheme);
  }, [editorTheme]);

  const toggleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex(t => t.id === editorTheme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    setEditorTheme(THEME_OPTIONS[nextIndex].id);
  };

  const currentThemeLabel = THEME_OPTIONS.find(t => t.id === editorTheme)?.label || 'Theme';

  const handleMarkdownHighlight = (id: string, currentValue: string, onChange: (val: string) => void) => {
    const el = document.getElementById(id) as HTMLTextAreaElement;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = currentValue.substring(start, end);

    if (selectedText.length > 0) {
      const newValue = currentValue.substring(0, start) + '`' + selectedText + '`' + currentValue.substring(end);
      onChange(newValue);
      
      // Optional: re-select or focus after state update
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + 1, end + 1);
      }, 0);
    }
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCase, value: any) => {
    const newCases = [...testCases];
    newCases[index] = { ...newCases[index], [field]: value };
    onTestCasesChange(newCases);
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large. Max 2MB.");
      return;
    }

    try {
      const promise = api.admin.uploadImage(file);
      toast.promise(promise, {
        loading: 'Uploading test case image...',
        success: (url) => {
          handleUpdateTestCase(index, 'image', url);
          return 'Image uploaded to Cloudinary';
        },
        error: 'Failed to upload image'
      });
    } catch (err) {
      console.error(err);
    }
    e.target.value = '';
  };

  const handleAddTestCase = () => {
    const newCase: Partial<TestCase> = {
      input: '',
      expectedOutput: '',
      imageScale: 40,
      isSample: true
    };
    onTestCasesChange([...testCases, newCase]);
  };

  const handleDeleteTestCase = (index: number) => {
    const newCases = [...testCases];
    newCases.splice(index, 1);
    onTestCasesChange(newCases);
  };


  return (
    <div className="h-full bg-[#0A0A0A] overflow-y-auto custom-scrollbar border-r border-zinc-800 transition-colors duration-200">
      {/* Exact UI Navigation System (Matches Problem View) */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-zinc-800/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 flex items-center gap-8">
          <button
            onClick={() => setActiveTab('description')}
            className={cn(
              "flex items-center gap-2.5 py-4 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative",
              activeTab === 'description' 
                ? "text-zinc-100" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <FileText className={cn("w-3.5 h-3.5", activeTab === 'description' ? "text-orange-500" : "text-zinc-500")} />
            Description
            {activeTab === 'description' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('editorial')}
            className={cn(
              "flex items-center gap-2.5 py-4 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative",
              activeTab === 'editorial' 
                ? "text-zinc-100" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <BookOpen className={cn("w-3.5 h-3.5", activeTab === 'editorial' ? "text-orange-500" : "text-zinc-500")} />
            Editorial
            {activeTab === 'editorial' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]"
              />
            )}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {activeTab === 'description' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProblemHeader
              metadata={metadata}
              content={description}
              editable={true}
              onChange={onMetadataChange}
              courses={courses}
              selectedCourseId={selectedCourseId}
              onCourseChange={onCourseChange}
              chapters={chapters}
              selectedChapterId={selectedChapterId}
              onChapterChange={onChapterChange}
              selectedSubChapterId={selectedSubChapterId}
              onSubChapterChange={onSubChapterChange}
            />

            <div className="flex items-center justify-between mb-3 mt-8">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Edit2 size={12} className="text-orange-500" /> Problem Description
              </span>
              <button 
                onClick={() => setFullscreenType('description')}
                className="text-[10px] font-bold text-zinc-500 hover:text-orange-500 transition-colors flex items-center gap-1.5"
              >
                <Plus size={12} className="rotate-45" /> Fullscreen
              </button>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] font-medium text-zinc-500">Problem Visual Context (Optional)</span>
                    </div>
                    {metadata.image && (
                        <div className="flex items-center gap-2 bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/50">
                            <span className="text-[10px] text-zinc-500 font-medium tracking-tight">Scale</span>
                            <input
                                type="number"
                                min="10"
                                max="100"
                                value={metadata.imageScale ?? 40}
                                onChange={(e) => onMetadataChange({ ...metadata, imageScale: parseInt(e.target.value) })}
                                className="w-10 text-[10px] p-0.5 border-none bg-transparent text-zinc-100 text-center focus:ring-0 outline-none font-mono"
                            />
                            <span className="text-[10px] text-zinc-500">%</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="w-full text-xs p-2.5 pr-8 border border-zinc-800 rounded-lg bg-zinc-900/50 text-zinc-100 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all placeholder-zinc-700"
                            placeholder="Problem image URL or upload"
                            value={metadata.image || ''}
                            onChange={(e) => onMetadataChange({ ...metadata, image: e.target.value })}
                        />
                        {metadata.image && (
                            <button
                                onClick={() => onMetadataChange({ ...metadata, image: '' })}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        id="problem-image-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                    toast.error("Image is too large. Max 2MB.");
                                    return;
                                }
                                try {
                                    const promise = api.admin.uploadImage(file);
                                    toast.promise(promise, {
                                        loading: 'Uploading problem image...',
                                        success: (url) => {
                                            onMetadataChange({ ...metadata, image: url, imageScale: metadata.imageScale || 40 });
                                            return 'Image uploaded to Cloudinary';
                                        },
                                        error: 'Failed to upload image'
                                    });
                                } catch (err) {
                                    console.error(err);
                                }
                            }
                        }}
                    />
                    <button
                        onClick={() => document.getElementById('problem-image-upload')?.click()}
                        className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 transition-all"
                        title="Upload Problem Image"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                </div>

                {metadata.image && (
                    <div className="mt-3 overflow-hidden flex justify-center">
                        <img
                            src={metadata.image}
                            alt="Problem Context"
                            style={{ width: `${metadata.imageScale || 40}%` }}
                            className="object-contain max-w-full cursor-zoom-in active:scale-[0.98] transition-all"
                            onDoubleClick={() => setOverlayImage(metadata.image!)}
                        />
                    </div>
                )}
            </div>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50 mb-12 shadow-inner" data-color-mode="dark">
              <MDEditor
                value={description}
                onChange={(val) => onDescriptionChange(val || '')}
                preview="edit"
                height={400}
                className="!bg-transparent !border-none custom-md-editor"
                previewOptions={{
                  rehypePlugins: [[rehypeRaw as any, { allowDangerousHtml: true }]],
                }}
              />
            </div>

            <div className="space-y-8 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Test Cases</span>
              </div>
              {testCases.map((testCase, index) => (
                <div key={index} className="group relative border border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700 rounded-xl p-4 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-xs text-zinc-100 tracking-tight">Example {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer group/toggle">
                        <span className="text-[10px] font-medium text-zinc-500 group-hover/toggle:text-zinc-400 transition-colors">Sample</span>
                        <input
                          type="checkbox"
                          checked={testCase.isSample}
                          onChange={(e) => handleUpdateTestCase(index, 'isSample', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-orange-600 focus:ring-orange-500/20"
                        />
                      </label>
                      <button
                        onClick={() => handleDeleteTestCase(index)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all ml-2"
                        title="Remove Example"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] font-medium text-zinc-500">Visual Context (Optional)</span>
                      </div>
                      {testCase.image && (
                        <div className="flex items-center gap-2 bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/50">
                          <span className="text-[10px] text-zinc-500 font-medium tracking-tight">Scale</span>
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={testCase.imageScale ?? 40}
                            onChange={(e) => handleUpdateTestCase(index, 'imageScale', parseInt(e.target.value))}
                            className="w-10 text-[10px] p-0.5 border-none bg-transparent text-zinc-100 text-center focus:ring-0 outline-none font-mono"
                          />
                          <span className="text-[10px] text-zinc-500">%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          className="w-full text-xs p-2.5 pr-8 border border-zinc-800 rounded-lg bg-zinc-900/50 text-zinc-100 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all placeholder-zinc-700"
                          placeholder="Image URL or upload"
                          value={testCase.image || ''}
                          onChange={(e) => handleUpdateTestCase(index, 'image', e.target.value)}
                        />
                        {testCase.image && (
                          <button
                            onClick={() => handleUpdateTestCase(index, 'image', '')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        id={`file-upload-${index}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(index, e)}
                      />
                      <button
                        onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                        className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 transition-all"
                        title="Upload Local Image"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                    </div>

                    {testCase.image && (
                      <div className="mt-3 overflow-hidden flex justify-center">
                        <img
                          src={testCase.image}
                          alt="Preview"
                          style={{ width: `${testCase.imageScale || 40}%` }}
                          className="object-contain max-w-full cursor-zoom-in active:scale-[0.98] transition-all"
                          onDoubleClick={() => setOverlayImage(testCase.image!)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="font-bold text-zinc-500 uppercase tracking-tighter">Input</span>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMarkdownHighlight(`input-${index}`, testCase.input || '', (v) => handleUpdateTestCase(index, 'input', v));
                          }}
                          className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <Code className="w-3 h-3" />
                        </button>
                      </div>
                      <textarea
                        id={`input-${index}`}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 text-zinc-300 resize-y focus:ring-1 focus:ring-orange-500/30 outline-none min-h-[60px] custom-scrollbar"
                        value={testCase.input}
                        onChange={(e) => handleUpdateTestCase(index, 'input', e.target.value)}
                        placeholder="test_input = ..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="font-bold text-zinc-500 uppercase tracking-tighter">Expected Output</span>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMarkdownHighlight(`output-${index}`, testCase.expectedOutput || '', (v) => handleUpdateTestCase(index, 'expectedOutput', v));
                          }}
                          className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <Code className="w-3 h-3" />
                        </button>
                      </div>
                      <textarea
                        id={`output-${index}`}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 text-zinc-300 resize-y focus:ring-1 focus:ring-orange-500/30 outline-none min-h-[60px] custom-scrollbar"
                        value={testCase.expectedOutput}
                        onChange={(e) => handleUpdateTestCase(index, 'expectedOutput', e.target.value)}
                        placeholder="output = ..."
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="font-bold text-zinc-500 uppercase tracking-tighter">Explanation (Optional)</span>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMarkdownHighlight(`explanation-${index}`, testCase.explanation || '', (v) => handleUpdateTestCase(index, 'explanation', v));
                          }}
                          className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <Code className="w-3 h-3" />
                        </button>
                      </div>
                      <textarea
                        id={`explanation-${index}`}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 text-zinc-300 resize-y focus:ring-1 focus:ring-orange-500/30 outline-none min-h-[50px] custom-scrollbar"
                        value={testCase.explanation || ''}
                        onChange={(e) => handleUpdateTestCase(index, 'explanation', e.target.value)}
                        placeholder="Briefly explain why this is the correct output..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddTestCase}
                className="w-full flex items-center justify-center gap-2 text-xs text-orange-500 hover:text-orange-400 font-bold py-4 rounded-xl border-2 border-dashed border-zinc-800 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Add Example Case
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Edit2 size={12} className="text-orange-500" /> Constraints & Follow-up
              </span>
              <button 
                onClick={() => setFullscreenType('footer')}
                className="text-[10px] font-bold text-zinc-500 hover:text-orange-500 transition-colors flex items-center gap-1.5"
              >
                <Plus size={12} className="rotate-45" /> Fullscreen
              </button>
            </div>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50 mb-12 shadow-inner" data-color-mode="dark">
              <MDEditor
                value={footer}
                onChange={(val) => onFooterChange(val || '')}
                preview="edit"
                height={200}
                className="!bg-transparent !border-none custom-md-editor"
                previewOptions={{
                  rehypePlugins: [[rehypeRaw as any, { allowDangerousHtml: true }]],
                }}
              />
            </div>

            {/* Technical Architecture Section */}
            <section className="space-y-6 mb-12 pt-8 border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">Technical Architecture</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Driver Code (Java)</span>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-zinc-400 hover:text-orange-500 transition-all"
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THEME_OPTIONS.find(t => t.id === editorTheme)?.color }} />
                      {currentThemeLabel}
                    </button>
                  </div>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
                    <MonacoEditor
                      height="300px"
                      defaultLanguage="java"
                      theme={editorTheme}
                      value={metadata.driverCode || "// Driver code here\n{{SOLUTION}}\n"}
                      onChange={(val) => onMetadataChange({ ...metadata, driverCode: val })}
                      beforeMount={registerCustomThemes}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Solution Template (Java)</span>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-zinc-400 hover:text-orange-500 transition-all"
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THEME_OPTIONS.find(t => t.id === editorTheme)?.color }} />
                      {currentThemeLabel}
                    </button>
                  </div>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
                    <MonacoEditor
                      height="200px"
                      defaultLanguage="java"
                      theme={editorTheme}
                      value={metadata.solutionTemplate || "class Solution {\n    public void solve() {\n        \n    }\n}"}
                      onChange={(val) => onMetadataChange({ ...metadata, solutionTemplate: val })}
                      beforeMount={registerCustomThemes}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 }
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mastery Editorial System */}
            <section className="space-y-6 mb-12">
              <EditorialAuthoring 
                solutions={metadata.editorialSolutions || []}
                onChange={(solutions) => onMetadataChange({ ...metadata, editorialSolutions: solutions })}
                activeType={activeEditorialType}
                onTypeChange={setActiveEditorialType}
              />
            </section>

            {/* Conceptual Check Section */}
            <section className="space-y-6 mb-12 pt-8 border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">Conceptual Check</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Question</span>
                  <textarea
                    value={metadata.quizQuestion || ''}
                    onChange={(e) => onMetadataChange({ ...metadata, quizQuestion: e.target.value })}
                    placeholder="What is the time complexity of the optimal solution?"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none min-h-[60px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Options (Comma separated)</span>
                    <input
                      type="text"
                      value={metadata.quizOptions || ''}
                      onChange={(e) => onMetadataChange({ ...metadata, quizOptions: e.target.value })}
                      placeholder="O(N), O(N log N), O(N^2), O(1)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Correct Answer</span>
                    <input
                      type="text"
                      value={metadata.quizCorrectAnswer || ''}
                      onChange={(e) => onMetadataChange({ ...metadata, quizCorrectAnswer: e.target.value })}
                      placeholder="O(N log N)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 focus:ring-1 focus:ring-orange-500/30 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="h-20"></div>
      </div>
      {/* Fullscreen Markdown Editor Overlay */}
      {fullscreenType && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col animate-in fade-in duration-300">
           <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#0D0D0D]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Edit2 size={16} />
                </div>
                <h2 className="text-xs font-black text-zinc-100 uppercase tracking-widest">
                  {fullscreenType === 'description' ? 'Editing Description' : 'Editing Constraints'}
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
                value={fullscreenType === 'description' ? description : footer}
                onChange={(val) => fullscreenType === 'description' ? onDescriptionChange(val || '') : onFooterChange(val || '')}
                height="100%"
                preview="live"
                className="h-full"
                previewOptions={{
                  rehypePlugins: [[rehypeRaw as any, { allowDangerousHtml: true }]],
                }}
              />
           </div>
           <div className="h-10 bg-zinc-900/50 border-t border-zinc-800 flex items-center px-8">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Press ESC or click close to exit</span>
           </div>
        </div>,
        document.body
      )}

      <ImageOverlay 
        src={overlayImage} 
        isOpen={!!overlayImage} 
        onClose={() => setOverlayImage(null)} 
      />
    </div>
  );
};
