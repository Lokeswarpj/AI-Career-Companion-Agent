const API_BASE_URL = '/api';

/**
 * High-performance client-side response cache with TTL & smart invalidation.
 * Prevents UI freezes, layout thrashing, and redundant network requests on tab navigation.
 */
const apiCache = new Map();
const DEFAULT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export function clearApiCache(prefix = null) {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(prefix)) {
      apiCache.delete(key);
    }
  }
}

/**
 * Standardized API client for all frontend HTTP calls.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('careerpulse_token');
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Cache check for GET requests
  const cacheKey = `${endpoint}`;
  if (isGet && !options.noCache && !options.forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < DEFAULT_CACHE_TTL)) {
      return cached.data;
    }
  }

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

  // Store in cache if GET request
  if (isGet) {
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  return data;
}

export const api = {
  // Cache utility
  clearCache: clearApiCache,

  // Auth
  register: async (payload) => {
    clearApiCache();
    return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  login: async (payload) => {
    clearApiCache();
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  demoLogin: async () => {
    clearApiCache();
    return apiRequest('/auth/demo-login', { method: 'POST' });
  },
  getMe: (opts) => apiRequest('/auth/me', opts),

  // Profile
  getProfile: (opts) => apiRequest('/profile', opts),
  updateProfile: async (payload) => {
    clearApiCache('/profile');
    clearApiCache('/matching');
    clearApiCache('/skill-gap');
    return apiRequest('/profile', { method: 'PUT', body: JSON.stringify(payload) });
  },

  // Resume
  uploadResume: async (formData) => {
    clearApiCache('/resume');
    clearApiCache('/matching');
    clearApiCache('/skill-gap');
    clearApiCache('/profile');
    return apiRequest('/resume/upload', { method: 'POST', body: formData });
  },
  getLatestResume: (opts) => apiRequest('/resume/latest', opts),
  deleteResume: async (id) => {
    clearApiCache('/resume');
    clearApiCache('/matching');
    clearApiCache('/skill-gap');
    return apiRequest(`/resume/${id}`, { method: 'DELETE' });
  },

  // Internships
  getInternships: (params = {}, opts = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/internships${query ? `?${query}` : ''}`, opts);
  },
  searchInternshipsRag: (query, params = {}, opts = {}) => {
    const searchParams = new URLSearchParams({ query, ...params }).toString();
    return apiRequest(`/internships/rag/search?${searchParams}`, opts);
  },
  getInternshipStats: (opts) => apiRequest('/internships/stats', opts),
  getInternship: (id, opts) => apiRequest(`/internships/${id}`, opts),
  getSavedInternships: (opts) => apiRequest('/internships/saved/all', opts),
  saveInternship: async (id, payload) => {
    clearApiCache('/internships/saved');
    return apiRequest(`/internships/saved/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  },
  removeSavedInternship: async (id) => {
    clearApiCache('/internships/saved');
    return apiRequest(`/internships/saved/${id}`, { method: 'DELETE' });
  },

  // Matching & Recommendations
  getRecommendations: (params = {}, opts = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/matching/recommendations${query ? `?${query}` : ''}`, opts);
  },
  evaluateMatch: (internshipId, opts) => apiRequest(`/matching/evaluate/${internshipId}`, opts),
  evaluateProfile: (profile, limit = 20) => apiRequest('/matching/evaluate-profile', { method: 'POST', body: JSON.stringify({ profile, limit }) }),

  // M3.1 Skill Gap Analysis
  analyzeSkillGap: (internshipId, opts) => apiRequest(`/skill-gap/analyze/${internshipId}`, opts),
  customSkillGap: (payload) => apiRequest('/skill-gap/custom-analyze', { method: 'POST', body: JSON.stringify(payload) }),

  // M3.2 Resume & Cover Letter Customization
  tailorResume: (payload) => apiRequest('/customization/tailor-resume', { method: 'POST', body: JSON.stringify(payload) }),
  generateCoverLetter: (payload) => apiRequest('/customization/cover-letter', { method: 'POST', body: JSON.stringify(payload) }),
  saveApplication: async (payload) => {
    clearApiCache('/customization/applications');
    return apiRequest('/customization/save-application', { method: 'POST', body: JSON.stringify(payload) });
  },
  getSavedApplications: (opts) => apiRequest('/customization/applications', opts),
  deleteApplication: async (id) => {
    clearApiCache('/customization/applications');
    return apiRequest(`/customization/applications/${id}`, { method: 'DELETE' });
  },

  // M3.3 Mock Interview & Prep Guide
  getPrepGuide: (internshipId, opts) => apiRequest(`/interview/prep-guide/${internshipId}`, opts),
  startInterview: (payload) => apiRequest('/interview/start', { method: 'POST', body: JSON.stringify(payload) }),
  submitAnswer: (payload) => apiRequest('/interview/submit-answer', { method: 'POST', body: JSON.stringify(payload) }),
  completeInterview: async (sessionId) => {
    clearApiCache('/interview/history');
    return apiRequest(`/interview/complete/${sessionId}`, { method: 'POST' });
  },
  getInterviewSessions: (opts) => apiRequest('/interview/history', opts),
  getInterviewHistory: (opts) => apiRequest('/interview/history', opts),
  getSessionDetail: (sessionId, opts) => apiRequest(`/interview/session/${sessionId}`, opts),
  getSessionTranscript: (sessionId, opts) => apiRequest(`/interview/session/${sessionId}`, opts),

  // M3.4 Career Assistant
  sendChatMessage: async (message) => {
    clearApiCache('/assistant/history');
    return apiRequest('/assistant/chat', { method: 'POST', body: JSON.stringify({ message }) });
  },
  getChatHistory: (opts) => apiRequest('/assistant/history', opts),
  clearChatHistory: async () => {
    clearApiCache('/assistant/history');
    return apiRequest('/assistant/history', { method: 'DELETE' });
  },

  // M4.1 Application Tracking & Management Module
  getApplications: (params = {}, opts = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/applications${query ? `?${query}` : ''}`, opts);
  },
  getApplicationStats: (opts = {}) => apiRequest('/applications/stats', opts),
  getApplication: (id, opts = {}) => apiRequest(`/applications/${id}`, opts),
  createApplication: async (payload) => {
    clearApiCache('/applications');
    return apiRequest('/applications', { method: 'POST', body: JSON.stringify(payload) });
  },
  importInternshipToTracker: async (internshipId, payload = {}) => {
    clearApiCache('/applications');
    return apiRequest(`/applications/import-internship/${internshipId}`, { method: 'POST', body: JSON.stringify(payload) });
  },
  updateApplicationStatus: async (id, status) => {
    clearApiCache('/applications');
    return apiRequest(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  updateApplication: async (id, payload) => {
    clearApiCache('/applications');
    return apiRequest(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteTrackerApplication: async (id) => {
    clearApiCache('/applications');
    return apiRequest(`/applications/${id}`, { method: 'DELETE' });
  }
};
