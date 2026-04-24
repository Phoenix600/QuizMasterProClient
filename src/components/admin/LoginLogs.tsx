import React, { useState, useEffect } from 'react';
import { 
  Clock, Search, Trash2, Tablet, Smartphone, Laptop, Plus, ChevronLeft, ChevronRight 
} from 'lucide-react';
import * as api from '../../services/api';

interface LoginLogsProps {
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
  openConfirm: (title: string, message: string, onConfirm: () => void, countdown?: number) => void;
}

export const LoginLogs: React.FC<LoginLogsProps> = ({ pushToast, openConfirm }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [expandedIpLogId, setExpandedIpLogId] = useState<string | null>(null);
  const [logsSearch, setLogsSearch] = useState('');

  const loadLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const data = await api.getLoginLogs(page, 10, logsSearch);
      setLogs(data.logs);
      setLogsTotalPages(data.pagination.pages);
      setLogsPage(data.pagination.page);
    } catch (e) {
      pushToast('Failed to load logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, [logsSearch]);

  const handleDeleteLog = async (id: string) => {
    openConfirm('Delete Login Log', 'Are you sure you want to delete this specific login session? This action is permanent.', async () => {
      try {
        await api.deleteLoginLog(id);
        loadLogs(logsPage);
        pushToast('Log deleted', 'success');
      } catch (e) {
        pushToast('Delete failed', 'error');
      }
    });
  };

  const handleDeleteSelectedLogs = async () => {
    const isFiltered = logsSearch.trim() !== '';
    const msg = isFiltered 
      ? `Are you sure you want to delete ALL logs matching "${logsSearch}"? This action cannot be reversed.`
      : `Are you sure you want to delete ALL login logs in the system? THIS WILL CLEAR ALL AUDIT DATA.`;
    
    openConfirm('Bulk Clear Logs', msg, async () => {
      try {
        await api.deleteLoginLogsBulk([], logsSearch);
        setLogsSearch('');
        loadLogs(1);
        pushToast('Logs cleared successfully', 'success');
      } catch (e) {
        pushToast('Bulk delete failed', 'error');
      }
    }, 12);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
              <Clock size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">Login Sessions</h3>
              <p className="text-xs text-zinc-500 font-semibold tracking-tight mt-0.5">Real-time security auditing</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-2xl items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/search:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-orange-500/50 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none transition-all"
              />
              {logsSearch && (
                <button 
                  onClick={() => setLogsSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              )}
            </div>
            <button
              onClick={handleDeleteSelectedLogs}
              className="px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 text-white rounded-2xl text-sm font-semibold transition-all flex items-center gap-2 border border-red-500/20"
            >
              <Trash2 size={18} />
              Clear Results
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-zinc-500 text-[11px] font-semibold tracking-tight px-5">
                <th className="px-6 py-3">Device</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3 text-center">Login Method</th>
                <th className="px-6 py-3">System</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3 text-right pr-10">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {logsLoading ? (
                <tr><td colSpan={7} className="text-center py-20 text-gray-500 animate-pulse font-bold">Scanning secure logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-24 text-gray-600 italic font-medium">No sessions found for this search.</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id} className="group hover:bg-white/[0.03] transition-all">
                  <td className="px-6 py-5 bg-white/[0.015] rounded-l-2xl border-l border-t border-b border-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-500/5 text-gray-500 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-all">
                        {log.deviceType?.includes('iPad') || log.deviceType?.includes('Tablet') ? <Tablet size={18} /> : 
                         log.deviceType?.includes('Phone') ? <Smartphone size={18} /> : <Laptop size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-zinc-200 group-hover:text-white transition-all">{log.deviceType || 'Desktop Device'}</span>
                        <span className="text-[10px] text-zinc-600 font-semibold tracking-tight">{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-white">{log.userName}</span>
                      <span className="text-[11px] text-gray-500 font-medium">{log.userEmail}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02] text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-tight ${log.loginType === 'Google' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                      {log.loginType || 'Email'}
                    </span>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                    <span className="px-3 py-1 bg-white/5 text-zinc-400 rounded-lg text-[10px] font-semibold tracking-tight border border-white/5">
                      {log.deviceOS || 'Unknown OS'}
                    </span>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-gray-300 font-bold">{log.location}</span>
                      <span className="text-[10px] text-gray-600 font-medium tracking-tight">LAT: {log.coordinates?.split(',')[1]} LON: {log.coordinates?.split(',')[0]}</span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-5 bg-white/[0.015] border-t border-b border-white/[0.02]"
                  >
                    <button 
                      onClick={() => setExpandedIpLogId(expandedIpLogId === log._id ? null : log._id)}
                      className={`flex items-center gap-2 group/ip transition-all ${expandedIpLogId === log._id ? 'bg-orange-500/10 rounded-xl p-2 -ml-2 border border-orange-500/20' : ''}`}
                    >
                      <span className={`text-[13px] text-gray-400 font-mono tracking-tighter ${expandedIpLogId === log._id ? 'text-white' : ''}`}>
                        {expandedIpLogId === log._id 
                          ? log.ipAddress 
                          : (log.ipAddress?.split(',')[0].length > 15 ? log.ipAddress?.split(',')[0].substring(0, 15) + '...' : log.ipAddress?.split(',')[0])
                        }
                      </span>
                      {log.ipAddress?.includes(',') && expandedIpLogId !== log._id && (
                        <span className="px-1.5 py-0.5 bg-gray-500/10 text-gray-400 text-[9px] font-bold rounded group-hover/ip:bg-orange-500/20 group-hover/ip:text-orange-500 transition-all">
                          +{log.ipAddress.split(',').length - 1}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.015] rounded-r-2xl border-r border-t border-b border-white/[0.02] text-right pr-6">
                    <button
                      onClick={() => handleDeleteLog(log._id)}
                      className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all group-hover:scale-105 active:scale-95"
                      title="Permanently remove this session log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Premium Pagination Footer */}
        {logs.length > 0 && (
          <div className="flex items-center justify-between mt-12 px-4 py-6 border-t border-white/[0.03]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-zinc-500 text-xs font-semibold tracking-tight">
                Showing <span className="text-white">{logs.length}</span> Active Logs
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => loadLogs(logsPage - 1)}
                disabled={logsPage === 1}
                className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all disabled:opacity-10"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-6 py-2 text-[11px] font-semibold text-zinc-500 tracking-tight">
                Page <span className="text-orange-500">{logsPage}</span> <span className="mx-2 opacity-30">|</span> Total {Math.max(1, logsTotalPages)}
              </div>
              <button
                onClick={() => loadLogs(logsPage + 1)}
                disabled={logsPage === logsTotalPages || logsTotalPages === 0}
                className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all disabled:opacity-10"
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
