import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Users, 
  Calendar,
  Save,
  X,
  PlusCircle,
  Hash,
  Info
} from 'lucide-react';
import * as api from '../../services/api';

interface Batch {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const BatchManager: React.FC<{ pushToast: any }> = ({ pushToast }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await api.getBatches();
      setBatches(data);
    } catch (err) {
      pushToast('Failed to fetch batches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingBatch) {
        await api.updateBatch(editingBatch._id, formData);
        pushToast('Batch updated successfully');
      } else {
        await api.createBatch(formData);
        pushToast('Batch created successfully');
      }
      setShowModal(false);
      setEditingBatch(null);
      setFormData({ name: '', description: '' });
      fetchBatches();
    } catch (err: any) {
      pushToast(err.response?.data?.message || 'Failed to save batch', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await api.deleteBatch(id);
      pushToast('Batch deleted successfully');
      fetchBatches();
    } catch (err: any) {
      pushToast(err.response?.data?.message || 'Failed to delete batch', 'error');
    }
  };

  const filtered = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-600"
          />
        </div>
        <button
          onClick={() => {
            setEditingBatch(null);
            setFormData({ name: '', description: '' });
            setShowModal(true);
          }}
          className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 tracking-tight"
        >
          <PlusCircle size={16} />
          Create New Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-white/5 rounded-[2rem] animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((batch) => (
            <motion.div
              layout
              key={batch._id}
              className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] p-6 group hover:border-purple-500/30 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors" />
              
              <div className="flex flex-col h-full gap-4 relative">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
                    <Hash size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingBatch(batch);
                        setFormData({ name: batch.name, description: batch.description });
                        setShowModal(true);
                      }}
                      className="p-2.5 bg-white/5 hover:bg-purple-500/10 text-zinc-500 hover:text-purple-400 rounded-xl transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(batch._id)}
                      className="p-2.5 bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-semibold text-white tracking-tight">{batch.name}</h4>
                  <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
                    {batch.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-semibold tracking-tight">
                    <Calendar size={12} />
                    {new Date(batch.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-zinc-400 text-[10px] font-semibold">
                    <Users size={10} />
                    Active Batch
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
              <Hash size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-zinc-400">No Batches Found</h3>
              <p className="text-zinc-600 text-sm">Create your first batch to start organizing students.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-[3rem] shadow-2xl p-8 sm:p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] -mr-32 -mt-32" />
              
              <div className="relative space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-semibold text-white tracking-tight">
                      {editingBatch ? 'Edit Batch' : 'New Batch'}
                    </h3>
                    <p className="text-zinc-500 text-sm font-medium">Define logical groups for your students.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white rounded-2xl transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 tracking-tight ml-1">Batch Identifier</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Batch 2024-Plus"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 tracking-tight ml-1">Description (Optional)</label>
                    <textarea
                      rows={4}
                      placeholder="Enter details about this batch..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700 resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-zinc-400 font-semibold rounded-2xl transition-all tracking-tight text-[10px]"
                    >
                      Wait, Go Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-2xl transition-all tracking-tight text-[11px] shadow-lg shadow-purple-500/20"
                    >
                      {editingBatch ? 'Save Changes' : 'Create Batch'}
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
