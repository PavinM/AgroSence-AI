/**
 * AgroSense AI - Soil Health Service
 * Provides API client for Soil Health AI Prediction & Model Metadata.
 *
 * Physical sensors (ESP32 prototype):
 *   - Soil Moisture Sensor → Soil_Moisture
 *   - DHT11 → Ambient_Temperature, Humidity
 */

const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  : (import.meta.env.VITE_API_BASE_URL || '');

/** Only the 3 physical sensor values available from the ESP32 prototype. */
export const DEFAULT_SOIL_INPUTS = {
  Soil_Moisture: 55,
  Ambient_Temperature: 28,
  Humidity: 60
};

export async function getSoilHealthHistory(limit = 50) {
  const response = await fetch(`${API_BASE_URL}/api/soil/history?limit=${encodeURIComponent(limit)}`);
  if (!response.ok) throw new Error(`Server returned ${response.status}`);
  const data = await response.json();
  return data.history || [];
}

/**
 * Check if FastAPI backend server is reachable
 */
export async function checkBackend() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return { online: true, data };
    }
    return { online: false };
  } catch (err) {
    return { online: false };
  }
}

/**
 * Fetch Soil AI Model metadata & feature importances from backend GET /api/soil/health
 */
export async function getSoilModelHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${API_BASE_URL}/api/soil/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend GET /api/soil/health unavailable:', err.message);
  }

  return null;
}

/**
 * Predict Soil Health using FastAPI endpoint POST /api/soil/predict
 */
export async function predictSoilHealth(sensorInputs = DEFAULT_SOIL_INPUTS) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/api/soil/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sensorInputs),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { ...data, inputs: { ...sensorInputs } };
    } else {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Soil AI model unavailable');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Soil prediction timed out. Please try again.');
    }
    throw err;
  }
}

