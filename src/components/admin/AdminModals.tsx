import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Chapter, Quiz } from '../../types';
import * as api from '../../services/api';

interface AdminModalsProps {
  showAddCourse: boolean;
  setShowAddCourse: (val: boolean) => void;
  newCourseData: { title: string; description: string };
  setNewCourseData: (val: { title: string; description: string }) => void;
  editingCourseData: { courseId: string; title: string, description: string } | null;
  setEditingCourseData: (val: any) => void;
  showAddChapter: boolean;
  setShowAddChapter: (val: boolean) => void;
  newChapterData: { title: string; description: string };
  setNewChapterData: (val: { title: string; description: string }) => void;
  editingChapterData: { chapterId?: string, _id?: string, id?: string, courseId: string, title: string, description: string } | null;
  setEditingChapterData: (val: any) => void;
  showAddQuiz: boolean;
  setShowAddQuiz: (val: boolean) => void;
  newQuizData: any;
  setNewQuizData: (val: any) => void;
  editingQuizData: any;
  setEditingQuizData: (val: any) => void;
  formError: string;
  setFormError: (val: string) => void;
  adminSelectedCourse: Course | null;
  adminSelectedChapter: Chapter | null;
  adminSelectedQuiz: Quiz | null;
  setAdminSelectedCourse: (val: Course | null) => void;
  setAdminSelectedQuiz: (val: Quiz | null) => void;
  fetchInitialData: () => void;
  fetchChaptersForCourse: (id: string) => void;
  fetchQuizzesForChapter: (id: string) => void;
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
  updateToast: (id: number, text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => void;
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  showAddCourse, setShowAddCourse, newCourseData, setNewCourseData,
  editingCourseData, setEditingCourseData,
  showAddChapter, setShowAddChapter, newChapterData, setNewChapterData,
  editingChapterData, setEditingChapterData,
  showAddQuiz, setShowAddQuiz, newQuizData, setNewQuizData,
  editingQuizData, setEditingQuizData,
  formError, setFormError,
  adminSelectedCourse, adminSelectedChapter, adminSelectedQuiz,
  setAdminSelectedCourse, setAdminSelectedQuiz,
  fetchInitialData, fetchChaptersForCourse, fetchQuizzesForChapter,
  pushToast, updateToast
}) => {

  const closeEditQuizModal = () => {
    setEditingQuizData(null);
    setFormError('');
  };

  return (
    <AnimatePresence>
      {/* Add Course Modal */}
      {showAddCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setShowAddCourse(false); setFormError(''); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-xl bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Course</h4>
              <button
                onClick={() => { setShowAddCourse(false); setFormError(''); }}
                className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Course title"
                value={newCourseData.title}
                onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
              <textarea
                placeholder="Course description"
                value={newCourseData.description}
                onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors h-28 resize-none"
              />
            </div>

            {formError && (
              <p className="text-red-400 text-xs font-medium">{formError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!newCourseData.title.trim()) {
                    setFormError('Course title is required');
                    return;
                  }
                  setFormError('');
                  const toastId = pushToast('Creating course...', 'loading', 0);
                  try {
                    await api.createCourse(newCourseData.title.trim(), newCourseData.description.trim());
                    updateToast(toastId, 'Course created successfully', 'success', 2600);
                    setShowAddCourse(false);
                    setNewCourseData({ title: '', description: '' });
                    fetchInitialData();
                  } catch (err: any) {
                    const message = err.response?.data?.message || err.message || 'Failed to create course';
                    setFormError(message);
                    updateToast(toastId, message, 'error', 3400);
                  }
                }}
                className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm"
              >
                Create Course
              </button>
              <button
                onClick={() => { setShowAddCourse(false); setFormError(''); }}
                className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Course Modal */}
      {editingCourseData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setEditingCourseData(null); setFormError(''); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Edit Course</h4>
              <button
                onClick={() => { setEditingCourseData(null); setFormError(''); }}
                className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Course title"
                value={editingCourseData.title}
                onChange={(e) => setEditingCourseData({ ...editingCourseData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <textarea
                placeholder="Course description"
                value={editingCourseData.description}
                onChange={(e) => setEditingCourseData({ ...editingCourseData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none"
              />
            </div>

            {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!editingCourseData.title.trim()) {
                    setFormError('Course title is required');
                    return;
                  }
                  setFormError('');
                  const toastId = pushToast('Updating course...', 'loading', 0);
                  try {
                    const updated = await api.updateCourse(editingCourseData.courseId, {
                      title: editingCourseData.title.trim(),
                      description: editingCourseData.description.trim(),
                    });
                    updateToast(toastId, 'Course updated', 'success', 2500);
                    if (adminSelectedCourse?._id === updated._id) setAdminSelectedCourse(updated);
                    setEditingCourseData(null);
                    fetchInitialData();
                  } catch (err: any) {
                    const message = err.response?.data?.message || err.message || 'Failed to update course';
                    setFormError(message);
                    updateToast(toastId, message, 'error', 3400);
                  }
                }}
                className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
              >
                Save Changes
              </button>
              <button
                onClick={() => { setEditingCourseData(null); setFormError(''); }}
                className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Quiz Modal */}
      {editingQuizData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeEditQuizModal}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Edit Quiz Details</h4>
              <button
                onClick={closeEditQuizModal}
                className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Quiz Title</label>
                <input
                  type="text"
                  value={editingQuizData.title}
                  onChange={(e) => setEditingQuizData({ ...editingQuizData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Description</label>
                <textarea
                  value={editingQuizData.description}
                  onChange={(e) => setEditingQuizData({ ...editingQuizData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">No. of Questions</label>
                <input
                  type="number"
                  min={1}
                  value={editingQuizData.questionCount}
                  onChange={(e) => setEditingQuizData({ ...editingQuizData, questionCount: parseInt(e.target.value || '1', 10) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Duration (mins)</label>
                <input
                  type="number"
                  min={1}
                  value={editingQuizData.timeLimit}
                  onChange={(e) => setEditingQuizData({ ...editingQuizData, timeLimit: parseInt(e.target.value || '1', 10) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Passing %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingQuizData.passingScore}
                  onChange={(e) => setEditingQuizData({ ...editingQuizData, passingScore: parseInt(e.target.value || '0', 10) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!editingQuizData.title.trim()) {
                    setFormError('Quiz title is required');
                    return;
                  }
                  setFormError('');
                  const toastId = pushToast('Updating quiz details...', 'loading', 0);
                  try {
                    const updated = await api.updateQuiz(editingQuizData.quizId, {
                      title: editingQuizData.title.trim(),
                      description: editingQuizData.description.trim(),
                      questionCount: editingQuizData.questionCount,
                      passingScore: editingQuizData.passingScore,
                      timeLimit: editingQuizData.timeLimit,
                    });
                    if (adminSelectedQuiz?._id === updated._id) setAdminSelectedQuiz(updated);
                    await fetchQuizzesForChapter(editingQuizData.chapterId);
                    updateToast(toastId, 'Quiz details updated', 'success', 2600);
                    closeEditQuizModal();
                  } catch (err: any) {
                    const message = err.response?.data?.message || err.message || 'Failed to update quiz details';
                    setFormError(message);
                    updateToast(toastId, message, 'error', 4200);
                  }
                }}
                className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
              >
                Save Changes
              </button>
              <button
                onClick={closeEditQuizModal}
                className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add Chapter Modal */}
      {showAddChapter && adminSelectedCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddChapter(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                {adminSelectedChapter ? `New Sub-folder in ${adminSelectedChapter.title}` : 'New Root Chapter'}
              </h4>
              <button
                onClick={() => setShowAddChapter(false)}
                className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Folder title"
                value={newChapterData.title}
                onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <textarea
                placeholder="Folder description"
                value={newChapterData.description}
                onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none"
              />
            </div>

            {formError && (
              <p className="text-red-400 text-xs font-medium">{formError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!newChapterData.title.trim()) {
                    setFormError('Chapter title is required');
                    return;
                  }
                  setFormError('');
                  const toastId = pushToast('Adding...', 'loading', 0);
                  try {
                    await api.createChapter(
                      adminSelectedCourse._id, 
                      newChapterData.title.trim(), 
                      newChapterData.description.trim(),
                      adminSelectedChapter?._id
                    );
                    updateToast(toastId, 'Added successfully', 'success', 2600);
                    setShowAddChapter(false);
                    setNewChapterData({ title: '', description: '' });
                    fetchChaptersForCourse(adminSelectedCourse._id);
                  } catch (err: any) {
                    const message = err.response?.data?.message || err.message || 'Failed to add chapter';
                    setFormError(message);
                    updateToast(toastId, message, 'error', 3400);
                  }
                }}
                className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
              >
                Create Folder
              </button>

              <button
                onClick={() => setShowAddChapter(false)}
                className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Chapter Modal */}
      {editingChapterData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setEditingChapterData(null); setFormError(''); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Edit Chapter</h4>
              <button
                onClick={() => { setEditingChapterData(null); setFormError(''); }}
                className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Chapter title"
                value={editingChapterData.title}
                onChange={(e) => setEditingChapterData({ ...editingChapterData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <textarea
                placeholder="Chapter description"
                value={editingChapterData.description}
                onChange={(e) => setEditingChapterData({ ...editingChapterData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none"
              />
            </div>

            {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!editingChapterData.title.trim()) {
                    setFormError('Chapter title is required');
                    return;
                  }
                  setFormError('');
                  const toastId = pushToast('Updating chapter...', 'loading', 0);
                  try {
                    const actualId = editingChapterData.chapterId || editingChapterData._id || editingChapterData.id;
                    await api.updateChapter(actualId, {
                      title: editingChapterData.title.trim(),
                      description: editingChapterData.description.trim(),
                    });
                    updateToast(toastId, 'Chapter updated', 'success', 2500);
                    setEditingChapterData(null);
                    fetchChaptersForCourse(editingChapterData.courseId);
                  } catch (err: any) {
                    const message = err.response?.data?.message || err.message || 'Failed to update chapter';
                    setFormError(message);
                    updateToast(toastId, message, 'error', 3400);
                  }
                }}
                className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
              >
                Save Changes
              </button>
              <button
                onClick={() => { setEditingChapterData(null); setFormError(''); }}
                className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
