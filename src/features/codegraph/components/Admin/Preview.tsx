import React from 'react';
import { Problem, TestCase } from '../../types';
import { Tag, Clock, MemoryStick, CheckCircle2, Activity, Layers, Settings as SettingsIcon, Video, FileText, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  return (
    <div className="h-full bg-[#0A0A0A] overflow-y-auto custom-scrollbar transition-colors duration-200" id="pdf-content">
      {activeTab === 'description' ? (
        <div className="p-8 max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
          {/* Header Section */}
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-zinc-100 tracking-tight leading-tight">
                {metadata.id ? `${metadata.id}. ` : ''}{metadata.title || 'Untitled Problem'}
              </h1>
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0",
                metadata.difficulty === 'EASY' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                metadata.difficulty === 'MEDIUM' ? "text-orange-500 border-orange-500/20 bg-orange-500/5" :
                "text-rose-500 border-rose-500/20 bg-rose-500/5"
              )}>
                {metadata.difficulty || 'MEDIUM'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px] text-zinc-500">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                <span>{metadata.timeLimitMs || 2000}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <MemoryStick className="w-3.5 h-3.5 text-zinc-600" />
                <span>{metadata.memoryLimitMb || 256}MB</span>
              </div>
              {metadata.tags && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-zinc-600" />
                  <div className="flex gap-1.5">
                    {Array.isArray(metadata.tags)
                      ? (metadata.tags as any[]).map((tag, idx) => (
                        <span key={tag.id || idx} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                          {typeof tag === 'string' ? tag : tag.name}
                        </span>
                      ))
                      : (metadata.tags as unknown as string || '').split(',').map((tag, idx) => (
                        <span key={idx} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                          {tag.trim()}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-emerald-500/80 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Solved</span>
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section className="prose prose-zinc prose-invert max-w-none space-y-6">
            {metadata.image && (
              <div className="mb-6 flex justify-center">
                <img
                  src={metadata.image}
                  alt="Problem Context"
                  className="block"
                  style={{ width: `${metadata.imageScale || 40}%` }}
                />
              </div>
            )}
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="rounded-xl overflow-hidden my-6 border border-zinc-800 shadow-2xl">
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: '1.5rem', background: '#09090b', fontSize: '13px' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-zinc-700/50" {...props}>
                        {children}
                      </code>
                    )
                  },
                  h1: ({ children }) => <h1 className="text-2xl font-black text-zinc-100 mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-zinc-100 mt-6 mb-3 tracking-tight">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold text-orange-500/90 mt-5 mb-2">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-md font-bold text-zinc-200 mt-4 mb-2">{children}</h4>,
                  p: ({ children }) => <p className="mb-4 text-zinc-300 leading-relaxed text-[13px]">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ol>,
                  strong: ({ children }) => <strong className="font-bold text-zinc-100">{children}</strong>,
                  em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-500/50 bg-orange-500/5 px-6 py-4 rounded-r-xl italic my-6 text-zinc-300">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {description || ''}
              </ReactMarkdown>
            </div>
          </section>

          {/* Test Cases Section */}
          {testCases.length > 0 && (
            <section className="space-y-8">
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Examples</h2>
              <div className="space-y-12">
                {testCases.map((testCase, index) => (
                  <div key={index} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500 group/item" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-100 px-1 border-l-2 border-orange-500/50">Example {index + 1}:</h3>
                      {onTestCasesChange && (
                        <button
                          onClick={() => handleDeleteTestCase(index)}
                          className="opacity-0 group-hover/item:opacity-100 p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {testCase.image && (
                      <div className="flex justify-center mb-6">
                        <img
                          src={testCase.image}
                          alt={`Example ${index + 1}`}
                          className="block"
                          style={{ width: `${testCase.imageScale || 40}%` }}
                        />
                      </div>
                    )}

                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition duration-500" />
                      <div className="relative bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl space-y-4 font-mono text-[11px] leading-relaxed">
                        <div className="space-y-1">
                          <span className="text-zinc-500 font-bold block uppercase tracking-tighter">Input</span>
                          <div className="text-zinc-200 whitespace-pre-wrap">{testCase.input}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-zinc-500 font-bold block uppercase tracking-tighter">Output</span>
                          <div className="text-zinc-200 whitespace-pre-wrap">{testCase.expectedOutput}</div>
                        </div>
                        {testCase.explanation && (
                          <div className="space-y-1 pt-2 border-t border-zinc-800/50">
                            <span className="text-zinc-500 font-bold block uppercase tracking-tighter">Explanation</span>
                            <div className="text-zinc-400 italic prose-sm prose-invert">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{testCase.explanation}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer Section */}
          {footer && (
            <section className="pt-8 border-t border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-100 mb-4 uppercase tracking-widest text-zinc-500">Constraints & Follow-up</h2>
              <div className="prose prose-zinc prose-invert max-w-none text-zinc-400 text-sm leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="rounded-xl overflow-hidden my-6 border border-zinc-800 shadow-2xl">
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, padding: '1.5rem', background: '#09090b', fontSize: '13px' }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-zinc-700/50" {...props}>
                          {children}
                        </code>
                      )
                    },
                    h1: ({ children }) => <h1 className="text-2xl font-black text-zinc-100 mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-zinc-100 mt-6 mb-4 tracking-tight">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold text-orange-500/90 mt-5 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 text-zinc-300 leading-relaxed text-[13px]">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ol>,
                    strong: ({ children }) => <strong className="font-bold text-zinc-100">{children}</strong>,
                    em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                  }}
                >
                  {footer || ''}
                </ReactMarkdown>
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="p-8 max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
          {/* Editorial Header */}
          <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-8">
            <div className="space-y-1 text-left">
              <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">{metadata?.title || 'Problem'} Editorial</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Mastery Path • Preview Mode</p>
            </div>

            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {['BRUTE', 'BETTER', 'OPTIMAL'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveEditorialType(type as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                    activeEditorialType === type
                      ? "bg-zinc-800 text-orange-500 shadow-sm ring-1 ring-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300"
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
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 text-zinc-500">
                  <Sparkles size={32} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest text-center">
                    No {activeEditorialType.toLowerCase()} approach defined yet.<br />
                    <span className="text-[10px] text-zinc-600 font-medium">Add it in the editor to see it here.</span>
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-12 pb-20">
                {/* Live Media Preview */}
                <div className="space-y-8">
                  {solution.videoUrl && (
                    <div className="relative aspect-video shadow-2xl rounded-2xl overflow-hidden border border-zinc-800/50 bg-black group">
                      <VideoPlayer url={solution.videoUrl} />
                      <div className="absolute top-4 left-4 pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                          <Video size={12} /> Video Tutorial Preview
                        </div>
                      </div>
                    </div>
                  )}

                  {!solution.videoUrl && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 opacity-40 grayscale">
                      <Video size={32} className="text-zinc-600" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Video URL Missing</span>
                    </div>
                  )}
                </div>

                {/* Intuition Section */}
                <section className="space-y-4">
                  <h2 className="text-md font-bold text-zinc-100 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    Intuition
                  </h2>
                  <div className="text-zinc-400 prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="rounded-xl overflow-hidden my-6 border border-zinc-800 shadow-2xl">
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, padding: '1.5rem', background: '#09090b', fontSize: '13px' }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-zinc-700/50" {...props}>
                              {children}
                            </code>
                          )
                        },
                        h1: ({ children }) => <h1 className="text-2xl font-black text-zinc-100 mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold text-zinc-100 mt-6 mb-4 tracking-tight">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold text-orange-500/90 mt-5 mb-2">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-md font-bold text-zinc-200 mt-4 mb-2">{children}</h4>,
                        p: ({ children }) => <p className="mb-4 text-zinc-300 leading-relaxed text-[13px]">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ol>,
                        strong: ({ children }) => <strong className="font-bold text-zinc-100">{children}</strong>,
                        em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-orange-500/50 bg-orange-500/5 px-6 py-4 rounded-r-xl italic my-6 text-zinc-300">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {solution.intuition || "Start thinking about the core constraints..."}
                    </ReactMarkdown>
                  </div>
                </section>

                {/* Approach Section */}
                <section className="space-y-4">
                  <h2 className="text-md font-bold text-zinc-100 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    Approach
                  </h2>
                  <div className="text-zinc-400 prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="rounded-xl overflow-hidden my-6 border border-zinc-800 shadow-2xl">
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, padding: '1.5rem', background: '#09090b', fontSize: '13px' }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-zinc-700/50" {...props}>
                              {children}
                            </code>
                          )
                        },
                        h1: ({ children }) => <h1 className="text-2xl font-black text-zinc-100 mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold text-zinc-100 mt-6 mb-4 tracking-tight">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold text-orange-500/90 mt-5 mb-2">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-md font-bold text-zinc-200 mt-4 mb-2">{children}</h4>,
                        p: ({ children }) => <p className="mb-4 text-zinc-300 leading-relaxed text-[13px]">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-zinc-300 text-[13px]">{children}</ol>,
                        strong: ({ children }) => <strong className="font-bold text-zinc-100">{children}</strong>,
                        em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-orange-500/50 bg-orange-500/5 px-6 py-4 rounded-r-xl italic my-6 text-zinc-300">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {solution.approach || "Follow these logical steps to implement the solution..."}
                    </ReactMarkdown>
                  </div>
                </section>

                {/* Presentation Preview */}
                {solution.pdfUrl ? (
                  <div className="pt-4">
                    <PdfViewer url={solution.pdfUrl} title="Presentation Preview" />
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 opacity-40 grayscale">
                    <FileText size={32} className="text-zinc-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">PDF URL Missing</span>
                  </div>
                )}

                {/* Implementation Preview */}
                <section className="space-y-6">
                  <h2 className="text-md font-bold text-zinc-100 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    Implementation Details
                  </h2>
                  <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">Editor Active</div>
                      <div className="text-xs text-zinc-500">Code implementation is visible and editable in the editor pane.</div>
                    </div>
                  </div>
                </section>
              </div>
            );
          })()}
        </div>
      )}

      <div className="h-16"></div>
    </div>
  );
};
