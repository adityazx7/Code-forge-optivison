const API_BASE = 'http://localhost:8000';

async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined) url.searchParams.set(key, val);
  });
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
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
};
