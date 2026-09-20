import React, { useState } from 'react';
import { History, Eye, CheckCircle, AlertTriangle, ExternalLink, Database, RefreshCw, Sprout } from 'lucide-react';
import { toImageSrc, BLOTCH_TURMERIC_LEAF_SVG, GENERIC_TURMERIC_LEAF_SVG } from '../services/plantAiService';
import AnalysisDetailModal from './AnalysisDetailModal';

export default function RecentAnalyses({ scanHistory = [], onRefresh, isLoading = false, error = '' }) {
  const [selectedScan, setSelectedScan] = useState(null);

  const formatTimestamp = (raw) => {
    if (!raw) return 'Just now';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return raw;
    }
  };

  const getThumbnail = (scan) => {
    if (scan.thumbnail) return toImageSrc(scan.thumbnail);
    if (scan.image) return toImageSrc(scan.image);
    // Dynamic leaf illustration placeholder based on disease
    const diseaseName = scan.disease || scan.prediction || scan.diseasePredicted || '';
    if (diseaseName.toLowerCase().includes('healthy')) {
      return GENERIC_TURMERIC_LEAF_SVG;
    }
    return BLOTCH_TURMERIC_LEAF_SVG;
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-500" />
            <span>Section 6 — Recent Plant Analyses</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Historical diagnostic records and computer vision audit log in MongoDB Atlas
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Database className="w-3 h-3" />
            <span>MongoDB Atlas</span>
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Refresh plant history"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Sample</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Crop</th>
                <th className="py-3.5 px-4">Disease Prediction</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {isLoading ? (
                <tr><td colSpan="8" className="py-8 text-center text-slate-500 dark:text-slate-400">Loading plant analysis history...</td></tr>
              ) : error ? (
                <tr><td colSpan="8" className="py-8 text-center text-rose-600 dark:text-rose-400">Unable to load plant analysis history.</td></tr>
              ) : scanHistory && scanHistory.length > 0 ? (
                scanHistory.map((scan, idx) => {
                  const disease = scan.disease || scan.diseasePredicted || scan.prediction || 'Unknown Disease';
                  const condition = scan.condition || (disease.toLowerCase().includes('healthy') ? 'Healthy' : 'Unhealthy');
                  const severity = scan.severity || (condition === 'Healthy' ? 'None' : 'Medium');

                  return (
                    <tr key={scan.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <img 
                            src={getThumbnail(scan)} 
                            alt={disease} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {formatTimestamp(scan.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {scan.crop || 'Turmeric'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {disease}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {scan.confidence}%
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden hidden lg:block">
                            <div 
                              className="bg-emerald-500 h-full rounded-full" 
                              style={{ width: `${Math.min(scan.confidence, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          severity === 'None'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : severity === 'Low'
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                            : severity === 'High'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                        }`}>
                          {severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          condition === 'Healthy'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {condition === 'Healthy' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>{condition}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedScan({
                            ...scan,
                            diseaseDetected: disease,
                            diseasePredicted: disease,
                            thumbnail: getThumbnail(scan)
                          })}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors inline-flex items-center space-x-1 font-semibold text-xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                    No plant disease scans recorded in MongoDB Atlas yet. Upload a turmeric leaf image above to analyze and record diagnostics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">Loading plant analysis history...</div>
          ) : error ? (
            <div className="p-6 text-center text-rose-600 dark:text-rose-400">Unable to load plant analysis history.</div>
          ) : scanHistory && scanHistory.length > 0 ? (
            scanHistory.map((scan, idx) => {
              const disease = scan.disease || scan.diseasePredicted || scan.prediction || 'Unknown Disease';
              const condition = scan.condition || 'Unhealthy';

              return (
                <div key={scan.id || idx} className="p-4 flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img 
                      src={getThumbnail(scan)} 
                      alt={disease} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {disease}
                        </h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          condition === 'Healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {condition}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatTimestamp(scan.timestamp)} • <strong className="text-emerald-600">{scan.confidence}%</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedScan({
                      ...scan,
                      diseaseDetected: disease,
                      diseasePredicted: disease,
                      thumbnail: getThumbnail(scan)
                    })}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              No plant disease scans recorded in MongoDB Atlas yet.
            </div>
          )}
        </div>

      </div>

      {/* Detail Modal */}
      {selectedScan && (
        <AnalysisDetailModal 
          scan={selectedScan} 
          onClose={() => setSelectedScan(null)} 
        />
      )}
    </section>
  );
}
