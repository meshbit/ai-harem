const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  const res = await fetch(url, config);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export const api = {
  getBootstrap: () => request('/portal/public/bootstrap'),
  getCharacters: (page = 1, pageSize = 24, sort = 'hot') =>
    request(`/portal/public/characters?page=${page}&pageSize=${pageSize}&sort=${sort}`),
  getFeatured: (limit = 18) =>
    request(`/portal/public/characters/featured?limit=${limit}`),
  getTags: () => request('/portal/public/tags'),
  getHotComments: (limit = 5) =>
    request(`/portal/public/comments/hot?limit=${limit}`),
  sendMessage: (characterId, message) =>
    request('/chat/', {
      method: 'POST',
      body: JSON.stringify({ characterId, message }),
    }),
};

export default api;
