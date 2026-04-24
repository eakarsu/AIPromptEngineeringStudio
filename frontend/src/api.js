const API_BASE = '/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  },
  post: async (path, data) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  },
  put: async (path, data) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  },
  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  },
};
