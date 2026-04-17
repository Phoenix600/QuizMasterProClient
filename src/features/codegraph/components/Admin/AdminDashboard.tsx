import React, { useState } from 'react';
import { ProblemList } from './ProblemList';
import { ProblemAuthoring } from './ProblemAuthoring';
import { ContestAuthoring } from './ContestAuthoring';
import { FileCode, ArrowLeft, Trophy, Plus, Search, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

interface AdminDashboardProps {
  onBack: () => void;
  initialProblemId?: string | number;
  initialContext?: {
    courseId?: string | number;
    chapterId?: string | number;
    subChapterId?: string | number;
  };
  initialTab?: 'problems' | 'contests';
  onSuccess?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, initialProblemId, initialContext, initialTab, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'problems' | 'contests'>(initialTab || 'problems');
  const [view, setView] = useState<'list' | 'authoring'>( (initialProblemId || initialContext) ? 'authoring' : 'list');
  const [activeProblemId, setActiveProblemId] = useState<string | number | undefined>(initialProblemId);
  const [authoringContext, setAuthoringContext] = useState<any>(initialContext || null);

  // Sync props with state if they change
  React.useEffect(() => {
    if (initialProblemId) {
      setActiveProblemId(initialProblemId);
      setView('authoring');
      setActiveTab('problems');
    }
  }, [initialProblemId]);

  React.useEffect(() => {
    if (initialContext) {
      setAuthoringContext(initialContext);
      setActiveProblemId(undefined);
      setView('authoring');
      setActiveTab('problems');
    }
  }, [initialContext]);

  React.useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
      setView('list'); // Return to list view when tab changes externally
    }
  }, [initialTab]);

  const handleEdit = (id: string | number) => {
    setActiveProblemId(id);
    setView('authoring');
  };

  const handleCreate = () => {
    setActiveProblemId(undefined);
    setView('authoring');
  };

  const handleBackFromAuthoring = () => {
    setView('list');
    setActiveProblemId(undefined);
    setAuthoringContext(null);
  };

  const handleCreateProblemWithContext = (context: any) => {
    setAuthoringContext(context);
    setActiveProblemId(undefined);
    setActiveTab('problems');
    setView('authoring');
  };

  if (view === 'authoring' && activeTab === 'problems') {
    return (
      <ProblemAuthoring
        problemId={activeProblemId}
        initialContext={authoringContext}
        onBack={handleBackFromAuthoring}
        onProblemSelect={setActiveProblemId}
        onCreateNew={handleCreate}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'problems' ? (
          <ProblemList
            onEdit={handleEdit}
            onCreate={handleCreate}
            onBack={onBack}
          />
        ) : (
          <ContestManager />
        )}
      </div>
    </div>
  );
};

/**
 * ContestManager Component (Inlined for simplicity or moved to file)
 * Handles listing and triggering contest creation
 */
const ContestManager = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState<any>(null);

  React.useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const data = await api.getContests();
      setContests(data);
    } catch (err) {
      console.error("Failed to fetch contests", err);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <ContestAuthoring 
        contest={selectedContest} 
        onBack={() => {
          setView('list');
          setSelectedContest(null);
          fetchContests();
        }} 
      />
    );
  }

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
       <div className="flex items-center justify-between mb-8">
         <div className="space-y-1">
           <h2 className="text-2xl font-bold text-white tracking-tight">Coding Contests</h2>
           <p className="text-sm text-zinc-500">Orchestrate periodic competitive excellence</p>
         </div>
         <button 
           onClick={() => {
             setSelectedContest(null);
             setView('create');
           }}
           className="flex items-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-white text-black rounded-xl text-xs font-bold transition-all shadow-lg shadow-white/5 active:scale-95"
         >
           <Plus size={16} />
           CREATE CONTEST
         </button>
       </div>

       {loading ? (
         <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
         </div>
       ) : contests.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[32px] p-12">
            <Trophy size={48} className="text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-medium">No contests found. Start by creating one!</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {contests.map((contest) => (
              <div key={contest._id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 group hover:border-zinc-700 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-white">{contest.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-1">{contest.description}</p>
                  </div>
                  {contest.isPublished ? (
                    <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">LIVE</div>
                  ) : (
                    <div className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-500">DRAFT</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-zinc-800/50">
                   <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">MCQs</span>
                      <p className="text-sm text-zinc-300 font-mono">{contest.mcqQuestions?.length || 0} Questions</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Coding</span>
                      <p className="text-sm text-zinc-300 font-mono">{contest.codingProblems?.length || 0} Problems</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                      <Calendar size={14} className="text-orange-500" />
                      {new Date(contest.startTime).toLocaleDateString()}
                   </div>
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setSelectedContest(contest);
                          setView('edit');
                        }}
                        className="p-2 text-zinc-500 hover:text-orange-500 transition-colors"
                      >
                         <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm("Delete contest?")) {
                            await api.deleteContest(contest._id);
                            fetchContests();
                          }
                        }}
                        className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
         </div>
       )}
    </div>
  );
};
