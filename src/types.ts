export type QuizMode = 'training' | 'test';

export interface User {
  _id: string;
  name: string;
  username?: string;
  profileUrl?: string;
  email: string;
  role: 'admin' | 'student';
  membershipType?: 'enquiry' | 'premium';
  trialDurationDays?: number;
  batchId?: any;
  isBanned?: boolean;
  banReason?: string;
  violationCount?: number;
  createdAt: string;
  
  // Profile fields
  phone?: string;
  dob?: string;
  avatarUrl?: string;
  bio?: string;
  location?: {
    city: string;
    pinCode: string;
    state: string;
    country: string;
  };
  education?: {
    collegeName: string;
    branch: string;
    graduationYear: string;
    degree?: string;
  };
  skills?: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
  };
  socialLinks?: {
    github: string;
    linkedin: string;
    twitter: string;
    others: string;
    resume: string;
  };
  codingProfiles?: {
    leetcode: string;
    hackerrank: string;
    codeforces: string;
    geeksforgeeks: string;
  };
  workExperience?: any[];
  projects?: any[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  type: 'QUIZ' | 'PROGRAMMING';
  chapterCount?: number;
  completedChapterCount?: number;
  quizCount?: number;
  completedQuizCount?: number;
  problemCount?: number;
  completedProblemCount?: number;
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
  problemCount?: number;
  completedProblemCount?: number;
  isCompleted?: boolean;
  problems?: Problem[];
  parentId?: string | any | null;
  subChapters?: Chapter[];
  quizzes?: Quiz[];
}


export interface Problem {
  _id: string;
  chapterId: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  active: boolean;
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
