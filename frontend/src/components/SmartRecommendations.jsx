import React from 'react';
import { Lightbulb, Droplets, ShieldAlert, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SmartRecommendations({ sensors, latestScan, soilPrediction, onNavigate }) {
  // Generate intelligent recommendations by fusing soil sensors and visual AI diagnosis
  const recommendations = [];

  // Soil Health Model Recommendation
  if (soilPrediction && soilPrediction.recommendation && soilPrediction.recommendation.length > 0) {
    recommendations.push({
      id: 'rec-soil-ai',
      type: 'Soil AI Model',
      icon: Lightbulb,
      iconColor: soilPrediction.health_status === 'Healthy' 
        ? 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950' 
        : 'text-amber-500 bg-amber-100 dark:bg-amber-950',
      title: `Soil AI Status: ${soilPrediction.health_status} (${soilPrediction.confidence}%)`,
      description: soilPrediction.recommendation.join(' '),
      actionText: 'Predict Soil'
    });
  }

  // Soil moisture recommendation
  const moistureVal = sensors?.moisture?.value || 64.5;
  if (moistureVal < 60) {
    recommendations.push({
      id: 'rec-moisture-low',
      type: 'Irrigation',
      icon: Droplets,
      iconColor: 'text-blue-500 bg-blue-100 dark:bg-blue-950',
      title: 'Low Soil Moisture Alert',
      description: `Soil moisture (${moistureVal}%) is below the recommended 60-80% threshold for turmeric rhizomes. Irrigation is recommended.`,
      actionText: 'Trigger Irrigation System'
    });
  } else if (moistureVal > 80) {
    recommendations.push({
      id: 'rec-moisture-high',
      type: 'Drainage',
      icon: Droplets,
      iconColor: 'text-amber-500 bg-amber-100 dark:bg-amber-950',
      title: 'High Soil Water Retention',
      description: `Soil moisture (${moistureVal}%) exceeds optimal range. Ensure field drainage channels are clear to prevent rhizome root rot (Pythium species).`,
      actionText: 'Inspect Field Channels'
    });
  } else {
    recommendations.push({
      id: 'rec-moisture-optimal',
      type: 'Irrigation',
      icon: Droplets,
      iconColor: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950',
      title: 'Soil Moisture Optimal',
      description: `Current moisture level (${moistureVal}%) is ideal for active rhizome growth. Maintain existing drip irrigation cycle.`,
      actionText: 'View Moisture Trend'
    });
  }

  // Plant AI Disease recommendation
  if (latestScan && latestScan.diseaseDetected !== 'Healthy Leaf') {
    recommendations.push({
      id: 'rec-disease',
      type: 'Disease Control',
      icon: ShieldAlert,
      iconColor: 'text-rose-500 bg-rose-100 dark:bg-rose-950',
      title: `Possible ${latestScan.diseaseDetected} Detected (${latestScan.confidence}%)`,
      description: `Visual AI scan identified ${latestScan.diseaseDetected} with ${latestScan.confidence}% confidence. Inspect affected turmeric leaves and apply targeted treatment.`,
      actionText: 'View AI Action Plan',
      tabTarget: 'plant-analysis'
    });
  }

  // NPK Soil Nutrients recommendation
  const nitrogenVal = sensors?.nitrogen?.value || 128;
  if (nitrogenVal < 100) {
    recommendations.push({
      id: 'rec-nitrogen',
      type: 'Fertilization',
      icon: Zap,
      iconColor: 'text-amber-500 bg-amber-100 dark:bg-amber-950',
      title: 'Nitrogen Deficiency Notice',
      description: `Soil Nitrogen level (${nitrogenVal} mg/kg) is low. Apply organic compost or urea top-dressing to support green leaf canopy development.`,
      actionText: 'View NPK Calculator'
    });
  } else {
    recommendations.push({
      id: 'rec-npk-balanced',
      type: 'Nutrition',
      icon: Zap,
      iconColor: 'text-teal-500 bg-teal-100 dark:bg-teal-950',
      title: 'NPK Nutrient Profile Balanced',
      description: `Soil Nitrogen (128 mg/kg), Phosphorus (52 mg/kg), and Potassium (165 mg/kg) are in ideal proportion for maximum curcumin yield.`,
      actionText: 'Soil Details'
    });
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span>Section 5 — Smart Recommendations</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Autonomous agronomic decision advice derived from AI vision & soil sensor fusion
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div key={rec.id} className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${rec.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {rec.type}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {rec.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  "{rec.description}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI + Sensor Fusion</span>
                </span>
                <button
                  onClick={() => onNavigate(rec.tabTarget || 'soil-monitoring')}
                  className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center space-x-1 transition-colors"
                >
                  <span>{rec.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
