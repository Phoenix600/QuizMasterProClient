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

// Global error handling for 401 / 403 (Banned)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      const isLoginRequest = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/google');
      
      if (!isLoginRequest) {
        // Clear session and reload for active sessions only
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
