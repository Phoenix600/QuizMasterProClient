import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  MapPin, 
  Phone, 
  Hash, 
  Edit, 
  X, 
  Filter,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2
} from 'lucide-react';
import * as api from '../../services/api';

export const UserManager: React.FC<{ pushToast: any }> = ({ pushToast }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [batchFilter, setBatchFilter] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [batchFilter]);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.getUsers(p, 10, search, batchFilter);
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err) {
      console.error(err);
      pushToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const data = await api.getBatches();
      setBatches(data);
    } catch (err) { console.error(err); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Create admin user update API
      await api.adminUpdateUser(selectedUser._id, selectedUser);
      pushToast('User updated successfully', 'success');
      setShowEditModal(false);
      fetchUsers(page);
    } catch (err: any) {
      pushToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h3 className="text-3xl font-semibold text-white tracking-tight">User Directory</h3>
          <p className="text-zinc-500 text-sm font-medium">Manage student accounts and assignments.</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <select
                value={batchFilter}
                onChange={(e) => {
                  setBatchFilter(e.target.value);
                  // Immediate fetch on filter change
                }}
                className="bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-3.5 text-xs font-semibold text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer min-w-[160px] shadow-inner"
              >
                <option value="" className="bg-[#1a1a1a]">All Batches</option>
                <option value="none" className="bg-[#1a1a1a]">No Batch</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id} className="bg-[#1a1a1a]">{b.name}</option>
                ))}
              </select>

              <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/search:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                className="bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all w-80 shadow-inner group-focus-within/search:bg-white/[0.04]"
              />
              </div>
            </div>
            <button
               onClick={() => fetchUsers(1)}
               className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-2xl transition-all"
            >
               <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-1 overflow-hidden">
        <table className="w-full border-separate border-spacing-y-2 px-4">
          <thead>
            <tr className="text-left border-b border-white/5">
              <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 tracking-tight pl-20">Student</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 tracking-tight">Affiliation</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 tracking-tight">Batch</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 tracking-tight">Status</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 tracking-tight">Contact</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 tracking-tight text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="group hover:bg-white/[0.02] transition-colors relative">
                <td className="px-6 py-4 bg-white/[0.01] rounded-l-3xl border-l border-t border-b border-white/[0.03]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 font-semibold">
                       {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover rounded-xl" /> : u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold text-zinc-200 group-hover:text-white transition-all truncate">{u.name}</span>
                      <span className="text-[10px] text-zinc-600 font-medium tracking-tight truncate">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 bg-white/[0.01] border-t border-b border-white/[0.03]">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-400">{u.collegeName || 'Not Set'}</span>
                    <span className="text-[10px] text-gray-600 font-semibold tracking-wide">{u.branch || 'General'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 bg-white/[0.01] border-t border-b border-white/[0.03]">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide ${u.batchId ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-500'}`}>
                    {(batches.find(b => b._id === (u.batchId?._id || u.batchId))?.name) || 'No Batch'}
                  </span>
                </td>
                <td className="px-6 py-4 bg-white/[0.01] border-t border-b border-white/[0.03]">
                   <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide text-center ${u.membershipType === 'premium' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                        {u.membershipType || 'enquiry'}
                      </span>
                      {u.membershipType !== 'premium' && (
                        <span className="text-[8px] font-semibold text-gray-600 text-center tracking-tight">
                          Trial Days: {Math.max(0, (u.trialDurationDays || 10) - Math.floor((new Date().getTime() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} Left
                        </span>
                      )}
                   </div>
                </td>
                <td className="px-6 py-4 bg-white/[0.01] border-t border-b border-white/[0.03]">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-400">{u.phone || 'No Phone'}</span>
                    <span className="text-[9px] text-gray-600 truncate max-w-[120px]">{u.address?.city || 'No Address'}</span>
                  </div>
                </td>
                <td className="px-5 py-4 bg-white/[0.01] rounded-r-3xl border-r border-t border-b border-white/[0.03] text-right pr-6">
                  <button 
                    onClick={() => {
                        const batchVal = u.batchId?._id || u.batchId || null;
                        setSelectedUser({ ...u, address: u.address || {}, batchId: batchVal === 'No Batch' ? null : batchVal });
                        setShowEditModal(true);
                    }}
                    className="p-2.5 bg-white/5 hover:bg-orange-500/10 text-zinc-500 hover:text-orange-400 rounded-xl transition-all"
                  >
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-8 border-t border-white/5 bg-black/20">
            <p className="text-gray-500 text-xs font-semibold tracking-wide">
              Total <span className="text-white">{users.length}</span> Members Loaded
            </p>
            <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => fetchUsers(page - 1)}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:text-white transition-all disabled:opacity-10 hover:bg-orange-500"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-6 py-2 text-[11px] font-semibold text-gray-500 tracking-wide">
                 {page} <span className="mx-2 opacity-30">/</span> {totalPages}
              </div>
              <button
                onClick={() => fetchUsers(page + 1)}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:text-white transition-all disabled:opacity-10 hover:bg-orange-500"
              >
                <ChevronRight size={18} />
              </button>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-[3rem] shadow-2xl p-10 lg:p-16 overflow-hidden max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
              
              <div className="relative space-y-12">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                         <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                             <User size={32} />
                         </div>
                         <div>
                            <h3 className="text-4xl font-semibold text-white tracking-tight">{selectedUser.name}</h3>
                            <p className="text-zinc-500 text-sm font-medium">Administrative Modification Panel</p>
                         </div>
                    </div>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-3 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white rounded-2xl transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Section 1 */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-semibold text-orange-500 tracking-wide border-b border-orange-500/20 pb-2">Institutional Details</h4>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">College Name</label>
                                <input
                                    type="text"
                                    value={selectedUser.collegeName || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, collegeName: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Branch</label>
                                    <input
                                        type="text"
                                        value={selectedUser.branch || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, branch: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Year</label>
                                    <input
                                        type="number"
                                        value={selectedUser.year || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, year: parseInt(e.target.value) || '' })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Assign Batch</label>
                                <select
                                    value={selectedUser.batchId}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, batchId: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-[#111]">No Batch</option>
                                    {batches.map(b => (
                                        <option key={b._id} value={b._id} className="bg-[#111]">{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Membership Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser({ ...selectedUser, membershipType: 'enquiry' })}
                                        className={`py-3 rounded-xl text-[10px] font-semibold tracking-wide border transition-all ${selectedUser.membershipType === 'enquiry' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-white/5 border-transparent text-gray-500 hover:text-gray-400'}`}
                                    >
                                        Enquiry
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser({ ...selectedUser, membershipType: 'premium' })}
                                        className={`py-3 rounded-xl text-[10px] font-semibold tracking-wide border transition-all ${selectedUser.membershipType === 'premium' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-transparent text-gray-500 hover:text-gray-400'}`}
                                    >
                                        Premium
                                    </button>
                                </div>
                            </div>

                            {selectedUser.membershipType === 'enquiry' && (
                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Trial Access Duration</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={selectedUser.trialDurationDays || 10}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, trialDurationDays: parseInt(e.target.value) || 0 })}
                                            className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500/50 transition-all font-semibold text-center"
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedUser({ ...selectedUser, trialDurationDays: (selectedUser.trialDurationDays || 10) + 1 })}
                                                className="w-12 py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-2xl text-sm font-semibold transition-all active:scale-90"
                                            >
                                                +1
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedUser({ ...selectedUser, trialDurationDays: Math.max(0, (selectedUser.trialDurationDays || 10) - 1) })}
                                                className="w-12 py-4 bg-white/5 hover:bg-white/10 text-zinc-500 border border-white/5 rounded-2xl text-sm font-semibold transition-all active:scale-90"
                                            >
                                                -1
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                        <p className="text-[10px] text-amber-500/80 font-medium leading-relaxed">
                                            Student will have access for <span className="text-amber-400 font-semibold">{selectedUser.trialDurationDays || 10} days</span> from account creation date and will be restricted thereafter unless upgraded to Premium.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2 */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-semibold text-purple-500 tracking-wide border-b border-purple-500/20 pb-2">Contact & Personal</h4>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={selectedUser.phone || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">City</label>
                                    <input
                                        type="text"
                                        value={selectedUser.address?.city || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, address: { ...selectedUser.address, city: e.target.value } })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Pin Code</label>
                                    <input
                                        type="text"
                                        value={selectedUser.address?.pinCode || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, address: { ...selectedUser.address, pinCode: e.target.value } })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">State</label>
                                    <input
                                        type="text"
                                        value={selectedUser.address?.state || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, address: { ...selectedUser.address, state: e.target.value } })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-zinc-600 tracking-wide ml-1">Country</label>
                                    <input
                                        type="text"
                                        value={selectedUser.address?.country || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, address: { ...selectedUser.address, country: e.target.value } })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-zinc-500 font-semibold rounded-[1.5rem] transition-all tracking-wide text-[11px]"
                    >
                      Wait, Go Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-[1.5rem] transition-all tracking-wide text-[11px] shadow-xl shadow-orange-500/20"
                    >
                      {isUpdating ? 'Applying Hooks...' : 'Commit Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
