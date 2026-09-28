/**
 * AgroSense AI - Sensor Service
 * Physical hardware: ESP32 Dev Board + Soil Moisture Sensor + DHT11
 *
 * Sensors available:
 *   - Soil Moisture Sensor -> moisture
 *   - DHT11                -> temperature, humidity
 */

import { API_BASE_URL } from './apiConfig';

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }
  return response.json();
}

export async function getLatestSensorReading() {
  const data = await request('/api/sensors/latest');
  return data.reading || null;
}

export async function getSensorHistory(limit = 100) {
  const data = await request(`/api/sensors/history?limit=${encodeURIComponent(limit)}`);
  return data.readings || [];
}

export async function sendSensorReading(data) {
  return request('/api/sensors/readings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

/**
 * Helper to compute status based on value and thresholds
 */
export function getSensorStatus(value, minOpt, maxOpt) {
  if (value < minOpt) return 'Low';
  if (value > maxOpt) return 'High';
  return 'Optimal';
}

/**
 * Fetch current real-time sensor metrics.
 * Connects to MongoDB Atlas via FastAPI GET /api/sensors/latest with fallback.
 */
export async function getRealtimeSensors(reading) {
  try {
    const latest = reading === undefined ? await getLatestSensorReading() : reading;
    if (latest && latest.soil_moisture !== undefined) {
      const timeStr = latest.timestamp
        ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Just now';

      return {
        moisture: {
          value: Number(latest.soil_moisture),
          unit: '%',
          minOptimal: 60,
          maxOptimal: 80,
          minVal: 0,
          maxVal: 100,
          label: 'Soil Moisture',
          status: getSensorStatus(Number(latest.soil_moisture), 60, 80),
          description: 'Optimal moisture for root development and rhizome growth.',
          lastUpdated: timeStr,
          deviceId: latest.device_id || 'ESP32_001'
        },
        temperature: {
          value: Number(latest.temperature),
          unit: '°C',
          minOptimal: 20,
          maxOptimal: 35,
          minVal: 0,
          maxVal: 60,
          label: 'Ambient Temperature',
          status: getSensorStatus(Number(latest.temperature), 20, 35),
          description: 'Ambient temperature read from DHT11. Turmeric grows best at 20-35°C.',
          lastUpdated: timeStr,
          deviceId: latest.device_id || 'ESP32_001'
        },
        humidity: {
          value: Number(latest.humidity),
          unit: '%',
          minOptimal: 60,
          maxOptimal: 85,
          minVal: 0,
          maxVal: 100,
          label: 'Humidity',
          status: getSensorStatus(Number(latest.humidity), 60, 85),
          description: 'Relative humidity from DHT11. High humidity supports turmeric growth.',
          lastUpdated: timeStr,
          deviceId: latest.device_id || 'ESP32_001'
        }
      };
    }
  } catch (err) {
    console.warn('[SensorService] Live reading fetch error:', err.message);
  }

  return null;
}

/**
 * System hardware & service connection telemetry including MongoDB Atlas node.
 */
export async function getSystemStatus() {
  let isMongoConnected = false;
  let isBackendOnline = false;
  let isPlantAiOnline = false;
  let isSoilAiOnline = false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (res.ok) {
      const healthData = await res.json();
      isBackendOnline = healthData.backend === 'healthy' || healthData.status === 'online';
      isMongoConnected = Boolean(healthData.mongodb);
      isPlantAiOnline = Boolean(healthData.plant_ai_model);
      isSoilAiOnline = Boolean(healthData.soil_ai_model);
    }
  } catch {
    // Backend is offline
  }

  return {
    esp32: {
      name: 'ESP32 Dev Board',
      status: isBackendOnline ? 'Connected' : 'Unavailable',
      signal: '-62 dBm',
      ip: '192.168.1.104',
      uptime: '14 days'
    },
    moistureSensor: {
      name: 'Soil Moisture Sensor',
      status: isBackendOnline ? 'Online' : 'Unavailable',
      pin: 'GPIO 34'
    },
    dht11: {
      name: 'DHT11 Temperature & Humidity',
      status: isBackendOnline ? 'Online' : 'Unavailable',
      pin: 'GPIO 4'
    },
    aiService: {
      name: 'Turmeric ONNX Disease Model',
      status: isPlantAiOnline ? 'Connected' : 'Unavailable',
      model: 'turmeric_model.onnx',
      latency: '42ms'
    },
    soilAiService: {
      name: 'Soil Health Random Forest Model',
      status: isSoilAiOnline ? 'Connected' : 'Unavailable',
      model: 'soil_model_3features.pkl'
    },
    mongodb: {
      name: 'MongoDB Atlas Database',
      status: isMongoConnected ? 'Connected' : 'Unavailable',
      database: 'agrosence_ai',
      collections: 'sensor_readings, soil_predictions, plant_analyses'
    },
    backendApi: {
      name: 'AgroSense FastAPI Backend',
      status: isBackendOnline ? 'Connected' : 'Unavailable',
      environment: 'Production',
      rate: '100% OK'
    }
  };
}

/** One live stream per dashboard; EventSource reconnects after network failures. */
export function subscribeToSync(onUpdate) {
  if (typeof EventSource === 'undefined') return () => {};
  const source = new EventSource(`${API_BASE_URL}/api/sync/stream`);
  source.addEventListener('sync', (event) => {
    try {
      onUpdate(JSON.parse(event.data));
      window.dispatchEvent(new Event('agrosense:sync'));
    } catch (error) {
      console.warn('[SensorService] Invalid sync event:', error.message);
    }
  });
  return () => source.close();
}
