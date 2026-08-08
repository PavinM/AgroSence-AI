import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';
import { LineChart as ChartIcon, Calendar } from 'lucide-react';
import { getHistoricalSensorData } from '../services/sensorService';

export default function SensorCharts() {
  const [timeframe, setTimeframe] = useState('24h');
  const [activeChart, setActiveChart] = useState('all'); // 'all', 'moisture', 'ph', 'npk'

  const chartData = getHistoricalSensorData(timeframe);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between space-x-4 my-1">
              <span className="flex items-center space-x-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span>{entry.name}:</span>
              </span>
              <strong className="font-semibold">{entry.value} {entry.unit || ''}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ChartIcon className="w-5 h-5 text-emerald-500" />
            <span>Section 3 — Sensor Telemetry Charts</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Interactive temporal trend monitoring for field soil health parameters
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center space-x-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <Calendar className="w-4 h-4 ml-2 text-slate-500 hidden xs:inline" />
          {['24h', '7d', '30d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tf === '24h' ? '24 Hours' : tf === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Selector Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All Indicators' },
          { id: 'moisture', label: 'Soil Moisture (%)' },
          { id: 'ph', label: 'Soil pH' },
          { id: 'npk', label: 'NPK Nutrients (mg/kg)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              activeChart === tab.id
                ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Soil Moisture Chart */}
        {(activeChart === 'all' || activeChart === 'moisture') && (
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Soil Moisture Over Time</span>
              </h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                Target 60-80%
              </span>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[40, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="moisture" 
                    name="Moisture" 
                    unit="%"
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Soil pH Chart */}
        {(activeChart === 'all' || activeChart === 'ph') && (
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Soil pH Over Time</span>
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                Ideal 5.5-6.8
              </span>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[5.0, 7.5]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="ph" 
                    name="Soil pH" 
                    unit="pH"
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* NPK Readings Chart */}
        {(activeChart === 'all' || activeChart === 'npk') && (
          <div className={`glass-card p-5 rounded-2xl ${activeChart === 'all' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>NPK Nutrients (Nitrogen, Phosphorus, Potassium) Over Time</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Unit: mg/kg
              </span>
            </div>
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar dataKey="nitrogen" name="Nitrogen (N)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="phosphorus" name="Phosphorus (P)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="potassium" name="Potassium (K)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
