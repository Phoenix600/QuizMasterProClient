import { ApiResponse, CodeDraft, Problem, Submission, TestCase } from '../types.ts';

export const SPRING_API_URL = import.meta.env.VITE_SPRING_API_URL || 'http://localhost:8080';
export const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5001/api';

const pendingRequests = new Map<string, Promise<any>>();

async function fetchApi<T>(endpoint: string, options?: RequestInit, baseUrl = SPRING_API_URL): Promise<T> {
  const token = localStorage.getItem('token');
  const method = options?.method || 'GET';
  const requestKey = `${method}:${baseUrl}${endpoint}`;

  // Security Guard: Prevent "undefined" URL segments from leaking to the server
  if (!endpoint || endpoint.includes('undefined') || endpoint.includes('null')) {
    console.warn('Blocked malformed API request to:', endpoint);
    return Promise.reject(new Error(`Security: Malformed API endpoint detected: ${endpoint}`));
  }

  // Deduplicate concurrent GET requests to same endpoint
  if (method === 'GET' && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error (${response.status})`);
      }

      const result: any = await response.json();

      // Standard format { success: boolean, data: T, message?: string }
      if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
        if (!result.success) {
          throw new Error(result.message || 'API request failed');
        }
        return result.data;
      }

      return result as T;
    } catch (err) {
      if (baseUrl === SPRING_API_URL && (err as any).name !== 'AbortError') {
        throw new Error('EXECUTION_ENGINE_OFFLINE');
      }
      throw err;
    } finally {
      // Small timeout before removing from pending to handle rapid-fire React renders
      setTimeout(() => pendingRequests.delete(requestKey), 2000);
    }
  })();

  if (method === 'GET') {
    pendingRequests.set(requestKey, fetchPromise);
  }

  return fetchPromise;
}

export const api = {
  // Problems (Source: Node.js)
  getProblems: (page = 0, size = 20, filters?: { chapterId?: string | number, courseId?: string | number }) => {
    let url = `/problems?page=${page}&size=${size}`;
    if (filters?.chapterId) url += `&chapterId=${filters.chapterId}`;
    if (filters?.courseId) url += `&courseId=${filters.courseId}`;
    return fetchApi<any>(url, {}, NODE_API_URL);
  },

  getProblem: (id: number | string) => {
    if (!id || id === 'undefined') return Promise.resolve(null as any);
    return fetchApi<Problem>(`/problems/${id}`, {}, NODE_API_URL);
  },

  getSampleTestCases: (id: number | string) =>
    fetchApi<TestCase[]>(`/problems/${id}/testcases`, {}, NODE_API_URL),

  getAllTestCases: (id: number | string) =>
    fetchApi<TestCase[]>(`/problems/${id}/testcases/all`, {}, NODE_API_URL),

  // Curriculum (Source: Node.js)
  getCourses: (type?: string) => fetchApi<any[]>(`/courses${type ? `?type=${type}` : ''}`, {}, NODE_API_URL),
  getChapters: (courseId: number | string) => fetchApi<any[]>(`/chapters/${courseId}`, {}, NODE_API_URL),

  // Submissions (Source: Spring Boot)
  submitCode: (problemId: string, sourceCode: string, language: string, testCases: TestCase[], driverCode: string) =>
    fetchApi<Submission>(`/submit`, {
      method: 'POST',
      body: JSON.stringify({ problemId, sourceCode, language, testCases, driverCode }),
    }, SPRING_API_URL),

  runCode: (problemId: string, sourceCode: string, language: string, testCases: TestCase[], driverCode: string) =>
    fetchApi<any>(`/submit/run`, {
      method: 'POST',
      body: JSON.stringify({ problemId, sourceCode, language, testCases, driverCode }),
    }, SPRING_API_URL),

  getSubmission: (id: number | string) =>
    fetchApi<Submission>(`/submit/${id}`, {}, SPRING_API_URL),

  getProblemSubmissions: (problemId: string, page = 0, size = 20) =>
    fetchApi<any>(`/submit/problem/${problemId}?page=${page}&size=${size}&sort=submittedAt,desc`, {}, SPRING_API_URL),

  deleteSubmission: (id: number | string) =>
    fetchApi<string>(`/submit/${id}`, { method: 'DELETE' }, SPRING_API_URL),

  getSolvedProblems: () =>
    fetchApi<string[]>(`/submit/solved`, {}, SPRING_API_URL),

  getSolvedFromNode: () =>
    fetchApi<string[]>(`/submissions/solved`, {}, NODE_API_URL),

  getResumeProblemId: () =>
    fetchApi<string | null>(`/problems/resume/last`, {}, NODE_API_URL), // Changed to Node.js

  trackProgress: (problemId: string) => {
    if (!problemId || problemId === 'undefined') return Promise.resolve(null);
    return fetchApi<any>(`/problems/${problemId}/track`, { method: 'POST' }, NODE_API_URL);
  },

  saveSubmissionToNode: (data: any) =>
    fetchApi<any>(`/submissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, NODE_API_URL),

  // Drafts (Source: Spring Boot)
  getDraft: (userId: string, problemId: string) =>
    fetchApi<CodeDraft>(`/drafts/${problemId}?userId=${userId}`, {}, SPRING_API_URL),

  saveDraft: (userId: string, problemId: string, code: string, language: string) =>
    fetchApi<CodeDraft>(`/drafts`, {
      method: 'POST',
      body: JSON.stringify({ userId, problemId, code, language }),
    }, SPRING_API_URL),

  // Admin (Target: Node.js)
  admin: {
    createCourse: (title: string, description: string, imageUrl?: string, type: string = 'PROGRAMMING') =>
      fetchApi<any>('/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title, description, imageUrl, type }),
      }, NODE_API_URL),
    createChapter: (courseId: number | string, title: string, orderIndex: number, parentId: string | null = null, description: string = '') =>
      fetchApi<any>(`/admin/chapters`, {
        method: 'POST',
        body: JSON.stringify({ courseId, title, orderIndex, parentId, description }),
      }, NODE_API_URL),
    deleteChapter: (id: string | number) => {
      if (!id || String(id) === 'undefined') return Promise.reject(new Error('Invalid chapter ID'));
      return fetchApi<void>(`/admin/chapters/${id}`, { method: 'DELETE' }, NODE_API_URL);
    },
    updateChapter: (id: string | number, data: { title?: string, description?: string, order?: number, parentId?: string | null }) => {
      if (!id || String(id) === 'undefined') return Promise.reject(new Error('Invalid chapter ID'));
      return fetchApi<any>(`/admin/chapters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, NODE_API_URL);
    },
    bulkUpdateChapters: (chapters: { _id: string, order: number }[]) =>
      fetchApi<any>(`/admin/chapters/bulk/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ chapters }),
      }, NODE_API_URL),
    createProblem: (request: any) =>
      fetchApi<Problem>('/admin/problems', {
        method: 'POST',
        body: JSON.stringify(request),
      }, NODE_API_URL),
    updateProblem: (id: number | string, request: any) =>
      fetchApi<Problem>(`/admin/problems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }, NODE_API_URL),
    addTestCases: (problemId: number | string, requests: any[]) =>
      fetchApi<string>(`/admin/problems/${problemId}/testcases`, {
        method: 'POST',
        body: JSON.stringify(requests),
      }, NODE_API_URL),
    getAllTestCases: (id: number | string) =>
      fetchApi<TestCase[]>(`/problems/${id}/testcases/all`, {}, NODE_API_URL),
    deleteProblem: (id: number | string) => {
      if (!id || String(id) === 'undefined') return Promise.reject(new Error('Invalid problem ID'));
      return fetchApi<void>(`/admin/problems/${id}`, { method: 'DELETE' }, NODE_API_URL);
    },

    // Quiz Admin
    createQuiz: (request: any) =>
      fetchApi<any>('/admin/quizzes', {
        method: 'POST',
        body: JSON.stringify(request),
      }, NODE_API_URL),

    getChapterQuizzes: (chapterId: string) =>
      fetchApi<any[]>(`/admin/quizzes/${chapterId}`, {}, NODE_API_URL),

    getCourseQuestions: (courseId: string) =>
      fetchApi<any[]>(`/admin/questions/course/${courseId}`, {}, NODE_API_URL),

    getQuestions: (chapterId: string) =>
      fetchApi<any[]>(`/admin/questions/${chapterId}`, {}, NODE_API_URL),

    deleteQuiz: (id: string) => {
      if (!id || String(id) === 'undefined') return Promise.reject(new Error('Invalid quiz ID'));
      return fetchApi<void>(`/admin/quizzes/${id}`, { method: 'DELETE' }, NODE_API_URL);
    },

    uploadImage: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${NODE_API_URL}/admin/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result: ApiResponse<string> = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    }
  },

  // Contests
  getContests: () => fetchApi<any[]>('/admin/contests', {}, NODE_API_URL),
  getContest: (id: string) => fetchApi<any>(`/contests/${id}`, {}, NODE_API_URL),
  submitContest: (id: string, data: { answers: any, codingSubmissions: any[], finalCodes?: any, violations: any[], startTime: string | Date }) =>
    fetchApi<any>(`/contests/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, NODE_API_URL),
  createContest: (data: any) => fetchApi<any>('/admin/contests', { method: 'POST', body: JSON.stringify(data) }, NODE_API_URL),
  updateContest: (id: string, data: any) => fetchApi<any>(`/admin/contests/${id}`, { method: 'PUT', body: JSON.stringify(data) }, NODE_API_URL),
  deleteContest: (id: string) => fetchApi<void>(`/admin/contests/${id}`, { method: 'DELETE' }, NODE_API_URL)
};
