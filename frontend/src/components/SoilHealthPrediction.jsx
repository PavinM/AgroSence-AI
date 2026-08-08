import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Activity, 
  Sparkles, 
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  BarChart3,
  Gauge,
  Info
} from 'lucide-react';
import SoilHealthProbabilityChart from './SoilHealthProbabilityChart';
import { predictSoilHealth, getSoilModelHealth, DEFAULT_SOIL_INPUTS } from '../services/soilHealthService';

export default function SoilHealthPrediction({ currentPrediction, onPredictionUpdate }) {
  const [inputs, setInputs] = useState(DEFAULT_SOIL_INPUTS);
  const [modelInfo, setModelInfo] = useState({
    model: 'Random Forest',
    status: 'loaded',
    accuracy: 100.0,
    dataset_samples: 1200,
    features_count: 11,
    feature_importances: {
      'Soil_Moisture': 66.24,
      'Nitrogen_Level': 17.86,
      'Soil_pH': 2.09,
      'Chlorophyll_Content': 1.89,
      'Soil_Temperature': 1.81,
      'Electrochemical_Signal': 1.72,
      'Potassium_Level': 1.72,
      'Humidity': 1.69,
      'Light_Intensity': 1.69,
      'Phosphorus_Level': 1.66,
      'Ambient_Temperature': 1.61
    }
  });

  const [prediction, setPrediction] = useState(currentPrediction || {
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
      'Soil Moisture (55%) is in the optimal range (60-70%).',
      'Soil pH (6.5) is well-balanced.',
      'Nitrogen level (40 mg/kg) is sufficient.'
    ]
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadModelMetadata() {
      const data = await getSoilModelHealth();
      if (data) setModelInfo(data);
    }
    loadModelMetadata();
  }, []);

  const handleInputChange = (field, rawVal) => {
    const num = rawVal === '' ? '' : parseFloat(rawVal);
    setInputs(prev => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const res = await predictSoilHealth(inputs);
    setPrediction(res);
    setLoading(false);
    if (onPredictionUpdate) {
      onPredictionUpdate(res);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Healthy':
        return {
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-500',
          badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          border: 'border-emerald-500/30'
        };
      case 'Moderate Stress':
        return {
          text: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-500',
          badge: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          border: 'border-amber-500/30'
        };
      case 'High Stress':
      case 'Error':
      case 'Offline':
      default:
        return {
          text: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-500',
          badge: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          border: 'border-rose-500/30'
        };
    }
  };

  const colors = getStatusColor(prediction.health_status);

  const sensorFields = [
    { key: 'Soil_Moisture', label: 'Soil Moisture', unit: '%', step: 1, min: 0, max: 100 },
    { key: 'Ambient_Temperature', label: 'Ambient Temp', unit: '°C', step: 0.5, min: -10, max: 60 },
    { key: 'Soil_Temperature', label: 'Soil Temp', unit: '°C', step: 0.5, min: -10, max: 60 },
    { key: 'Humidity', label: 'Humidity', unit: '%', step: 1, min: 0, max: 100 },
    { key: 'Light_Intensity', label: 'Light Intensity', unit: 'Lux', step: 10, min: 0, max: 5000 },
    { key: 'Soil_pH', label: 'Soil pH', unit: 'pH', step: 0.1, min: 0, max: 14 },
    { key: 'Nitrogen_Level', label: 'Nitrogen (N)', unit: 'mg/kg', step: 1, min: 0, max: 300 },
    { key: 'Phosphorus_Level', label: 'Phosphorus (P)', unit: 'mg/kg', step: 1, min: 0, max: 200 },
    { key: 'Potassium_Level', label: 'Potassium (K)', unit: 'mg/kg', step: 1, min: 0, max: 300 },
    { key: 'Chlorophyll_Content', label: 'Chlorophyll Content', unit: 'SPAD', step: 1, min: 0, max: 100 },
    { key: 'Electrochemical_Signal', label: 'Electrochemical Signal', unit: 'mV', step: 0.1, min: 0, max: 10 }
  ];

  return (
    <section className="mb-8 space-y-6">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sprout className="w-5 h-5 text-emerald-500" />
            <span>Soil Health AI Prediction & Model Diagnostics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Random Forest classifier & multi-spectral telemetry analyzer
          </p>
        </div>
      </div>

      {/* 1. Model Information Dashboard Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Model</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {modelInfo.model || 'Random Forest'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-4">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Accuracy</p>
              <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                {modelInfo.accuracy}%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-4">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dataset</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {modelInfo.dataset_samples} Samples
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-4">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Features</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {modelInfo.features_count} Telemetry Inputs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-4">
            <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Model Status</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${modelInfo.status === 'loaded' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="text-xs font-black text-slate-900 dark:text-white capitalize">
                  {modelInfo.status === 'loaded' ? 'Loaded' : 'Error'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Soil Prediction Status, Explanation & Recommendations */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Main Soil Health Prediction Result Card */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Sprout className="w-4 h-4 text-emerald-500" />
                  <span>🌱 Soil AI Health Classifier</span>
                </span>
                <h3 className={`text-2xl sm:text-3xl font-black mt-2 ${colors.text}`}>
                  {prediction.health_status}
                </h3>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${colors.badge} flex items-center space-x-1.5`}>
                {prediction.health_status === 'Healthy' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : prediction.health_status === 'Moderate Stress' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                )}
                <span>{prediction.health_status}</span>
              </div>
            </div>

            {/* Confidence Score Gauge Visualizer */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center space-x-1.5">
                  <Gauge className="w-4 h-4 text-emerald-500" />
                  <span>Model Confidence Score</span>
                </span>
                <span className={`text-lg font-black ${colors.text}`}>
                  🟢 {prediction.confidence}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bg}`}
                  style={{ width: `${Math.max(prediction.confidence || 0, 4)}%` }}
                ></div>
              </div>
            </div>

            {/* Probability Progress Bar Visualization */}
            <div className="mt-6">
              <SoilHealthProbabilityChart probabilities={prediction.probabilities} />
            </div>
          </div>

          {/* Prediction Explanation ("Why [Status]?") Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-emerald-500" />
              <span>Why {prediction.health_status}? (AI Decision Diagnostics)</span>
            </h3>

            {prediction.why_explanation && prediction.why_explanation.length > 0 ? (
              <ul className="space-y-2.5">
                {prediction.why_explanation.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Random Forest prediction based on evaluated 11 multi-spectral soil telemetry parameters.
              </p>
            )}
          </div>

          {/* AI Recommendation Card */}
          <div className="glass-card rounded-3xl p-6 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>AI Recommendation Plan</span>
            </h3>

            <ul className="space-y-2.5">
              {prediction.recommendation?.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right Column: Sensor Inputs & Feature Importance */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Sensor Input Parameters Form */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Sensor Input Telemetry (Manual / ESP32)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                11 Parameters
              </span>
            </div>

            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sensorFields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate block" title={field.label}>
                      {field.label} ({field.unit})
                    </label>
                    <input
                      type="number"
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      value={inputs[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                ))}
              </div>

              {/* Large Predict Soil Health Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Predicting Soil Health...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    <span>Predict Soil Health</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Feature Importance Chart */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Feature Importance Weights (Model Decision Factors)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Random Forest</span>
            </div>

            <div className="space-y-2.5 pt-2">
              {Object.entries(modelInfo.feature_importances || {}).slice(0, 6).map(([feature, weight]) => (
                <div key={feature} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{feature.replace(/_/g, ' ')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{weight}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${Math.max(weight, 2)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
