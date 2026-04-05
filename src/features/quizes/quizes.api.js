import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../services/endpoints';

export const getAllPublishedQuizzes = async () => {
  const response = await apiClient.get(ENDPOINTS.QUIZ.ALL);
  return response.data;
};

export const getQuizWithQuestions = async (quizId) => {
  const response = await apiClient.get(ENDPOINTS.QUIZ.BY_ID(quizId));
  return response.data;
};

export const submitQuiz = async (quizId, answers, timeTaken, mode) => {
  const response = await apiClient.post(ENDPOINTS.QUIZ.SUBMIT, { 
    quizId, 
    answers,
    timeTaken,
    mode
  });
  return response.data.result;
};
