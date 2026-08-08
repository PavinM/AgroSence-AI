import React, { useState, useEffect } from 'react';
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
  getSystemStatus 
} from './services/sensorService';

import { 
  INITIAL_RECENT_ANALYSES, 
  TURMERIC_DISEASE_CLASSES, 
  DISEASE_PROFILES,
  BLOTCH_TURMERIC_LEAF_SVG,
  GENERIC_TURMERIC_LEAF_SVG
} from './services/plantAiService';

import {
  INITIAL_SOIL_PREDICTION,
  INITIAL_SOIL_HISTORY,
  predictSoilHealth
} from './services/soilHealthService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  // Soil Telemetry State
  const [sensors, setSensors] = useState(null);
  
  // System Telemetry State
  const [telemetry, setTelemetry] = useState(null);

  // Plant Scan History State
  const [scanHistory, setScanHistory] = useState(INITIAL_RECENT_ANALYSES);

  // Soil Health AI Prediction State & History
  const [soilPrediction, setSoilPrediction] = useState(INITIAL_SOIL_PREDICTION);
  const [soilHistory, setSoilHistory] = useState(INITIAL_SOIL_HISTORY);

  // Latest Plant Scan state for Farm Overview & Recommendations
  const blotchClass =
    TURMERIC_DISEASE_CLASSES?.BLOTCH ||
    TURMERIC_DISEASE_CLASSES?.Blotch ||
    (Array.isArray(TURMERIC_DISEASE_CLASSES)
      ? TURMERIC_DISEASE_CLASSES.find(
          (name) => String(name).toLowerCase() === 'blotch'
        )
      : null) ||
    'Blotch';

  const blotchProfile =
    DISEASE_PROFILES?.[blotchClass] ||
    DISEASE_PROFILES?.Blotch ||
    DISEASE_PROFILES?.BLOTCH ||
    {
      symptoms: [
        'Blotched or discolored regions on the leaf',
        'Affected areas may expand over time'
      ],
      recommendedAction: [
        'Inspect nearby turmeric plants for similar symptoms',
        'Remove severely affected foliage when appropriate',
        'Seek crop-specific disease management guidance if symptoms spread'
      ]
    };

  const defaultBlotchScan = {
    id: 'scan-109',
    timestamp: 'Just now',
    crop: 'Turmeric (Curcuma longa)',
    diseaseDetected: blotchClass,
    diseasePredicted: blotchClass,
    prediction: blotchClass,
    disease: blotchClass,
    confidence: 81.66,
    condition: 'Unhealthy',
    severity: 'High',
    symptoms: blotchProfile.symptoms || [],
    recommendedAction:
      blotchProfile.recommendedAction ||
      blotchProfile.recommended_action ||
      [],
    thumbnail: BLOTCH_TURMERIC_LEAF_SVG,
    image: BLOTCH_TURMERIC_LEAF_SVG
  };

  const [latestScan, setLatestScan] = useState(defaultBlotchScan);

  // Toggle Dark Mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load initial sensor & system data
  const refreshData = async () => {
    setIsRefreshing(true);
    const data = await getRealtimeSensors();
    const system = await getSystemStatus();
    setSensors(data);
    setTelemetry(system);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    refreshData();

    // Periodic sensor telemetry pulse simulation (every 15 seconds)
    const interval = setInterval(() => {
      refreshData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // When user completes a new AI plant scan
  const handleNewAnalysis = (newResult) => {
    const scanItem = {
      ...newResult,
      diseasePredicted: newResult.diseaseDetected,
      thumbnail: newResult.imagePreview || BLOTCH_TURMERIC_LEAF_SVG
    };
    
    setLatestScan(scanItem);
    setScanHistory((prev) => [scanItem, ...prev]);
  };

  // When user completes a new Soil Health prediction
  const handleSoilPredictionUpdate = (newPrediction) => {
    setSoilPrediction(newPrediction);
    const historyRecord = {
      id: `soil-pred-${Date.now().toString().slice(-4)}`,
      timestamp: newPrediction.timestamp || 'Just now',
      health_status: newPrediction.health_status,
      confidence: newPrediction.confidence,
      probabilities: newPrediction.probabilities,
      recommendation: newPrediction.recommendation,
      inputs: newPrediction.inputs
    };
    setSoilHistory((prev) => [historyRecord, ...prev]);
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
          <div>
            <FarmOverview 
              sensors={sensors} 
              latestScan={latestScan} 
              soilPrediction={soilPrediction}
              onNavigate={setActiveTab} 
            />
            <SoilHealthPrediction 
              currentPrediction={soilPrediction}
              onPredictionUpdate={handleSoilPredictionUpdate}
            />
            <SoilMonitoring sensors={sensors} />
            <SensorCharts />
            <PlantAiAnalysis onAnalysisComplete={handleNewAnalysis} />
            <SmartRecommendations 
              sensors={sensors} 
              latestScan={latestScan} 
              soilPrediction={soilPrediction}
              onNavigate={setActiveTab} 
            />
            <RecentAnalyses scanHistory={scanHistory} />
            <SystemStatus telemetry={telemetry} />
          </div>
        )}

        {/* TAB 2: Dedicated Plant AI Analysis Focus */}
        {activeTab === 'plant-analysis' && (
          <div>
            <PlantAiAnalysis onAnalysisComplete={handleNewAnalysis} />
            <RecentAnalyses scanHistory={scanHistory} />
          </div>
        )}

        {/* TAB 3: Dedicated Soil Health Monitoring & AI Model Focus */}
        {activeTab === 'soil-monitoring' && (
          <div>
            <SoilHealthPrediction 
              currentPrediction={soilPrediction}
              onPredictionUpdate={handleSoilPredictionUpdate}
            />
            <SoilHealthHistory historyList={soilHistory} />
            <SoilMonitoring sensors={sensors} />
            <SensorCharts />
            <SmartRecommendations 
              sensors={sensors} 
              latestScan={latestScan} 
              onNavigate={setActiveTab} 
            />
          </div>
        )}

        {/* TAB 4: Dedicated Scan History (Plant & Soil) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <SoilHealthHistory historyList={soilHistory} />
            <RecentAnalyses scanHistory={scanHistory} />
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
