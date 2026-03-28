import axios from 'axios';
import { User, Course, Chapter, Quiz, Question, QuizResult, LeaderboardEntry } from '../types';

const instance = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to include the JWT token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await instance.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await instance.post('/auth/register', { name, email, password, role: 'student' });
  return response.data;
};

// Admin - Courses
export const getCourses = async (): Promise<Course[]> => {
  const response = await instance.get('/admin/courses');
  return response.data;
};

export const createCourse = async (title: string, description: string): Promise<Course> => {
  const response = await instance.post('/admin/courses', { title, description });
  return response.data;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await instance.delete(`/admin/courses/${courseId}`);
};

// Admin - Chapters
export const getChapters = async (courseId: string): Promise<Chapter[]> => {
  const response = await instance.get(`/admin/chapters/${courseId}`);
  return response.data;
};

export const createChapter = async (courseId: string, title: string, description: string, order: number = 1): Promise<Chapter> => {
  const response = await instance.post('/admin/chapters', { courseId, title, description, order });
  return response.data;
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
  await instance.delete(`/admin/chapters/${chapterId}`);
};

// Admin - Quizzes
export const getQuizzes = async (chapterId: string): Promise<Quiz[]> => {
  const response = await instance.get(`/admin/quizzes/${chapterId}`);
  return response.data;
};

export const createQuiz = async (chapterId: string, courseId: string, title: string, description: string, passingScore: number, timeLimit: number): Promise<Quiz> => {
  const response = await instance.post('/admin/quizzes', { chapterId, courseId, title, description, passingScore, timeLimit });
  return response.data;
};

export const publishQuiz = async (quizId: string): Promise<void> => {
  await instance.patch(`/admin/quizzes/${quizId}/publish`);
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  await instance.delete(`/admin/quizzes/${quizId}`);
};

// Admin - Questions
export const getQuestions = async (quizId: string): Promise<Question[]> => {
  const response = await instance.get(`/admin/questions/${quizId}`);
  return response.data;
};

export const createQuestion = async (questionData: Partial<Question>): Promise<Question> => {
  const response = await instance.post('/admin/questions', questionData);
  return response.data;
};

export const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<void> => {
  await instance.patch(`/admin/questions/${questionId}`, questionData);
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  await instance.delete(`/admin/questions/${questionId}`);
};

// Admin - Leaderboard
export const getLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
  const response = await instance.get(`/admin/leaderboard/${quizId}`);
  return response.data;
};

// Student - Quiz
export const getAllPublishedQuizzes = async (): Promise<Quiz[]> => {
  const response = await instance.get('/quiz/all');
  return response.data;
};

export const getQuizWithQuestions = async (quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> => {
  const response = await instance.get(`/quiz/${quizId}`);
  return response.data;
};

export const submitQuiz = async (quizId: string, answers: { questionId: string; selectedOptions: number[] }[], timeTaken: number): Promise<QuizResult> => {
  const response = await instance.post('/quiz/submit', { 
    quizId, 
    answers,
    timeTaken 
  });
  return response.data.result;
};

export const getMyResults = async (): Promise<QuizResult[]> => {
  const response = await instance.get('/results/my-results');
  return response.data;
};

export const testConnection = async () => {
  // No-op
};
