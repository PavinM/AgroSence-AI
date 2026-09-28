import React from 'react';
import { Server, Cpu, Radio, Brain, Cloud, CheckCircle2, Database, Thermometer } from 'lucide-react';

export default function SystemStatus({ telemetry }) {
  const isMongoConnected = telemetry?.mongodb?.status === 'Connected';

  const systemNodes = [
    {
      id: 'esp32',
      label: 'ESP32 Microcontroller',
      status: telemetry?.esp32?.status || 'Loading',
      metric: 'Wi-Fi 2.4GHz • IP: 192.168.1.104',
      icon: Cpu,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'moisture',
      label: 'Soil Moisture Sensor',
      status: telemetry?.moistureSensor?.status || 'Loading',
      metric: 'Capacitive Probe v1.2 • GPIO 34 (ADC1)',
      icon: Radio,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'dht11',
      label: 'DHT11 Temp & Humidity',
      status: telemetry?.dht11?.status || 'Loading',
      metric: 'Single-bus Digital • GPIO 4',
      icon: Thermometer,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'aiService',
      label: 'Turmeric ONNX Disease AI',
      status: telemetry?.aiService?.status || 'Loading',
      metric: 'MobileNetV2 / ResNet • CPU Execution',
      icon: Brain,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'soilAiService',
      label: 'Soil Health Random Forest AI',
      status: telemetry?.soilAiService?.status || 'Loading',
      metric: '3-Feature Estimator • Real-Time',
      icon: Brain,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'mongodb',
      label: 'MongoDB Atlas Database',
      status: telemetry?.mongodb?.status || (isMongoConnected ? 'Connected' : 'Offline / Standby'),
      metric: `Database: agrosence_ai • 3 Collections`,
      icon: Database,
      indicator: isMongoConnected ? 'bg-emerald-500' : 'bg-amber-500'
    },
    {
      id: 'backend',
      label: 'FastAPI Backend Gateway',
      status: telemetry?.backendApi?.status || 'Loading',
      metric: 'Uvicorn ASGI • Port 8000',
      icon: Cloud,
      indicator: 'bg-emerald-500'
    }
  ];

  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-500" />
            <span>Section 7 — System Telemetry Status</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hardware peripheral nodes, IoT connection status, AI models, and MongoDB Atlas database
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemNodes.map((node) => {
          const Icon = node.icon;
          const isHealthy = node.status === 'Connected' || node.status === 'Online' || node.status.includes('Loaded');

          return (
            <div key={node.id} className="glass-card glass-card-hover p-4 sm:p-5 rounded-2xl flex items-start space-x-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white break-words">
                    {node.label}
                  </h3>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${node.indicator} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${node.indicator}`}></span>
                    </span>
                    <span className={`text-xs font-extrabold ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {node.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                  {node.metric}
                </p>
                <div className="mt-3 flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Telemetry Operational</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
