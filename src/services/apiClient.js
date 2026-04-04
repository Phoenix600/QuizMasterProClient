import axios from 'axios';
import API_BASE_URL from '../api';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Attach JWT token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
