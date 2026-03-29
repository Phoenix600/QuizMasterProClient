import React from 'react';
import { motion } from 'motion/react';
import { Trophy, PlayCircle, BookOpen, Layers, ChevronRight, Code, Zap, Target, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const Home = ({ onStart, currentUser }) => {
  const features = [
    {
      icon: Code,
      title: "Code Challenges",
      description: "Test your skills with real-world programming scenarios and logic puzzles.",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description: "Get immediate results and detailed explanations for every question.",
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      icon: Target,
      title: "Skill Tracking",
      description: "Monitor your progress across different courses and difficulty levels.",
      color: "text-green-500",
      bg: "bg-green-500/10"
    }
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full -ml-24 -mb-24 pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-orange-500 uppercase tracking-widest">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              New Quizzes Available
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
              Master Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                Tech Skills
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 leading-relaxed max-w-xl font-medium">
              Challenge yourself with interactive quizzes designed by industry experts. 
              From JavaScript to System Design, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Button 
                onClick={onStart}
                className="w-full sm:w-auto px-10 py-5 text-lg"
                icon={PlayCircle}
              >
                {currentUser ? 'Explore Quizzes' : 'Get Started Now'}
              </Button>
              <div className="flex items-center gap-4 text-gray-500 font-bold uppercase tracking-widest text-xs">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#141414] bg-white/10 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <span>Join 2,000+ Learners</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-transparent rounded-[4rem] border border-white/10 p-8 relative group">
              <div className="absolute inset-0 bg-orange-500/5 rounded-[4rem] blur-2xl group-hover:bg-orange-500/10 transition-all" />
              <div className="relative h-full bg-[#1a1a1a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Trophy className="text-white" size={24} />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20" />
                      <div className="w-3 h-3 rounded-full bg-orange-500/20" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="h-4 bg-white/5 rounded-full w-3/4" />
                    <div className="h-4 bg-white/5 rounded-full w-full" />
                    <div className="h-4 bg-white/5 rounded-full w-2/3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-8">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 bg-white/5 rounded-3xl border border-white/5" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full group">
              <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">
                {feature.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Stats Section */}
      <section className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-12 md:p-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="space-y-2">
            <div className="text-5xl font-black text-white italic tracking-tighter">50+</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Courses</div>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black text-white italic tracking-tighter">200+</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quizzes</div>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black text-white italic tracking-tighter">10k+</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Questions</div>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black text-white italic tracking-tighter">2k+</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Learners</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
