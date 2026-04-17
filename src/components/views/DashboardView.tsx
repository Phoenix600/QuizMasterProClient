import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Target, 
  Flame, 
  Award, 
  CheckCircle2, 
  BookOpen, 
  TrendingUp,
  Clock,
  ChevronRight,
  Zap,
  Calendar as CalendarIcon,
  Code
} from 'lucide-react';
import { StreakCalendar } from './StreakCalendar';

interface DashboardStats {
  totalQuizzes: number;
  averagePercentage: number;
  streak: number;
  courseProgress: number;
  professionalStatus: string;
  activeDates: string[];
  coursesStatus: { id: string; title: string; progress: number; totalQuizzes: number; passedQuizzes: number; }[];
}

interface DashboardViewProps {
  stats: DashboardStats | null;
  userName: string;
  setView: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, userName, setView }) => {
  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Average Accuracy',
      value: `${stats.averagePercentage}%`,
      icon: <Target className="text-blue-400" size={24} />,
      color: 'blue'
    },
    {
      label: 'Quizzes Completed',
      value: stats.totalQuizzes,
      icon: <CheckCircle2 className="text-green-400" size={24} />,
      color: 'green'
    },
    {
      label: 'Current Streak',
      value: `${stats.streak} Days`,
      icon: <Flame className="text-orange-500" size={24} />,
      color: 'orange'
    },
    {
      label: 'Professional Status',
      value: stats.professionalStatus,
      icon: <Award className="text-purple-400" size={24} />,
      color: 'purple'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-orange-500">{userName}</span>!
          </h2>
          <p className="text-gray-400 mt-2 text-lg">Here's how your learning journey is progressing.</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-[#1a1a1a] border border-white/5 rounded-3xl group hover:border-orange-500/30 transition-all cursor-default"
          >
            <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) — Focused on Learning History & Progress */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Learning Calendar */}
          <StreakCalendar activeDates={stats.activeDates || []} />

          {/* Expanded Course Status List */}
          <div className="p-10 bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-bold text-white">Course Completion Status</h3>
                  <p className="text-gray-400 mt-1">Detailed breakdown of your progress across all courses.</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-4xl font-black text-white">{stats.courseProgress}%</span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Overall Mastered</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                {(stats.coursesStatus || []).length > 0 ? (
                  stats.coursesStatus.map((course, i) => (
                    <div key={course.id || i} className="group cursor-default p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-base font-bold text-white group-hover:text-orange-500 transition-colors truncate max-w-[220px]">
                          {course.title}
                        </p>
                        <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-black text-orange-500 uppercase">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: i * 0.05 }}
                          className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                          {course.passedQuizzes} / {course.totalQuizzes} Quizzes Passed
                        </p>
                        <div className="flex gap-1">
                          {[...Array(Math.min(course.passedQuizzes, 5))].map((_, idx) => (
                            <div key={idx} className="w-1 h-1 bg-orange-500 rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                      <BookOpen size={32} />
                    </div>
                    <p className="text-gray-500 text-sm italic">You haven't started any courses yet.</p>
                    <button 
                      onClick={() => setView('selection')}
                      className="mt-6 px-8 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                    >
                      Browse Courses
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Streak & Motivation */}
        <div className="space-y-8">
          <div className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap size={140} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold">Daily Streak</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-baseline gap-2">
                  <p className="text-7xl font-black">{stats.streak}</p>
                  <span className="text-xl font-bold opacity-80">Days</span>
                </div>
                
                <p className="text-orange-100 font-medium text-lg leading-relaxed">
                  Excellent consistency! Keep learning every day to maintain your streak.
                </p>
                
                <div className="pt-4 space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                    <span>Weekly Progress</span>
                    <span>{stats.streak % 7}/7</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div 
                        key={day}
                        className={`h-2 flex-1 rounded-full ${day <= (stats.streak % 7 || (stats.streak > 0 ? 7 : 0)) ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:border-orange-500/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                <Award className="text-orange-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Your Rank</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-white">{stats.professionalStatus}</p>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                You've mastered <span className="text-white font-bold">{stats.courseProgress}%</span> of all available material. 
                Complete <span className="text-orange-500 font-bold">3 more quizzes</span> to reach the next rank!
              </p>
              
              <button 
                onClick={() => setView('selection')}
                className="w-full py-4 bg-white/5 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all border border-white/5 hover:border-orange-500/50"
              >
                Find New Quiz
              </button>
              
              <button 
                onClick={() => setView('coding')}
                className="w-full py-4 mt-4 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white font-bold rounded-2xl transition-all border border-orange-500/20 hover:border-orange-500 flex items-center justify-center gap-2 group"
              >
                <Code className="group-hover:scale-110 transition-transform" size={20} />
                Coding Workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
