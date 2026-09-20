const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  : (import.meta.env.VITE_API_BASE_URL || '');

export async function getPlantAnalysisHistory(limit = 20) {
  const response = await fetch(`${API_BASE_URL}/api/plant/history?limit=${encodeURIComponent(limit)}`);
  if (!response.ok) throw new Error(`Server returned ${response.status}`);
  const data = await response.json();
  return data.analyses || [];
}