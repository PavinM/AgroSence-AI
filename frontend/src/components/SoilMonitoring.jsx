import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Clock, 
  Layers, 
  RefreshCw, 
  ArrowUpDown, 
  Database,
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react';
import { getSensorHistory } from '../services/sensorService';

export default function SoilMonitoring({ sensors, onRefreshSensors }) {
  const [historyReadings, setHistoryReadings] = useState([]);
  const [limit, setLimit] = useState(20);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Fetch MongoDB history table data
  const fetchTableData = async () => {
    setIsLoadingHistory(true);
    setHistoryError('');
    try {
      const data = await getSensorHistory(limit);
      setHistoryReadings(data);
    } catch (err) {
      console.warn('Failed to load sensor history table data:', err);
      setHistoryReadings([]);
      setHistoryError('Unable to load sensor data.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchTableData();
    const interval = setInterval(fetchTableData, 30000);
    window.addEventListener('agrosense:sync', fetchTableData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('agrosense:sync', fetchTableData);
    };
  }, [limit]);

  const handleManualRefresh = async () => {
    setIsRefreshingLocal(true);
    if (onRefreshSensors) {
      await onRefreshSensors();
    }
    await fetchTableData();
    setTimeout(() => setIsRefreshingLocal(false), 500);
  };

  // Sort readings according to sortOrder
  const displayedReadings = [...historyReadings].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const sensorList = [
    {
      id: 'moisture',
      label: 'Soil Moisture',
      value: sensors?.moisture?.value,
      unit: '%',
      status: sensors?.moisture?.status,
      icon: Droplets,
      iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400',
      minOptimal: 60,
      maxOptimal: 80,
      minVal: 0,
      maxVal: 100,
      lastUpdated: sensors?.moisture?.lastUpdated,
      source: 'Capacitive Sensor (GPIO 34)',
      description: 'Soil moisture content for root development and rhizome growth. Optimal: 60-80%.'
    },
    {
      id: 'temperature',
      label: 'Temperature',
      value: sensors?.temperature?.value,
      unit: '°C',
      status: sensors?.temperature?.status,
      icon: Thermometer,
      iconBg: 'bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400',
      minOptimal: 20,
      maxOptimal: 35,
      minVal: 0,
      maxVal: 60,
      lastUpdated: sensors?.temperature?.lastUpdated,
      source: 'DHT11 Sensor (GPIO 4)',
      description: 'Ambient air temperature. Turmeric foliage grows best between 20-35°C.'
    },
    {
      id: 'humidity',
      label: 'Humidity',
      value: sensors?.humidity?.value,
      unit: '%',
      status: sensors?.humidity?.status,
      icon: Wind,
      iconBg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400',
      minOptimal: 60,
      maxOptimal: 85,
      minVal: 0,
      maxVal: 100,
      lastUpdated: sensors?.humidity?.lastUpdated,
      source: 'DHT11 Sensor (GPIO 4)',
      description: 'Ambient relative humidity. Optimal levels prevent foliar moisture stress.'
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

  const formatTimestamp = (rawTs) => {
    if (!rawTs) return 'Just now';
    try {
      const d = new Date(rawTs);
      return d.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch {
      return rawTs;
    }
  };

  return (
    <section className="mb-8 space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span>Section 2 — Live ESP32 Sensor Monitoring</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Current real-time readings from ESP32 Dev Board + Soil Moisture + DHT11 (updates automatically)
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshingLocal}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLocal ? 'animate-spin text-emerald-500' : ''}`} />
          <span>Refresh Readings</span>
        </button>
      </div>

      {/* CURRENT READINGS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sensorList.map((item) => {
          const Icon = item.icon;
          const hasValue = Number.isFinite(item.value);
          const percentage = hasValue ? Math.min(Math.max(((item.value - item.minVal) / (item.maxVal - item.minVal)) * 100, 5), 100) : 0;

          return (
            <div key={item.id} className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Target: {item.minOptimal} – {item.maxOptimal} {item.unit}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(item.status)}`}>
                    {item.status || 'Waiting for sensor data'}
                  </span>
                </div>

                <div className="mt-4 mb-2 flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {hasValue ? item.value : '--'}
                    </span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {item.unit}
                    </span>
                  </div>
                </div>

                {/* Progress meter */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {hasValue ? item.description : 'No live reading available yet.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Updated: {item.lastUpdated}</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium break-words" title={item.source}>
                  {item.source}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SENSOR HISTORY TABLE (MongoDB Atlas Persistent Telemetry) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>Sensor History Table</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                  <Database className="w-2.5 h-2.5" />
                  <span>MongoDB Atlas</span>
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Persistent telemetry log captured from physical sensors
              </p>
            </div>
          </div>

          {/* Table Controls: Limit & Sort & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 text-[11px]">Rows:</span>
              {[20, 50, 100].map((num) => (
                <button
                  key={num}
                  onClick={() => setLimit(num)}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    limit === num
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition-colors"
              title="Toggle sorting order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            <button
              onClick={fetchTableData}
              disabled={isLoadingHistory}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Refresh table data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Soil Moisture</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Humidity</th>
                <th className="py-3 px-4 text-right">Device ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {historyError ? (
                <tr><td colSpan="5" className="py-8 text-center text-rose-600 dark:text-rose-400">{historyError}</td></tr>
              ) : displayedReadings.length > 0 ? (
                displayedReadings.map((reading, idx) => (
                  <tr key={reading.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {formatTimestamp(reading.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {reading.soil_moisture ?? reading.Soil_Moisture} %
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {reading.temperature ?? reading.Ambient_Temperature} °C
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {reading.humidity ?? reading.Humidity} %
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-400 font-mono">
                      {reading.device_id || 'ESP32_001'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                    {isLoadingHistory ? (
                      <span className="inline-flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                        <span>Loading historical telemetry from MongoDB Atlas...</span>
                      </span>
                    ) : (
                      <span>No sensor readings recorded in MongoDB Atlas yet. Readings will appear once ESP32 transmits telemetry.</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
