import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend
} from 'recharts';
import { LineChart as ChartIcon, RefreshCw, Database } from 'lucide-react';
import { getSensorHistory } from '../services/sensorService';

export default function SensorCharts() {
  const [activeChart, setActiveChart] = useState('all'); // 'all', 'moisture', 'temperature', 'humidity'
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchChartHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const readings = await getSensorHistory(100);
      setChartData(readings.map((r) => {
        const dateObj = new Date(r.timestamp);
        return {
          timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fullTime: dateObj.toLocaleString(),
          moisture: Number(r.soil_moisture),
          temperature: Number(r.temperature),
          humidity: Number(r.humidity)
        };
      }));
    } catch (err) {
      setChartData([]);
      setError(err.message || 'Unable to load sensor history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartHistory();

    // Auto-update charts every 30 seconds as specified
    const interval = setInterval(() => {
      fetchChartHistory();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1">
            {payload[0]?.payload?.fullTime || label}
          </p>
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
            <span>Section 3 — Historical Sensor Telemetry Graphs</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Temporal trend graphs for physical sensors (Soil Moisture, Ambient Temperature, Humidity)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
            <Database className="w-3 h-3" />
            <span>FastAPI Sensor History</span>
          </span>

          <button
            onClick={fetchChartHistory}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Refresh charts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading sensor history...</p>}
      {!isLoading && error && <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">Unable to load sensor history.</p>}
      {!isLoading && !error && chartData.length === 0 && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No sensor readings available yet.</p>}

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All 3 Physical Channels' },
          { id: 'moisture', label: 'Soil Moisture (%)' },
          { id: 'temperature', label: 'Ambient Temperature (°C)' },
          { id: 'humidity', label: 'Humidity (%)' }
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

      {/* Grid of Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Graph 1: Soil Moisture vs Time */}
        {(activeChart === 'all' || activeChart === 'moisture') && (
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Soil Moisture vs Time</span>
              </h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                Optimal: 60-80%
              </span>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[20, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="moisture" 
                    name="Soil Moisture" 
                    unit="%"
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graph 2: Ambient Temperature vs Time */}
        {(activeChart === 'all' || activeChart === 'temperature') && (
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span>Temperature vs Time</span>
              </h3>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-md">
                Optimal: 20-35°C
              </span>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[10, 50]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    name="Temperature" 
                    unit="°C"
                    stroke="#f97316" 
                    strokeWidth={2.5}
                    dot={{ fill: '#f97316', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graph 3: Humidity vs Time */}
        {(activeChart === 'all' || activeChart === 'humidity') && (
          <div className={`glass-card p-5 rounded-2xl ${activeChart === 'all' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <span>Humidity vs Time</span>
              </h3>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                Optimal: 60-85%
              </span>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[20, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    name="Humidity" 
                    unit="%"
                    stroke="#14b8a6" 
                    strokeWidth={2.5}
                    dot={{ fill: '#14b8a6', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
