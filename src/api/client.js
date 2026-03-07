const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper for API calls
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  
  // Handle 401 - unauthorized
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  // Handle 429 - rate limit
  if (response.status === 429) {
    const error = await response.json();
    throw new Error(error.message || 'Too many todos');
  }

  // Parse JSON response
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  // For 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Auth API
export const authAPI = {
  register: (email, password) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Todos API
export const todosAPI = {
  getAll: () => fetchAPI('/todos'),

  create: (text) =>
    fetchAPI('/todos', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  update: (id, updates) =>
    fetchAPI(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id) =>
    fetchAPI(`/todos/${id}`, {
      method: 'DELETE',
    }),
};
