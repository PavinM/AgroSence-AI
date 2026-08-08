import React from 'react';
import { Droplets, TestTube, Zap, Activity, Clock, Layers } from 'lucide-react';

export default function SoilMonitoring({ sensors }) {
  const sensorList = [
    {
      id: 'moisture',
      label: 'Soil Moisture',
      value: sensors?.moisture?.value || 64.5,
      unit: '%',
      status: sensors?.moisture?.status || 'Optimal',
      icon: Droplets,
      iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400',
      minOptimal: 60,
      maxOptimal: 80,
      minVal: 0,
      maxVal: 100,
      lastUpdated: sensors?.moisture?.lastUpdated || 'Just now',
      description: 'Maintains cellular turgor and rhizome swelling.'
    },
    {
      id: 'ph',
      label: 'Soil pH Level',
      value: sensors?.ph?.value || 6.2,
      unit: 'pH',
      status: sensors?.ph?.status || 'Optimal',
      icon: TestTube,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
      minOptimal: 5.5,
      maxOptimal: 6.8,
      minVal: 0,
      maxVal: 14,
      lastUpdated: sensors?.ph?.lastUpdated || 'Just now',
      description: 'Ideal range (5.5-6.5) for curcumin uptake.'
    },
    {
      id: 'nitrogen',
      label: 'Nitrogen (N)',
      value: sensors?.nitrogen?.value || 128,
      unit: 'mg/kg',
      status: sensors?.nitrogen?.status || 'Optimal',
      icon: Zap,
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400',
      minOptimal: 100,
      maxOptimal: 150,
      minVal: 0,
      maxVal: 300,
      lastUpdated: sensors?.nitrogen?.lastUpdated || 'Just now',
      description: 'Essential for vegetative foliage canopy.'
    },
    {
      id: 'phosphorus',
      label: 'Phosphorus (P)',
      value: sensors?.phosphorus?.value || 52,
      unit: 'mg/kg',
      status: sensors?.phosphorus?.status || 'Optimal',
      icon: Layers,
      iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400',
      minOptimal: 40,
      maxOptimal: 70,
      minVal: 0,
      maxVal: 150,
      lastUpdated: sensors?.phosphorus?.lastUpdated || 'Just now',
      description: 'Promotes deep root & rhizome branching.'
    },
    {
      id: 'potassium',
      label: 'Potassium (K)',
      value: sensors?.potassium?.value || 165,
      unit: 'mg/kg',
      status: sensors?.potassium?.status || 'Optimal',
      icon: Activity,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400',
      minOptimal: 120,
      maxOptimal: 180,
      minVal: 0,
      maxVal: 300,
      lastUpdated: sensors?.potassium?.lastUpdated || 'Just now',
      description: 'Enhances disease resistance & starch yield.'
    }
  ];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Optimal':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Low':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'High':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span>Section 2 — Real-Time Soil Monitoring</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Turmeric soil moisture, pH & primary macro-nutrients (N, P, K)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensorList.map((item) => {
          const Icon = item.icon;
          const percentage = Math.min(Math.max(((item.value - item.minVal) / (item.maxVal - item.minVal)) * 100, 5), 100);

          return (
            <div key={item.id} className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Optimum: {item.minOptimal} – {item.maxOptimal} {item.unit}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 mb-2 flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {item.value}
                    </span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {item.unit}
                    </span>
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Updated: {item.lastUpdated}</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  RS485 Sensor
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
