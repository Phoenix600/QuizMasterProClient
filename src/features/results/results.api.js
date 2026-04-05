import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../services/endpoints';

export const getMyResults = async () => {
  const response = await apiClient.get(ENDPOINTS.RESULTS.MY_RESULTS);
  return response.data;
};

export const getMyStats = async () => {
  const response = await apiClient.get('/results/stats');
  return response.data;
};
