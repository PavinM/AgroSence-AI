import { API_BASE_URL } from './apiConfig';

export async function getPlantAnalysisHistory(limit = 20) {
  const response = await fetch(`${API_BASE_URL}/api/plant/history?limit=${encodeURIComponent(limit)}`);
  if (!response.ok) throw new Error(`Server returned ${response.status}`);
  const data = await response.json();
  return data.analyses || [];
}