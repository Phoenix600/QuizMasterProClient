import React from 'react';
import { Problem, TestCase } from '../../types';
import { Tag, Clock, MemoryStick, CheckCircle2, Activity, Layers, Settings as SettingsIcon, Video, FileText, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import VideoPlayer from '../VideoPlayer';
import { PdfViewer } from '../PdfViewer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PreviewProps {
  activeTab: 'description' | 'editorial';
  activeEditorialType: 'BRUTE' | 'BETTER' | 'OPTIMAL';
  setActiveEditorialType: (type: 'BRUTE' | 'BETTER' | 'OPTIMAL') => void;
  description: string;
  testCases: Partial<TestCase>[];
  footer: string;
  metadata: any;
  onTestCasesChange?: (testCases: Partial<TestCase>[]) => void;
}

export const Preview: React.FC<PreviewProps> = ({
  activeTab,
  activeEditorialType,
  setActiveEditorialType,
  description,
  testCases,
  footer,
  metadata,
  onTestCasesChange
}) => {

  const handleDeleteTestCase = (index: number) => {
    if (onTestCasesChange) {
      const newTestCases = [...testCases];
      newTestCases.splice(index, 1);
      onTestCasesChange(newTestCases);
    }
  };

  const markdownComponents: any = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="rounded-xl overflow-hidden my-6 border border-zinc-800 shadow-2xl">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, padding: '1.5rem', background: '#09090b', fontSize: '14px' }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-orange-500/10 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-orange-500/20" {...props}>
          {children}
        </code>
      )
    },
    h1: ({ children }: any) => <h1 className="text-2xl font-black text-zinc-100 mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold text-zinc-100 mt-6 mb-4 tracking-tight">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold text-orange-500/90 mt-5 mb-2">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-md font-bold text-zinc-200 mt-4 mb-2">{children}</h4>,
    p: ({ children }: any) => <p className="mb-4 text-zinc-200 leading-relaxed text-[16px]">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 mb-6 space-y-2 text-zinc-200 text-[16px]">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-zinc-200 text-[16px]">{children}</ol>,
    strong: ({ children }: any) => <strong className="font-bold text-zinc-100">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-zinc-400">{children}</em>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-orange-500/50 bg-orange-500/5 px-6 py-4 rounded-r-xl italic my-6 text-zinc-200">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="my-8 overflow-x-auto rounded-xl border border-zinc-800 shadow-lg bg-zinc-900/20 backdrop-blur-sm">
        <table className="w-full text-left border-collapse text-[14px]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[10px] font-black tracking-widest">{children}</thead>,
    th: ({ children }: any) => <th className="px-6 py-4 border-b border-zinc-800 font-black">{children}</th>,
    td: ({ children }: any) => <td className="px-6 py-4 border-b border-zinc-800/50 text-zinc-300">{children}</td>,
    tr: ({ children }: any) => <tr className="hover:bg-zinc-800/30 transition-colors">{children}</tr>,
  };

  return (
    <div className="h-full bg-[#0A0A0A] overflow-y-auto custom-scrollbar transition-colors duration-200" id="pdf-content">
      {activeTab === 'description' ? (
        <div className="p-8 max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500 text-left">
          {/* Header Section */}
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-zinc-100 tracking-tight leading-tight">
                {metadata.id ? `${metadata.id}. ` : ''}{metadata.title || 'Untitled Problem'}
              </h1>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0",
                metadata.difficulty === 'EASY' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                metadata.difficulty === 'MEDIUM' ? "text-orange-500 border-orange-500/20 bg-orange-500/5" :
                "text-rose-500 border-rose-500/20 bg-rose-500/5"
              )}>
                {metadata.difficulty || 'MEDIUM'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-orange-500/70" />
                <span>{metadata.timeLimitMs || 2000}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <MemoryStick className="w-3.5 h-3.5 text-blue-500/70" />
                <span>{metadata.memoryLimitMb || 256}MB</span>
              </div>
              {metadata.tags && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-zinc-600" />
                  <div className="flex gap-1.5">
                    {Array.isArray(metadata.tags)
                      ? (metadata.tags as any[]).map((tag, idx) => (
                        <span key={tag.id || idx} className="text-zinc-500 hover:text-orange-500 transition-colors cursor-default">
                          {typeof tag === 'string' ? tag : tag.name}
                        </span>
                      ))
                      : (metadata.tags as unknown as string || '').split(',').map((tag, idx) => (
                        <span key={idx} className="text-zinc-500 hover:text-orange-500 transition-colors cursor-default">
                          {tag.trim()}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
              <div className="ml-auto flex items-center gap-2 text-emerald-500/80">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section className="prose prose-zinc prose-invert max-w-none">
            {metadata.image && (
              <div className="mb-10 flex justify-center">
                <img
                  src={metadata.image}
                  alt="Problem Context"
                  className="rounded-2xl shadow-2xl border border-zinc-800"
                  style={{ width: `${metadata.imageScale || 60}%` }}
                />
              </div>
            )}
            <div className="text-zinc-200 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {description || ''}
              </ReactMarkdown>
            </div>
          </section>

          {/* Test Cases Section */}
          {testCases.length > 0 && (
            <section className="space-y-8 pt-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <Sparkles size={18} className="text-orange-500" />
                <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Examples</h2>
              </div>
              <div className="space-y-12">
                {testCases.map((testCase, index) => (
                  <div key={index} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] border-l-2 border-orange-500 pl-4 ml-1">Example {index + 1}</h3>

                    {testCase.image && (
                      <div className="flex justify-center mb-6">
                        <img
                          src={testCase.image}
                          alt={`Example ${index + 1}`}
                          className="rounded-xl border border-zinc-800 shadow-lg"
                          style={{ width: `${testCase.imageScale || 50}%` }}
                        />
                      </div>
                    )}

                    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 space-y-6 font-mono text-[13px] leading-relaxed shadow-inner">
                      <div className="space-y-2">
                        <span className="text-zinc-500 font-bold block uppercase tracking-widest text-[10px]">Input</span>
                        <div className="text-orange-100/90 bg-orange-500/5 p-3 rounded-lg border border-orange-500/10 whitespace-pre-wrap">{testCase.input}</div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-zinc-500 font-bold block uppercase tracking-widest text-[10px]">Output</span>
                        <div className="text-emerald-100/90 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 whitespace-pre-wrap">{testCase.expectedOutput}</div>
                      </div>
                      {testCase.explanation && (
                        <div className="space-y-2 pt-4 border-t border-zinc-800/50">
                          <span className="text-zinc-500 font-bold block uppercase tracking-widest text-[10px]">Explanation</span>
                          <div className="text-zinc-300 italic px-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                              {testCase.explanation}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer Section */}
          {footer && (
            <section className="pt-12 border-t border-zinc-800/60">
              <div className="flex items-center gap-3 mb-6">
                <SettingsIcon size={16} className="text-zinc-600" />
                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Constraints & Follow-up</h2>
              </div>
              <div className="prose prose-zinc prose-invert max-w-none text-zinc-400">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {footer || ''}
                </ReactMarkdown>
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="p-8 max-w-3xl mx-auto space-y-12 animate-in fade-in duration-500 text-left">
          {/* Editorial Header */}
          <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-10">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-zinc-100 tracking-tight">{metadata?.title || 'Problem'} Editorial</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Advanced Mastery Logic • Expert Solution</p>
              </div>
            </div>

            <div className="flex bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-1 shadow-2xl">
              {['BRUTE', 'BETTER', 'OPTIMAL'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveEditorialType(type as any)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    activeEditorialType === type
                      ? "bg-zinc-800 text-orange-500 shadow-lg ring-1 ring-zinc-700/50"
                      : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30"
                  )}
                >
                  {type === 'BRUTE' ? <Activity size={12} /> : type === 'BETTER' ? <Layers size={12} /> : <SettingsIcon size={12} />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const solution = (metadata?.editorialSolutions || []).find((s: any) => s.type === activeEditorialType);

            if (!solution) {
              return (
                <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-[2.5rem] bg-zinc-900/10 text-zinc-600">
                  <div className="relative mb-6">
                    <Sparkles size={48} className="opacity-10" />
                    <Sparkles size={32} className="absolute -top-2 -right-2 opacity-20 animate-pulse text-orange-500" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-center px-10 leading-loose">
                    Detailed {activeEditorialType.toLowerCase()} sequence is pending initialization.<br />
                    <span className="text-[10px] text-zinc-700 font-bold">Please update the problem configuration in the editor.</span>
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-16 pb-24">
                {/* Live Media Preview */}
                <div className="space-y-8">
                  {solution.videoUrl && (
                    <div className="relative aspect-video shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden border border-zinc-800 bg-black group transition-all duration-700 hover:border-orange-500/20">
                      <VideoPlayer url={solution.videoUrl} />
                      <div className="absolute top-6 left-6 pointer-events-none">
                        <div className="bg-zinc-900/80 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/5 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                          Masterclass Preview
                        </div>
                      </div>
                    </div>
                  )}

                  {!solution.videoUrl && (
                    <div className="h-48 flex flex-col items-center justify-center border border-zinc-800/30 rounded-3xl bg-zinc-900/20 text-zinc-700">
                      <div className="p-4 rounded-full bg-zinc-800/50 mb-4">
                        <Video size={28} className="opacity-20 translate-x-[1px]" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Visual Logic Stream Available</p>
                    </div>
                  )}
                </div>

                {/* Conceptual Content */}
                <div className="space-y-16">
                  {solution.intuition && (
                    <section className="space-y-6 animate-in slide-in-from-left duration-500">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                          <Sparkles size={16} className="text-orange-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Intuition</h2>
                      </div>
                      <div className="bg-zinc-900/20 p-8 rounded-[2rem] border border-zinc-800/50 shadow-inner">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                          {solution.intuition}
                        </ReactMarkdown>
                      </div>
                    </section>
                  )}

                  {solution.approach && (
                    <section className="space-y-6 animate-in slide-in-from-left duration-700">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Activity size={16} className="text-blue-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Logic & Approach</h2>
                      </div>
                      <div className="bg-zinc-900/20 p-8 rounded-[2rem] border border-zinc-800/50 shadow-inner">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                          {solution.approach}
                        </ReactMarkdown>
                      </div>
                    </section>
                  )}

                  {solution.pdfUrl && (
                    <section className="space-y-6 animate-in slide-in-from-left duration-900">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <FileText size={16} className="text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Deep-Dive Presentation</h2>
                      </div>
                      <div className="rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
                        <PdfViewer url={solution.pdfUrl} />
                      </div>
                    </section>
                  )}
                </div>

                {/* Implementation Preview */}
                <div className="space-y-10 pt-16 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Layers size={16} className="text-purple-500" />
                      </div>
                      <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Implementation</h2>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {(solution.implementations || []).map((impl: any, idx: number) => (
                      <div key={idx} className="space-y-4 group">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{impl.language || 'Code'} Solution</span>
                            <div className="h-[1px] w-12 bg-zinc-800 group-hover:w-20 transition-all duration-500" />
                          </div>
                        </div>
                        
                        <div className="rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-[#09090b] transition-all hover:border-zinc-700">
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={impl.language?.toLowerCase() || 'javascript'}
                            PreTag="div"
                            customStyle={{ margin: 0, padding: '2rem', background: 'transparent', fontSize: '14px', lineHeight: '1.7' }}
                          >
                            {impl.code || ''}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complexity Analysis */}
                {(solution.complexity?.time || solution.complexity?.space) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-16 border-t border-zinc-800/80">
                    {solution.complexity?.time && (
                      <div className="relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative p-10 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] space-y-6">
                          <div className="flex items-center gap-3 text-zinc-500">
                            <Clock size={16} className="text-orange-500" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Temporal Efficiency</span>
                          </div>
                          <p className="text-4xl font-black text-zinc-100 font-mono tracking-tighter">{solution.complexity.time}</p>
                        </div>
                      </div>
                    )}
                    {solution.complexity?.space && (
                      <div className="relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative p-10 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] space-y-6">
                          <div className="flex items-center gap-3 text-zinc-500">
                            <Layers size={16} className="text-blue-500" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Spatial Footprint</span>
                          </div>
                          <p className="text-4xl font-black text-zinc-100 font-mono tracking-tighter">{solution.complexity.space}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      <div className="h-20" />
    </div>
  );
};
