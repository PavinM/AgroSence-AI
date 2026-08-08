import React from 'react';
import { X, CheckCircle, AlertTriangle, Sparkles, Calendar, ShieldAlert } from 'lucide-react';
import { DISEASE_PROFILES, TURMERIC_DISEASE_CLASSES, GENERIC_TURMERIC_LEAF_SVG, formatDiseaseName, toImageSrc } from '../services/plantAiService';

export default function AnalysisDetailModal({ scan, onClose }) {
  if (!scan) return null;

  const diseaseName = formatDiseaseName(scan.diseasePredicted || scan.diseaseDetected || scan.prediction || scan.disease || TURMERIC_DISEASE_CLASSES.BLOTCH);
  const profile = DISEASE_PROFILES[diseaseName] || DISEASE_PROFILES[TURMERIC_DISEASE_CLASSES.BLOTCH];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Turmeric AI Diagnosis Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Main Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-40 h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
              <img 
                src={toImageSrc(scan.thumbnail || scan.image || GENERIC_TURMERIC_LEAF_SVG)} 
                alt={diseaseName} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {scan.crop || 'Turmeric Leaf'}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  scan.condition === 'Healthy' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  Condition: {scan.condition}
                </span>
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {diseaseName}
              </h2>
              
              <div className="mt-3 flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  AI Confidence: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{scan.confidence}%</strong>
                </div>
                <div>
                  Date: <strong className="text-slate-700 dark:text-slate-300">{scan.timestamp}</strong>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${scan.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Observed Symptoms</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {scan.symptoms || profile.symptoms}
            </p>
          </div>

          {/* Action Plan */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <h4 className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-1 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Agronomic Action Plan</span>
            </h4>
            <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
              {scan.recommendedAction || profile.recommendedAction}
            </p>
          </div>

          {/* Prevention */}
          {profile.prevention && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <h4 className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300 mb-1 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Long-Term Prevention</span>
              </h4>
              <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                {profile.prevention}
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
