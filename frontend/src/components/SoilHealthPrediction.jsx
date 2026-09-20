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
import { predictSoilHealth, getSoilModelHealth } from '../services/soilHealthService';

export default function SoilHealthPrediction({ currentPrediction, sensors, onPredictionUpdate }) {
  const [inputs, setInputs] = useState({
    Soil_Moisture: '',
    Ambient_Temperature: '',
    Humidity: ''
  });
  const [modelInfo, setModelInfo] = useState({});

  const [prediction, setPrediction] = useState(currentPrediction);

  const [loading, setLoading] = useState(false);
  const [modelError, setModelError] = useState('');
  const [predictionError, setPredictionError] = useState('');

  useEffect(() => {
    async function loadModelMetadata() {
      const data = await getSoilModelHealth();
      if (data) setModelInfo(data);
      else setModelError('Unable to load soil AI status.');
    }
    loadModelMetadata();
  }, []);

  useEffect(() => {
    if (currentPrediction) setPrediction(currentPrediction);
  }, [currentPrediction]);

  useEffect(() => {
    if (sensors?.moisture && sensors?.temperature && sensors?.humidity) {
      setInputs({
        Soil_Moisture: sensors.moisture.value,
        Ambient_Temperature: sensors.temperature.value,
        Humidity: sensors.humidity.value
      });
    }
  }, [sensors]);

  const handleInputChange = (field, rawVal) => {
    const num = rawVal === '' ? '' : parseFloat(rawVal);
    setInputs(prev => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    if (Object.values(inputs).some((value) => value === '')) {
      setPredictionError('Waiting for all three sensor readings.');
      return;
    }
    setPredictionError('');
    setLoading(true);
    setPrediction(null);
    try {
      const res = await predictSoilHealth(inputs);
      setPrediction(res);
      if (onPredictionUpdate) onPredictionUpdate(res);
    } catch (err) {
      setPredictionError(err.message || 'Unable to predict soil health.');
    } finally {
      setLoading(false);
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

  const displayPrediction = loading ? {
    health_status: 'Analyzing...',
    confidence: 0,
    probabilities: {},
    recommendation: [],
    why_explanation: []
  } : prediction || {
    health_status: 'Waiting for sensor data',
    confidence: 0,
    probabilities: {},
    recommendation: [],
    why_explanation: []
  };
  const colors = getStatusColor(displayPrediction.health_status);

  const sensorFields = [
    { key: 'Soil_Moisture', label: 'Soil Moisture', unit: '%', step: 0.1, min: 0, max: 100 },
    { key: 'Ambient_Temperature', label: 'Ambient Temp', unit: '°C', step: 0.1, min: -10, max: 60 },
    { key: 'Humidity', label: 'Humidity', unit: '%', step: 0.1, min: 0, max: 100 }
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
            Random Forest classifier using three physical sensor readings
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
                {modelInfo.test_accuracy ?? modelInfo.accuracy ?? 'Not evaluated'}{(modelInfo.test_accuracy ?? modelInfo.accuracy) != null ? '%' : ''}
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
                {modelInfo.dataset_samples ?? modelInfo.sample_count ?? 'Not available'}{(modelInfo.dataset_samples ?? modelInfo.sample_count) != null ? ' Samples' : ''}
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
                {modelInfo.features_count ?? modelInfo.features_used?.length ?? 3} Features
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {(modelInfo.features_used || ['Soil_Moisture', 'Ambient_Temperature', 'Humidity']).map((feature) => feature.replace(/_/g, ' ')).join(' | ')}
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
                <span className={`w-2.5 h-2.5 rounded-full ${modelInfo.model_loaded || modelInfo.status === 'loaded' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="text-xs font-black text-slate-900 dark:text-white capitalize">
                  {modelInfo.model_loaded || modelInfo.status === 'loaded' ? 'Ready' : modelError ? 'Unavailable' : 'Loading'}
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
                  {displayPrediction.health_status}
                </h3>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${colors.badge} flex items-center space-x-1.5`}>
                {displayPrediction.health_status === 'Healthy' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : displayPrediction.health_status === 'Moderate Stress' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                )}
                <span>{displayPrediction.health_status}</span>
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
                  {displayPrediction.confidence}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bg}`}
                  style={{ width: `${Math.max(displayPrediction.confidence || 0, 4)}%` }}
                ></div>
              </div>
            </div>

            {/* Probability Progress Bar Visualization */}
            <div className="mt-6">
              <SoilHealthProbabilityChart probabilities={displayPrediction.probabilities} />
            </div>
          </div>

          {/* Prediction Explanation ("Why [Status]?") Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-emerald-500" />
              <span>Why {displayPrediction.health_status}? (AI Decision Diagnostics)</span>
            </h3>

            {displayPrediction.why_explanation && displayPrediction.why_explanation.length > 0 ? (
              <ul className="space-y-2.5">
                {displayPrediction.why_explanation.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Random Forest prediction based on the current soil moisture, ambient temperature and humidity readings.
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
              {displayPrediction.recommendation?.map((rec, index) => (
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
                3 Parameters
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

              {predictionError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{predictionError}</p>
              )}

              {/* Large Predict Soil Health Button */}
              <button
                type="submit"
                disabled={loading || Object.values(inputs).some((value) => value === '')}
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
              {Object.entries(modelInfo.feature_importances || {}).length > 0 ? Object.entries(modelInfo.feature_importances).map(([feature, weight]) => (
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
              )) : <p className="text-xs text-slate-500 dark:text-slate-400">Feature importance unavailable</p>}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
