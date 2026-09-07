const API_BASE_URL = '/api';

/**
 * Standardized API client for all frontend HTTP calls.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('careerpulse_token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  demoLogin: () => apiRequest('/auth/demo-login', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),

  // Profile
  getProfile: () => apiRequest('/profile'),
  updateProfile: (payload) => apiRequest('/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Resume
  uploadResume: (formData) => apiRequest('/resume/upload', { method: 'POST', body: formData }),
  getLatestResume: () => apiRequest('/resume/latest'),
  deleteResume: (id) => apiRequest(`/resume/${id}`, { method: 'DELETE' }),

  // Internships
  getInternships: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/internships${query ? `?${query}` : ''}`);
  },
  getInternship: (id) => apiRequest(`/internships/${id}`),
  getSavedInternships: () => apiRequest('/internships/saved/all'),
  saveInternship: (id, payload) => apiRequest(`/internships/saved/${id}`, { method: 'POST', body: JSON.stringify(payload) }),
  removeSavedInternship: (id) => apiRequest(`/internships/saved/${id}`, { method: 'DELETE' }),

  // Matching & Recommendations
  getRecommendations: () => apiRequest('/matching/recommendations'),
  evaluateMatch: (internshipId) => apiRequest(`/matching/evaluate/${internshipId}`),

  // Mock Interview
  startInterview: (payload) => apiRequest('/interview/start', { method: 'POST', body: JSON.stringify(payload) }),
  submitAnswer: (payload) => apiRequest('/interview/submit-answer', { method: 'POST', body: JSON.stringify(payload) }),
  completeInterview: (sessionId) => apiRequest(`/interview/complete/${sessionId}`, { method: 'POST' }),
  getInterviewSessions: () => apiRequest('/interview/sessions'),
  getSessionTranscript: (sessionId) => apiRequest(`/interview/sessions/${sessionId}`),

  // Career Assistant
  sendChatMessage: (message) => apiRequest('/assistant/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getChatHistory: () => apiRequest('/assistant/history'),
  clearChatHistory: () => apiRequest('/assistant/history', { method: 'DELETE' })
};
