import React from 'react';
import { Document, Page } from 'react-pdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Expand, 
  Loader2, 
  AlertCircle,
  Maximize2,
  Minimize2,
  Zap,
  MousePointer2,
  ExternalLink,
  X
} from 'lucide-react';
import { pdfjs } from 'react-pdf';
import { cn } from '../lib/utils';
import { NODE_API_URL } from '../lib/api';

// Global Worker Configuration
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string | null;
  title?: string;
}

/**
 * High-Performance Laser Pointer with SVG Trail
 * Uses direct DOM manipulation in the animation loop to bypass React render overhead
 */
const LaserPointer: React.FC<{ mousePos: { x: number, y: number }, color: string }> = ({ mousePos, color }) => {
  const pathRef = React.useRef<SVGPathElement>(null);
  const dotRef = React.useRef<HTMLDivElement>(null);
  const gradientRef = React.useRef<SVGLinearGradientElement>(null);
  const trailRef = React.useRef<{ x: number, y: number }[]>(new Array(12).fill({ x: mousePos.x, y: mousePos.y }));

  React.useEffect(() => {
    let animationFrameId: number;
    const trail = trailRef.current;

    const animate = () => {
      let x = mousePos.x + 4;
      let y = mousePos.y + 4;

      for (let i = 0; i < 12; i++) {
        let nextDot = trail[i + 1] || trail[0];
        trail[i] = { x: x, y: y };
        x += (nextDot.x - x) * 0.3;
        y += (nextDot.y - y) * 0.3;
      }

      if (pathRef.current) {
        const M = `M ${trail[11].x}, ${trail[11].y} `;
        const C = `C ${trail[6].x}, ${trail[6].y} ${trail[6].x}, ${trail[6].y} ${trail[5].x}, ${trail[5].y} `;
        const S = `S ${trail[2].x}, ${trail[2].y} ${trail[1].x}, ${trail[1].y} ${trail[1].x}, ${trail[1].y} ${mousePos.x + 4}, ${mousePos.y + 4}`;
        pathRef.current.setAttribute('d', M + C + S);
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mousePos.x + 1}px, ${mousePos.y + 1}px)`;
      }

      if (gradientRef.current) {
        const dx = mousePos.x + 4 - trail[1].x;
        const dy = mousePos.y + 4 - trail[1].y;
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) x2 = 1; else x1 = 1;
        } else {
          if (dy > 0) y2 = 1; else y1 = 1;
        }

        gradientRef.current.setAttribute('x1', String(x1));
        gradientRef.current.setAttribute('y1', String(y1));
        gradientRef.current.setAttribute('x2', String(x2));
        gradientRef.current.setAttribute('y2', String(y2));
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mousePos]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[500]">
      <svg className="w-full h-full absolute top-0 left-0">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="laserGradient" ref={gradientRef}>
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path 
          id="trail" 
          ref={pathRef}
          fill="none" 
          stroke="url(#laserGradient)" 
          strokeWidth="4.5" 
          filter="url(#glow)"
          strokeLinecap="round"
        />
      </svg>
      <div 
        ref={dotRef}
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}, 0 0 20px ${color}`
        }}
        className="fixed w-3 h-3 rounded-full will-change-transform"
      />
    </div>
  );
};

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, title = "Presentation Viewer" }) => {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [renderedWidth, setRenderedWidth] = React.useState(0);
  const [pageAspect, setPageAspect] = React.useState<number | null>(null);
  const [renderedPdfUrl, setRenderedPdfUrl] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [laserColor, setLaserColor] = React.useState('#f97316'); // Default Orange Juice

  const LASER_COLORS = [
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
  ];

  const CACHE_NAME = "pdf-cache-v1";

  const extractId = (url: string) => {
    const match = url.match(/\/d\/(.+?)\//);
    return match ? match[1] : null;
  };

  React.useEffect(() => {
    const loadPdf = async () => {
      if (!url) {
        setRenderedPdfUrl(null);
        setNumPages(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      setRenderedPdfUrl(null); // Clear previous URL immediately to avoid race conditions
      
      try {
        const driveId = extractId(url);
        let finalUrl = url;

        // Use our own internal backend proxy to avoid 522 errors and CORS issues
        finalUrl = `${NODE_API_URL}/proxy/pdf?url=${encodeURIComponent(url)}`;

        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          setRenderedPdfUrl(URL.createObjectURL(blob));
        } else {
          const response = await fetch(finalUrl);
          if (!response.ok) throw new Error("Connection failed");

          const blob = await response.blob();
          if (blob.type === 'text/html') throw new Error("Access restricted");

          const cacheResponse = new Response(blob, { headers: { 'Content-Type': 'application/pdf' } });
          await cache.put(url, cacheResponse);
          setRenderedPdfUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        setError("Unable to load presentation. Please ensure the link is public.");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [url]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const newWidth = Math.floor(entries[0].contentRect.width);
        setContainerWidth(newWidth);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (containerWidth === 0) return;
    if (renderedWidth === 0) {
      setRenderedWidth(containerWidth);
      return;
    }
    const timer = setTimeout(() => {
      setRenderedWidth(containerWidth);
    }, 150);
    return () => clearTimeout(timer);
  }, [containerWidth, renderedWidth]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const [isHovered, setIsHovered] = React.useState(false);
  const [showLaser, setShowLaser] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isFullscreen) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    if (isFullscreen) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isFullscreen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen && !document.fullscreenElement && !isHovered) return;
      const isNext = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key);
      const isPrev = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key);

      if (e.key.toLowerCase() === 'l' && isFullscreen) {
        setShowLaser(prev => !prev);
      }

      if (isNext) {
        e.preventDefault();
        setCurrentPage(prev => Math.min(prev + 1, numPages || prev));
      } else if (isPrev) {
        e.preventDefault();
        setCurrentPage(prev => Math.max(prev - 1, 1));
      } else if (e.key === 'Escape') {
        if (isFullscreen || document.fullscreenElement) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          setIsFullscreen(false);
          setShowLaser(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, numPages, isHovered]);

  if (!url) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-orange-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
        <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
      </div>

      <div 
        className={cn(
          "relative group transition-all duration-700 ease-in-out",
          isFullscreen 
            ? "fixed inset-0 z-[1000] bg-[#050505] flex items-center justify-center p-12" 
            : "bg-[#141414] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl"
        )}
      >
        <button 
          onClick={() => {
            if (isFullscreen && document.fullscreenElement) {
              document.exitFullscreen();
            }
            setIsFullscreen(!isFullscreen);
            if (isFullscreen) setShowLaser(false);
          }}
          className={cn(
            "absolute top-6 right-6 z-[1100] transition-all duration-300 border border-white/5 flex items-center justify-center shadow-2xl overflow-hidden",
            isFullscreen 
              ? "w-14 h-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl opacity-100 backdrop-blur-xl" 
              : "w-12 h-12 bg-zinc-800/80 backdrop-blur-md rounded-full text-zinc-400 hover:text-orange-500 opacity-0 group-hover:opacity-100"
          )}
          title={isFullscreen ? "Close Presentation (ESC)" : "Enter Presentation"}
        >
          {isFullscreen ? <X size={28} className="animate-in spin-in-90 duration-300" /> : <Expand size={20} />}
        </button>

        <div 
          ref={containerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={(!isFullscreen && pageAspect) ? { aspectRatio: `${pageAspect}`, height: 'auto' } : {}}
          className={cn(
            "relative w-full bg-[#0A0A0A] rounded-xl overflow-hidden shadow-2xl",
            isFullscreen ? "fixed inset-0 z-[1000] bg-black p-0" : (!pageAspect ? "aspect-video" : ""),
            isFullscreen && showLaser && "cursor-none"
          )}
        >
          {isFullscreen && showLaser && (
           <LaserPointer mousePos={mousePos} color={laserColor} />
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-zinc-950/20 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            </div>
          )}

          {renderedPdfUrl && (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              loading ? "opacity-0" : "opacity-100 transition-opacity duration-500"
            )}>
              <Document
                key={renderedPdfUrl || 'none'}
                file={renderedPdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className="w-full"
              >
                <Page 
                  pageNumber={currentPage} 
                  width={containerWidth || 800}
                  onLoadSuccess={(page) => {
                    const { width, height } = page.getViewport({ scale: 1 });
                    setPageAspect(width / height);
                  }}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="w-full"
                  loading={null}
                />
              </Document>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
                <div className="flex items-center gap-6 px-6 py-2 bg-zinc-900/90 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl">
                  <div className="flex items-center gap-3">
                    {isFullscreen && (
                      <>
                        <button 
                          onClick={() => setShowLaser(!showLaser)}
                          className={cn(
                            "transition-all duration-300 p-1.5 rounded-full",
                            showLaser ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "text-zinc-500 hover:text-orange-500"
                          )}
                          title="Laser Pointer (L)"
                        >
                          <Zap size={16} fill={showLaser ? "currentColor" : "none"} />
                        </button>

                        <AnimatePresence>
                          {showLaser && (
                            <motion.div 
                              initial={{ opacity: 0, width: 0, x: -10 }}
                              animate={{ opacity: 1, width: 'auto', x: 0 }}
                              exit={{ opacity: 0, width: 0, x: -10 }}
                              className="flex items-center gap-1.5 overflow-visible px-2"
                            >
                              <div className="w-px h-4 bg-zinc-800 mx-2" />
                              <div className="flex items-center gap-1.5">
                                {LASER_COLORS.map((c) => (
                                  <button
                                    key={c.value}
                                    onClick={() => setLaserColor(c.value)}
                                    style={{ backgroundColor: c.value }}
                                    className={cn(
                                      "w-4 h-4 rounded-full transition-all duration-300 border-2",
                                      laserColor === c.value 
                                        ? "border-white scale-110 shadow-[0_0_8px_currentColor]" 
                                        : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                                    )}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                  
                  {isFullscreen && <div className="w-px h-4 bg-zinc-800" />}

                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-zinc-500 hover:text-orange-500 transition-all hover:scale-110 active:scale-90"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>

                  <div className="w-px h-4 bg-zinc-800" />

                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-zinc-500 hover:text-orange-500 disabled:opacity-5 transition-all hover:scale-110 active:scale-90"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-orange-500 tracking-tighter">{currentPage}</span>
                    <span className="text-zinc-700 font-bold text-xs">/</span>
                    <span className="text-sm font-black text-zinc-500 tracking-tighter">{numPages || '--'}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(numPages || p, p + 1))}
                    disabled={currentPage === numPages}
                    className="text-zinc-500 hover:text-orange-500 disabled:opacity-5 transition-all hover:scale-110 active:scale-90"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div className="w-px h-4 bg-zinc-800" />

                  <a 
                    href={url || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-orange-500 transition-all hover:scale-110 active:scale-90 p-1"
                    title="Download / Open in New Tab"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .react-pdf__Page__canvas {
          width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        .react-pdf__Page {
          background-color: transparent !important;
        }
      `}</style>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          CURRENT PAGE: <span className="text-zinc-100">{currentPage}</span> / <span className="text-zinc-400">{numPages || '--'}</span>
        </div>
        
        {numPages && (
          <div className="flex items-center gap-4">
            <div className="w-48 h-[3px] bg-zinc-800 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(currentPage / numPages) * 100}%` }}
                className="absolute inset-y-0 left-0 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
              />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{Math.round((currentPage / numPages) * 100)}%</span>
          </div>
        )}
      </div>

      <div className="mt-4 bg-[#0A0A0A] border border-zinc-800/50 rounded-xl px-4 py-3 flex items-center gap-3">
        <Maximize2 size={12} className="text-zinc-600" />
        <p className="text-[10px] text-zinc-500 font-medium italic tracking-wide">
          Tip: Use Arrow keys or Spacebar to navigate in presentation mode.
        </p>
      </div>
    </section>
  );
};
