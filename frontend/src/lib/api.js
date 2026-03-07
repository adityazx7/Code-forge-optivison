// API Base uses the provided env var, or defaults to localhost for development.
// Note: Render provides raw hostnames, so we format them to include the protocol and /api path.
const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const host = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, ""); 
    return host.startsWith('http') ? `${host}/api` : `https://${host}/api`;
  }
  return 'http://localhost:8000/api';
};

const API_BASE = getApiBase().replace(/\/api$/, "");

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('optivision-token');
  }
  return null;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined) url.searchParams.set(key, val);
  });

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchAuthAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // --- Public analytics endpoints ---
  getOverview: () => fetchAPI('/api/overview'),
  getExpiries: () => fetchAPI('/api/expiries'),
  getOIByStrike: (expiry) => fetchAPI('/api/oi-by-strike', { expiry }),
  getVolumeByStrike: (expiry) => fetchAPI('/api/volume-by-strike', { expiry }),
  getPCRTimeline: () => fetchAPI('/api/pcr-timeline'),
  getSpotPrice: () => fetchAPI('/api/spot-price'),
  getOIChanges: () => fetchAPI('/api/oi-changes'),
  getVolatilitySurface: () => fetchAPI('/api/volatility-surface'),
  getMaxPain: (expiry) => fetchAPI('/api/max-pain', { expiry }),
  getHeatmap: (metric) => fetchAPI('/api/heatmap', { metric }),
  getAnomalySummary: () => fetchAPI('/api/anomalies/summary'),
  getAnomalyDetails: (limit) => fetchAPI('/api/anomalies/details', { limit }),
  getClusters: (n_clusters) => fetchAPI('/api/clusters', { n_clusters }),

  // --- Auth endpoints ---
  register: (email, username, password) =>
    fetchAuthAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    }),
  login: (email, password) =>
    fetchAuthAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => fetchAuthAPI('/api/auth/me'),

  // --- Settings endpoints ---
  getSettings: () => fetchAuthAPI('/api/settings'),
  updateSettings: (settings) =>
    fetchAuthAPI('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // --- Chat endpoints ---
  sendChat: (message) =>
    fetchAuthAPI('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
