import React from 'react';
import { 
  User, 
  Camera, 
  Mail,
  GraduationCap,
  Building2,
  Calendar,
  Phone,
  MapPin,
  Globe,
  Hash,
  Save,
  CheckCircle2,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DUMMY_USER } from '../constants';
import { UserProfile } from '../types';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface ProfileViewProps {
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
  onBack: () => void;
}

const ProfileInput = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  icon: Icon, 
  disabled,
  readOnly,
  info
}: { 
  label: string, 
  placeholder: string, 
  value?: string, 
  onChange?: (val: string) => void, 
  icon?: any,
  disabled?: boolean,
  readOnly?: boolean,
  info?: string
}) => (
  <div className={cn("space-y-1.5 w-full", disabled && "opacity-50")}>
    <div className="flex justify-between items-center">
      <label className="text-[11px] font-semibold text-zinc-500 tracking-tight">{label}</label>
      {info && <span className="text-[9px] text-zinc-600 font-medium italic">{info}</span>}
    </div>
    <div className="relative group">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500/70 transition-colors" size={16} />}
      <input 
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full bg-zinc-900/40 border border-zinc-800/60 rounded-xl py-3 px-4 text-sm text-zinc-200 transition-all outline-none",
          Icon && "pl-11",
          readOnly ? "cursor-default border-zinc-800/40" : "focus:border-orange-500/30 focus:bg-zinc-900/60"
        )}
      />
    </div>
  </div>
);

export default function ProfileView({ user, onSave, onBack }: ProfileViewProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'profile'>('profile');
  
  // Robust initialization for nested fields
  const [profileData, setProfileData] = React.useState<UserProfile>(() => {
    const base = { ...DUMMY_USER, ...user };
    return {
      ...base,
      location: {
        city: user?.location?.city || DUMMY_USER.location.city,
        pinCode: user?.location?.pinCode || DUMMY_USER.location.pinCode,
        state: user?.location?.state || DUMMY_USER.location.state,
        country: user?.location?.country || DUMMY_USER.location.country,
      },
      education: {
        collegeName: user?.education?.collegeName || DUMMY_USER.education.collegeName,
        branch: user?.education?.branch || DUMMY_USER.education.branch,
        graduationYear: user?.education?.graduationYear || DUMMY_USER.education.graduationYear,
        degree: user?.education?.degree || DUMMY_USER.education.degree,
        currentRole: user?.education?.currentRole || DUMMY_USER.education.currentRole,
      }
    };
  });

  // Sync state if user prop changes (e.g. after fresh fetch in workspace)
  React.useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        ...user,
        location: {
          city: user.location?.city || prev.location.city,
          pinCode: user.location?.pinCode || prev.location.pinCode,
          state: user.location?.state || prev.location.state,
          country: user.location?.country || prev.location.country,
        },
        education: {
          collegeName: user.education?.collegeName || prev.education.collegeName,
          branch: user.education?.branch || prev.education.branch,
          graduationYear: user.education?.graduationYear || prev.education.graduationYear,
          degree: user.education?.degree || prev.education.degree,
          currentRole: user.education?.currentRole || prev.education.currentRole,
        }
      }));
    }
  }, [user]);

  const updateEducation = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }));
  };

  const updateLocation = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  return (
    <div className="h-full w-full bg-[#0A0A0A] overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-10">
        
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Your <span className="text-orange-500">Profile</span> Settings
            </h1>
            <p className="text-sm text-zinc-500 font-medium">Keep your academic and contact details up to date.</p>
          </div>
          
          <div className="bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800/50 flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-semibold transition-all",
                activeTab === 'overview' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={cn(
                "px-8 py-2 rounded-xl text-xs font-semibold transition-all relative overflow-hidden group",
                activeTab === 'profile' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {activeTab === 'profile' && (
                <motion.div 
                  layoutId="active-tab-indicator"
                  className="absolute inset-0 bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Profile</span>
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-transparent rounded-[2.5rem] blur-2xl group-hover:bg-orange-600/10 transition-all duration-500" />
          <div className="relative bg-zinc-900/30 border border-zinc-800/40 rounded-[2.5rem] p-8 flex items-center gap-8 backdrop-blur-xl">
            <div className="relative group/avatar">
              <div className="w-28 h-28 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-zinc-800" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-9 h-9 bg-orange-600 hover:bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95">
                <Camera size={18} />
              </button>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">{profileData.name}</h2>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-default">
                  <Mail size={14} className="text-orange-500/70" />
                  {profileData.email}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                <div className="flex items-center gap-2 text-green-500/80 bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10">
                  <CheckCircle2 size={14} />
                  Verified Student
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Academic Profile Card */}
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Academic Profile</h3>
            </div>
            
            <div className="space-y-6">
              <ProfileInput 
                label="College / University" 
                placeholder="Enter college name" 
                icon={Building2}
                value={profileData.education.collegeName}
                onChange={(val) => updateEducation('collegeName', val)}
              />
              <div className="grid grid-cols-2 gap-4">
                <ProfileInput 
                  label="Branch / Major" 
                  placeholder="CSE, ECE, etc." 
                  value={profileData.education.branch}
                  onChange={(val) => updateEducation('branch', val)}
                />
                <ProfileInput 
                  label="Graduation Year" 
                  placeholder="2025" 
                  value={profileData.education.graduationYear}
                  onChange={(val) => updateEducation('graduationYear', val)}
                />
              </div>
              <ProfileInput 
                label="Assigned Batch" 
                placeholder="Batch name" 
                icon={Hash}
                readOnly
                info="Managed by Admin"
                value={typeof profileData.batchId === 'object' ? (profileData.batchId as any)?.name : profileData.batchId || 'Not Assigned'}
              />
            </div>
          </div>

          {/* Connect & Location Card */}
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-500">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Connect & Location</h3>
            </div>
            
            <div className="space-y-6">
              <ProfileInput 
                label="Phone Number" 
                placeholder="+91 0000000000" 
                icon={Phone}
                value={profileData.phone}
                onChange={(val) => setProfileData({ ...profileData, phone: val })}
              />
              <div className="grid grid-cols-2 gap-4">
                <ProfileInput 
                  label="City" 
                  placeholder="Enter city" 
                  value={profileData.location.city}
                  onChange={(val) => updateLocation('city', val)}
                />
                <ProfileInput 
                  label="Pin Code" 
                  placeholder="440022" 
                  value={profileData.location.pinCode}
                  onChange={(val) => updateLocation('pinCode', val)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ProfileInput 
                  label="State" 
                  placeholder="Enter state" 
                  icon={Briefcase}
                  value={profileData.location.state}
                  onChange={(val) => updateLocation('state', val)}
                />
                <ProfileInput 
                  label="Country" 
                  placeholder="Enter country" 
                  icon={Globe}
                  value={profileData.location.country}
                  onChange={(val) => updateLocation('country', val)}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 pb-12">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(profileData)}
            className="flex items-center gap-3 px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold shadow-[0_10px_30px_rgba(234,88,12,0.3)] transition-all"
          >
            <Save size={18} />
            Save Profile Data
          </motion.button>
        </div>

        <div className="text-center pb-8 border-t border-zinc-900 pt-8">
           <p className="text-[10px] text-zinc-700 font-semibold tracking-widest uppercase">
             © 2026 ProQuiz Master. All rights reserved.
           </p>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
      `}</style>
    </div>
  );
}
