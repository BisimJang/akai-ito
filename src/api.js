const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Auth
  signup: (username, email) => req('/api/auth/signup', { method: 'POST', body: JSON.stringify({ username, email }) }),
  login: (username) => req('/api/auth/login', { method: 'POST', body: JSON.stringify({ username }) }),
  googleLogin: (token) => req('/api/auth/google', { method: 'POST', body: JSON.stringify({ token }) }),

  // Cases
  getCases: (userId, status) => req(`/api/users/${userId}/cases${status ? `?status=${status}` : ''}`),
  getCase: (caseId) => req(`/api/cases/${caseId}`),
  getMessages: (caseId) => req(`/api/cases/${caseId}/messages`),
  createCase: (userId, title, description, priority) =>
    req('/api/cases', { method: 'POST', body: JSON.stringify({ userId, title, description, priority }) }),
  updateCase: (caseId, data) =>
    req(`/api/cases/${caseId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCase: (caseId) => req(`/api/cases/${caseId}`, { method: 'DELETE' }),

  // Evidence
  uploadEvidence: (caseId, files, url) => {
    const form = new FormData();
    if (files && files.length > 0) {
      files.forEach(file => form.append('files', file));
    }
    if (url) form.append('url', url);
    return fetch(`${BASE}/api/cases/${caseId}/evidence`, { method: 'POST', body: form }).then(r => r.json());
  },

  // Investigation chat
  investigate: (caseId, query, history = []) =>
    req(`/api/cases/${caseId}/investigate`, { method: 'POST', body: JSON.stringify({ query, history }) }),
};
