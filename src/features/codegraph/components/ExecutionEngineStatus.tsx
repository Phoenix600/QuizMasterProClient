import React from 'react';
import { Power, Activity, ShieldCheck, ShieldAlert, Download, Cpu, HardDrive, Clock, Users, Terminal } from 'lucide-react';
import { useExecutionEngine, EngineStatus } from '../hooks/useExecutionEngine';
import { cn } from '../lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu'; // Assuming these exist or I will create them

interface ExecutionEngineStatusProps {
    onOpenDownloadCenter: () => void;
}

export const ExecutionEngineStatus: React.FC<ExecutionEngineStatusProps> = ({ onOpenDownloadCenter }) => {
  const { status, latency, metrics, toggleEngine } = useExecutionEngine();

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (s: EngineStatus) => {
    switch (s) {
      case 'ONLINE': return 'text-emerald-500';
      case 'STARTING': return 'text-yellow-500 animate-pulse';
      case 'ERROR': return 'text-rose-500';
      default: return 'text-zinc-500';
    }
  };

  const getStatusIcon = (s: EngineStatus) => {
    switch (s) {
      case 'ONLINE': return <ShieldCheck className="w-4 h-4" />;
      case 'ERROR': return <ShieldAlert className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded-md border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all group",
                    status === 'ONLINE' ? "border-emerald-500/20" : "border-zinc-800"
                )}>
                    <div className={cn("relative flex items-center justify-center", getStatusColor(status))}>
                        {getStatusIcon(status)}
                        {status === 'ONLINE' && (
                            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        )}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Local Engine</span>
                        <span className={cn("text-[10px] font-mono", getStatusColor(status))}>
                            {status === 'ONLINE' ? `${latency || '--'}ms` : status}
                        </span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-zinc-950 border-zinc-800 text-zinc-300">
                <DropdownMenuLabel className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2 py-1.5">Engine Control</DropdownMenuLabel>
                
                <DropdownMenuItem 
                    onClick={() => toggleEngine('START')}
                    disabled={status === 'ONLINE' || status === 'STARTING'}
                    className="flex items-center gap-2 text-xs focus:bg-emerald-500/10 focus:text-emerald-400 cursor-pointer mx-1 my-0.5 rounded-lg"
                >
                    <Power className="w-3.5 h-3.5" />
                    Turn On Engine
                </DropdownMenuItem>

                <DropdownMenuItem 
                    onClick={() => toggleEngine('STOP')}
                    disabled={status === 'OFFLINE'}
                    className="flex items-center gap-2 text-xs focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer mx-1 my-0.5 rounded-lg"
                >
                    <Power className="w-3.5 h-3.5" />
                    Close Engine
                </DropdownMenuItem>

                {status === 'ONLINE' && metrics && (
                    <>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuLabel className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2 py-1.5 flex items-center justify-between">
                            Diagnostics
                            <span className="text-[8px] text-emerald-500/50 lowercase font-normal italic">live</span>
                        </DropdownMenuLabel>
                        <div className="px-2 pb-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Activity className="w-2.5 h-2.5 text-emerald-500" />
                                        <span className="text-[8px] text-zinc-500 font-medium">Latency</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-200">{latency || '--'}ms</div>
                                </div>
                                <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Clock className="w-2.5 h-2.5 text-blue-500" />
                                        <span className="text-[8px] text-zinc-500 font-medium">Uptime</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-200">{formatUptime(metrics.uptime)}</div>
                                </div>
                                <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Cpu className="w-2.5 h-2.5 text-orange-500" />
                                        <span className="text-[8px] text-zinc-500 font-medium">CPU Load</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-200">{metrics.cpuLoad} ({metrics.cores}c)</div>
                                </div>
                                <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <HardDrive className="w-2.5 h-2.5 text-purple-500" />
                                        <span className="text-[8px] text-zinc-500 font-medium">Memory</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-200 truncate">{metrics.memory}</div>
                                </div>
                            </div>
                            <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Terminal className="w-2.5 h-2.5 text-zinc-400" />
                                    <span className="text-[8px] text-zinc-500 font-medium truncate max-w-[100px]">{metrics.os}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5 text-zinc-400" />
                                    <span className="text-[8px] font-mono text-zinc-400">{metrics.sessions} sess</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <DropdownMenuSeparator className="bg-zinc-800" />
                
                <DropdownMenuItem 
                    onClick={onOpenDownloadCenter}
                    className="flex items-center gap-2 text-xs focus:bg-orange-500/10 focus:text-orange-400 cursor-pointer mx-1 my-0.5 rounded-lg"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download Center
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
};
