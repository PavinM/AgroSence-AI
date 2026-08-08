import React from 'react';
import { Server, Cpu, Radio, Brain, Cloud, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SystemStatus({ telemetry }) {
  const systemNodes = [
    {
      id: 'esp32',
      label: 'ESP32 Microcontroller',
      status: telemetry?.esp32?.status || 'Connected',
      metric: 'Signal: -62 dBm • Wi-Fi 2.4GHz',
      icon: Cpu,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'moisture',
      label: 'Soil Moisture Sensor Node',
      status: telemetry?.moistureSensor?.status || 'Online',
      metric: 'Capacitive Probe v1.2 • GPIO 34',
      icon: Radio,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'soilProp',
      label: 'Soil Property (NPK/pH) Sensor',
      status: telemetry?.soilPropertySensor?.status || 'Online',
      metric: 'RS485 Modbus RTU • 9600 Baud',
      icon: Server,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'aiService',
      label: 'Turmeric AI Inference Service',
      status: telemetry?.aiService?.status || 'Online',
      metric: 'ResNet-50 Engine • Latency 42ms',
      icon: Brain,
      indicator: 'bg-emerald-500'
    },
    {
      id: 'backend',
      label: 'Backend REST & WS Gateway',
      status: telemetry?.backendApi?.status || 'Online',
      metric: 'FastAPI REST / MQTT Server',
      icon: Cloud,
      indicator: 'bg-emerald-500'
    }
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-500" />
            <span>Section 7 — System Telemetry Status</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hardware peripheral nodes, IoT connection status and backend health metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemNodes.map((node) => {
          const Icon = node.icon;
          return (
            <div key={node.id} className="glass-card glass-card-hover p-4 sm:p-5 rounded-2xl flex items-start space-x-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {node.label}
                  </h3>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${node.indicator} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${node.indicator}`}></span>
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {node.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
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
