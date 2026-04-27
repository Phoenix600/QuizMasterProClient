import React from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Trophy, 
  Flame, 
  Calendar,
  ChevronDown,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import HeatMap from '@uiw/react-heat-map';

import { UserProfile } from '../types';

interface ProfileDashboardProps {
  user: UserProfile;
  onBack: () => void;
  onEdit: () => void;
}

const Heatmap = () => {
  const heatmapData = {
    "total": 57,
    "months": {
      "1": { "14": { "total": 1 }, "5": { "total": 4 }, "8": { "total": 2 } },
      "10": { "24": { "total": 1 } },
      "12": { "12": { "total": 1 }, "13": { "total": 1 }, "25": { "total": 1 }, "7": { "total": 1 } },
      "2": { "16": { "total": 1 } },
      "3": { "13": { "total": 1 }, "7": { "total": 1 } },
      "4": { "14": { "total": 12 } },
      "5": { "10": { "total": 1 }, "19": { "total": 1 }, "9": { "total": 1 } },
      "6": { "14": { "total": 4 }, "17": { "total": 1 }, "24": { "total": 1 } },
      "7": { "17": { "total": 2 }, "25": { "total": 3 }, "26": { "total": 4 } },
      "8": { "13": { "total": 1 }, "25": { "total": 1 }, "27": { "total": 2 }, "29": { "total": 3 }, "30": { "total": 5 } }
    }
  };

  // Transform backend monthly JSON into a flat {date, count} array
  const transformedData = React.useMemo(() => {
    const today = new Date(2026, 2, 17); // March 17, 2026
    const results: { date: string; count: number }[] = [];
    
    // Iterate through the last 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthNum = (d.getMonth() + 1).toString();
      const year = d.getFullYear();
      
      const monthData = heatmapData.months[monthNum as keyof typeof heatmapData.months];
      if (monthData) {
        Object.entries(monthData).forEach(([day, dayData]: [string, any]) => {
          const formattedDate = `${year}/${monthNum.padStart(2, '0')}/${day.padStart(2, '0')}`;
          results.push({
            date: formattedDate,
            count: dayData.total
          });
        });
      }
    }
    return results;
  }, []);

  const startDate = new Date(2025, 2, 18); // Approx 1 year ago
  const endDate = new Date(2026, 2, 17);

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-200">
            <span className="text-orange-500">{heatmapData.total}</span> submissions in the last 12 months
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900/80 border border-zinc-800 p-1 rounded-full">
            <button className="px-3 py-1 rounded-full bg-orange-600/20 text-orange-500 text-[10px] font-bold border border-orange-500/20">
              TUF
            </button>
            <button className="px-3 py-1 rounded-full text-zinc-600 text-[10px] font-bold hover:text-zinc-400 transition-colors">
              LeetCode
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">
            Last 12 months
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="min-w-[700px] flex justify-center">
          <HeatMap
            value={transformedData}
            width={750}
            startDate={startDate}
            endDate={endDate}
            legendCellSize={0} // Hide default legend
            rectSize={12}
            space={3}
            rectProps={{
              rx: 2
            }}
            panelColors={{
              0: '#18181b66', // zinc-900/40
              1: '#064e3b66', // green-900/40
              4: '#15803d99', // green-700/60
              10: '#22c55ee6', // green-500/90
            }}
            style={{
              color: '#71717a', // zinc-500 for labels
              '--rhm-rect-active': '#22c55e',
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-800/30">
        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span>Active Days - <span className="text-zinc-300 font-bold">30</span></span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span>Max Streak - <span className="text-zinc-300 font-bold">2</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-800/40" />
            <span>Not visited yet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-green-500/90" />
            <span>Achieved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileDetails = ({ user }: { user: UserProfile }) => {
  const details = [
    {
      title: "Personal Information",
      items: [
        { label: "Full Name", value: user.name },
        { label: "Username", value: user.username },
        { label: "Email", value: user.email },
        { label: "Location", value: `${user.location.city}, ${user.location.state}, ${user.location.country}` },
      ]
    },
    {
      title: "Skills & Expertise",
      items: [
        { label: "Languages", value: user.skills.languages.join(', ') },
        { label: "Frameworks", value: user.skills.frameworks.join(', ') },
        { label: "Databases", value: user.skills.databases.join(', ') },
        { label: "Tools", value: user.skills.tools.join(', ') },
      ]
    },
    {
      title: "Education & Experience",
      items: [
        { label: "University", value: user.education.collegeName },
        { label: "Degree", value: user.education.degree },
        { label: "Current Role", value: user.education.currentRole },
      ]
    },
    {
      title: "Social Presence",
      items: [
        { label: "GitHub", value: user.socialLinks.github },
        { label: "LinkedIn", value: user.socialLinks.linkedin },
        { label: "Twitter", value: user.socialLinks.twitter },
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {details.map((section, idx) => (
        <div key={idx} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 border-b border-zinc-800/50 pb-2">{section.title}</h3>
          <div className="space-y-3">
            {section.items.map((item, i) => (
              <div key={i} className="flex flex-col space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{item.label}</span>
                <span className="text-sm text-zinc-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Bio Section - Full Width */}
      <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-200 border-b border-zinc-800/50 pb-2">About Me</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {user.bio}
        </p>
      </div>

      {/* Work Experience Section - Full Width */}
      <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-zinc-200 border-b border-zinc-800/50 pb-2">Work Experience</h3>
        <div className="grid grid-cols-1 gap-6">
          {user.workExperience.map((exp) => (
            <div key={exp.id} className="space-y-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg group hover:border-orange-500/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">{exp.company}</h4>
                  <p className="text-xs text-zinc-500 font-medium">{exp.role} • {exp.mode}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  <Calendar size={10} />
                  {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.isOngoing ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present')}
                </div>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                {exp.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section - Full Width */}
      <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-zinc-200 border-b border-zinc-800/50 pb-2">Projects</h3>
        <div className="grid grid-cols-1 gap-6">
          {user.projects.map((project) => (
            <div key={project.id} className="space-y-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg group hover:border-orange-500/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">{project.title}</h4>
                  <p className="text-xs text-zinc-500 font-medium">{project.role}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  <Calendar size={10} />
                  {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {project.isOngoing ? 'Present' : (project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present')}
                </div>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                {project.highlights}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ProfileDashboard({ user, onBack, onEdit }: ProfileDashboardProps) {
  return (
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-4 space-y-6 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors px-3 py-2 rounded-md hover:bg-zinc-900"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="px-3 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
              <img 
                src={user.avatarUrl} 
                alt="avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">{user.name}</h2>
              <p className="text-[10px] text-zinc-500">{user.email}</p>
            </div>
          </div>

          <button 
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 text-xs font-bold rounded-md border border-orange-500/20 transition-all"
          >
            <Edit2 size={14} />
            Edit Profile Details
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Profile Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400">
                <Flame size={14} className="text-orange-500" />
                {user.streak} Day Streak
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <Heatmap />
            <ProfileDetails user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}
