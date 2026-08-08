/**
 * AgroSense AI - Sensor Service
 * Mock service providing real-time & historical soil health telemetry data.
 * Architecture Note: Replace function implementations with real REST/WebSocket endpoints when backend/ESP32 is connected.
 */

// Initial baseline soil data for turmeric (Curcuma longa)
const initialSensorState = {
  moisture: {
    value: 64.5,
    unit: '%',
    minOptimal: 60,
    maxOptimal: 80,
    minVal: 0,
    maxVal: 100,
    label: 'Soil Moisture',
    status: 'Optimal',
    description: 'Optimal moisture for root development and rhizome growth.',
    lastUpdated: 'Just now'
  },
  ph: {
    value: 6.2,
    unit: 'pH',
    minOptimal: 5.5,
    maxOptimal: 6.8,
    minVal: 0,
    maxVal: 14,
    label: 'Soil pH Level',
    status: 'Optimal',
    description: 'Slightly acidic to neutral soil, ideal for turmeric nutrient absorption.',
    lastUpdated: 'Just now'
  },
  nitrogen: {
    value: 128,
    unit: 'mg/kg',
    minOptimal: 100,
    maxOptimal: 150,
    minVal: 0,
    maxVal: 300,
    label: 'Nitrogen (N)',
    status: 'Optimal',
    description: 'Promotes healthy green foliage and leaf area index.',
    lastUpdated: 'Just now'
  },
  phosphorus: {
    value: 52,
    unit: 'mg/kg',
    minOptimal: 40,
    maxOptimal: 70,
    minVal: 0,
    maxVal: 150,
    label: 'Phosphorus (P)',
    status: 'Optimal',
    description: 'Essential for vigorous root growth and tuber yield.',
    lastUpdated: 'Just now'
  },
  potassium: {
    value: 165,
    unit: 'mg/kg',
    minOptimal: 120,
    maxOptimal: 180,
    minVal: 0,
    maxVal: 300,
    label: 'Potassium (K)',
    status: 'Optimal',
    description: 'Crucial for curcumin synthesis and disease resistance.',
    lastUpdated: 'Just now'
  }
};

/**
 * Helper to compute status based on value and thresholds
 */
export function getSensorStatus(value, minOpt, maxOpt) {
  if (value < minOpt) return 'Low';
  if (value > maxOpt) return 'High';
  return 'Optimal';
}

/**
 * Fetch current real-time sensor metrics
 */
export async function getRealtimeSensors() {
  // Simulate network latency (50ms)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...initialSensorState });
    }, 50);
  });
}

/**
 * Generate time-series historical data for Recharts (24h, 7d, 30d)
 */
export function getHistoricalSensorData(timeframe = '24h') {
  const points = timeframe === '24h' ? 12 : timeframe === '7d' ? 14 : 30;
  const now = new Date();
  const data = [];

  for (let i = points - 1; i >= 0; i--) {
    let timestampLabel = '';
    if (timeframe === '24h') {
      const past = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      timestampLabel = past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '7d') {
      const past = new Date(now.getTime() - i * 12 * 60 * 60 * 1000);
      timestampLabel = past.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
    } else {
      const past = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      timestampLabel = past.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Realistic fluctuations around turmeric baseline
    const moisture = +(64 + Math.sin(i * 0.5) * 6 + (Math.random() * 2 - 1)).toFixed(1);
    const ph = +(6.2 + Math.cos(i * 0.4) * 0.3 + (Math.random() * 0.1 - 0.05)).toFixed(2);
    const nitrogen = Math.round(128 + Math.sin(i * 0.3) * 12 + (Math.random() * 4 - 2));
    const phosphorus = Math.round(52 + Math.cos(i * 0.5) * 6 + (Math.random() * 2 - 1));
    const potassium = Math.round(165 + Math.sin(i * 0.2) * 15 + (Math.random() * 5 - 2.5));

    data.push({
      timestamp: timestampLabel,
      moisture,
      ph,
      nitrogen,
      phosphorus,
      potassium
    });
  }

  return data;
}

/**
 * System hardware & service connection telemetry
 */
export async function getSystemStatus() {
  return {
    esp32: { name: 'ESP32 Gateway Node', status: 'Connected', signal: '-62 dBm', ip: '192.168.1.104', uptime: '14 days' },
    moistureSensor: { name: 'Soil Moisture Capacitive v1.2', status: 'Online', battery: '98%', pin: 'GPIO 34' },
    soilPropertySensor: { name: 'Soil NPK & pH RS485 Probe', status: 'Online', bus: 'Modbus RTU', pin: 'GPIO 16/17' },
    aiService: { name: 'Turmeric AI Inference Engine', status: 'Online', model: 'ResNet-50 v2.1', latency: '42ms' },
    backendApi: { name: 'AgroSense REST & WS API', status: 'Online', environment: 'Production', rate: '100% OK' }
  };
}
