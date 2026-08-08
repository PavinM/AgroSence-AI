import React, { useState } from 'react';
import { History, CheckCircle2, AlertTriangle, ShieldAlert, Eye, X } from 'lucide-react';
import SoilHealthProbabilityChart from './SoilHealthProbabilityChart';

export default function SoilHealthHistory({ historyList = [] }) {
  const [selectedHistory, setSelectedHistory] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Moderate Stress':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'High Stress':
      default:
        return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-500" />
            <span>Soil Health Prediction History</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Historical soil AI diagnostics and multi-spectral telemetry log
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Soil Health Status</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Primary Recommendation</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {historyList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {item.timestamp}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.health_status)}`}>
                      {item.health_status === 'Healthy' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{item.health_status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                    {item.confidence}%
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {item.recommendation?.[0] || 'Maintain current irrigation'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedHistory(item)}
                      className="px-3 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold text-xs transition-colors inline-flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {historyList.map((item) => (
            <div key={item.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(item.health_status)}`}>
                  {item.health_status}
                </span>
                <span className="text-xs text-slate-400">
                  {item.timestamp}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Confidence:</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {item.confidence}%
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                ✓ {item.recommendation?.[0]}
              </p>

              <button
                onClick={() => setSelectedHistory(item)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1 mt-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Details</span>
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* History Detail Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Soil Health Prediction Log
              </h3>
              <button
                onClick={() => setSelectedHistory(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Timestamp:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{selectedHistory.timestamp}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Soil Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedHistory.health_status)}`}>
                  {selectedHistory.health_status}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Confidence:</span>
                <span className="font-black text-emerald-600 text-sm">{selectedHistory.confidence}%</span>
              </div>

              <div className="pt-2">
                <SoilHealthProbabilityChart probabilities={selectedHistory.probabilities} />
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Recommendations</h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                  {selectedHistory.recommendation?.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setSelectedHistory(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
