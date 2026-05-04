import React from 'react';
import { motion, useDragControls } from 'motion/react';
import { BookOpen, Share2, ThumbsUp, ChevronLeft, ChevronRight, CheckCircle2, Activity, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import VideoPlayer from './VideoPlayer';
import { cn } from '../lib/utils';
import { Problem } from '../types';
import {
  Group,
  Panel,
  Separator
} from 'react-resizable-panels';

interface LectureViewProps {
  problem: Problem;
  onPrev?: () => void;
  onNext?: () => void;
}

const CustomResizeHandle = ({ direction }: { direction: 'horizontal' | 'vertical' }) => (
  <Separator className={cn(
    "relative transition-all duration-300 group z-50",
    direction === 'horizontal' ? "w-1 hover:w-1.5 cursor-col-resize" : "h-1 hover:h-1.5 cursor-row-resize",
    "bg-transparent flex items-center justify-center p-0.5"
  )}>
    <div className={cn(
      "bg-zinc-800/30 transition-colors group-hover:bg-orange-500/50",
      direction === 'horizontal' ? "w-[1px] h-full" : "h-[1px] w-full"
    )} />
  </Separator>
);

export const LectureView: React.FC<LectureViewProps> = ({ problem, onPrev, onNext }) => {
  const [isFocusMode, setIsFocusMode] = React.useState(false);
  const dragControls = useDragControls();
  const studyGridRef = React.useRef<HTMLDivElement>(null);

  const markdownComponents: any = {
    code({ node, inline, className, children, ...props }: any) {
      return (
        <code className="bg-orange-500/10 px-1.5 py-0.5 rounded text-orange-400 font-mono text-[0.9em] border border-orange-500/20" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-3xl font-black text-white mt-10 mb-6 tracking-tight border-b border-white/5 pb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold text-white mt-8 mb-4 tracking-tight">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold text-orange-500/90 mt-6 mb-3">{children}</h3>,
    p: ({ children }: any) => <p className="mb-6 text-zinc-300 leading-[1.8] text-[17px] font-medium">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc pl-6 mb-8 space-y-3 text-zinc-300 text-[17px]">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-8 space-y-3 text-zinc-300 text-[17px]">{children}</ol>,
    li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-orange-500/50 bg-orange-500/5 px-8 py-6 rounded-r-2xl italic my-10 text-zinc-200 text-lg">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="my-10 overflow-x-auto rounded-2xl border border-white/5 shadow-2xl bg-zinc-900/40 backdrop-blur-md">
        <table className="w-full text-left border-collapse text-[15px]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-white/5 text-zinc-400 uppercase text-[11px] font-black tracking-widest">{children}</thead>,
    th: ({ children }: any) => <th className="px-8 py-5 border-b border-white/5 font-black">{children}</th>,
    td: ({ children }: any) => <td className="px-8 py-5 border-b border-white/5 text-zinc-300 font-medium">{children}</td>,
    tr: ({ children }: any) => <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>,
    strong: ({ children }: any) => <strong className="font-bold text-white">{children}</strong>,
  };

  return (
    <div className="h-full w-full bg-[#0A0A0A] overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0D0D0D] shrink-0">
        <div className="flex items-center gap-8">
           <div className="relative py-5 text-sm font-bold text-orange-500 flex items-center gap-2.5">
              <BookOpen size={16} />
              Theory
              <motion.div layoutId="lecture-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            </div>
        </div>

        <div className="flex items-center gap-6">
             <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest",
                  isFocusMode 
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
             >
                {isFocusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {isFocusMode ? "Exit Focus" : "Focus Mode"}
             </button>

             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">Active</span>
             </div>
        </div>
      </div>

      {/* Main Content Area with Resizable Panels */}
      <div className="flex-1 overflow-hidden" ref={studyGridRef}>
        <Group 
          id="lecture-view-group"
          orientation="horizontal" 
          className="h-full"
          defaultLayout={{ "video-panel": 40, "theory-panel": 60 }}
          onLayoutChanged={(layout) => {
            const values = Array.isArray(layout) ? layout : Object.values(layout);
            if (values && values.length >= 2) {
              console.log(`Column Widths -> Video: ${values[0]}%, Theory: ${values[1]}%`);
            }
          }}
        >
          {/* Left Panel: Video Tutorial */}
          {!isFocusMode && (
            <>
              <Panel id="video-panel" defaultSize={40} minSize={30} className="bg-[#0D0D0D]/30 border-r border-white/5">
                <div className="h-full p-8 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
                  <motion.div
                    drag="y"
                    dragControls={dragControls}
                    dragListener={false}
                    dragConstraints={studyGridRef}
                    dragMomentum={false}
                    dragElastic={0}
                    className="relative group w-full max-w-2xl"
                  >
                    {/* Premium Cinema-Grade Chassis Frame */}
                    <div className="relative rounded-[40px] p-1.5 pb-10 bg-zinc-900 border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,1),0_0_40px_rgba(249,115,22,0.1)] overflow-hidden transition-all duration-500 hover:border-orange-500/30">
                      {/* The Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-800 rounded-b-2xl border-x border-b border-white/5 flex items-center justify-center z-30">
                        <div className="w-8 h-1 bg-zinc-700 rounded-full opacity-50" />
                      </div>

                      <div className="absolute inset-0 bg-black rounded-[36px]" />

                      <div className="relative aspect-video rounded-[32px] overflow-hidden border border-white/5 bg-black mt-4 mx-1.5">
                        <VideoPlayer url={problem.videoUrl} />
                      </div>

                      {/* Bottom Handle */}
                      <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-orange-500/5 transition-all group/handle"
                      >
                        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/20 border border-transparent group-hover/handle:border-orange-500/20 transition-all">
                          <Activity size={14} className="text-orange-500" />
                          <span className="text-[10px] font-semibold text-zinc-400 tracking-widest uppercase">Reposition Master</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </Panel>
              <CustomResizeHandle direction="horizontal" />
            </>
          )}

          {/* Right Panel: Theory Content */}
          <Panel id="theory-panel" className="bg-[#0A0A0A]">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className={cn(
                "mx-auto p-12 lg:p-16 transition-all duration-700",
                isFocusMode ? "max-w-5xl" : "max-w-3xl"
              )}>
                 <div className="space-y-12">
                    {/* Header Content */}
                    <div className="space-y-6">
                      <h1 className={cn(
                        "font-bold text-white tracking-tight leading-tight transition-all duration-700",
                        isFocusMode ? "text-6xl" : "text-4xl"
                      )}>
                        {problem.title}
                      </h1>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-[11px] font-black px-5 py-2 rounded-full tracking-[0.1em] uppercase border transition-all duration-500",
                          problem.difficulty === 'EASY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]" :
                          problem.difficulty === 'MEDIUM' ? "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]" :
                          "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                        )}>
                          {problem.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Markdown Body */}
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {problem.description}
                      </ReactMarkdown>
                    </div>
                 </div>
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      {/* Navigation Footer */}
      <div className="h-14 border-t border-white/5 flex items-center justify-between px-8 bg-[#0D0D0D] shrink-0">
        <button 
          onClick={onPrev}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Previous Unit
        </button>
        <div className="flex items-center gap-6">
           <button className="text-zinc-500 hover:text-white transition-colors">
              <Share2 size={18} />
           </button>
           <button className="text-zinc-500 hover:text-white transition-colors">
              <ThumbsUp size={18} />
           </button>
        </div>
        <button 
          onClick={onNext}
          className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          Next Lesson
          <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
          background-clip: content-box;
        }
      `}</style>
    </div>
  );
};
