import React, { useRef, useState } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Info,
  Image as ImageIcon,
  WifiOff,
} from "lucide-react";

import {
  analyzePlantImage,
  formatDiseaseName,
} from "../services/plantAiService";

export default function PlantAiAnalysis({ onAnalysisComplete }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // -----------------------------------------------------
  // FILE / CAMERA IMAGE
  // -----------------------------------------------------

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setSelectedFile(file);
    setAnalysisResult(null);

    const reader = new FileReader();

    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // -----------------------------------------------------
  // RESET
  // -----------------------------------------------------

  const resetAnalysis = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setLoadingStep("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  // -----------------------------------------------------
  // REAL AGROSENSE AI ANALYSIS
  // -----------------------------------------------------

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError(
        "Please upload or capture a turmeric leaf image before analysis."
      );

      return;
    }

    setError("");
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      setLoadingStep(
        "Uploading turmeric leaf image to AgroSense AI..."
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      setLoadingStep(
        "Preprocessing leaf image..."
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      setLoadingStep(
        "Running ONNX turmeric disease classification..."
      );

      const result =
        await analyzePlantImage(selectedFile);

      setLoadingStep(
        "Preparing disease diagnosis..."
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 250)
      );

      console.log(
        "REAL AGROSENSE AI RESULT:",
        result
      );

      setAnalysisResult(result);

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error(
        "AgroSense AI analysis failed:",
        err
      );

      setError(
        err?.message ||
          "Plant analysis failed. Make sure the AgroSense AI backend is running."
      );
    } finally {
      setIsAnalyzing(false);
      setLoadingStep("");
    }
  };

  // -----------------------------------------------------
  // UI HELPERS
  // -----------------------------------------------------

  const getConditionBadge = (condition) => {
    if (condition === "Healthy") {
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    }

    return "bg-red-500/20 text-red-300 border border-red-500/30";
  };

  const getSeverityStyle = (severity) => {
    switch (
      String(severity || "").toLowerCase()
    ) {
      case "critical":
        return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800";

      case "high":
        return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800";

      case "medium":
        return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800";

      case "low":
        return "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800";

      default:
        return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800";
    }
  };

  const diseaseName = analysisResult
    ? formatDiseaseName(
        analysisResult.prediction ||
          analysisResult.disease
      )
    : "";

  const probabilities =
    analysisResult?.probabilities || {};

  // -----------------------------------------------------
  // COMPONENT
  // -----------------------------------------------------

  return (
    <section className="mb-8">
      {/* TITLE */}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />

            <span>
              Section 4 — Turmeric Plant AI Analysis
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time ONNX computer vision disease
            detection for Aphids Disease, Blotch,
            Healthy Leaf and Leaf Spot
          </p>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-4 sm:p-8 relative overflow-hidden">
        {/* CAMERA */}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* FILE UPLOAD */}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================================================= */}
          {/* LEFT */}
          {/* ================================================= */}

          <div className="lg:col-span-5 space-y-6">
            {/* BUTTONS */}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  cameraInputRef.current?.click()
                }
                disabled={isAnalyzing}
                className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-5 h-5 shrink-0" />

                <span>Take Photo</span>
              </button>

              <button
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={isAnalyzing}
                className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm transition-all duration-200 active:scale-95 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                <Upload className="w-5 h-5 shrink-0" />

                <span>Upload Image</span>
              </button>
            </div>

            {/* REAL AI NOTICE */}

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />

                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    AgroSense AI Model
                  </p>

                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Uploaded images are analyzed using
                    your trained turmeric disease ONNX
                    model.
                  </p>
                </div>
              </div>
            </div>

            {/* IMAGE PREVIEW */}

            <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-hidden aspect-video sm:aspect-square flex items-center justify-center">
              {selectedImage ? (
                <div className="relative w-full h-full group">
                  <img
                    src={selectedImage}
                    alt="Turmeric Leaf Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* SCANNER */}

                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scanner-line" />

                      <div className="z-10 bg-slate-900/90 text-white px-4 py-3 rounded-2xl border border-slate-700 text-center shadow-xl max-w-xs">
                        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />

                        <p className="font-bold text-sm text-emerald-400">
                          Analyzing turmeric plant...
                        </p>

                        <p className="text-[11px] text-slate-300 mt-1">
                          {loadingStep}
                        </p>
                      </div>
                    </div>
                  )}

                  {!isAnalyzing && (
                    <button
                      onClick={resetAnalysis}
                      className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md transition-transform hover:scale-110"
                      title="Clear photo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8 text-emerald-500" />
                  </div>

                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Select Turmeric Leaf
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Take a clear field photo or upload a
                    turmeric leaf image.
                  </p>
                </div>
              )}
            </div>

            {/* FILE INFORMATION */}

            {selectedFile && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>
                  <strong>Image:</strong>{" "}
                  {selectedFile.name}
                </p>

                <p className="mt-1">
                  <strong>Size:</strong>{" "}
                  {(
                    selectedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </p>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <div className="flex gap-3">
                  <WifiOff className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />

                  <div>
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      Analysis Error
                    </p>

                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYZE */}

            {selectedImage && !isAnalyzing && (
              <button
                onClick={handleAnalyze}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-bold text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />

                <span>
                  Analyze Turmeric Plant
                </span>
              </button>
            )}
          </div>

          {/* ================================================= */}
          {/* RIGHT */}
          {/* ================================================= */}

          <div className="lg:col-span-7">
            {isAnalyzing ? (
              /* LOADING */

              <div className="h-full min-h-[360px] flex flex-col items-center justify-center p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-900 border-t-emerald-500 animate-spin" />

                  <div
                    className="absolute inset-2 rounded-full border-4 border-teal-200 dark:border-teal-900 border-b-teal-400 animate-spin"
                    style={{
                      animationDirection:
                        "reverse",
                      animationDuration: "1.5s",
                    }}
                  />

                  <Sparkles className="w-8 h-8 text-emerald-500 absolute inset-0 m-auto" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  AgroSense AI is analyzing...
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                  {loadingStep}
                </p>

                <p className="text-[11px] text-slate-400 mt-3">
                  ONNX Turmeric Disease Classification
                </p>
              </div>
            ) : analysisResult ? (
              /* ================================================= */
              /* RESULTS */
              /* ================================================= */

              <div className="space-y-6">
                {/* RESULT HEADER */}

                <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Crop:{" "}
                          {analysisResult.crop ||
                            "Turmeric"}
                        </span>

                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getConditionBadge(
                            analysisResult.condition
                          )}`}
                        >
                          Condition:{" "}
                          {analysisResult.condition}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
                        {diseaseName}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1">
                        AgroSense AI Disease Prediction
                      </p>
                    </div>

                    {/* CONFIDENCE */}

                    <div className="sm:text-right shrink-0 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">
                        AI Confidence
                      </p>

                      <p className="text-2xl font-black text-emerald-400">
                        {Number(
                          analysisResult.confidence
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                  </div>

                  {/* CONFIDENCE BAR */}

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                      <span>
                        Model Confidence Score
                      </span>

                      <span className="text-emerald-400">
                        {Number(
                          analysisResult.confidence
                        ).toFixed(2)}
                        %
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            Number(
                              analysisResult.confidence
                            ) || 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ============================================= */}
                {/* PROBABILITIES */}
                {/* ============================================= */}

                <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Multi-Class AI Probability
                    Distribution
                  </h4>

                  <div className="space-y-3">
                    {Object.entries(
                      probabilities
                    ).map(
                      ([
                        className,
                        probability,
                      ]) => {
                        const friendlyName =
                          formatDiseaseName(
                            className
                          );

                        const predicted =
                          className ===
                            analysisResult.prediction ||
                          friendlyName ===
                            diseaseName;

                        const probabilityNumber =
                          Number(probability) || 0;

                        return (
                          <div key={className}>
                            <div className="flex justify-between text-xs mb-1">
                              <span
                                className={`font-semibold ${
                                  predicted
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {friendlyName}

                                {predicted &&
                                  " ✓ (Detected)"}
                              </span>

                              <span
                                className={`font-bold ${
                                  predicted
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-400"
                                }`}
                              >
                                {probabilityNumber.toFixed(
                                  2
                                )}
                                %
                              </span>
                            </div>

                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  predicted
                                    ? "bg-emerald-500"
                                    : "bg-slate-300 dark:bg-slate-700"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    probabilityNumber,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* ============================================= */}
                {/* DIAGNOSTICS */}
                {/* ============================================= */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SYMPTOMS */}

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-500" />

                      <span>
                        Identified Symptoms
                      </span>
                    </h4>

                    {analysisResult.symptoms
                      ?.length ? (
                      <ul className="space-y-2">
                        {analysisResult.symptoms.map(
                          (symptom, index) => (
                            <li
                              key={index}
                              className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex gap-2"
                            >
                              <span className="text-amber-500">
                                •
                              </span>

                              <span>{symptom}</span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No symptoms reported.
                      </p>
                    )}
                  </div>

                  {/* SEVERITY */}

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-500" />

                      <span>
                        Crop Disease Severity
                      </span>
                    </h4>

                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold ${getSeverityStyle(
                        analysisResult.severity
                      )}`}
                    >
                      {analysisResult.condition ===
                      "Healthy"
                        ? "Healthy"
                        : `${
                            analysisResult.severity ||
                            "Unknown"
                          } Risk`}
                    </span>

                    <p className="text-[11px] text-slate-400 mt-3">
                      Severity assessment generated
                      from the AgroSense AI diagnosis.
                    </p>
                  </div>
                </div>

                {/* ============================================= */}
                {/* ACTION PLAN */}
                {/* ============================================= */}

                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 mb-3 flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />

                    <span>
                      Recommended Agronomic Action
                      Plan
                    </span>
                  </h4>

                  {analysisResult
                    .recommended_action?.length ? (
                    <ol className="space-y-2">
                      {analysisResult.recommended_action.map(
                        (action, index) => (
                          <li
                            key={index}
                            className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed flex gap-3"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {index + 1}
                            </span>

                            <span>{action}</span>
                          </li>
                        )
                      )}
                    </ol>
                  ) : (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      Continue monitoring the turmeric
                      plant.
                    </p>
                  )}
                </div>

                {/* NEW ANALYSIS */}

                <button
                  onClick={resetAnalysis}
                  className="w-full py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />

                  Analyze Another Leaf
                </button>
              </div>
            ) : (
              /* EMPTY */

              <div className="h-full min-h-[360px] flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <Info className="w-12 h-12 text-slate-400 mb-3" />

                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  AI Diagnostic Ready
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Upload or capture a turmeric leaf
                  image to perform diagnosis using the
                  AgroSense AI ONNX model.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {[
                    "Aphids Disease",
                    "Blotch",
                    "Healthy Leaf",
                    "Leaf Spot",
                  ].map((item) => (
                    <span
                      key={item}
                      className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}