import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight, Layers, Trophy } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

const CourseList = ({ courses, onSelectCourse }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {courses.map((course, index) => (
        <motion.div
          key={course._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card 
            onClick={() => onSelectCourse(course)}
            className="h-full cursor-pointer flex flex-col"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <Badge variant="secondary" icon={Layers}>
                {course.chaptersCount || 0} Chapters
              </Badge>
            </div>

            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-white tracking-tight mb-4 group-hover:text-orange-500 transition-colors">
                {course.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                {course.description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 tracking-tight">
                <Trophy size={14} className="text-orange-500" />
                {course.quizzesCount || 0} Quizzes
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CourseList;
