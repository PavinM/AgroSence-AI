/**
 * AgroSense AI - Plant AI Service
 * --------------------------------
 * Connects the React frontend to the real FastAPI + ONNX backend.
 *
 * Backend:
 * http://localhost:8000
 *
 * Endpoint:
 * POST /api/plant/analyze
 */

import { API_BASE_URL } from './apiConfig';

/**
 * Analyze a turmeric leaf image using the trained AgroSense AI model.
 *
 * @param {File} imageFile
 * @returns {Promise<Object>}
 */
export async function analyzePlantImage(imageFile) {
  if (!imageFile) {
    throw new Error("Please select a turmeric leaf image.");
  }

  // Validate image type
  if (!imageFile.type.startsWith("image/")) {
    throw new Error("Selected file must be an image.");
  }

  // Create multipart/form-data request
  const formData = new FormData();
  formData.append("file", imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/api/plant/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Server returned ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("AgroSense AI Backend Response:", data);

    return {
      crop: data.crop || "Turmeric",
      condition:
        data.condition ||
        (data.prediction === "Healthy_Leaf" ? "Healthy" : "Unhealthy"),
      prediction: data.prediction || data.disease || "Unknown",
      disease: data.disease || data.prediction || "Unknown",
      diseaseDetected: data.disease || data.prediction || "Unknown",
      diseasePredicted: data.disease || data.prediction || "Unknown",
      confidence: Number(data.confidence ?? 0),
      severity: data.severity || "Unknown",
      probabilities: data.probabilities || {},
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
      recommended_action: Array.isArray(data.recommended_action)
        ? data.recommended_action
        : [],
      recommendedAction: Array.isArray(data.recommended_action)
        ? data.recommended_action
        : Array.isArray(data.symptoms)
        ? data.symptoms
        : [],
      analyzedAt: new Date().toISOString(),
      source: "AgroSense AI ONNX Model",
      success: true,
    };
  } catch (error) {
    console.error("AgroSense AI analysis error:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Cannot connect to AgroSense AI backend. Make sure FastAPI is running on port 8000."
      );
    }
    throw error;
  }
}

/**
 * Check whether the AgroSense AI backend is online.
 *
 * @returns {Promise<boolean>}
 */
export async function checkPlantAiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    console.error("AgroSense AI health check failed:", error);
    return false;
  }
}

/**
 * Convert backend class names into user-friendly labels.
 */
export function formatDiseaseName(name) {
  if (!name) return "Unknown";
  return String(name)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Return whether the prediction represents a healthy turmeric plant.
 */
export function isHealthyPrediction(prediction) {
  if (!prediction) return false;
  const normalized = String(prediction)
    .toLowerCase()
    .replaceAll("_", " ")
    .trim();
  return normalized === "healthy leaf";
}

/**
 * Convert probability object into an array for Recharts or UI display.
 */
export function probabilitiesToArray(probabilities = {}) {
  return Object.entries(probabilities)
    .map(([className, probability]) => ({
      name: formatDiseaseName(className),
      className,
      probability: Number(probability) || 0,
    }))
    .sort((a, b) => b.probability - a.probability);
}

/**
 * Return severity information for frontend cards.
 */
export function getSeverityInfo(severity) {
  const normalized = String(severity || "").toLowerCase();
  switch (normalized) {
    case "low":
    case "none":
      return {
        label: "Low",
        level: 1,
        description: "Minor or no symptoms detected. Continue monitoring the plant.",
      };
    case "medium":
      return {
        label: "Medium",
        level: 2,
        description: "Disease symptoms detected. Treatment and monitoring are recommended.",
      };
    case "high":
      return {
        label: "High",
        level: 3,
        description: "Significant disease symptoms detected. Prompt action is recommended.",
      };
    case "critical":
      return {
        label: "Critical",
        level: 4,
        description: "Severe disease condition detected. Immediate attention is recommended.",
      };
    default:
      return {
        label: "Unknown",
        level: 0,
        description: "Severity information is unavailable.",
      };
  }
}

/**
 * Generate frontend summary from AI result.
 */
export function generateAnalysisSummary(result) {
  if (!result) return null;
  const healthy =
    result.condition === "Healthy" || isHealthyPrediction(result.prediction);

  return {
    title: healthy
      ? "Healthy Turmeric Leaf"
      : `${formatDiseaseName(result.prediction)} Detected`,
    crop: result.crop || "Turmeric",
    condition: healthy ? "Healthy" : "Unhealthy",
    confidence: Number(result.confidence) || 0,
    severity: healthy ? "None" : result.severity || "Unknown",
    message: healthy
      ? "The AgroSense AI model did not detect signs of the supported turmeric leaf diseases."
      : `AgroSense AI detected ${formatDiseaseName(result.prediction)} with ${Number(
          result.confidence
        ).toFixed(2)}% confidence.`,
  };
}

/**
 * Create a local preview URL for uploaded image.
 */
export function createImagePreview(file) {
  if (!file) return null;
  return URL.createObjectURL(file);
}

/**
 * API configuration export.
 */
export const plantAiConfig = {
  baseUrl: API_BASE_URL,
  analyzeEndpoint: `${API_BASE_URL}/api/plant/analyze`,
  healthEndpoint: `${API_BASE_URL}/api/health`,
  model: "Turmeric Disease ONNX",
  supportedClasses: ["Aphids_Disease", "Blotch", "Healthy_Leaf", "Leaf_Spot"],
};

// ============================================================
// SVG Placeholders & Assets (Formatted as valid Data URIs)
// ============================================================

export function svgToDataUri(svgStr) {
  if (!svgStr) return '';
  if (typeof svgStr !== 'string') return svgStr;
  const trimmed = svgStr.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http')) {
    return trimmed;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
}

export function toImageSrc(src) {
  if (!src) return GENERIC_TURMERIC_LEAF_SVG;
  return svgToDataUri(src);
}

export const RAW_GENERIC_TURMERIC_LEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="24" fill="#ecfdf5"/>
  <path
    d="M100 165
       C55 140 45 95 70 55
       C90 25 130 25 150 45
       C165 65 155 105 125 135
       C115 145 105 155 100 165Z"
    fill="#10b981"
  />
  <path
    d="M100 160
       C105 125 115 90 140 55"
    stroke="#047857"
    stroke-width="5"
    fill="none"
    stroke-linecap="round"
  />
</svg>
`;
export const GENERIC_TURMERIC_LEAF_SVG = svgToDataUri(RAW_GENERIC_TURMERIC_LEAF_SVG);

export const RAW_BLOTCH_TURMERIC_LEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#ecfdf5"/>
  <ellipse cx="150" cy="150" rx="65" ry="120"
           fill="#4ade80"
           transform="rotate(25 150 150)"/>
  <line x1="105" y1="245" x2="195" y2="55"
        stroke="#166534"
        stroke-width="6"/>
  <circle cx="135" cy="120" r="18" fill="#78350f"/>
  <circle cx="170" cy="155" r="14" fill="#92400e"/>
  <circle cx="145" cy="190" r="20" fill="#713f12"/>
  <circle cx="180" cy="105" r="10" fill="#a16207"/>
</svg>
`;
export const BLOTCH_TURMERIC_LEAF_SVG = svgToDataUri(RAW_BLOTCH_TURMERIC_LEAF_SVG);

export const RAW_HEALTHY_TURMERIC_LEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#ecfdf5"/>
  <ellipse cx="150" cy="150" rx="65" ry="120"
           fill="#22c55e"
           transform="rotate(25 150 150)"/>
  <line x1="105" y1="245" x2="195" y2="55"
        stroke="#15803d"
        stroke-width="6"/>
</svg>
`;
export const HEALTHY_TURMERIC_LEAF_SVG = svgToDataUri(RAW_HEALTHY_TURMERIC_LEAF_SVG);

export const RAW_LEAF_SPOT_TURMERIC_LEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#ecfdf5"/>
  <ellipse cx="150" cy="150" rx="65" ry="120"
           fill="#65a30d"
           transform="rotate(25 150 150)"/>
  <line x1="105" y1="245" x2="195" y2="55"
        stroke="#3f6212"
        stroke-width="6"/>
  <circle cx="135" cy="105" r="9" fill="#422006"/>
  <circle cx="165" cy="130" r="12" fill="#713f12"/>
  <circle cx="140" cy="165" r="8" fill="#422006"/>
  <circle cx="175" cy="190" r="11" fill="#713f12"/>
  <circle cx="120" cy="205" r="7" fill="#422006"/>
</svg>
`;
export const LEAF_SPOT_TURMERIC_LEAF_SVG = svgToDataUri(RAW_LEAF_SPOT_TURMERIC_LEAF_SVG);

export const RAW_APHIDS_TURMERIC_LEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#ecfdf5"/>
  <ellipse cx="150" cy="150" rx="65" ry="120"
           fill="#84cc16"
           transform="rotate(25 150 150)"/>
  <line x1="105" y1="245" x2="195" y2="55"
        stroke="#3f6212"
        stroke-width="6"/>
  <circle cx="135" cy="115" r="5" fill="#111827"/>
  <circle cx="150" cy="130" r="5" fill="#111827"/>
  <circle cx="165" cy="145" r="5" fill="#111827"/>
  <circle cx="140" cy="165" r="5" fill="#111827"/>
  <circle cx="175" cy="180" r="5" fill="#111827"/>
  <circle cx="125" cy="190" r="5" fill="#111827"/>
</svg>
`;
export const APHIDS_TURMERIC_LEAF_SVG = svgToDataUri(RAW_APHIDS_TURMERIC_LEAF_SVG);

export const SAMPLE_LEAVES = [
  { name: "Blotch", svg: BLOTCH_TURMERIC_LEAF_SVG },
  { name: "Healthy Leaf", svg: HEALTHY_TURMERIC_LEAF_SVG },
  { name: "Leaf Spot", svg: LEAF_SPOT_TURMERIC_LEAF_SVG },
  { name: "Aphids Disease", svg: APHIDS_TURMERIC_LEAF_SVG },
];

// ============================================================
// Disease Profiles
// ============================================================

const aphidProfile = {
  name: "Aphids Disease",
  condition: "Unhealthy",
  severity: "Medium",
  symptoms: [
    "Small aphids may appear on young leaves and shoots",
    "Leaves may curl, wrinkle, or become distorted",
    "Yellowing and reduced plant growth may occur",
    "Sticky honeydew may be visible on affected foliage",
  ],
  recommendedAction: [
    "Inspect nearby turmeric plants for aphid infestation",
    "Remove heavily infested leaves when appropriate",
    "Use suitable biological or crop-specific aphid management",
    "Monitor the crop regularly for further spread",
  ],
  recommended_action: [
    "Inspect nearby turmeric plants for aphid infestation",
    "Remove heavily infested leaves when appropriate",
    "Use suitable biological or crop-specific aphid management",
    "Monitor the crop regularly for further spread",
  ],
};

const blotchProfile = {
  name: "Blotch",
  condition: "Unhealthy",
  severity: "Medium",
  symptoms: [
    "Blotched or discolored regions on the leaf",
    "Irregular brown or dark lesions may develop",
    "Affected areas may expand over time",
    "Severe infection may reduce healthy leaf area",
  ],
  recommendedAction: [
    "Inspect nearby turmeric plants for similar symptoms",
    "Remove severely affected foliage when appropriate",
    "Avoid excessive moisture on leaf surfaces",
    "Seek crop-specific disease management guidance if symptoms spread",
  ],
  recommended_action: [
    "Inspect nearby turmeric plants for similar symptoms",
    "Remove severely affected foliage when appropriate",
    "Avoid excessive moisture on leaf surfaces",
    "Seek crop-specific disease management guidance if symptoms spread",
  ],
};

const healthyProfile = {
  name: "Healthy Leaf",
  condition: "Healthy",
  severity: "Low",
  symptoms: [
    "Leaf shows normal green coloration",
    "No significant disease lesions detected",
    "No major visible pest damage detected",
    "Leaf structure appears healthy",
  ],
  recommendedAction: [
    "Continue regular crop monitoring",
    "Maintain suitable soil moisture",
    "Maintain balanced nutrient levels",
    "Continue preventive field management practices",
  ],
  recommended_action: [
    "Continue regular crop monitoring",
    "Maintain suitable soil moisture",
    "Maintain balanced nutrient levels",
    "Continue preventive field management practices",
  ],
};

const leafSpotProfile = {
  name: "Leaf Spot",
  condition: "Unhealthy",
  severity: "Medium",
  symptoms: [
    "Small brown or dark spots may appear on leaves",
    "Spots may enlarge as the condition progresses",
    "Multiple lesions may merge on severely affected leaves",
    "Affected leaves may gradually yellow or dry",
  ],
  recommendedAction: [
    "Remove severely affected leaves when appropriate",
    "Inspect surrounding plants for similar leaf spots",
    "Reduce prolonged leaf wetness where possible",
    "Use crop-specific disease management guidance if infection spreads",
  ],
  recommended_action: [
    "Remove severely affected leaves when appropriate",
    "Inspect surrounding plants for similar leaf spots",
    "Reduce prolonged leaf wetness where possible",
    "Use crop-specific disease management guidance if infection spreads",
  ],
};

export const DISEASE_PROFILES = {
  Aphids_Disease: aphidProfile,
  "Aphids Disease": aphidProfile,
  APHIDS: aphidProfile,

  Blotch: blotchProfile,
  BLOTCH: blotchProfile,

  Healthy_Leaf: healthyProfile,
  "Healthy Leaf": healthyProfile,
  HEALTHY: healthyProfile,

  Leaf_Spot: leafSpotProfile,
  "Leaf Spot": leafSpotProfile,
  LEAF_SPOT: leafSpotProfile,
};

// ============================================================
// Compatibility Exports
// ============================================================

// Dual array + object definition for TURMERIC_DISEASE_CLASSES
export const TURMERIC_DISEASE_CLASSES = [
  "Aphids_Disease",
  "Blotch",
  "Healthy_Leaf",
  "Leaf_Spot",
];

TURMERIC_DISEASE_CLASSES.BLOTCH = "Blotch";
TURMERIC_DISEASE_CLASSES.Blotch = "Blotch";
TURMERIC_DISEASE_CLASSES.APHIDS = "Aphids_Disease";
TURMERIC_DISEASE_CLASSES.Aphids_Disease = "Aphids_Disease";
TURMERIC_DISEASE_CLASSES.HEALTHY = "Healthy_Leaf";
TURMERIC_DISEASE_CLASSES.Healthy_Leaf = "Healthy_Leaf";
TURMERIC_DISEASE_CLASSES.LEAF_SPOT = "Leaf_Spot";
TURMERIC_DISEASE_CLASSES.Leaf_Spot = "Leaf_Spot";

export const INITIAL_RECENT_ANALYSES = [
  {
    id: 1,
    crop: "Turmeric",
    prediction: "Blotch",
    disease: "Blotch",
    diseaseDetected: "Blotch",
    diseasePredicted: "Blotch",
    condition: "Unhealthy",
    confidence: 79.39,
    severity: "Medium",
    timestamp: new Date().toISOString(),
    thumbnail: BLOTCH_TURMERIC_LEAF_SVG,
    image: BLOTCH_TURMERIC_LEAF_SVG,
  },
  {
    id: 2,
    crop: "Turmeric",
    prediction: "Healthy_Leaf",
    disease: "Healthy Leaf",
    diseaseDetected: "Healthy Leaf",
    diseasePredicted: "Healthy Leaf",
    condition: "Healthy",
    confidence: 96.4,
    severity: "None",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    thumbnail: HEALTHY_TURMERIC_LEAF_SVG,
    image: HEALTHY_TURMERIC_LEAF_SVG,
  },
  {
    id: 3,
    crop: "Turmeric",
    prediction: "Leaf_Spot",
    disease: "Leaf Spot",
    diseaseDetected: "Leaf Spot",
    diseasePredicted: "Leaf Spot",
    condition: "Unhealthy",
    confidence: 91.2,
    severity: "Medium",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    thumbnail: LEAF_SPOT_TURMERIC_LEAF_SVG,
    image: LEAF_SPOT_TURMERIC_LEAF_SVG,
  },
  {
    id: 4,
    crop: "Turmeric",
    prediction: "Aphids_Disease",
    disease: "Aphids Disease",
    diseaseDetected: "Aphids Disease",
    diseasePredicted: "Aphids Disease",
    condition: "Unhealthy",
    confidence: 88.7,
    severity: "High",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    thumbnail: APHIDS_TURMERIC_LEAF_SVG,
    image: APHIDS_TURMERIC_LEAF_SVG,
  },
];

const plantAiService = {
  analyzePlantImage,
  checkPlantAiHealth,
  formatDiseaseName,
  isHealthyPrediction,
  probabilitiesToArray,
  getSeverityInfo,
  generateAnalysisSummary,
  createImagePreview,
  config: plantAiConfig,
};

export default plantAiService;
