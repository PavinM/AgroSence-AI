import io
import os
import sys
import json
import numpy as np
import onnxruntime as ort

from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware


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

@app.get("/")
def root():
    return {
        "service": "AgroSense AI",
        "status": "online"
    }


@app.get("/api/health")
def health():
    return {
        "status": "online",
        "ai_model": "loaded",
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

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {str(e)}"
        )


# ------------------------------------------------
# Soil Health Prediction endpoint
# ------------------------------------------------

from pydantic import BaseModel

from pydantic import BaseModel

class SoilPredictionInput(BaseModel):
    Soil_Moisture: float = 55.0
    Ambient_Temperature: float = 28.0
    Soil_Temperature: float = 26.0
    Humidity: float = 60.0
    Light_Intensity: float = 700.0
    Soil_pH: float = 6.5
    Nitrogen_Level: float = 40.0
    Phosphorus_Level: float = 25.0
    Potassium_Level: float = 35.0
    Chlorophyll_Content: float = 45.0
    Electrochemical_Signal: float = 1.2


SOIL_MODEL_DIR = os.path.join(PROJECT_DIR, "ai", "soil_health", "models")
soil_model_path = os.path.join(SOIL_MODEL_DIR, "soil_model.pkl")
label_encoder_path = os.path.join(SOIL_MODEL_DIR, "label_encoder.pkl")
feature_names_path = os.path.join(SOIL_MODEL_DIR, "feature_names.pkl")

soil_model = None
soil_label_encoder = None
soil_feature_names = None

def get_soil_model():
    global soil_model, soil_label_encoder, soil_feature_names
    if soil_model is None:
        try:
            import joblib
            import pandas as pd
            if os.path.exists(soil_model_path):
                soil_model = joblib.load(soil_model_path)
                soil_label_encoder = joblib.load(label_encoder_path)
                soil_feature_names = joblib.load(feature_names_path)
                print("Soil model and encoder loaded successfully.")
        except Exception as e:
            print(f"Soil model load info: {e}")
    return soil_model, soil_label_encoder, soil_feature_names

# Initial attempt to load at startup
get_soil_model()


@app.get("/api/soil/health")
def soil_health_info():
    model, encoder, feature_names = get_soil_model()
    is_loaded = (model is not None and encoder is not None)
    classes = list(encoder.classes_) if encoder is not None else ["Healthy", "High Stress", "Moderate Stress"]
    
    feature_importances = {}
    if is_loaded and hasattr(model, "feature_importances_") and feature_names:
        importances = model.feature_importances_
        for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
            feature_importances[name] = round(float(imp * 100), 2)
    else:
        feature_importances = {
            "Soil_Moisture": 66.24,
            "Nitrogen_Level": 17.86,
            "Soil_pH": 2.09,
            "Chlorophyll_Content": 1.89,
            "Soil_Temperature": 1.81,
            "Electrochemical_Signal": 1.72,
            "Potassium_Level": 1.72,
            "Humidity": 1.69,
            "Light_Intensity": 1.69,
            "Phosphorus_Level": 1.66,
            "Ambient_Temperature": 1.61
        }

    return {
        "model": "Random Forest Classifier",
        "status": "loaded" if is_loaded else "unloaded",
        "classes": classes,
        "accuracy": 100.0,
        "dataset_samples": 1200,
        "features_count": len(feature_names) if feature_names else 11,
        "feature_importances": feature_importances
    }


@app.post("/api/soil/predict")
def predict_soil_health(data: SoilPredictionInput):
    model, encoder, feature_names = get_soil_model()

    if model is None or encoder is None:
        raise HTTPException(
            status_code=500,
            detail="Soil AI model unavailable"
        )

    try:
        import pandas as pd
        payload = data.dict()
        input_df = pd.DataFrame([payload])
        if feature_names is not None:
            input_df = input_df[feature_names]
        
        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]
        predicted_label = encoder.inverse_transform([prediction])[0]
        
        prob_dict = {}
        for cls_name, prob in zip(encoder.classes_, probabilities):
            prob_dict[str(cls_name)] = round(float(prob * 100), 2)
        
        main_confidence = round(float(np.max(probabilities) * 100), 2)
        health_status = str(predicted_label)

        # Dynamic prediction explanation ("Why [Status]?")
        why_explanation = []
        moisture = payload.get("Soil_Moisture", 55.0)
        ph = payload.get("Soil_pH", 6.5)
        nitrogen = payload.get("Nitrogen_Level", 40.0)
        soil_temp = payload.get("Soil_Temperature", 26.0)

        if moisture < 40:
            why_explanation.append(f"Soil Moisture ({moisture}%) is severely low (optimal: 60-70%).")
        elif moisture < 50:
            why_explanation.append(f"Soil Moisture ({moisture}%) is slightly below optimal range.")
        elif moisture > 80:
            why_explanation.append(f"Soil Moisture ({moisture}%) is excessively high (risk of root rot).")
        else:
            why_explanation.append(f"Soil Moisture ({moisture}%) is in the optimal range.")

        if ph < 5.5:
            why_explanation.append(f"Soil pH ({ph}) is acidic (ideal for turmeric: 5.8 - 7.2).")
        elif ph > 7.5:
            why_explanation.append(f"Soil pH ({ph}) is alkaline.")
        else:
            why_explanation.append(f"Soil pH ({ph}) is well-balanced.")

        if nitrogen < 25:
            why_explanation.append(f"Nitrogen level ({nitrogen} mg/kg) is deficient.")
        elif nitrogen < 35:
            why_explanation.append(f"Nitrogen level ({nitrogen} mg/kg) is moderate.")
        else:
            why_explanation.append(f"Nitrogen level ({nitrogen} mg/kg) is sufficient.")

        if soil_temp > 35 or soil_temp < 15:
            why_explanation.append(f"Soil temperature ({soil_temp}°C) is outside normal crop comfort range.")

        # Recommendations based on prediction status
        if health_status == "Healthy":
            recommendations = [
                "Maintain current irrigation schedule.",
                "Continue nutrient monitoring.",
                "Soil is healthy."
            ]
        elif health_status == "Moderate Stress":
            recommendations = [
                "Inspect soil moisture and nutrient levels.",
                "Adjust fertilization and irrigation routine.",
                "Soil shows moderate stress signs."
            ]
        else:
            recommendations = [
                "Immediate soil intervention required.",
                "Check for severe moisture deficiency or nutrient imbalance.",
                "Soil is under high stress."
            ]

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


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)


