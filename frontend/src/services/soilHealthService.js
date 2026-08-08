/**
 * AgroSense AI - Soil Health Service
 * Provides API client for Soil Health AI Prediction & Model Metadata.
 */

const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  : (import.meta.env.VITE_API_BASE_URL || '');

export const DEFAULT_SOIL_INPUTS = {
  Soil_Moisture: 55,
  Ambient_Temperature: 28,
  Soil_Temperature: 26,
  Humidity: 60,
  Light_Intensity: 700,
  Soil_pH: 6.5,
  Nitrogen_Level: 40,
  Phosphorus_Level: 25,
  Potassium_Level: 35,
  Chlorophyll_Content: 45,
  Electrochemical_Signal: 1.2
};

export const INITIAL_SOIL_PREDICTION = {
  health_status: 'Healthy',
  confidence: 82.96,
  probabilities: {
    'Healthy': 82.96,
    'Moderate Stress': 12.07,
    'High Stress': 4.97
  },
  recommendation: [
    'Maintain current irrigation schedule.',
    'Continue nutrient monitoring.',
    'Soil is healthy.'
  ],
  why_explanation: [
    'Soil Moisture (55%) is in optimal range (60-70%).',
    'Soil pH (6.5) is well-balanced.',
    'Nitrogen level (40 mg/kg) is sufficient.'
  ],
  timestamp: 'Just now'
};

export const INITIAL_SOIL_HISTORY = [
  {
    id: 'soil-pred-104',
    timestamp: 'Today, 11:30 AM',
    health_status: 'Healthy',
    confidence: 82.96,
    probabilities: {
      'Healthy': 82.96,
      'Moderate Stress': 12.07,
      'High Stress': 4.97
    },
    recommendation: [
      'Maintain current irrigation schedule.',
      'Continue nutrient monitoring.',
      'Soil is healthy.'
    ],
    why_explanation: [
      'Soil Moisture is in optimal range.',
      'Soil pH is balanced.'
    ],
    inputs: { ...DEFAULT_SOIL_INPUTS }
  },
  {
    id: 'soil-pred-103',
    timestamp: 'Yesterday, 03:45 PM',
    health_status: 'Moderate Stress',
    confidence: 74.20,
    probabilities: {
      'Healthy': 18.50,
      'Moderate Stress': 74.20,
      'High Stress': 7.30
    },
    recommendation: [
      'Adjust irrigation to reach optimal soil moisture (60-70%).',
      'Apply balanced NPK fertilizer amendment.',
      'Monitor soil pH and organic matter levels.'
    ],
    why_explanation: [
      'Soil Moisture (42%) is slightly below optimal range.',
      'Soil pH (5.2) is acidic.'
    ],
    inputs: { ...DEFAULT_SOIL_INPUTS, Soil_Moisture: 42, Soil_pH: 5.2 }
  },
  {
    id: 'soil-pred-102',
    timestamp: '05 Aug 2026, 09:15 AM',
    health_status: 'Healthy',
    confidence: 91.45,
    probabilities: {
      'Healthy': 91.45,
      'Moderate Stress': 6.20,
      'High Stress': 2.35
    },
    recommendation: [
      'Maintain current irrigation schedule.',
      'Continue nutrient monitoring.',
      'Soil is healthy.'
    ],
    why_explanation: [
      'Soil Moisture is optimal.',
      'Soil pH is ideal.'
    ],
    inputs: { ...DEFAULT_SOIL_INPUTS, Soil_Moisture: 65 }
  }
];

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
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/api/soil/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend GET /api/soil/health unavailable:', err.message);
  }

  // Baseline fallback model info metadata
  return {
    model: 'Random Forest Classifier',
    status: 'loaded',
    classes: ['Healthy', 'High Stress', 'Moderate Stress'],
    accuracy: 100.0,
    dataset_samples: 1200,
    features_count: 11,
    feature_importances: {
      'Soil Moisture': 66.24,
      'Nitrogen Level': 17.86,
      'Soil pH': 2.09,
      'Chlorophyll Content': 1.89,
      'Soil Temp': 1.81,
      'Electrochemical': 1.72,
      'Potassium (K)': 1.72,
      'Humidity': 1.69,
      'Light Intensity': 1.69,
      'Phosphorus (P)': 1.66,
      'Ambient Temp': 1.61
    }
  };
}

/**
 * Predict Soil Health using FastAPI endpoint POST /api/soil/predict
 */
export async function predictSoilHealth(sensorInputs = DEFAULT_SOIL_INPUTS) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
      return {
        ...data,
        timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        inputs: { ...sensorInputs }
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      return {
        error: errData.detail || 'Soil AI model unavailable',
        health_status: 'Error',
        confidence: 0,
        probabilities: { Healthy: 0, 'Moderate Stress': 0, 'High Stress': 0 },
        recommendation: ['Soil AI model is unavailable or failed to load on backend.'],
        why_explanation: [errData.detail || 'Backend Random Forest model execution failed.'],
        timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        inputs: { ...sensorInputs }
      };
    }
  } catch (err) {
    return {
      error: `Network Error: ${err.message}`,
      health_status: 'Offline',
      confidence: 0,
      probabilities: { Healthy: 0, 'Moderate Stress': 0, 'High Stress': 0 },
      recommendation: ['Backend API server offline. Start backend server at http://localhost:8000.'],
      why_explanation: ['Could not connect to FastAPI server at http://localhost:8000.'],
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      inputs: { ...sensorInputs }
    };
  }
}

