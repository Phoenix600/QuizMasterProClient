import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Info, Share2, Flame } from 'lucide-react';

interface StreakCalendarProps {
  activeDates: string[]; // ['YYYY-MM-DD']
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({ activeDates }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust to start from Monday

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  // Generate days for the grid
  const days = [];
  const prevMonthDays = daysInMonth(year, month - 1);
  
  // Padding from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, current: false });
  }
  
  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, current: true });
  }
  
  // Padding for next month
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false });
  }

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isActive = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return activeDates.includes(dateStr);
  };

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      {/* Top Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-orange-500 rounded-b-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <button className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-95">
          <Info size={18} />
        </button>
        
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 bg-white/5 rounded-full text-white hover:bg-orange-500/20 hover:text-orange-500 transition-all active:scale-95">
            <ChevronLeft size={18} />
          </button>
          
          <div className="overflow-hidden h-8 flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={monthName}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="px-6 py-1.5 bg-white/10 border border-white/10 rounded-xl"
              >
                <span className="text-sm font-bold text-white tracking-wide">{monthName}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <button onClick={nextMonth} className="p-2 bg-white/5 rounded-full text-white hover:bg-orange-500/20 hover:text-orange-500 transition-all active:scale-95">
            <ChevronRight size={18} />
          </button>
        </div>
        
        <button className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-95">
          <Share2 size={18} />
        </button>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-y-6 mb-8 relative z-10">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <motion.div 
            key={d}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]"
          >
            {d}
          </motion.div>
        ))}

        {/* Days grid with month-change animation container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={monthName}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="col-span-7 grid grid-cols-7 gap-y-6"
          >
            {days.map((item, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ scale: item.current ? 1.15 : 1 }}
                className="flex flex-col items-center justify-center relative min-h-[48px] cursor-default"
              >
                {item.current && isActive(item.day) ? (
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20,
                      delay: 0.1 + (idx % 7) * 0.02
                    }}
                    className="w-10 h-10 bg-gradient-to-br from-orange-500/30 to-orange-600/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-orange-500/10 border border-orange-500/20"
                  >
                    <Flame className="text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" size={20} />
                  </motion.div>
                ) : (
                  <span className={`text-sm font-semibold transition-colors ${item.current ? (isActive(item.day) ? 'text-orange-500' : 'text-white/80') : 'text-gray-800'}`}>
                    {item.day}
                  </span>
                )}
                {item.current && isToday(item.day) && !isActive(item.day) && (
                  <motion.div 
                    layoutId="today-indicator"
                    className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none" />
    </div>
  );
};
