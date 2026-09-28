import io
import os
import sys
import json
import numpy as np
import onnxruntime as ort

from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles


# ------------------------------------------------
# Paths & Environment
# ------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

ai_venv_site = os.path.join(PROJECT_DIR, "ai", "venv", "Lib", "site-packages")
if os.path.exists(ai_venv_site) and ai_venv_site not in sys.path:
    sys.path.insert(0, ai_venv_site)


# ------------------------------------------------
# App
# ------------------------------------------------

app = FastAPI(
    title="AgroSense AI API",
    version="1.0.0"
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if allowed_origins_env:
    if allowed_origins_env.strip() == "*":
        allowed_origins = ["*"]
    else:
        allowed_origins.extend([o.strip() for o in allowed_origins_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------
# Database Connection (MongoDB Atlas)
# ------------------------------------------------

try:
    from backend import database as db
except ImportError:
    import database as db

@app.on_event("startup")
async def startup_db():
    """Attempt initial MongoDB Atlas index creation on startup if reachable."""
    try:
        if db.is_mongodb_connected():
            db.init_db_indexes()
            print("[AgroSense AI] Connected to MongoDB Atlas persistent storage.")
        else:
            print("[AgroSense AI] MongoDB Atlas not yet connected or offline. Running with fallback buffer.")
    except Exception as e:
        print(f"[AgroSense AI] MongoDB startup notice: {e}")


MODEL_DIR = os.path.join(
    PROJECT_DIR,
    "ai",
    "model"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "turmeric_model.onnx"
)

CLASS_PATH = os.path.join(
    MODEL_DIR,
    "class_info.json"
)



# ------------------------------------------------
# Load classes
# ------------------------------------------------

with open(CLASS_PATH, "r", encoding="utf-8") as f:
    class_info = json.load(f)

class_names = class_info["classes"]


# ------------------------------------------------
# Load ONNX model once
# ------------------------------------------------

session = ort.InferenceSession(
    MODEL_PATH,
    providers=["CPUExecutionProvider"]
)

input_name = session.get_inputs()[0].name


# ------------------------------------------------
# Disease information
# ------------------------------------------------

DISEASE_INFO = {
    "Aphids_Disease": {
        "display_name": "Aphids Disease",
        "condition": "Unhealthy",
        "severity": "Medium",
        "symptoms": [
            "Possible aphid infestation on turmeric foliage",
            "Leaf curling or distortion may occur",
            "Reduced plant vigor may be observed"
        ],
        "recommended_action": [
            "Inspect the underside of affected leaves",
            "Isolate heavily affected plants where practical",
            "Consult local agricultural guidance for suitable aphid management"
        ]
    },

    "Blotch": {
        "display_name": "Blotch",
        "condition": "Unhealthy",
        "severity": "Medium",
        "symptoms": [
            "Blotched or discolored regions on the leaf",
            "Affected areas may expand over time"
        ],
        "recommended_action": [
            "Inspect nearby turmeric plants for similar symptoms",
            "Remove severely affected foliage when appropriate",
            "Seek crop-specific disease management guidance if symptoms spread"
        ]
    },

    "Healthy_Leaf": {
        "display_name": "Healthy Leaf",
        "condition": "Healthy",
        "severity": "None",
        "symptoms": [
            "No supported disease class strongly detected"
        ],
        "recommended_action": [
            "Continue regular crop monitoring",
            "Maintain appropriate irrigation and soil nutrient conditions"
        ]
    },

    "Leaf_Spot": {
        "display_name": "Leaf Spot",
        "condition": "Unhealthy",
        "severity": "Medium",
        "symptoms": [
            "Visible spots or lesions on turmeric leaves",
            "Leaf discoloration may occur around affected regions"
        ],
        "recommended_action": [
            "Monitor whether spots are spreading",
            "Remove severely affected foliage when appropriate",
            "Consult local agricultural guidance for disease management"
        ]
    }
}


# ------------------------------------------------
# Prediction
# ------------------------------------------------

def analyze_image(image_bytes):

    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")

    image = image.resize((224, 224))

    image_array = np.asarray(
        image,
        dtype=np.float32
    )

    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    outputs = session.run(
        None,
        {input_name: image_array}
    )

    probabilities = outputs[0][0]

    predicted_index = int(
        np.argmax(probabilities)
    )

    predicted_class = class_names[
        predicted_index
    ]

    confidence = float(
        probabilities[predicted_index] * 100
    )

    disease = DISEASE_INFO[predicted_class]

    probability_data = {}

    for name, probability in zip(
        class_names,
        probabilities
    ):
        probability_data[name] = round(
            float(probability * 100),
            2
        )

    return {
        "crop": "Turmeric",
        "condition": disease["condition"],
        "prediction": predicted_class,
        "disease": disease["display_name"],
        "confidence": round(confidence, 2),
        "severity": disease["severity"],
        "probabilities": probability_data,
        "symptoms": disease["symptoms"],
        "recommended_action": disease["recommended_action"]
    }


# ------------------------------------------------
# Health endpoint
# ------------------------------------------------

frontend_dist = os.path.join(PROJECT_DIR, "frontend", "dist")

if os.path.exists(os.path.join(frontend_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")


@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "service": "AgroSense AI",
        "status": "online"
    }


@app.api_route("/api/health", methods=["GET", "HEAD"])
def health():
    is_mongo_ok = db.is_mongodb_connected()
    plant_model_ok = (session is not None)
    model, encoder, _ = get_soil_model()
    soil_model_ok = (model is not None and encoder is not None)
    return {
        "backend": "healthy",
        "plant_ai_model": plant_model_ok,
        "soil_ai_model": soil_model_ok,
        "mongodb": is_mongo_ok,
        # Legacy compatibility fields
        "status": "online",
        "ai_model": "loaded" if plant_model_ok else "unloaded",
        "crop": "Turmeric",
        "classes": class_names
    }


# ------------------------------------------------
# Plant analysis endpoint
# ------------------------------------------------

@app.post("/api/plant/analyze")
async def plant_analysis(
    file: UploadFile = File(...)
):

    if file.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are supported."
        )

    try:

        image_bytes = await file.read()

        result = analyze_image(image_bytes)

        # Save to MongoDB Atlas plant_analyses collection
        try:
            db.save_plant_analysis(
                crop=result.get("crop", "Turmeric"),
                prediction=result.get("prediction", "Unknown"),
                disease=result.get("disease", "Unknown"),
                condition=result.get("condition", "Unknown"),
                confidence=result.get("confidence", 0.0),
                severity=result.get("severity", "Unknown"),
                probabilities=result.get("probabilities", {}),
                symptoms=result.get("symptoms", []),
                recommended_action=result.get("recommended_action", [])
            )
        except Exception as db_err:
            print(f"[MongoDB] Error saving plant analysis: {db_err}")

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {str(e)}"
        )


@app.get("/api/plant/history")
def get_plant_analyses_history(limit: int = 50):
    """Fetch recent plant disease analyses from MongoDB Atlas."""
    analyses = db.get_plant_history(limit=limit)
    return {
        "success": True,
        "count": len(analyses),
        "analyses": analyses
    }


# ------------------------------------------------
# ESP32 Sensor Telemetry Endpoints & Models
# ------------------------------------------------

from typing import Optional
from pydantic import BaseModel

class SensorReadingInput(BaseModel):
    """ESP32 physical sensor reading payload."""
    device_id: Optional[str] = "ESP32_001"
    Soil_Moisture: Optional[float] = None
    soil_moisture: Optional[float] = None
    Ambient_Temperature: Optional[float] = None
    temperature: Optional[float] = None
    Humidity: Optional[float] = None
    humidity: Optional[float] = None


@app.post("/api/sensors/readings")
def post_sensor_reading(data: SensorReadingInput):
    """
    Save real-time sensor readings from ESP32 Dev Board.
    Captures: Soil_Moisture, Ambient_Temperature, Humidity.
    """
    moisture = data.Soil_Moisture if data.Soil_Moisture is not None else data.soil_moisture
    temp = data.Ambient_Temperature if data.Ambient_Temperature is not None else data.temperature
    hum = data.Humidity if data.Humidity is not None else data.humidity

    if moisture is None or temp is None or hum is None:
        raise HTTPException(
            status_code=400,
            detail="Missing required sensor fields. Expected: Soil_Moisture, Ambient_Temperature, Humidity."
        )

    if not (0 <= moisture <= 100):
        raise HTTPException(status_code=400, detail=f"Invalid soil moisture: {moisture}%. Must be between 0 and 100.")
    if not (-20 <= temp <= 80):
        raise HTTPException(status_code=400, detail=f"Invalid temperature: {temp}°C. Must be between -20 and 80.")
    if not (0 <= hum <= 100):
        raise HTTPException(status_code=400, detail=f"Invalid humidity: {hum}%. Must be between 0 and 100.")

    device_id = data.device_id or "ESP32_001"
    saved = db.save_sensor_reading(
        soil_moisture=moisture,
        temperature=temp,
        humidity=hum,
        device_id=device_id
    )

    return {
        "success": True,
        "message": "Sensor reading saved",
        "data": {
            "device_id": saved.get("device_id", device_id),
            "Soil_Moisture": saved.get("soil_moisture", moisture),
            "Ambient_Temperature": saved.get("temperature", temp),
            "Humidity": saved.get("humidity", hum),
            "timestamp": saved.get("timestamp")
        }
    }


def read_sync_snapshot():
    """Read shared MongoDB state, including writes from other app instances."""
    return {
        "reading": db.get_latest_sensor_reading(),
        "soil": db.get_soil_history(limit=1),
        "plants": db.get_plant_history(limit=1),
    }


@app.get("/api/sync/stream")
async def sync_stream(request: Request):
    from backend.realtime import stream_updates
    return StreamingResponse(
        stream_updates(request, read_sync_snapshot),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/sensors/latest")
def get_latest_sensor(device_id: Optional[str] = None):
    """Fetch the newest sensor reading from MongoDB Atlas."""
    reading = db.get_latest_sensor_reading(device_id=device_id)
    if not reading:
        raise HTTPException(
            status_code=404,
            detail="No sensor readings found. Make sure the ESP32 has sent at least one reading."
        )
    return {
        "success": True,
        "reading": {
            "device_id": reading.get("device_id", "ESP32_001"),
            "soil_moisture": reading.get("soil_moisture"),
            "temperature": reading.get("temperature"),
            "humidity": reading.get("humidity"),
            "timestamp": reading.get("timestamp")
        }
    }


@app.get("/api/sensors/history")
def get_sensors_history(device_id: Optional[str] = None, limit: int = 100):
    """
    Fetch chronological historical sensor readings from MongoDB Atlas
    for Recharts graphs and tabular analysis.
    """
    raw_readings = db.get_sensor_history(device_id=device_id, limit=limit)
    formatted = []
    for r in raw_readings:
        formatted.append({
            "device_id": r.get("device_id", "ESP32_001"),
            "timestamp": r.get("timestamp"),
            "soil_moisture": r.get("soil_moisture"),
            "temperature": r.get("temperature"),
            "humidity": r.get("humidity")
        })
    return {
        "success": True,
        "count": len(formatted),
        "readings": formatted
    }


# ------------------------------------------------
# Soil Health Prediction endpoint & Models
# ------------------------------------------------

class SoilPredictionInput(BaseModel):
    """Physical sensor inputs from ESP32 + Soil Moisture Sensor + DHT11."""
    device_id: Optional[str] = "ESP32_001"
    Soil_Moisture: float = 55.0
    Ambient_Temperature: float = 28.0
    Humidity: float = 60.0


SOIL_MODEL_DIR = os.path.join(PROJECT_DIR, "ai", "soil_health", "models")
soil_model_path = os.path.join(SOIL_MODEL_DIR, "soil_model_3features.pkl")
label_encoder_path = os.path.join(SOIL_MODEL_DIR, "label_encoder.pkl")
feature_names_path = os.path.join(SOIL_MODEL_DIR, "feature_names.pkl")
accuracy_path = os.path.join(SOIL_MODEL_DIR, "model_accuracy.pkl")

soil_model = None
soil_label_encoder = None
soil_feature_names = None
soil_model_accuracy = None

PHYSICAL_FEATURES = ["Soil_Moisture", "Ambient_Temperature", "Humidity"]

def get_soil_model():
    global soil_model, soil_label_encoder, soil_feature_names, soil_model_accuracy
    if soil_model is None:
        try:
            import joblib
            import pandas as pd
            if os.path.exists(soil_model_path):
                soil_model = joblib.load(soil_model_path)
                soil_label_encoder = joblib.load(label_encoder_path)
                soil_feature_names = joblib.load(feature_names_path)
                if os.path.exists(accuracy_path):
                    soil_model_accuracy = joblib.load(accuracy_path)
                print("3-feature soil model loaded successfully.")
            else:
                print(f"Soil model not found at: {soil_model_path}")
        except Exception as e:
            print(f"Soil model load error: {e}")
    return soil_model, soil_label_encoder, soil_feature_names

# Initial attempt to load at startup
get_soil_model()


@app.get("/api/soil/health")
def soil_health_info():
    model, encoder, feature_names = get_soil_model()
    is_loaded = (model is not None and encoder is not None)
    classes = list(encoder.classes_) if encoder is not None else ["Healthy", "High Stress", "Moderate Stress"]
    features_used = feature_names if feature_names else PHYSICAL_FEATURES

    feature_importances = {}
    if is_loaded and hasattr(model, "feature_importances_") and feature_names:
        importances = model.feature_importances_
        for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
            feature_importances[name] = round(float(imp * 100), 2)
    else:
        # Default fallback showing 3 physical features
        feature_importances = {
            "Soil_Moisture": 60.0,
            "Ambient_Temperature": 25.0,
            "Humidity": 15.0
        }

    return {
        "model_loaded": is_loaded,
        "model_name": "soil_model_3features.pkl",
        "model_type": "Random Forest Classifier",
        "features_used": features_used,
        "classes": classes,
        "dataset_samples": 1200,
        "feature_importances": feature_importances,
        "test_accuracy": soil_model_accuracy,
        # Legacy fields for frontend compatibility
        "model": "Random Forest Classifier",
        "status": "loaded" if is_loaded else "unloaded",
        "accuracy": soil_model_accuracy,
        "features_count": len(features_used)
    }


@app.post("/api/soil/predict")
def predict_soil_health(data: SoilPredictionInput):
    model, encoder, feature_names = get_soil_model()

    if model is None or encoder is None:
        raise HTTPException(
            status_code=500,
            detail="Soil AI model (3-feature) unavailable. Run ai/soil_health/train_model_3features.py first."
        )

    try:
        import pandas as pd
        payload = data.dict()

        # Use physical sensor features only
        features = feature_names if feature_names else PHYSICAL_FEATURES
        input_df = pd.DataFrame([{f: payload[f] for f in features}])

        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]
        predicted_label = encoder.inverse_transform([prediction])[0]

        prob_dict = {}
        for cls_name, prob in zip(encoder.classes_, probabilities):
            prob_dict[str(cls_name)] = round(float(prob * 100), 2)

        main_confidence = round(float(np.max(probabilities) * 100), 2)
        health_status = str(predicted_label)

        # Dynamic explanation based on actual physical sensor readings
        why_explanation = ["Prediction is based on the current soil moisture, ambient temperature and humidity readings."]

        moisture = payload.get("Soil_Moisture", 55.0)
        amb_temp = payload.get("Ambient_Temperature", 28.0)
        humidity = payload.get("Humidity", 60.0)

        if moisture < 40:
            why_explanation.append(f"Soil Moisture ({moisture}%) is severely low — optimal range for turmeric is 60-70%.")
        elif moisture < 55:
            why_explanation.append(f"Soil Moisture ({moisture}%) is below the optimal range (60-70%).")
        elif moisture > 85:
            why_explanation.append(f"Soil Moisture ({moisture}%) is excessively high — risk of root rot.")
        else:
            why_explanation.append(f"Soil Moisture ({moisture}%) is in an acceptable range.")

        if amb_temp > 38:
            why_explanation.append(f"Ambient Temperature ({amb_temp}°C) is high — turmeric prefers 20-35°C.")
        elif amb_temp < 15:
            why_explanation.append(f"Ambient Temperature ({amb_temp}°C) is low — may slow rhizome development.")
        else:
            why_explanation.append(f"Ambient Temperature ({amb_temp}°C) is within turmeric growing range.")

        if humidity < 40:
            why_explanation.append(f"Humidity ({humidity}%) is low — turmeric grows best above 60%.")
        elif humidity > 90:
            why_explanation.append(f"Humidity ({humidity}%) is very high — increased disease risk.")
        else:
            why_explanation.append(f"Humidity ({humidity}%) is within an acceptable range.")

        # Recommendations based on predicted health status
        if health_status == "Healthy":
            recommendations = [
                "Current measured conditions indicate suitable soil conditions.",
                "Continue monitoring soil moisture and environmental conditions regularly.",
                "Maintain current irrigation schedule."
            ]
        elif health_status == "Moderate Stress":
            recommendations = [
                "Monitor soil moisture closely and check irrigation requirements.",
                "Inspect environmental temperature and humidity levels.",
                "Adjust irrigation if soil moisture is outside the 60-70% range."
            ]
        else:
            recommendations = [
                "Immediate soil-condition monitoring is recommended.",
                "Check irrigation — soil moisture may be severely low or excessively high.",
                "Verify DHT11 sensor readings and inspect the crop field directly."
            ]

        # Automatically persist soil prediction to MongoDB Atlas soil_predictions collection
        try:
            device_id = payload.get("device_id") or "ESP32_001"
            db.save_soil_prediction(
                inputs={
                    "Soil_Moisture": moisture,
                    "Ambient_Temperature": amb_temp,
                    "Humidity": humidity
                },
                health_status=health_status,
                confidence=main_confidence,
                probabilities=prob_dict,
                recommendation=recommendations,
                why_explanation=why_explanation,
                device_id=device_id
            )
        except Exception as db_err:
            print(f"[MongoDB] Error saving soil prediction: {db_err}")

        return {
            "health_status": health_status,
            "confidence": main_confidence,
            "probabilities": prob_dict,
            "recommendation": recommendations,
            "why_explanation": why_explanation
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Soil health prediction failed: {str(e)}"
        )


@app.get("/api/soil/history")
def get_soil_prediction_history(device_id: Optional[str] = None, limit: int = 50):
    """Fetch recent soil health predictions from MongoDB Atlas."""
    history = db.get_soil_history(device_id=device_id, limit=limit)
    return {
        "success": True,
        "count": len(history),
        "history": history
    }


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail=f"API endpoint '/{full_path}' not found")
    
    file_path = os.path.join(frontend_dist, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {
        "service": "AgroSense AI",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)



