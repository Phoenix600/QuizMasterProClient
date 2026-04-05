import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../services/endpoints';

export const login = async (email, password) => {
  const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, { name, email, password, role: 'student' });
  return response.data;
};

export const googleLogin = async (idToken) => {
  const response = await apiClient.post('/auth/google', { idToken });
  return response.data;
};
