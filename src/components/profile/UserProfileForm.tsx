import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  BookOpen, 
  GraduationCap, 
  Building2, 
  Calendar, 
  Save, 
  Loader2, 
  Hash,
  Camera,
  Globe,
  Map,
  ShieldCheck
} from 'lucide-react';
import * as api from '../../services/api';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  collegeName?: string;
  year?: number;
  branch?: string;
  batchId?: any;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    pinCode?: string;
  };
}

export const UserProfileForm: React.FC<{ 
  user: any; 
  onUpdate: (updated: any) => void; 
  pushToast: any;
}> = ({ user, onUpdate, pushToast }) => {
  const [formData, setFormData] = useState<UserProfile>({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    collegeName: user.collegeName || '',
    year: user.year || undefined,
    branch: user.branch || '',
    batchId: user.batchId?._id || user.batchId || '',
    address: {
      city: user.address?.city || '',
      state: user.address?.state || '',
      country: user.address?.country || '',
      pinCode: user.address?.pinCode || ''
    }
  });

  const [batches, setBatches] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const data = await api.getBatches();
      setBatches(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateProfile(formData);
      onUpdate(updated);
      pushToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      pushToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Header Card */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[80px] -mr-32 -mt-32" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 overflow-hidden">
                {user.profilePicture ? (
                   <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-zinc-700" />
                )}
              </div>
              <button 
                type="button"
                className="absolute -bottom-2 -right-2 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-900/40 transition-all active:scale-90"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-4xl font-bold text-white tracking-tight">{user.name}</h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <span className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                  <Mail size={14} className="text-orange-500/50" />
                  {user.email}
                </span>
                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full hidden sm:block" />
                <span className="flex items-center gap-2 text-zinc-500 text-sm font-medium tracking-tight">
                  <ShieldCheck size={14} className="text-emerald-500/50" />
                  Verified Student
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Academic Profile */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <GraduationCap size={20} />
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">Academic Profile</h4>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">College / University</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="text"
                    placeholder="Enter college name"
                    value={formData.collegeName}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">Branch / Major</label>
                  <input
                    type="text"
                    placeholder="CSE, ECE, etc."
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">Graduation Year</label>
                  <input
                    type="number"
                    placeholder="2025"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-zinc-500 tracking-tight">Assigned Batch</label>
                  {user.role !== 'admin' && (
                    <span className="text-[10px] font-bold text-zinc-600">Managed by Admin</span>
                  )}
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <select
                    disabled={user.role !== 'admin'}
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none ${user.role !== 'admin' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <option value="" className="bg-[#1a1a1a]">Select your batch</option>
                    {batches.map(batch => (
                      <option key={batch._id} value={batch._id} className="bg-[#1a1a1a]">{batch.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                <MapPin size={20} />
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">Connect & Location</h4>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="tel"
                    placeholder="+91 0000000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">City</label>
                  <input
                    type="text"
                    placeholder="Nagpur"
                    value={formData.address?.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">Pin Code</label>
                  <input
                    type="text"
                    placeholder="440022"
                    value={formData.address?.pinCode}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pinCode: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">State</label>
                  <div className="relative">
                     <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                     <input
                        type="text"
                        placeholder="Maharashtra"
                        value={formData.address?.state}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-800"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 tracking-tight ml-1">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input
                        type="text"
                        placeholder="India"
                        value={formData.address?.country}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button
            disabled={isSaving}
            type="submit"
            className="px-12 py-5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-[2rem] transition-all flex items-center gap-3 shadow-xl shadow-orange-900/20 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed group tracking-tight"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
            Save Profile Data
          </button>
        </div>
      </form>
    </motion.div>
  );
};
