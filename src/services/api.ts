import axios from 'axios';
import { User, Course, Chapter, Quiz, Question, QuizResult, LeaderboardEntry } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// Admin - Courses
export const getCourses = async (): Promise<Course[]> => {
  const response = await api.get('/admin/courses');
  return response.data;
};

export const createCourse = async (courseName: string, description: string): Promise<Course> => {
  const response = await api.post('/admin/courses', { courseName, description });
  return response.data;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await api.delete(`/admin/courses/${courseId}`);
};

export const updateCourse = async (courseId: string, courseName: string, description: string): Promise<Course> => {
  const response = await api.put(`/admin/courses/${courseId}`, { courseName, description });
  return response.data;
};

// Admin - Chapters
export const getChapters = async (courseId: string): Promise<Chapter[]> => {
  const response = await api.get(`/admin/chapters/${courseId}`);
  return response.data;
};

export const createChapter = async (courseId: string, chapterName: string, description: string): Promise<Chapter> => {
  const response = await api.post('/admin/chapters', { courseId, chapterName, description });
  return response.data;
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
  await api.delete(`/admin/chapters/${chapterId}`);
};

export const updateChapter = async (chapterId: string, chapterName: string, description: string): Promise<Chapter> => {
  const response = await api.put(`/admin/chapters/${chapterId}`, { chapterName, description });
  return response.data;
};

// Admin - Quizzes
export const getQuizzes = async (chapterId: string): Promise<Quiz[]> => {
  const response = await api.get(`/admin/quizzes/${chapterId}`);
  return response.data;
};

export const createQuiz = async (chapterId: string, quizTitle: string, description: string, passingScore: number, timeLimit: number): Promise<Quiz> => {
  const response = await api.post('/admin/quizzes', { chapterId, quizTitle, description, passingScore, timeLimit });
  return response.data;
};

export const publishQuiz = async (quizId: string): Promise<Quiz> => {
  const response = await api.patch(`/admin/quizzes/${quizId}/publish`);
  return response.data;
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  await api.delete(`/admin/quizzes/${quizId}`);
};

export const updateQuiz = async (quizId: string, quizTitle: string, description: string, passingScore: number, timeLimit: number): Promise<Quiz> => {
  const response = await api.put(`/admin/quizzes/${quizId}`, { quizTitle, description, passingScore, timeLimit });
  return response.data;
};

// Admin - Questions
export const getQuestions = async (quizId: string): Promise<Question[]> => {
  const response = await api.get(`/admin/questions/${quizId}`);
  return response.data;
};

export const createQuestion = async (questionData: Partial<Question>): Promise<Question> => {
  const response = await api.post('/admin/questions', questionData);
  return response.data;
};

export const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<Question> => {
  const response = await api.patch(`/admin/questions/${questionId}`, questionData);
  return response.data;
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  await api.delete(`/admin/questions/${questionId}`);
};

// Admin - Leaderboard
export const getLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
  const response = await api.get(`/admin/leaderboard/${quizId}`);
  return response.data;
};

// Student - Quiz
export const getAllPublishedQuizzes = async (): Promise<Quiz[]> => {
  const response = await api.get('/quiz/all');
  return response.data;
};

export const getQuizWithQuestions = async (quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> => {
  const response = await api.get(`/quiz/${quizId}`);
  return response.data;
};

export const submitQuiz = async (quizId: string, answers: { questionId: string; selectedOptions: number[] }[], timeTaken: number): Promise<QuizResult> => {
  const response = await api.post('/quiz/submit', { quizId, answers, timeTaken });
  return response.data;
};

// Student - Results
export const getMyResults = async (): Promise<QuizResult[]> => {
  const response = await api.get('/results/my-results');
  return response.data;
};

export const getResultDetails = async (resultId: string): Promise<QuizResult> => {
  const response = await api.get(`/results/${resultId}`);
  return response.data;
};

export default api;
