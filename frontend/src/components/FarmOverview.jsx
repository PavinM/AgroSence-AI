import React from 'react';
import { ShieldCheck, AlertTriangle, Droplets, Leaf, Activity, ArrowRight } from 'lucide-react';
import { GENERIC_TURMERIC_LEAF_SVG, toImageSrc } from '../services/plantAiService';

export default function FarmOverview({ sensors, latestScan, soilPrediction, onNavigate }) {
  const cropHealthStatus = latestScan ? (latestScan.condition === 'Healthy' ? 'Good' : 'Attention Required') : 'Waiting for analysis';
  const soilStatus = soilPrediction?.health_status || 'Waiting for prediction';
  const soilConfidence = soilPrediction?.confidence;

  const soilColor = soilStatus === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400' :
                    soilStatus === 'Moderate Stress' ? 'text-amber-600 dark:text-amber-400' :
                    'text-rose-600 dark:text-rose-400';

  const soilIconBg = soilStatus === 'Healthy' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' :
                     soilStatus === 'Moderate Stress' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400' :
                     'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400';

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span>Section 1 — Farm Overview</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time field telemetry and crop status summary
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Overall Crop Health */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Overall Crop Health
              </p>
              <h3 className={`text-xl sm:text-2xl font-extrabold mt-1 ${
                cropHealthStatus === 'Good' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {cropHealthStatus}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${
              cropHealthStatus === 'Good' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
            }`}>
              {cropHealthStatus === 'Good' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              Based on visual AI scans
            </span>
            <button 
              onClick={() => onNavigate('plant-analysis')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Scan Leaf</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Soil Health (Powered by Soil AI Model) */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <span>🌱 2. Soil Health</span>
              </p>
              <h3 className={`text-xl sm:text-2xl font-extrabold mt-1 ${soilColor}`}>
                {soilStatus}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Confidence: <strong className={soilColor}>{soilConfidence != null ? `${soilConfidence}%` : '--'}</strong>
              </p>
            </div>
            <div className={`p-3 rounded-xl ${soilIconBg}`}>
              <Leaf className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              AI Prediction Model
            </span>
            <button 
              onClick={() => onNavigate('soil-monitoring')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Predict Soil</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Soil Moisture */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Soil Moisture
              </p>
              <div className="flex items-baseline space-x-1 mt-1">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {sensors?.moisture?.value != null ? `${sensors.moisture.value}%` : '--'}
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  {sensors?.moisture?.status || 'Waiting'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Droplets className="w-6 h-6" />
            </div>
          </div>

          {/* Progress gauge bar */}
          <div className="mt-4 pt-2">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${sensors?.moisture?.value || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0%</span>
              <span>Target: 60 - 80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Ambient Temperature */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">4. Ambient Temperature</p>
          <div className="flex items-baseline space-x-1 mt-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400">
              {sensors?.temperature?.value != null ? sensors.temperature.value : '--'}
            </h3>
            <span className="text-xs font-semibold text-slate-500">°C</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{sensors?.temperature?.status || 'Waiting for sensor data'}</p>
        </div>

        {/* Card 5: Humidity */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">5. Humidity</p>
          <div className="flex items-baseline space-x-1 mt-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
              {sensors?.humidity?.value != null ? sensors.humidity.value : '--'}
            </h3>
            <span className="text-xs font-semibold text-slate-500">%</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{sensors?.humidity?.status || 'Waiting for sensor data'}</p>
        </div>

        {/* Card 6: AI Plant Analysis */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4. AI Plant Analysis
              </p>
              <h3 className="text-lg font-bold mt-1 text-slate-900 dark:text-white truncate">
                {latestScan?.diseaseDetected || 'Waiting for analysis'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{latestScan?.confidence != null ? `${latestScan.confidence}%` : '--'}</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
              <img 
                src={toImageSrc(latestScan?.thumbnail || latestScan?.image || GENERIC_TURMERIC_LEAF_SVG)} 
                alt="Turmeric Plant" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              {latestScan?.timestamp || 'No analysis yet'}
            </span>
            <button 
              onClick={() => onNavigate('plant-analysis')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Analyze New</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
