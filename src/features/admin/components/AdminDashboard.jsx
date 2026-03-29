import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronDown, 
  Trophy, 
  Layers, 
  Code, 
  Edit, 
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import * as adminApi from '../admin.api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';

const AdminDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [courseChapters, setCourseChapters] = useState({});
  const [chapterQuizzes, setChapterQuizzes] = useState({});
  const [questions, setQuestions] = useState([]);
  
  const [adminSelectedCourse, setAdminSelectedCourse] = useState(null);
  const [adminSelectedChapter, setAdminSelectedChapter] = useState(null);
  const [adminSelectedQuiz, setAdminSelectedQuiz] = useState(null);
  const [adminView, setAdminView] = useState('hierarchy');
  
  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ title: '', description: '' });
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterData, setNewChapterData] = useState({ title: '', description: '' });
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({ title: '', description: '', passingScore: 70, timeLimit: 15 });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChapters = async (courseId) => {
    try {
      const data = await adminApi.getChapters(courseId);
      setCourseChapters(prev => ({ ...prev, [courseId]: data }));
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const fetchQuizzes = async (chapterId) => {
    try {
      const data = await adminApi.getQuizzes(chapterId);
      setChapterQuizzes(prev => ({ ...prev, [chapterId]: data }));
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const toggleCourse = async (courseId) => {
    const isExpanding = !expandedCourses[courseId];
    setExpandedCourses(prev => ({ ...prev, [courseId]: isExpanding }));
    if (isExpanding && !courseChapters[courseId]) {
      await fetchChapters(courseId);
    }
  };

  const toggleChapter = async (chapterId) => {
    const isExpanding = !expandedChapters[chapterId];
    setExpandedChapters(prev => ({ ...prev, [chapterId]: isExpanding }));
    if (isExpanding && !chapterQuizzes[chapterId]) {
      await fetchQuizzes(chapterId);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseData.title) return;
    try {
      await adminApi.createCourse(newCourseData.title, newCourseData.description);
      setShowAddCourse(false);
      setNewCourseData({ title: '', description: '' });
      fetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await adminApi.deleteCourse(id);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const handleCreateChapter = async () => {
    if (!newChapterData.title || !adminSelectedCourse) return;
    try {
      await adminApi.createChapter(adminSelectedCourse._id, newChapterData.title, newChapterData.description);
      setShowAddChapter(false);
      setNewChapterData({ title: '', description: '' });
      fetchChapters(adminSelectedCourse._id);
    } catch (error) {
      console.error('Failed to create chapter:', error);
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chapter?')) return;
    try {
      await adminApi.deleteChapter(id);
      fetchChapters(adminSelectedCourse._id);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  };

  const handleCreateQuiz = async (chapterId) => {
    if (!newQuizData.title || !adminSelectedCourse) return;
    try {
      await adminApi.createQuiz(
        chapterId, 
        adminSelectedCourse._id, 
        newQuizData.title, 
        newQuizData.description, 
        newQuizData.passingScore, 
        newQuizData.timeLimit
      );
      setShowAddQuiz(false);
      setNewQuizData({ title: '', description: '', passingScore: 70, timeLimit: 15 });
      fetchQuizzes(chapterId);
    } catch (error) {
      console.error('Failed to create quiz:', error);
    }
  };

  const handleDeleteQuiz = async (quizId, chapterId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await adminApi.deleteQuiz(quizId);
      fetchQuizzes(chapterId);
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  const handleManageQuestions = async (quiz) => {
    setAdminSelectedQuiz(quiz);
    setAdminView('questions');
    try {
      const data = await adminApi.getQuestions(quiz._id);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            {adminView === 'hierarchy' ? 'Admin Dashboard' : 'Question Management'}
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
            {adminView === 'hierarchy' 
              ? 'Manage your courses, chapters, and quizzes.' 
              : `Editing questions for ${adminSelectedQuiz?.title}`}
          </p>
        </div>
        {adminView === 'questions' && (
          <Button 
            variant="secondary" 
            onClick={() => setAdminView('hierarchy')}
            icon={ChevronLeft}
          >
            Back to Hierarchy
          </Button>
        )}
      </div>

      {adminView === 'hierarchy' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div 
                key={course._id} 
                className={`bg-[#1a1a1a] border rounded-3xl transition-all relative overflow-hidden group ${adminSelectedCourse?._id === course._id ? 'border-orange-500/50 ring-4 ring-orange-500/10' : 'border-white/5 hover:border-white/10'}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                <div className="p-8 space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Code size={24} />
                    </div>
                    <button 
                      onClick={() => handleDeleteCourse(course._id)}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold text-white">{course.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setAdminSelectedCourse(course);
                      toggleCourse(course._id);
                    }}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${adminSelectedCourse?._id === course._id ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    {adminSelectedCourse?._id === course._id ? 'Hide Chapters' : 'View Chapters'}
                    <ChevronDown size={16} className={`transition-transform ${expandedCourses[course._id] ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
            
            {showAddCourse ? (
              <Card className="border-orange-500/30 space-y-4" hover={false}>
                <h4 className="text-xl font-bold text-white">Add New Course</h4>
                <div className="space-y-4">
                  <Input 
                    placeholder="Course Title"
                    value={newCourseData.title}
                    onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                  />
                  <textarea 
                    placeholder="Course Description"
                    value={newCourseData.description}
                    onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors h-24 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCreateCourse} className="flex-1">Create Course</Button>
                  <Button variant="secondary" onClick={() => setShowAddCourse(false)}>Cancel</Button>
                </div>
              </Card>
            ) : (
              <button
                onClick={() => setShowAddCourse(true)}
                className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[250px] group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span className="font-bold">Add New Course</span>
              </button>
            )}
          </div>

          {adminSelectedCourse && expandedCourses[adminSelectedCourse._id] && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5"></div>
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Layers className="text-blue-500" size={20} />
                  Chapters in {adminSelectedCourse.title}
                </h3>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courseChapters[adminSelectedCourse._id]?.map((chapter) => (
                  <div key={chapter._id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden group/chapter hover:border-blue-500/30 transition-all">
                    <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover/chapter:scale-110 transition-transform">
                            <Layers size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xl font-bold text-white">{chapter.title}</h4>
                            <p className="text-xs text-gray-500">Chapter</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteChapter(chapter._id)}
                          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => {
                          setAdminSelectedChapter(chapter);
                          toggleChapter(chapter._id);
                        }}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${adminSelectedChapter?._id === chapter._id ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      >
                        {adminSelectedChapter?._id === chapter._id ? 'Hide Quizzes' : 'View Quizzes'}
                        <ChevronDown size={16} className={`transition-transform ${expandedChapters[chapter._id] ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {expandedChapters[chapter._id] && adminSelectedChapter?._id === chapter._id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-3 pt-4"
                          >
                            {chapterQuizzes[chapter._id]?.map((quiz) => (
                                <div 
                                  key={quiz._id} 
                                  onClick={() => handleManageQuestions(quiz)}
                                  className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl group/quiz cursor-pointer hover:border-orange-500/30 hover:bg-white/[0.08] transition-all"
                                >
                                  <div className="w-8 h-8 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
                                    <Trophy size={14} />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                      {quiz.title}
                                    </p>
                                    <p className="text-[10px] text-gray-500">{quiz.timeLimit} mins • {quiz.passingScore}% to pass</p>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteQuiz(quiz._id, chapter._id);
                                    }}
                                    className="p-2 bg-white/5 text-gray-500 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover/quiz:opacity-100"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                            ))}
                            {showAddQuiz ? (
                              <div className="bg-white/5 border border-orange-500/30 rounded-xl p-4 space-y-3 mt-3">
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Add New Quiz</h4>
                                <div className="space-y-3">
                                  <Input 
                                    placeholder="Quiz Title"
                                    value={newQuizData.title}
                                    onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                                    className="text-xs"
                                  />
                                  <textarea 
                                    placeholder="Quiz Description"
                                    value={newQuizData.description}
                                    onChange={(e) => setNewQuizData({ ...newQuizData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-xs h-16 resize-none"
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] text-gray-500 uppercase">Time (mins)</label>
                                      <input 
                                        type="number" 
                                        value={newQuizData.timeLimit}
                                        onChange={(e) => setNewQuizData({ ...newQuizData, timeLimit: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] text-gray-500 uppercase">Pass %</label>
                                      <input 
                                        type="number" 
                                        value={newQuizData.passingScore}
                                        onChange={(e) => setNewQuizData({ ...newQuizData, passingScore: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={() => handleCreateQuiz(chapter._id)} className="flex-1 py-2 text-[10px]">Create</Button>
                                  <Button variant="secondary" onClick={() => setShowAddQuiz(false)} className="px-3 py-2 text-[10px]">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAddQuiz(true)}
                                className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                              >
                                <Plus size={14} />
                                Add New Quiz
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
                
                {showAddChapter ? (
                  <Card className="border-blue-500/30 space-y-4" hover={false}>
                    <h4 className="text-lg font-bold text-white">Add New Chapter</h4>
                    <div className="space-y-4">
                      <Input 
                        placeholder="Chapter Title"
                        value={newChapterData.title}
                        onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                      />
                      <textarea 
                        placeholder="Chapter Description"
                        value={newChapterData.description}
                        onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleCreateChapter} className="flex-1">Create Chapter</Button>
                      <Button variant="secondary" onClick={() => setShowAddChapter(false)}>Cancel</Button>
                    </div>
                  </Card>
                ) : (
                  <button
                    onClick={() => setShowAddChapter(true)}
                    className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-2xl p-6 flex items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[100px] group"
                  >
                    <Plus size={20} />
                    <span className="font-bold">Add New Chapter</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          <QuestionForm 
            quizId={adminSelectedQuiz._id}
            editingQuestionId={editingQuestionId}
            onSuccess={() => {
              setEditingQuestionId(null);
              handleManageQuestions(adminSelectedQuiz);
            }}
            onCancel={() => setEditingQuestionId(null)}
            initialData={editingQuestionId ? questions.find(q => q._id === editingQuestionId) : null}
          />
          <QuestionList 
            questions={questions}
            onEdit={(q) => {
              setEditingQuestionId(q._id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={async (id) => {
              if (confirm('Are you sure you want to delete this question?')) {
                await adminApi.deleteQuestion(id);
                handleManageQuestions(adminSelectedQuiz);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
