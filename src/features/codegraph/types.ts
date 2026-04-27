export interface Project {
  id: string;
  title: string;
  role: string;
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  highlights: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  mode: string;
  role: string;
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  description: string;
}

export interface UserProfile {
  name: string;
  username?: string;
  profileUrl?: string;
  email: string;
  phone?: string;
  dob?: string;
  location: {
    city: string;
    pinCode: string;
    state: string;
    country: string;
  };
  avatarUrl: string;
  profilePicture?: string;
  bio: string;
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
  };
  education: {
    collegeName: string;
    branch: string;
    graduationYear: string;
    degree?: string;
    currentRole?: string;
  };
  socialLinks: {
    github: string;
    linkedin: string;
    twitter: string;
    others: string;
    resume: string;
  };
  codingProfiles: {
    leetcode: string;
    hackerrank: string;
    codeforces: string;
    geeksforgeeks: string;
    others: string;
  };
  workExperience: WorkExperience[];
  projects: Project[];
  streak?: number;
  batchId?: string | { name: string };
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export interface Tag {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  problems: Problem[];
  quizzes?: any[];
  contests?: any[];
  subChapters?: Chapter[];
  courseId?: string;
  parentId?: string | any | null;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: Tag[];
  timeLimitMs: number;
  memoryLimitMb: number;
  driverCode: string;
  solutionTemplate: string;
  editorialVideoUrl?: string;
  editorialPdfUrl?: string;
  quizQuestion?: string;
  quizOptions?: string;
  quizCorrectAnswer?: string;
  footer?: string;
  image?: string;
  imageScale?: number;
  active: boolean;
  chapterId?: string | any;
  testCases?: TestCase[];
  editorialSolutions?: EditorialSolution[];
}

export type SolutionType = 'BRUTE' | 'BETTER' | 'OPTIMAL';

export interface EditorialSolution {
  type: SolutionType;
  title?: string;
  videoUrl?: string;
  pdfUrl?: string;
  intuition?: string;
  approach?: string;
  complexity?: {
    time?: string;
    space?: string;
  };
  implementations?: {
    language: string;
    code: string;
  }[];
}

export type SubmissionStatus = 'PENDING' | 'QUEUED' | 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED';

export interface Submission {
  id: string;
  problemId: string;
  sourceCode: string;
  language: string;
  status: SubmissionStatus;
  executionTimeMs?: number;
  memoryKb?: number;
  memoryUsageKb?: number;
  compileError?: string;
  runtimeError?: string;
  failedInput?: string;
  expectedOutput?: string;
  actualOutput?: string;
  failedTestCaseImage?: string;
  failedTestCaseExplanation?: string;
  failedTestCaseImageScale?: number;
  passedTestCases: number;
  totalTestCases: number;
  submittedAt: string;
  isRun?: boolean;
  results?: TestCaseRunResult[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  explanation?: string;
  image?: string;
  imageScale?: number;
  problemId: string;
}

export interface TestCaseRunResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  memoryKb: number;
  error?: string;
}

export interface RunResult {
  compiled: boolean;
  compileError?: string;
  results: TestCaseRunResult[];
  status: string;
  passedTestCases?: number;
  totalTestCases?: number;
  executionTimeMs?: number;
  memoryKb?: number;
}

export interface CodeDraft {
  id: string;
  userId: string;
  problemId: string;
  code: string;
  sourceCode?: string;
  language: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
