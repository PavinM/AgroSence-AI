import React from 'react';

export default function SoilHealthProbabilityChart({ probabilities }) {
  const probList = [
    {
      label: 'Healthy',
      value: probabilities?.['Healthy'] ?? 82.96,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
    },
    {
      label: 'Moderate Stress',
      value: probabilities?.['Moderate Stress'] ?? 12.07,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
    },
    {
      label: 'High Stress',
      value: probabilities?.['High Stress'] ?? 4.97,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        AI Probability Distribution
      </h4>
      {probList.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {item.label}
            </span>
            <span className={`font-bold ${item.textColor}`}>
              {item.value.toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${item.barColor}`}
              style={{ width: `${Math.max(item.value, 2)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
