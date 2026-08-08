import React, { useState } from 'react';
import { History, Eye, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { INITIAL_RECENT_ANALYSES, toImageSrc } from '../services/plantAiService';
import AnalysisDetailModal from './AnalysisDetailModal';

export default function RecentAnalyses({ scanHistory = INITIAL_RECENT_ANALYSES }) {
  const [selectedScan, setSelectedScan] = useState(null);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-500" />
            <span>Section 6 — Recent Plant Analyses</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Historical diagnostic records and computer vision audit log
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Thumbnail</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Crop</th>
                <th className="py-3.5 px-4">Disease Prediction</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {scanHistory.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      <img 
                        src={toImageSrc(scan.thumbnail)} 
                        alt={scan.diseasePredicted} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {scan.timestamp}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {scan.crop || 'Turmeric Leaf'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {scan.diseasePredicted || scan.diseaseDetected}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {scan.confidence}%
                      </span>
                      <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden hidden lg:block">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${scan.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      scan.condition === 'Healthy'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}>
                      {scan.condition === 'Healthy' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      <span>{scan.condition}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedScan(scan)}
                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors inline-flex items-center space-x-1 font-semibold text-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {scanHistory.map((scan) => (
            <div key={scan.id} className="p-4 flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-3 min-w-0">
                <img 
                  src={toImageSrc(scan.thumbnail || scan.image)} 
                  alt={scan.diseasePredicted} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {scan.diseasePredicted || scan.diseaseDetected}
                    </h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      scan.condition === 'Healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {scan.condition}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {scan.timestamp} • <strong className="text-emerald-600">{scan.confidence}%</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedScan(scan)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))}
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
