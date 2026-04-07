import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2 
} from 'lucide-react';
import * as api from '../../services/api';

interface SuspensionManagerProps {
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
}

export const SuspensionManager: React.FC<SuspensionManagerProps> = ({ pushToast }) => {
  const [banLogs, setBanLogs] = useState<any[]>([]);
  const [banLogsLoading, setBanLogsLoading] = useState(false);
  const [banLogsPage, setBanLogsPage] = useState(1);
  const [banLogsTotalPages, setBanLogsTotalPages] = useState(1);
  const [banLogsSearch, setBanLogsSearch] = useState('');
  const [logsType, setLogsType] = useState<'banned' | 'warnings'>('banned');
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

  const loadBanLogs = async (page = 1) => {
    setBanLogsLoading(true);
    try {
      const data = await api.getBanLogs(page, 10, banLogsSearch, logsType);
      setBanLogs(data.logs);
      setBanLogsTotalPages(data.pagination.pages);
      setBanLogsPage(data.pagination.page);
    } catch (e) {
      pushToast('Failed to load logs', 'error');
    } finally {
      setBanLogsLoading(false);
    }
  };

  useEffect(() => {
    loadBanLogs(1);
  }, [banLogsSearch, logsType]);

  const handleUnbanUser = async (userId: string) => {
    try {
      await api.unbanUser(userId);
      pushToast(logsType === 'warnings' ? 'Strikes reset successfully' : 'User unbanned successfully', 'success');
      loadBanLogs(banLogsPage);
    } catch (e) {
      pushToast('Action failed', 'error');
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-[#1a1a1a] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-red-500/10 transition-all duration-700" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-[0.3em] ml-1">
              <AlertCircle size={14} />
              {logsType === 'banned' ? 'Account Suspensions' : 'Integrity Warnings'}
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {logsType === 'banned' ? 'Suspension Logs' : 'Student Warnings'}
            </h3>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mr-4">
              <button
                onClick={() => setLogsType('banned')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  logsType === 'banned' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:text-white'
                }`}
              >
                <AlertCircle size={14} />
                Suspended
              </button>
              <button
                onClick={() => setLogsType('warnings')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  logsType === 'warnings' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'
                }`}
              >
                <RefreshCw size={14} />
                Warnings
              </button>
            </div>

            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/search:text-red-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder={logsType === 'banned' ? "Search suspended users..." : "Search students with warnings..."}
                value={banLogsSearch}
                onChange={(e) => setBanLogsSearch(e.target.value)}
                className="bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all w-80 shadow-inner group-focus-within/search:bg-white/[0.04]"
              />
            </div>
            
            <button
              onClick={() => loadBanLogs(1)}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-2xl transition-all active:scale-95"
            >
              <RefreshCw size={20} className={banLogsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left">
                <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest pl-20">Student</th>
                <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Reason / Status</th>
                <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Level</th>
                <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Last Event</th>
                <th className="px-6 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right pr-12">Controls</th>
              </tr>
            </thead>
            <tbody>
              {banLogs.map((log) => (
                <tr key={log._id} className="group hover:bg-white/[0.03] transition-all">
                  <td className="px-6 py-5 bg-white/[0.015] rounded-l-2xl border-l border-t border-b border-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${log.action === 'ban' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {log.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-gray-200 group-hover:text-white transition-all">{log.userName}</span>
                        <span className="text-[10px] text-gray-600 font-bold tracking-tight">{log.userEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                    <p 
                      onClick={() => setExpandedReasonId(expandedReasonId === log._id ? null : log._id)}
                      className={`text-[13px] font-bold cursor-pointer transition-all duration-300 ${
                        expandedReasonId === log._id 
                          ? 'text-white whitespace-normal max-w-none bg-white/5 p-3 rounded-xl border border-white/5 shadow-2xl' 
                          : `${log.action === 'ban' ? 'text-red-400/80' : 'text-orange-400/80'} line-clamp-1 max-w-[200px] hover:text-white`
                      }`} 
                      title={expandedReasonId === log._id ? "Click to collapse" : "Click to view full reason"}
                    >
                      {log.reason}
                    </p>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.action === 'ban' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {log.action === 'ban' ? 'Suspended' : `Strike ${log.violationCount}/4`}
                    </span>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                    <span className="text-[11px] text-gray-500 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] rounded-r-2xl border-r border-t border-b border-white/[0.02] text-right pr-6">
                    <button
                      onClick={() => handleUnbanUser(log.userId)}
                      className={`${
                        log.action === 'ban' 
                          ? 'bg-red-500/10 hover:bg-red-500 border-red-500/20 text-red-500' 
                          : 'bg-orange-500/10 hover:bg-orange-500 border-orange-500/20 text-orange-500'
                      } hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95`}
                    >
                      {log.action === 'ban' ? 'Unban Student' : 'Reset Strikes'}
                    </button>
                  </td>
                </tr>
              ))}
              {banLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <CheckCircle2 size={48} className="text-gray-500" />
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
                        {logsType === 'banned' ? 'No students are suspended' : 'No students have current warnings'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {banLogs.length > 0 && (
          <div className="flex items-center justify-between mt-12 px-4 py-6 border-t border-white/[0.03]">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${logsType === 'banned' ? 'bg-red-500' : 'bg-orange-500'}`} />
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Showing <span className="text-white">{banLogs.length}</span> {logsType === 'banned' ? 'Suspensions' : 'Warnings'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => loadBanLogs(banLogsPage - 1)}
                disabled={banLogsPage === 1}
                className={`w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:text-white transition-all disabled:opacity-10 ${logsType === 'banned' ? 'hover:bg-red-500' : 'hover:bg-orange-500'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-6 py-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                Page <span className={logsType === 'banned' ? 'text-red-500' : 'text-orange-500'}>{banLogsPage}</span> <span className="mx-2 opacity-30">|</span> Total {Math.max(1, banLogsTotalPages)}
              </div>
              <button
                onClick={() => loadBanLogs(banLogsPage + 1)}
                disabled={banLogsPage === banLogsTotalPages || banLogsTotalPages === 0}
                className={`w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:text-white transition-all disabled:opacity-10 ${logsType === 'banned' ? 'hover:bg-red-500' : 'hover:bg-orange-500'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
