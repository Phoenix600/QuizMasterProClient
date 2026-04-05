import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Zap, 
  Brain, 
  BarChart3, 
  Calendar,
  CheckCircle2,
  XCircle,
  Activity,
  Award
} from 'lucide-react';
import { QuizResult, User } from '../../types';
import * as api from '../../services/api';

interface StudentDashboardViewProps {
  currentUser: User | null;
  setView: (view: any) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ 
  currentUser,
  setView 
}) => {
  const [stats, setStats] = useState<any>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, r] = await Promise.all([
          api.getMyStats(),
          api.getMyResults()
        ]);
        setStats(s);
        setResults(r);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
        <Activity size={40} className="animate-pulse text-orange-500" />
        <p className="text-sm font-medium">Crunching your performance data...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20"
          >
            <Award size={12} />
            Student Dashboard
          </motion.div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Level Up, <span className="text-orange-500">{currentUser?.name}</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-lg font-medium">
            Track your mastery across all technical domains and refine your study strategy based on real insights.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setView('selection')}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/25 flex items-center gap-2"
          >
            <Zap size={18} />
            Take a Quiz
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Overall Accuracy', value: `${stats.averagePercentage}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Quizzes Taken', value: stats.totalQuizzes, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Strongest Area', value: stats.strengthArea, icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Area for Growth', value: stats.weaknessArea, icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-xl"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity ${item.bg.replace('bg-', 'bg-[#')}`}></div>
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-5 relative z-10 transition-transform group-hover:scale-110`}>
              <item.icon size={24} />
            </div>
            <p className="text-2xl font-black text-white relative z-10">{item.value}</p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1 relative z-10">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subject-wise Analysis */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Subject Mastery</h3>
            </div>

            <div className="space-y-8">
              {Object.entries<any>(stats.subjectWise).map(([name, s], idx) => {
                const avg = Math.round(s.totalP / s.count);
                return (
                  <div key={idx} className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-bold text-gray-300">{name}</p>
                      <p className={`text-xs font-black ${avg >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>{avg}%</p>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${avg}%` }}
                        transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                        className={`h-full rounded-full ${avg >= 70 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]'}`}
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{s.count} sessions</p>
                  </div>
                );
              })}
              {Object.keys(stats.subjectWise).length === 0 && (
                <div className="py-10 text-center text-gray-600 italic text-sm">
                  Complete more quizzes to see category-wise analysis.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Performance History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                  <Calendar size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Quiz History</h3>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Quiz Title', 'Category', 'Score', 'Status', 'Date'].map(h => (
                        <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {results.slice(0, 10).map((r, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-5">
                          <p className="text-white font-bold text-sm tracking-tight">{r.quizId?.title || 'External Quiz'}</p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase mt-0.5">{r.mode || 'test'} session</p>
                        </td>
                        <td className="px-5 py-5 text-gray-400 font-medium">
                          {r.quizId?.category || 'General'}
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs font-black text-white">
                               {r.percentage}%
                             </div>
                             <p className="text-gray-600 text-xs font-medium">{r.score}/{r.totalQuestions}</p>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          {r.isPassed ? (
                            <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg w-fit border border-emerald-500/20">
                              <CheckCircle2 size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Passed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2 py-1 rounded-lg w-fit border border-red-500/20">
                              <XCircle size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Failed</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-5">
                          <p className="text-gray-400 text-xs font-medium">
                            {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-gray-600 italic">
                          No sessions recorded yet. Start your first quiz!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {results.length > 10 && (
                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <button className="text-orange-500 text-xs font-bold hover:underline transition-all group">
                    View All Activity records
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
