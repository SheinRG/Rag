import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Stream a POST request and return a ReadableStream of SSE events.
 */
export async function streamPost(path, body) {
  const token = localStorage.getItem('access_token');
  console.log('Stream post:', path, body);
  
  const response = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  console.log('Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stream request failed: ${response.status} - ${errorText}`);
  }

  return response.body;
}
