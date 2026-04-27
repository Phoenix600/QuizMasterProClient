import React from 'react';
import { 
  ArrowLeft, 
  User, 
  Camera, 
  Github, 
  Twitter, 
  Linkedin, 
  Link as LinkIcon, 
  FileText,
  Code2,
  ChevronDown,
  X,
  Plus,
  Calendar,
  Eye,
  EyeOff,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Terminal,
  Database,
  Wrench,
  ExternalLink,
  Trophy,
  Check,
  ImageIcon,
  Pencil,
  GraduationCap,
  Flame,
  ChevronRight,
  Monitor,
  Layout,
  Rocket,
  Circle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, WorkExperience, Project } from '../types';
import { AVATAR_LIST } from '../constants';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface ProfileViewProps {
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
  onBack: () => void;
}

const InputField = ({ label, placeholder = "", value, onChange, type = "text", icon: Icon, required, disabled }: { label: string, placeholder?: string, value?: string, onChange?: (val: string) => void, type?: string, icon?: any, required?: boolean, disabled?: boolean }) => (
  <div className={cn("space-y-1.5 w-full", disabled && "opacity-50")}>
    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={14} />}
      <input 
        type={type}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onClick={(e) => {
          if (type === 'date' && !disabled) {
            try {
              (e.target as any).showPicker();
            } catch (err) {
              // Fallback for older browsers
            }
          }
        }}
        className={cn(
          "w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-200 focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700",
          Icon && "pl-10",
          type === "date" && "appearance-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer",
          disabled && "cursor-not-allowed"
        )}
      />
    </div>
  </div>
);

const CheckboxField = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <div className={cn(
      "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
      checked ? "bg-orange-500 border-orange-500 scale-110" : "bg-zinc-900 border-zinc-800 group-hover:border-zinc-700"
    )}>
      {checked && <Check size={12} className="text-white" />}
    </div>
    <input 
      type="checkbox" 
      className="hidden" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)} 
    />
    <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
  </label>
);

const SelectField = ({ label, placeholder, value, options, onChange, required, icon: Icon }: { label: string, placeholder: string, value?: string, options: string[], onChange: (val: string) => void, required?: boolean, icon?: any }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 flex-1 min-w-[200px] relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={14} />}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-400 flex items-center justify-between hover:border-zinc-700 transition-colors",
            Icon && "pl-10"
          )}
        >
          <span className={cn("truncate", value && "text-zinc-200")}>{value || placeholder}</span>
          <ChevronDown size={14} className={cn("text-zinc-600 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full left-0 w-full mt-2 bg-[#141414] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-orange-500/10 hover:text-orange-500 flex items-center justify-between group",
                  value === option ? "text-orange-500 bg-orange-500/5" : "text-zinc-400"
                )}
              >
                <span>{option}</span>
                {value === option && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MarkdownEditorField = ({ label, value, onChange, height = 200 }: { label: string, value?: string, onChange: (val: string) => void, height?: number }) => (
  <div className="space-y-1.5 w-full" data-color-mode="dark">
    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">{label}</label>
    <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-inner">
      <MDEditor
        value={value || ''}
        onChange={(val) => onChange(val || '')}
        preview="edit"
        height={height}
        className="!bg-transparent !border-none custom-md-editor"
        previewOptions={{
          rehypePlugins: [[rehypeRaw as any, { allowDangerousHtml: true }]],
        }}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, placeholder, value, onChange, count, max }: { label: string, placeholder: string, value?: string, onChange?: (val: string) => void, count: number, max: number }) => (
  <div className="space-y-1.5 w-full">
    <div className="flex justify-between items-center px-0.5">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <span className="text-[10px] text-zinc-600 font-mono">{count}/{max}</span>
    </div>
    <textarea 
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      rows={4}
      className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-200 focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700 resize-none"
    />
  </div>
);

const Section = ({ title, children, onSave, onAdd }: { title: string, children: React.ReactNode, onSave?: () => void, onAdd?: () => void }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{title}</h2>
      {onAdd && (
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-orange-500 hover:border-orange-500/30 transition-all group"
        >
          <Plus size={12} className="group-hover:rotate-90 transition-transform" />
          Add More
        </button>
      )}
    </div>
    <div className="bg-[#0D0D0D] border border-zinc-800/50 rounded-3xl p-8 space-y-8 relative overflow-hidden group/section">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      {children}
      {onSave && (
        <div className="flex justify-end pt-4 border-t border-zinc-800/30">
          <button 
            onClick={onSave}
            className="bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white text-xs font-bold py-2.5 px-8 rounded-xl border border-orange-500/20 hover:border-orange-500 transition-all duration-300 shadow-lg shadow-orange-500/10"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  </div>
);

const PreviewCard = ({ title, children, fullWidth }: { title: string, children: React.ReactNode, fullWidth?: boolean }) => (
  <div className={cn(
    "bg-[#0D0D0D] border border-zinc-800/50 rounded-[2rem] p-7 space-y-6 relative overflow-hidden group/preview-card hover:border-zinc-700/50 transition-colors",
    fullWidth && "md:col-span-2"
  )}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{title}</h3>
    <div className="space-y-5">
      {children}
    </div>
  </div>
);

const PreviewItem = ({ label, value, isMarkdown }: { label: string, value?: string, isMarkdown?: boolean }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</span>
    {isMarkdown ? (
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
          {value || 'Not Specified'}
        </ReactMarkdown>
      </div>
    ) : (
      <p className="text-sm font-bold text-zinc-200 tracking-tight leading-tight">{value || 'Not Specified'}</p>
    )}
  </div>
);

const AvatarSelectionModal = ({ isOpen, onClose, currentAvatar, onSelect }: { isOpen: boolean, onClose: () => void, currentAvatar: string, onSelect: (url: string) => void }) => {
  const [selected, setSelected] = React.useState(currentAvatar);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0D0D0D] border border-zinc-800 rounded-[2.5rem] shadow-2xl z-[201] overflow-hidden"
          >
            <div className="flex flex-col h-[75vh]">
              {/* Header */}
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Choose Your Avatar</h2>
                  <p className="text-zinc-500 text-sm font-semibold">Select a professional identity from our collection.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Current Selection Preview */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-36 h-36 rounded-[2.5rem] bg-zinc-900 border-2 border-orange-500 p-0.5 shadow-2xl shadow-orange-500/20">
                    <img 
                      src={selected} 
                      alt="Current Selection" 
                      className="w-full h-full object-cover rounded-[2.4rem]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Active Preview</span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-4">
                  {AVATAR_LIST.map((url, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "aspect-square rounded-2xl bg-zinc-900 border-2 cursor-pointer transition-all overflow-hidden group/avatar-item",
                        selected === url ? "border-orange-500 ring-4 ring-orange-500/10" : "border-zinc-800 hover:border-zinc-700"
                      )}
                      onClick={() => setSelected(url)}
                    >
                      <img 
                        src={url} 
                        alt={`Avatar ${i + 1}`} 
                        className={cn(
                          "w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500",
                          selected === url && "opacity-100"
                        )}
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-zinc-800 bg-zinc-900/20 flex justify-end gap-4">
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onSelect(selected);
                    onClose();
                  }}
                  className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DEFAULT_AVATAR = AVATAR_LIST[0];

export default function ProfileView({ user, onSave, onBack }: ProfileViewProps) {
  const [profileData, setProfileData] = React.useState<UserProfile>(() => {
    return {
      ...user,
      name: user?.name || '',
      username: user?.username || '',
      profileUrl: user?.profileUrl || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dob: user?.dob || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || DEFAULT_AVATAR,
      location: {
        city: user?.location?.city || '',
        pinCode: user?.location?.pinCode || '',
        state: user?.location?.state || '',
        country: user?.location?.country || ''
      },
      education: {
        collegeName: user?.education?.collegeName || '',
        branch: user?.education?.branch || '',
        graduationYear: user?.education?.graduationYear || '',
        degree: user?.education?.degree || ''
      },
      skills: {
        languages: user?.skills?.languages || [],
        frameworks: user?.skills?.frameworks || [],
        databases: user?.skills?.databases || [],
        tools: user?.skills?.tools || []
      },
      socialLinks: {
        github: user?.socialLinks?.github || '',
        linkedin: user?.socialLinks?.linkedin || '',
        twitter: user?.socialLinks?.twitter || '',
        others: user?.socialLinks?.others || '',
        resume: user?.socialLinks?.resume || ''
      },
      codingProfiles: {
        leetcode: user?.codingProfiles?.leetcode || '',
        hackerrank: user?.codingProfiles?.hackerrank || '',
        codeforces: user?.codingProfiles?.codeforces || '',
        geeksforgeeks: user?.codingProfiles?.geeksforgeeks || '',
        others: user?.codingProfiles?.others || ''
      },
      workExperience: user?.workExperience || [],
      projects: user?.projects || []
    };
  });
  
  const [workExperiences, setWorkExperiences] = React.useState<WorkExperience[]>(profileData.workExperience || []);
  const [projects, setProjects] = React.useState<Project[]>(profileData.projects || []);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'preview' | 'edit'>('preview');

  React.useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        ...user,
        username: user.username || prev.username,
        profileUrl: user.profileUrl || prev.profileUrl,
        location: { ...prev.location, ...user.location },
        education: { ...prev.education, ...user.education },
        skills: { ...prev.skills, ...user.skills },
        socialLinks: { ...prev.socialLinks, ...user.socialLinks },
        codingProfiles: { ...prev.codingProfiles, ...user.codingProfiles }
      }));
      setWorkExperiences(user.workExperience || []);
      setProjects(user.projects || []);
    }
  }, [user]);

  const handleSave = () => {
    const updatedUser: UserProfile = {
      ...profileData,
      workExperience: workExperiences,
      projects: projects,
    };
    onSave(updatedUser);
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperiences(workExperiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setProjects(projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj));
  };

  const handleAddExperience = () => {
    const newId = Date.now().toString();
    setWorkExperiences([...workExperiences, { id: newId, company: '', mode: 'Remote', role: '', startDate: '', endDate: '', isOngoing: false, description: '' }]);
  };

  const handleRemoveExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter(exp => exp.id !== id));
  };

  const handleAddProject = () => {
    const newId = Date.now().toString();
    setProjects([...projects, { id: newId, title: '', role: '', startDate: '', endDate: '', isOngoing: false, highlights: '' }]);
  };

  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter(proj => proj.id !== id));
  };

  const toggleWorkOngoing = (id: string) => {
    setWorkExperiences(workExperiences.map(exp => 
      exp.id === id ? { ...exp, isOngoing: !exp.isOngoing, endDate: exp.isOngoing ? exp.endDate : '' } : exp
    ));
  };

  const toggleProjectOngoing = (id: string) => {
    setProjects(projects.map(proj => 
      proj.id === id ? { ...proj, isOngoing: !proj.isOngoing, endDate: proj.isOngoing ? proj.endDate : '' } : proj
    ));
  };

  const yearOptions = Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  return (
    <div className="h-screen bg-[#050505] text-zinc-300 font-sans overflow-y-auto custom-scrollbar">
      {/* Avatar Modal */}
      <AvatarSelectionModal 
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={profileData.avatarUrl}
        onSelect={(url) => {
          const updated = { ...profileData, avatarUrl: url };
          setProfileData(updated);
          onSave({
            ...updated,
            workExperience: workExperiences,
            projects: projects
          });
          setIsAvatarModalOpen(false);
        }}
      />

      <div className="max-w-[1500px] mx-auto min-h-screen flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full md:w-72 bg-[#0D0D0D] border-b md:border-b-0 md:border-r border-zinc-800 p-8 flex flex-col items-center space-y-10 sticky top-0 md:h-screen">
          <button 
            onClick={onBack}
            className="self-start flex items-center gap-3 text-zinc-500 hover:text-orange-500 transition-all duration-300 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Dashboard</span>
          </button>

          <div className="flex flex-col items-center space-y-6 w-full pt-6">
            <div className="relative group">
              <div className="w-36 h-36 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-orange-500/5 group-hover:border-orange-500/30 transition-all duration-500">
                <img 
                  src={profileData.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              {mode === 'edit' && (
                <button 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute -bottom-2 -right-2 w-11 h-11 bg-orange-600 hover:bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-600/20 transition-all hover:scale-110 active:scale-95 border-4 border-[#0D0D0D]"
                >
                  <Camera size={18} />
                </button>
              )}
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">{profileData.name}</h2>
              <p className="text-[11px] font-bold text-zinc-600 tracking-tight leading-none truncate max-w-[200px]">{profileData.email}</p>
            </div>

            <button 
              onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
              className={cn(
                "w-full py-3 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold transition-all active:scale-[0.98] border",
                mode === 'preview' 
                  ? "bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white" 
                  : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {mode === 'preview' ? <Pencil size={16} /> : <Eye size={16} />}
              {mode === 'preview' ? 'Edit Details' : 'View Preview'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-14 relative">
          <div className="max-w-5xl mx-auto space-y-12">
            <AnimatePresence mode="wait">
              {mode === 'preview' ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-white tracking-tight leading-none">Profile Dashboard</h2>
                  </div>

                  {/* Secondary Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PreviewCard title="Personal Information">
                      <div className="grid grid-cols-1 gap-6">
                        <PreviewItem label="Full Name" value={profileData.name} />
                        <PreviewItem label="Username" value={profileData.username} />
                        <PreviewItem label="Email" value={profileData.email} />
                        <PreviewItem label="Profile Link" value={profileData.profileUrl} />
                        <PreviewItem label="Location" value={profileData.location?.city ? `${profileData.location.city}, ${profileData.location.country || 'India'}` : undefined} />
                      </div>
                    </PreviewCard>

                    <PreviewCard title="Skills & Expertise">
                      <div className="space-y-6">
                        <PreviewItem label="Languages" value={profileData.skills?.languages?.join(', ')} />
                        <PreviewItem label="Frameworks" value={profileData.skills?.frameworks?.join(', ')} />
                        <PreviewItem label="Databases" value={profileData.skills?.databases?.join(', ')} />
                        <PreviewItem label="Tools" value={profileData.skills?.tools?.join(', ')} />
                      </div>
                    </PreviewCard>

                    <PreviewCard title="Education & Experience">
                      <div className="space-y-6">
                        <PreviewItem label="University" value={profileData.education?.collegeName} />
                        <PreviewItem label="Degree" value={profileData.education?.degree} />
                        <PreviewItem label="Current Role" value={profileData.education?.currentRole} />
                      </div>
                    </PreviewCard>

                    <PreviewCard title="Social Presence">
                      <div className="space-y-6">
                        <PreviewItem label="Github" value={profileData.socialLinks?.github} />
                        <PreviewItem label="Linkedin" value={profileData.socialLinks?.linkedin} />
                        <PreviewItem label="Twitter" value={profileData.socialLinks?.twitter} />
                      </div>
                    </PreviewCard>

                    <div className="md:col-span-2">
                      <PreviewCard title="About Me">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                            {profileData.bio || 'Tell the world about yourself...'}
                          </ReactMarkdown>
                        </div>
                      </PreviewCard>
                    </div>

                    {/* Work Experience Section */}
                    <div className="md:col-span-2">
                      <PreviewCard title="Work Experience">
                        <div className="space-y-4">
                          {workExperiences.map((exp) => (
                            <div key={exp.id} className="group/strip relative flex flex-col gap-4 p-6 rounded-[1.5rem] bg-zinc-900/30 border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300 overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover/strip:bg-orange-500/10 transition-all" />
                              
                              <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-orange-500 shadow-xl shrink-0 group-hover/strip:border-orange-500/30 transition-colors">
                                    <Building2 size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-lg font-bold text-white tracking-tight truncate group-hover/strip:text-orange-500 transition-colors">{exp.company}</h4>
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 tracking-tight">
                                      <span className="truncate">{exp.role}</span>
                                      <Circle size={4} className="fill-zinc-700 text-zinc-700" />
                                      <span className="text-orange-500/80 shrink-0">{exp.mode}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-widest shrink-0 shadow-inner group-hover/strip:border-zinc-700 transition-colors">
                                  <Calendar size={12} className="text-orange-500" />
                                  <span>{new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – {exp.isOngoing ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                </div>
                              </div>

                              {exp.description && (
                                <div className="relative z-10 pl-16">
                                  <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-li:my-0.5 text-zinc-400 font-bold opacity-80 group-hover/strip:opacity-100 transition-opacity">
                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                      {exp.description}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {workExperiences.length === 0 && <p className="text-xs text-zinc-600 font-bold text-center py-4 tracking-widest uppercase">No experience added yet</p>}
                        </div>
                      </PreviewCard>
                    </div>

                    {/* Projects Section */}
                    <div className="md:col-span-2">
                      <PreviewCard title="Featured Projects">
                        <div className="space-y-4">
                          {projects.map((proj) => (
                            <div key={proj.id} className="group/strip relative flex flex-col gap-4 p-6 rounded-[1.5rem] bg-zinc-900/30 border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300 overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover/strip:bg-orange-500/10 transition-all" />
                              
                              <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-orange-500 shadow-xl shrink-0 group-hover/strip:border-orange-500/30 transition-colors">
                                    <Rocket size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-lg font-bold text-white tracking-tight truncate group-hover/strip:text-orange-500 transition-colors">{proj.title}</h4>
                                    <div className="text-xs font-bold text-zinc-500 tracking-tight truncate">
                                      {proj.role}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-widest shrink-0 shadow-inner group-hover/strip:border-zinc-700 transition-colors">
                                  <Calendar size={12} className="text-orange-500" />
                                  <span>{new Date(proj.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – {proj.isOngoing ? 'Ongoing' : proj.endDate ? new Date(proj.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                </div>
                              </div>

                              {proj.highlights && (
                                <div className="relative z-10 pl-16">
                                  <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-li:my-0.5 text-zinc-400 font-bold opacity-80 group-hover/strip:opacity-100 transition-opacity">
                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                      {proj.highlights}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {projects.length === 0 && <p className="text-xs text-zinc-600 font-bold text-center py-4 tracking-widest uppercase">No projects added yet</p>}
                        </div>
                      </PreviewCard>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="edit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12 pb-24"
                >
                  <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-white tracking-tight leading-none">Edit Profile</h1>
                    <p className="text-zinc-500 font-semibold text-base">Update your professional details and social presence.</p>
                  </div>

                  {/* Edit Sections */}
                  <Section title="Core Information" onSave={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputField 
                        label="Full Name" 
                        placeholder="e.g. Pranay Ramteke" 
                        icon={User}
                        value={profileData.name} 
                        onChange={(val) => setProfileData({ ...profileData, name: val })}
                      />
                      <InputField 
                        label="Username" 
                        placeholder="e.g. pranay_pro" 
                        icon={User}
                        value={profileData.username} 
                        onChange={(val) => setProfileData({ ...profileData, username: val })}
                      />
                      <InputField 
                        label="Profile URL" 
                        placeholder="quizmaster.pro/p/username" 
                        icon={Globe}
                        value={profileData.profileUrl} 
                        onChange={(val) => setProfileData({ ...profileData, profileUrl: val })}
                      />
                      <InputField 
                        label="Official Email" 
                        placeholder="name@email.com" 
                        icon={Mail}
                        value={profileData.email} 
                        type="email" 
                        onChange={(val) => setProfileData({ ...profileData, email: val })}
                      />
                      <InputField 
                        label="Phone Contact" 
                        placeholder="+91 00000 00000" 
                        icon={Phone}
                        value={profileData.phone} 
                        onChange={(val) => setProfileData({ ...profileData, phone: val })}
                      />
                      <InputField 
                        label="Date of Birth" 
                        placeholder="DD-MM-YYYY" 
                        icon={Calendar}
                        value={profileData.dob} 
                        type="date"
                        onChange={(val) => setProfileData({ ...profileData, dob: val })}
                      />
                      <InputField 
                        label="Current City" 
                        placeholder="e.g. Nagpur, India" 
                        icon={MapPin}
                        value={profileData.location?.city} 
                        onChange={(val) => setProfileData({ ...profileData, location: { ...profileData.location, city: val } })}
                      />
                    </div>
                  </Section>

                  <Section title="Education Details" onSave={handleSave}>
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SelectField 
                          label="Graduation Year" 
                          placeholder="Select Year" 
                          options={yearOptions}
                          value={profileData.education?.graduationYear} 
                          onChange={(val) => setProfileData({ ...profileData, education: { ...profileData.education, graduationYear: val } })}
                        />
                        <InputField 
                          label="Branch / Major" 
                          placeholder="e.g. Computer Science" 
                          icon={Briefcase}
                          value={profileData.education?.branch}
                          onChange={(val) => setProfileData({ ...profileData, education: { ...profileData.education, branch: val } })}
                        />
                      </div>
                      <InputField 
                        label="Institution / University Name" 
                        placeholder="Enter your full college or university name" 
                        icon={Building2}
                        value={profileData.education?.collegeName}
                        onChange={(val) => setProfileData({ ...profileData, education: { ...profileData.education, collegeName: val } })}
                      />
                    </div>
                  </Section>

                  <Section title="Professional Bio" onSave={handleSave}>
                    <MarkdownEditorField 
                      label="Biography" 
                      value={profileData.bio}
                      onChange={(val) => setProfileData({ ...profileData, bio: val })}
                      height={250}
                    />
                  </Section>

                  <Section title="Digital Presence" onSave={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputField 
                        label="GitHub" 
                        placeholder="github.com/username" 
                        icon={Github} 
                        value={profileData.socialLinks?.github} 
                        onChange={(val) => setProfileData({ ...profileData, socialLinks: { ...profileData.socialLinks, github: val } })}
                      />
                      <InputField 
                        label="Twitter / X" 
                        placeholder="twitter.com/username" 
                        icon={Twitter} 
                        value={profileData.socialLinks?.twitter} 
                        onChange={(val) => setProfileData({ ...profileData, socialLinks: { ...profileData.socialLinks, twitter: val } })}
                      />
                      <InputField 
                        label="LinkedIn" 
                        placeholder="linkedin.com/in/username" 
                        icon={Linkedin} 
                        value={profileData.socialLinks?.linkedin} 
                        onChange={(val) => setProfileData({ ...profileData, socialLinks: { ...profileData.socialLinks, linkedin: val } })}
                      />
                      <InputField 
                        label="Portfolio" 
                        placeholder="yourwebsite.com" 
                        icon={Globe} 
                        value={profileData.socialLinks?.others}
                        onChange={(val) => setProfileData({ ...profileData, socialLinks: { ...profileData.socialLinks, others: val } })}
                      />
                      <div className="md:col-span-2">
                        <InputField 
                          label="Resume URL" 
                          placeholder="Link to your PDF resume (Drive, Dropbox, etc.)" 
                          icon={ExternalLink} 
                          value={profileData.socialLinks?.resume}
                          onChange={(val) => setProfileData({ ...profileData, socialLinks: { ...profileData.socialLinks, resume: val } })}
                        />
                      </div>
                    </div>
                  </Section>

                  <Section title="Technical Expertise" onSave={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputField 
                        label="Languages" 
                        placeholder="C++, Java, Python, JavaScript" 
                        icon={Terminal}
                        value={profileData.skills?.languages?.join(', ')} 
                        onChange={(val) => setProfileData({ ...profileData, skills: { ...profileData.skills, languages: val.split(',').map(s => s.trim()) } })}
                      />
                      <InputField 
                        label="Frameworks" 
                        placeholder="React, Node.js, Spring Boot" 
                        icon={Code2}
                        value={profileData.skills?.frameworks?.join(', ')} 
                        onChange={(val) => setProfileData({ ...profileData, skills: { ...profileData.skills, frameworks: val.split(',').map(s => s.trim()) } })}
                      />
                      <InputField 
                        label="Databases" 
                        placeholder="MongoDB, PostgreSQL, MySQL" 
                        icon={Database}
                        value={profileData.skills?.databases?.join(', ')} 
                        onChange={(val) => setProfileData({ ...profileData, skills: { ...profileData.skills, databases: val.split(',').map(s => s.trim()) } })}
                      />
                      <InputField 
                        label="Tools" 
                        placeholder="Git, Docker, Kubernetes, AWS" 
                        icon={Wrench}
                        value={profileData.skills?.tools?.join(', ')} 
                        onChange={(val) => setProfileData({ ...profileData, skills: { ...profileData.skills, tools: val.split(',').map(s => s.trim()) } })}
                      />
                    </div>
                  </Section>

                  <Section title="Professional Journey" onSave={handleSave} onAdd={handleAddExperience}>
                    <div className="space-y-12">
                      {workExperiences.map((exp, index) => (
                        <div key={exp.id} className="space-y-8 relative group/exp bg-zinc-900/20 p-8 rounded-[2rem] border border-zinc-800/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                                {index + 1}
                              </div>
                              <span className="text-sm font-bold text-white tracking-tight">Work Experience {index + 1}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveExperience(exp.id)}
                              className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField 
                              label="Company" 
                              placeholder="e.g. Google" 
                              icon={Building2}
                              value={exp.company} 
                              onChange={(val) => updateWorkExperience(exp.id, 'company', val)}
                              required 
                            />
                            <SelectField 
                              label="Mode" 
                              placeholder="Select Mode" 
                              icon={Monitor}
                              options={['Remote', 'On-site', 'Hybrid']}
                              value={exp.mode} 
                              onChange={(val) => updateWorkExperience(exp.id, 'mode', val)}
                              required 
                            />
                            <InputField 
                              label="Role" 
                              placeholder="e.g. Software Engineer" 
                              icon={User}
                              value={exp.role} 
                              onChange={(val) => updateWorkExperience(exp.id, 'role', val)}
                              required 
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <InputField 
                                label="Start Date" 
                                value={exp.startDate} 
                                type="date" 
                                icon={Calendar} 
                                onChange={(val) => updateWorkExperience(exp.id, 'startDate', val)}
                                required 
                              />
                              <div className="space-y-3">
                                <InputField 
                                  label="End Date" 
                                  value={exp.endDate} 
                                  type="date" 
                                  icon={Calendar} 
                                  onChange={(val) => updateWorkExperience(exp.id, 'endDate', val)}
                                  required={!exp.isOngoing} 
                                  disabled={exp.isOngoing} 
                                />
                                <CheckboxField 
                                  label="Currently working here" 
                                  checked={exp.isOngoing || false} 
                                  onChange={() => toggleWorkOngoing(exp.id)} 
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <MarkdownEditorField 
                                label="Key Responsibilities" 
                                value={exp.description} 
                                onChange={(val) => updateWorkExperience(exp.id, 'description', val)}
                                height={250}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {workExperiences.length === 0 && (
                        <button 
                          onClick={handleAddExperience}
                          className="w-full py-8 border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600 hover:text-orange-500 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all flex flex-col items-center gap-3 font-bold text-sm"
                        >
                          <Plus size={24} />
                          Add Work Experience
                        </button>
                      )}
                    </div>
                  </Section>

                  <Section title="Projects" onSave={handleSave} onAdd={handleAddProject}>
                    <div className="space-y-12">
                      {projects.map((proj, index) => (
                        <div key={proj.id} className="space-y-8 relative group/exp bg-zinc-900/20 p-8 rounded-[2rem] border border-zinc-800/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                                {index + 1}
                              </div>
                              <span className="text-sm font-bold text-white tracking-tight">Project {index + 1}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveProject(proj.id)}
                              className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField 
                              label="Project Title" 
                              placeholder="e.g. E-Commerce Platform" 
                              icon={Rocket}
                              value={proj.title} 
                              onChange={(val) => updateProject(proj.id, 'title', val)}
                              required 
                            />
                            <InputField 
                              label="Role" 
                              placeholder="e.g. Full Stack Developer" 
                              icon={User}
                              value={proj.role} 
                              onChange={(val) => updateProject(proj.id, 'role', val)}
                              required 
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <InputField 
                                label="Start Date" 
                                value={proj.startDate} 
                                type="date" 
                                icon={Calendar} 
                                onChange={(val) => updateProject(proj.id, 'startDate', val)}
                                required 
                              />
                              <div className="space-y-3">
                                <InputField 
                                  label="End Date" 
                                  value={proj.endDate} 
                                  type="date" 
                                  icon={Calendar} 
                                  onChange={(val) => updateProject(proj.id, 'endDate', val)}
                                  required={!proj.isOngoing} 
                                  disabled={proj.isOngoing} 
                                />
                                <CheckboxField 
                                  label="Ongoing project" 
                                  checked={proj.isOngoing || false} 
                                  onChange={() => toggleProjectOngoing(proj.id)} 
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <MarkdownEditorField 
                                label="Project Highlights / Bullet Points" 
                                value={proj.highlights} 
                                onChange={(val) => updateProject(proj.id, 'highlights', val)}
                                height={250}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {projects.length === 0 && (
                        <button 
                          onClick={handleAddProject}
                          className="w-full py-8 border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600 hover:text-orange-500 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all flex flex-col items-center gap-3 font-bold text-sm"
                        >
                          <Plus size={24} />
                          Add Project
                        </button>
                      )}
                    </div>
                  </Section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #18181b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #27272a;
        }
        .custom-md-editor .w-md-editor {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .custom-md-editor .w-md-editor-toolbar {
          background-color: #141414 !important;
          border-bottom: 1px solid #27272a !important;
        }
        .custom-md-editor .w-md-editor-text {
          font-family: inherit !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
        .prose-xs {
          font-size: 0.75rem;
          line-height: 1.5;
        }
        .prose-xs p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
