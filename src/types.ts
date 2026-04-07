export type QuizMode = 'training' | 'test';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  isBanned?: boolean;
  banReason?: string;
  violationCount?: number;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  chapterCount?: number;
  completedChapterCount?: number;
  quizCount?: number;
  completedQuizCount?: number;
  totalQuestions?: number;
  progress?: number;
}

export interface Chapter {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  quizCount?: number;
  completedQuizCount?: number;
  isCompleted?: boolean;
}

export interface Quiz {
  _id: string;
  chapterId: string;
  courseId: string;
  title: string;
  description: string;
  questionCount: number;
  passingScore: number;
  timeLimit: number; // in minutes
  isPublished: boolean;
  questions: (string | Question)[]; // pool of question IDs or full objects
  isCompleted?: boolean;
}

export interface Option {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  chapterId: string;
  courseId: string;
  quizId?: string; // Optional reference for compatibility
  questionText: string;
  image?: string;
  codeSnippet?: string;
  programmingLanguage?: string;
  explanation?: string;
  options: Option[];
  numberOfCorrectAnswers: number;
  order: number;
}

export interface QuizResult {
  _id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  timeTaken: number; // in seconds
  createdAt: string;
}

export interface LeaderboardEntry {
  userName: string;
  score: number;
  timeTaken: number;
  percentage: number;
  createdAt: string;
}

export interface GlobalLeaderboardEntry {
  resultId: string;
  userName: string;
  userEmail: string;
  quizTitle: string;
  quizId: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  timeTaken: number;
  mode: QuizMode;
  createdAt: string;
}
