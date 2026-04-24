import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Search, Filter, Layers, RefreshCw, Trash2, Medal, Clock, CheckCircle2, Users, ChevronDown 
} from 'lucide-react';
import * as api from '../../services/api';
import { GlobalLeaderboardEntry } from '../../types';

interface LeaderboardProps {
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
  openConfirm: (title: string, message: string, onConfirm: () => void, countdown?: number) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ pushToast, openConfirm }) => {
  const [lbEntries, setLbEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbSearch, setLbSearch] = useState('');
  const [lbQuizFilter, setLbQuizFilter] = useState('');
  const [lbModeFilter, setLbModeFilter] = useState<string>('');
  const [lbDateFrom, setLbDateFrom] = useState('');
  const [lbDateTo, setLbDateTo] = useState('');
  const [lbSort, setLbSort] = useState<'merit' | 'date'>('merit');
  const [lbPage, setLbPage] = useState(1);
  const [showQuizDrop, setShowQuizDrop] = useState(false);
  const [showModeDrop, setShowModeDrop] = useState(false);
  const LB_PAGE_SIZE = 10;

  const loadLeaderboard = async () => {
    setLbLoading(true);
    try {
      const data = await api.getAllLeaderboard(lbModeFilter);
      setLbEntries(data);
    } catch {
      // silent
    } finally {
      setLbLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [lbModeFilter]);

  const handleDeleteRecord = async (resultId: string) => {
    openConfirm('Delete Record', 'Are you sure you want to delete this leaderboard entry? This action is permanent.', async () => {
      try {
        await api.deleteLeaderboardRecord(resultId);
        setLbEntries(prev => prev.filter(e => e.resultId !== resultId));
        pushToast('Record deleted', 'success');
      } catch (e) {
        pushToast('Delete failed', 'error');
      }
    });
  };

  const filteredLBEntries = useMemo(() => {
    return lbEntries.filter(e => {
      const matchSearch = e.userName.toLowerCase().includes(lbSearch.toLowerCase()) ||
        e.userEmail.toLowerCase().includes(lbSearch.toLowerCase());
      const matchQuiz = !lbQuizFilter || e.quizTitle === lbQuizFilter;
      const entryDate = new Date(e.createdAt);
      const matchFrom = !lbDateFrom || entryDate >= new Date(lbDateFrom);
      const matchTo = !lbDateTo || entryDate <= new Date(lbDateTo + 'T23:59:59');
      return matchSearch && matchQuiz && matchFrom && matchTo;
    }).sort((a, b) => {
      if (lbSort === 'merit') {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [lbEntries, lbSearch, lbQuizFilter, lbDateFrom, lbDateTo, lbSort]);

  const handleDeleteAllRecords = async () => {
    const isFiltered = lbSearch || lbQuizFilter || lbDateFrom || lbDateTo;
    const targetCount = filteredLBEntries.length;
    
    if (targetCount === 0) return;

    const msg = isFiltered 
      ? `Are you sure you want to delete ALL ${targetCount} filtered records? This CANNOT be undone.`
      : `Are you sure you want to delete ALL ${lbEntries.length} records in the system? THIS WILL CLEAR THE ENTIRE LEADERBOARD.`;

    openConfirm('Bulk Clear Leaderboard', msg, async () => {
      try {
        const idsToDelete = isFiltered ? filteredLBEntries.map(e => e.resultId) : [];
        await api.deleteLeaderboardBulk(idsToDelete);
        
        if (isFiltered) {
          setLbEntries(prev => prev.filter(e => !idsToDelete.includes(e.resultId)));
        } else {
          setLbEntries([]);
        }
        pushToast('Records deleted successfully', 'success');
      } catch (e) {
        pushToast('Action failed', 'error');
      }
    }, 15);
  };

  useEffect(() => { setLbPage(1); }, [lbSearch, lbQuizFilter, lbDateFrom, lbDateTo, lbSort]);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {lbEntries.length > 0 && (() => {
        const total = lbEntries.length;
        const passed = lbEntries.filter(e => e.isPassed).length;
        const avgPct = Math.round(lbEntries.reduce((s, e) => s + e.percentage, 0) / total);
        return (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Attempts', value: total, icon: <Users size={18} />, color: 'text-blue-400' },
              { label: 'Avg Score', value: `${avgPct}%`, icon: <Medal size={18} />, color: 'text-amber-400' },
              { label: 'Pass Rate', value: `${Math.round((passed / total) * 100)}%`, icon: <CheckCircle2 size={18} />, color: 'text-green-400' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>{icon}</div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold tracking-tight">{label}</p>
                  <p className="text-2xl font-semibold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Filters + refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
          <input
            type="text"
            placeholder="Search by student name..."
            value={lbSearch}
            onChange={(e) => setLbSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <div className="relative min-w-[180px]">
          <button
            type="button"
            onClick={() => setShowQuizDrop(!showQuizDrop)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-left text-white focus:outline-none focus:border-amber-500 transition-all flex items-center justify-between group"
          >
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-amber-500 transition-colors" size={15} />
            <span className="truncate max-w-[120px]">{lbQuizFilter || 'All Quizzes'}</span>
            <ChevronDown size={14} className={`text-gray-500 transition-transform ${showQuizDrop ? 'rotate-180 text-amber-500' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showQuizDrop && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowQuizDrop(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute z-[101] top-full left-0 mt-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-2xl min-w-[220px] backdrop-blur-xl overflow-hidden"
                >
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar-orange pr-1">
                    <button
                      onClick={() => { setLbQuizFilter(''); setShowQuizDrop(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${!lbQuizFilter ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      All Quizzes
                      {!lbQuizFilter && <CheckCircle2 size={12} />}
                    </button>
                    {[...new Map(lbEntries.map(e => [e.quizTitle, e.quizTitle])).values()].map(t => (
                      <button
                        key={t}
                        onClick={() => { setLbQuizFilter(t); setShowQuizDrop(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${lbQuizFilter === t ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        {t}
                        {lbQuizFilter === t && <CheckCircle2 size={12} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="relative min-w-[160px]">
          <button
            type="button"
            onClick={() => setShowModeDrop(!showModeDrop)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-left text-white focus:outline-none focus:border-amber-500 transition-all flex items-center justify-between group"
          >
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-amber-500 transition-colors" size={15} />
            <span className="truncate max-w-[100px]">{lbModeFilter === 'test' ? 'Test Mode' : lbModeFilter === 'training' ? 'Training Mode' : 'All Modes'}</span>
            <ChevronDown size={14} className={`text-gray-500 transition-transform ${showModeDrop ? 'rotate-180 text-amber-500' : ''}`} />
          </button>

          <AnimatePresence>
            {showModeDrop && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowModeDrop(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute z-[101] top-full left-0 mt-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-2xl min-w-[180px] backdrop-blur-xl overflow-hidden"
                >
                  <div className="space-y-1">
                    {[
                      { val: '', label: 'All Modes' },
                      { val: 'test', label: 'Test Mode' },
                      { val: 'training', label: 'Training Mode' }
                    ].map(m => (
                      <button
                        key={m.label}
                        onClick={() => { setLbModeFilter(m.val); setShowModeDrop(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${lbModeFilter === m.val ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        {m.label}
                        {lbModeFilter === m.val && <CheckCircle2 size={12} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <input
          type="date"
          value={lbDateFrom}
          onChange={(e) => setLbDateFrom(e.target.value)}
          title="From date"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
        />
        <input
          type="date"
          value={lbDateTo}
          onChange={(e) => setLbDateTo(e.target.value)}
          title="To date"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
        />
        <button
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            setLbDateFrom(today);
            setLbDateTo(today);
          }}
          className="px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
        >
          Today
        </button>
        {(lbSearch || lbQuizFilter || lbDateFrom || lbDateTo) && (
          <button
            onClick={() => { setLbSearch(''); setLbQuizFilter(''); setLbDateFrom(''); setLbDateTo(''); }}
            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white rounded-xl text-xs font-semibold transition-all"
          >
            Clear
          </button>
        )}
        <button
          onClick={loadLeaderboard}
          disabled={lbLoading}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={lbLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
        {lbEntries.length > 0 && (
          <button
            onClick={handleDeleteAllRecords}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Trash2 size={14} />
            {(lbSearch || lbQuizFilter || lbDateFrom || lbDateTo) ? `Delete Filtered (${filteredLBEntries.length})` : 'Clear All'}
          </button>
        )}
      </div>

      {/* Sort mode */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 font-semibold tracking-tight">Sort by:</span>
        <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
          <button
            onClick={() => setLbSort('merit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              lbSort === 'merit' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Medal size={12} />
            Merit (Score → Earliest Submit)
          </button>
          <button
            onClick={() => setLbSort('date')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              lbSort === 'date' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Clock size={12} />
            Latest Submitted
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden">
        {lbLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (() => {
          if (filteredLBEntries.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600">
                  <Trophy size={28} />
                </div>
                <p className="text-gray-500 text-sm">
                  {lbEntries.length === 0 ? 'No quiz submissions yet.' : 'No results match the current filters.'}
                </p>
              </div>
            );
          }

          const totalPages = Math.max(1, Math.ceil(filteredLBEntries.length / LB_PAGE_SIZE));
          const safePage = Math.min(lbPage, totalPages);
          const paginated = filteredLBEntries.slice((safePage - 1) * LB_PAGE_SIZE, safePage * LB_PAGE_SIZE);

          return (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['#', 'Student', 'Quiz', 'Score', '% Score', 'Status', 'Mode', 'Time', 'Date', 'Action'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[11px] font-semibold text-zinc-500 tracking-tight">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((entry, idx) => {
                    const globalIdx = (safePage - 1) * LB_PAGE_SIZE + idx;
                    const mins = Math.floor(entry.timeTaken / 60);
                    const secs = entry.timeTaken % 60;
                    const timeStr = mins > 0
                      ? `${mins}m ${secs}s`
                      : `${secs}s`;
                    const d = new Date(entry.createdAt);
                    const date = d.toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    });
                    const time = d.toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    });
                    return (
                      <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-4">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                            globalIdx === 0 ? 'bg-amber-500/20 text-amber-400' :
                            globalIdx === 1 ? 'bg-gray-400/10 text-gray-300' :
                            globalIdx === 2 ? 'bg-orange-700/20 text-orange-500' :
                            'bg-white/5 text-gray-500'
                          }`}>{globalIdx + 1}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{entry.userName}</p>
                          <p className="text-[11px] text-zinc-500">{entry.userEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-300 font-medium max-w-[180px] truncate">{entry.quizTitle}</p>
                        </td>
                        <td className="px-5 py-4 text-zinc-300 font-semibold">{entry.score}/{entry.totalQuestions}</td>
                        <td className="px-5 py-4 font-semibold text-white">{Math.round(entry.percentage)}%</td>
                        <td className="px-5 py-4">
                          {entry.isPassed ? (
                            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold px-2 py-1 rounded-md tracking-tight border border-emerald-500/20">Passed</span>
                          ) : (
                            <span className="bg-red-500/10 text-red-500 text-[10px] font-semibold px-2 py-1 rounded-md tracking-tight border border-red-500/20">Failed</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-md tracking-tight border ${
                            entry.mode === 'training' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                              : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          }`}>
                            {entry.mode || 'test'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 font-medium">{timeStr}</td>
                        <td className="px-5 py-4">
                          <p className="text-white font-semibold">{date}</p>
                          <p className="text-[10px] text-zinc-600 font-medium tracking-tight">{time}</p>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleDeleteRecord(entry.resultId)}
                            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                <p className="text-xs text-gray-500">
                  Showing {(safePage - 1) * LB_PAGE_SIZE + 1}–{Math.min(safePage * LB_PAGE_SIZE, filteredLBEntries.length)} of {filteredLBEntries.length} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLbPage(1)}
                    disabled={safePage === 1}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >«</button>
                  <button
                    onClick={() => setLbPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | '…')[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-xs">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setLbPage(item as number)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                            safePage === item
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'text-zinc-500 hover:text-white hover:bg-white/5'
                          }`}
                        >{item}</button>
                      )
                    )}
                  <button
                    onClick={() => setLbPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >›</button>
                  <button
                    onClick={() => setLbPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >»</button>
                </div>
              </div>
            )}
            </>
          );
        })()}
      </div>
    </div>
  );
};
