import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import FarmOverview from './components/FarmOverview';
import SoilMonitoring from './components/SoilMonitoring';
import SensorCharts from './components/SensorCharts';
import PlantAiAnalysis from './components/PlantAiAnalysis';
import SmartRecommendations from './components/SmartRecommendations';
import RecentAnalyses from './components/RecentAnalyses';
import SystemStatus from './components/SystemStatus';
import SoilHealthPrediction from './components/SoilHealthPrediction';
import SoilHealthHistory from './components/SoilHealthHistory';

import { 
  getRealtimeSensors, 
  getSystemStatus,
  subscribeToSync
} from './services/sensorService';

import { getSoilHealthHistory } from './services/soilHealthService';
import { getPlantAnalysisHistory } from './services/plantHistoryService';

import {
  BLOTCH_TURMERIC_LEAF_SVG,
  GENERIC_TURMERIC_LEAF_SVG
} from './services/plantAiService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  // Soil Telemetry State (Current readings from ESP32 / MongoDB)
  const [sensors, setSensors] = useState(null);
  
  // System Telemetry State (Nodes + MongoDB Atlas status)
  const [telemetry, setTelemetry] = useState(null);

  const [scanHistory, setScanHistory] = useState([]);

  const [soilPrediction, setSoilPrediction] = useState(null);
  const [soilHistory, setSoilHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Latest Plant Scan state for Farm Overview & Recommendations
  const [latestScan, setLatestScan] = useState(null);

  // Toggle Dark Mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch persistent history from MongoDB Atlas
  const fetchDbHistories = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError('');
    try {
      const [persistedSoil, persistedPlants] = await Promise.all([
        getSoilHealthHistory(50),
        getPlantAnalysisHistory(20)
      ]);

      setSoilHistory(persistedSoil);
      setSoilPrediction(persistedSoil[0] || null);
      setScanHistory(persistedPlants);
      if (persistedPlants.length > 0) {
        const top = persistedPlants[0];
        setLatestScan({
          ...top,
          diseaseDetected: top.disease || top.prediction,
          diseasePredicted: top.disease || top.prediction,
          thumbnail: top.condition === 'Healthy' ? GENERIC_TURMERIC_LEAF_SVG : BLOTCH_TURMERIC_LEAF_SVG
        });
      } else {
        setLatestScan(null);
      }
    } catch (err) {
      console.warn('[App] Error loading MongoDB persistent histories:', err);
      setHistoryError('Unable to load history data.');
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // Periodic refresh also provides a fallback when streaming is unavailable.
  const pollLiveSensors = useCallback(async () => {
    const data = await getRealtimeSensors();
    const system = await getSystemStatus();
    setSensors(data);
    setTelemetry(system);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Full manual refresh
  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([pollLiveSensors(), fetchDbHistories()]);
    setIsRefreshing(false);
  };

  // Setup periodic polling: 10s for sensors, 30s for history
  useEffect(() => {
    refreshData();

    // 10s interval for current sensor readings
    const sensorInterval = setInterval(() => {
      pollLiveSensors();
    }, 10000);

    // 30s interval for database history
    const historyInterval = setInterval(() => {
      fetchDbHistories();
    }, 30000);

    return () => {
      clearInterval(sensorInterval);
      clearInterval(historyInterval);
    };
  }, [pollLiveSensors, fetchDbHistories]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToSync(async (snapshot) => {
      const data = await getRealtimeSensors(snapshot.reading);
      if (!active) return;
      setSensors(data);
      if (snapshot.reading?.timestamp) {
        setLastUpdated(new Date(snapshot.reading.timestamp).toLocaleTimeString());
      }
      fetchDbHistories();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [fetchDbHistories]);

  // When user completes a new AI plant scan
  const handleNewAnalysis = (newResult) => {
    const scanItem = {
      ...newResult,
      diseasePredicted: newResult.diseaseDetected || newResult.disease,
      thumbnail: newResult.imagePreview || BLOTCH_TURMERIC_LEAF_SVG
    };
    
    setLatestScan(scanItem);
    setScanHistory((prev) => [scanItem, ...prev]);

    // Re-fetch persistent records from MongoDB Atlas
    fetchDbHistories();
  };

  // When user completes a new Soil Health prediction
  const handleSoilPredictionUpdate = (newPrediction) => {
    setSoilPrediction(newPrediction);
    fetchDbHistories();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-24 md:pb-12">
      
      {/* Top Header */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Responsive Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Dashboard Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* TAB 1: Main Dashboard View (All Sections Integrated) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <FarmOverview 
              sensors={sensors} 
              latestScan={latestScan} 
              soilPrediction={soilPrediction}
              onNavigate={setActiveTab} 
            />
            <SoilMonitoring sensors={sensors} onRefreshSensors={pollLiveSensors} />
            <SensorCharts />
            <SoilHealthPrediction 
              currentPrediction={soilPrediction}
              sensors={sensors}
              onPredictionUpdate={handleSoilPredictionUpdate}
            />
            <SoilHealthHistory 
              historyList={soilHistory} 
              onRefresh={fetchDbHistories}
              isLoading={isHistoryLoading}
              error={historyError}
            />
            <PlantAiAnalysis onAnalysisComplete={handleNewAnalysis} />
            <RecentAnalyses 
              scanHistory={scanHistory} 
              onRefresh={fetchDbHistories}
              isLoading={isHistoryLoading}
              error={historyError}
            />
            <SmartRecommendations 
              sensors={sensors} 
              latestScan={latestScan} 
              soilPrediction={soilPrediction}
              onNavigate={setActiveTab} 
            />
            <SystemStatus telemetry={telemetry} />
          </div>
        )}

        {/* TAB 2: Dedicated Plant AI Analysis Focus */}
        {activeTab === 'plant-analysis' && (
          <div className="space-y-8">
            <PlantAiAnalysis onAnalysisComplete={handleNewAnalysis} />
            <RecentAnalyses 
              scanHistory={scanHistory} 
              onRefresh={fetchDbHistories}
              isLoading={isHistoryLoading}
              error={historyError}
            />
          </div>
        )}

        {/* TAB 3: Dedicated Soil Health Monitoring & AI Model Focus */}
        {activeTab === 'soil-monitoring' && (
          <div className="space-y-8">
            <SoilMonitoring sensors={sensors} onRefreshSensors={pollLiveSensors} />
            <SensorCharts />
            <SoilHealthPrediction 
              currentPrediction={soilPrediction}
              sensors={sensors}
              onPredictionUpdate={handleSoilPredictionUpdate}
            />
            <SoilHealthHistory 
              historyList={soilHistory} 
              onRefresh={fetchDbHistories} 
            />
            <SmartRecommendations 
              sensors={sensors} 
              latestScan={latestScan} 
              onNavigate={setActiveTab} 
            />
          </div>
        )}

        {/* TAB 4: Dedicated Scan History (Plant & Soil) */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            <SoilHealthHistory 
              historyList={soilHistory} 
              onRefresh={fetchDbHistories} 
            />
            <RecentAnalyses 
              scanHistory={scanHistory} 
              onRefresh={fetchDbHistories} 
            />
          </div>
        )}

        {/* TAB 5: Dedicated Hardware & API System Status */}
        {activeTab === 'system-status' && (
          <div>
            <SystemStatus telemetry={telemetry} />
          </div>
        )}

      </main>

    </div>
  );
}
