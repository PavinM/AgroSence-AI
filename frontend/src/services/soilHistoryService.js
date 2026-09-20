/**
 * AgroSense AI - Soil & Sensor History Service
 * ============================================
 * Provides REST client functions for MongoDB Atlas persistent data:
 * 1. getLatestSensorReading()   -> GET /api/sensors/latest
 * 2. getSensorHistory()          -> GET /api/sensors/history
 * 3. getSoilHealthHistory()      -> GET /api/soil/history
 * 4. getPlantAnalysisHistory()   -> GET /api/plant/history
 * 5. saveSensorReading()         -> POST /api/sensors/readings
 */

const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  : (import.meta.env.VITE_API_BASE_URL || '');

/**
 * Fetch the newest real-time sensor reading from MongoDB Atlas via FastAPI.
 * @param {string} deviceId Optional ESP32 device identifier
 * @returns {Promise<Object|null>}
 */
export async function getLatestSensorReading(deviceId = 'ESP32_001') {
  try {
    const url = deviceId
      ? `${API_BASE_URL}/api/sensors/latest?device_id=${encodeURIComponent(deviceId)}`
      : `${API_BASE_URL}/api/sensors/latest`;

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return data.reading || null;
  } catch (err) {
    console.warn('[SoilHistoryService] getLatestSensorReading warning:', err.message);
    return null;
  }
}

/**
 * Fetch historical ESP32 sensor telemetry from MongoDB Atlas for graphs & tables.
 * @param {string} deviceId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getSensorHistory(deviceId = 'ESP32_001', limit = 100) {
  try {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    if (limit) params.append('limit', limit.toString());

    const res = await fetch(`${API_BASE_URL}/api/sensors/history?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return data.readings || [];
  } catch (err) {
    console.warn('[SoilHistoryService] getSensorHistory warning:', err.message);
    return [];
  }
}

/**
 * Fetch historical Random Forest soil health predictions from MongoDB Atlas.
 * @param {string} deviceId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getSoilHealthHistory(deviceId = 'ESP32_001', limit = 50) {
  try {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    if (limit) params.append('limit', limit.toString());

    const res = await fetch(`${API_BASE_URL}/api/soil/history?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    console.warn('[SoilHistoryService] getSoilHealthHistory warning:', err.message);
    return [];
  }
}

/**
 * Fetch recent ONNX plant disease analyses from MongoDB Atlas.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getPlantAnalysisHistory(limit = 50) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/plant/history?limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return data.analyses || [];
  } catch (err) {
    console.warn('[SoilHistoryService] getPlantAnalysisHistory warning:', err.message);
    return [];
  }
}

/**
 * Manually post sensor readings (useful for testing or dashboard simulator).
 * @param {Object} readingData
 * @returns {Promise<Object>}
 */
export async function saveSensorReading(readingData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sensors/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readingData)
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('[SoilHistoryService] saveSensorReading error:', err.message);
    throw err;
  }
}
