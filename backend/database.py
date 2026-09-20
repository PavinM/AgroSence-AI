"""
AgroSense AI - MongoDB Atlas Database Layer
============================================
Handles persistent connection, collection management, indexing, and CRUD
operations for:
1. sensor_readings: ESP32 telemetry (Soil Moisture, Ambient Temperature, Humidity)
2. soil_predictions: Random Forest soil health prediction logs
3. plant_analyses: ONNX turmeric leaf disease inference logs

Architecture Note:
Singleton MongoClient instance is maintained. Connection failures are handled
gracefully so the FastAPI backend never crashes if MongoDB Atlas is unavailable.
"""

import os
import sys
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import PyMongoError, ConnectionFailure, ServerSelectionTimeoutError

# Ensure environment variables are loaded from .env if present
def _load_env_file():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir)
    env_paths = [
        os.path.join(base_dir, ".env"),
        os.path.join(project_dir, ".env")
    ]
    for path in env_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_file()

MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "agrosence_ai").strip() or "agrosence_ai"

# Singleton Client & DB Cache
_client: Optional[MongoClient] = None
_db = None
_indexes_created = False

# In-memory buffer fallback if MongoDB is not yet configured or temporarily unreachable
_memory_store = {
    "sensor_readings": [],
    "soil_predictions": [],
    "plant_analyses": []
}


def get_client() -> Optional[MongoClient]:
    """Returns singleton MongoClient instance or None if not configured/failed."""
    global _client, MONGODB_URI
    # Re-check env in case it was updated dynamically
    if not MONGODB_URI:
        MONGODB_URI = os.getenv("MONGODB_URI", "").strip()

    if not MONGODB_URI:
        return None

    if _client is None:
        try:
            _client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500,
                socketTimeoutMS=5000,
                retryWrites=True
            )
        except Exception as e:
            print(f"[MongoDB] Initialization error: {e}", file=sys.stderr)
            _client = None
    return _client


def get_db():
    """Returns MongoDB database instance or None."""
    global _db, _indexes_created
    client = get_client()
    if client is None:
        return None

    if _db is None:
        try:
            _db = client[MONGODB_DATABASE]
            if not _indexes_created:
                init_db_indexes(_db)
        except Exception as e:
            print(f"[MongoDB] Error getting database: {e}", file=sys.stderr)
            return None
    return _db


def is_mongodb_connected() -> bool:
    """Verifies MongoDB Atlas connectivity using a quick ping command."""
    db = get_db()
    if db is None:
        return False
    try:
        db.command("ping")
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError, PyMongoError, Exception) as e:
        return False


def init_db_indexes(db=None):
    """Creates required indexes on collections for efficient historical lookups."""
    global _indexes_created
    if db is None:
        db = get_db()
    if db is None:
        return False

    try:
        # 1. sensor_readings index: { device_id: 1, timestamp: -1 }
        db["sensor_readings"].create_index(
            [("device_id", ASCENDING), ("timestamp", DESCENDING)],
            background=True
        )

        # 2. soil_predictions index: { device_id: 1, timestamp: -1 }
        db["soil_predictions"].create_index(
            [("device_id", ASCENDING), ("timestamp", DESCENDING)],
            background=True
        )

        # 3. plant_analyses index: { timestamp: -1 }
        db["plant_analyses"].create_index(
            [("timestamp", DESCENDING)],
            background=True
        )

        _indexes_created = True
        print(f"[MongoDB] Indexes successfully initialized on database '{MONGODB_DATABASE}'.")
        return True
    except Exception as e:
        print(f"[MongoDB] Error initializing indexes: {e}", file=sys.stderr)
        return False


# ------------------------------------------------
# Document formatting helper (JSON serializable)
# ------------------------------------------------

def _format_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    clean = dict(doc)
    if "_id" in clean:
        clean["id"] = str(clean.pop("_id"))
    if "timestamp" in clean and isinstance(clean["timestamp"], datetime):
        clean["timestamp"] = clean["timestamp"].isoformat()
    return clean


# ------------------------------------------------
# Sensor Readings Operations
# ------------------------------------------------

def save_sensor_reading(
    soil_moisture: float,
    temperature: float,
    humidity: float,
    device_id: str = "ESP32_001",
    timestamp: Optional[datetime] = None
) -> Dict[str, Any]:
    """Persists an ESP32 sensor reading document to MongoDB Atlas."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)

    doc = {
        "device_id": str(device_id),
        "timestamp": timestamp,
        "soil_moisture": round(float(soil_moisture), 2),
        "temperature": round(float(temperature), 2),
        "humidity": round(float(humidity), 2)
    }

    db = get_db()
    if db is not None:
        try:
            res = db["sensor_readings"].insert_one(doc)
            doc["_id"] = res.inserted_id
        except Exception as e:
            print(f"[MongoDB] insert sensor_readings failed: {e}", file=sys.stderr)
            _memory_store["sensor_readings"].append(doc)
    else:
        _memory_store["sensor_readings"].append(doc)

    return _format_doc(doc)


def get_latest_sensor_reading(device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Fetches the latest reading from MongoDB Atlas."""
    db = get_db()
    if db is not None:
        try:
            query = {"device_id": device_id} if device_id else {}
            doc = db["sensor_readings"].find_one(query, sort=[("timestamp", DESCENDING)])
            if doc:
                return _format_doc(doc)
        except Exception as e:
            print(f"[MongoDB] get_latest_sensor_reading error: {e}", file=sys.stderr)

    # Fallback to in-memory store
    readings = _memory_store["sensor_readings"]
    if device_id:
        readings = [r for r in readings if r.get("device_id") == device_id]
    if readings:
        sorted_readings = sorted(readings, key=lambda x: x.get("timestamp", datetime.min), reverse=True)
        return _format_doc(sorted_readings[0])
    return None


def get_sensor_history(device_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Fetches historical readings in chronological order (oldest to newest)
    so frontend charts can directly plot them.
    """
    db = get_db()
    readings: List[Dict[str, Any]] = []
    if db is not None:
        try:
            query = {"device_id": device_id} if device_id else {}
            # Query newest first up to limit, then reverse to chronological
            cursor = db["sensor_readings"].find(query).sort("timestamp", DESCENDING).limit(limit)
            raw = list(cursor)
            raw.reverse()
            return [_format_doc(d) for d in raw]
        except Exception as e:
            print(f"[MongoDB] get_sensor_history error: {e}", file=sys.stderr)

    # Fallback
    mem = _memory_store["sensor_readings"]
    if device_id:
        mem = [r for r in mem if r.get("device_id") == device_id]
    sorted_mem = sorted(mem, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:limit]
    sorted_mem.reverse()
    return [_format_doc(d) for d in sorted_mem]


# ------------------------------------------------
# Soil Predictions Operations
# ------------------------------------------------

def save_soil_prediction(
    inputs: Dict[str, float],
    health_status: str,
    confidence: float,
    probabilities: Dict[str, float],
    recommendation: List[str],
    why_explanation: Optional[List[str]] = None,
    device_id: str = "ESP32_001",
    timestamp: Optional[datetime] = None
) -> Dict[str, Any]:
    """Persists a Random Forest soil prediction result to MongoDB Atlas."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)

    doc = {
        "device_id": str(device_id),
        "timestamp": timestamp,
        "inputs": {
            "Soil_Moisture": round(float(inputs.get("Soil_Moisture", 0)), 2),
            "Ambient_Temperature": round(float(inputs.get("Ambient_Temperature", 0)), 2),
            "Humidity": round(float(inputs.get("Humidity", 0)), 2)
        },
        "health_status": str(health_status),
        "confidence": round(float(confidence), 2),
        "probabilities": {k: round(float(v), 2) for k, v in probabilities.items()},
        "recommendation": list(recommendation),
        "why_explanation": list(why_explanation or [])
    }

    db = get_db()
    if db is not None:
        try:
            res = db["soil_predictions"].insert_one(doc)
            doc["_id"] = res.inserted_id
        except Exception as e:
            print(f"[MongoDB] insert soil_predictions failed: {e}", file=sys.stderr)
            _memory_store["soil_predictions"].append(doc)
    else:
        _memory_store["soil_predictions"].append(doc)

    return _format_doc(doc)


def get_soil_history(device_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Fetches soil prediction history from MongoDB Atlas (newest first)."""
    db = get_db()
    if db is not None:
        try:
            query = {"device_id": device_id} if device_id else {}
            cursor = db["soil_predictions"].find(query).sort("timestamp", DESCENDING).limit(limit)
            return [_format_doc(d) for d in cursor]
        except Exception as e:
            print(f"[MongoDB] get_soil_history error: {e}", file=sys.stderr)

    mem = _memory_store["soil_predictions"]
    if device_id:
        mem = [r for r in mem if r.get("device_id") == device_id]
    sorted_mem = sorted(mem, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:limit]
    return [_format_doc(d) for d in sorted_mem]


# ------------------------------------------------
# Plant Analyses Operations
# ------------------------------------------------

def save_plant_analysis(
    crop: str,
    prediction: str,
    disease: str,
    condition: str,
    confidence: float,
    severity: str,
    probabilities: Dict[str, float],
    symptoms: List[str],
    recommended_action: List[str],
    timestamp: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Persists ONNX plant disease inference result and metadata to MongoDB Atlas.
    Note: Image binary is deliberately excluded to maintain lightweight Atlas documents.
    """
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)

    doc = {
        "timestamp": timestamp,
        "crop": str(crop),
        "prediction": str(prediction),
        "disease": str(disease),
        "condition": str(condition),
        "confidence": round(float(confidence), 2),
        "severity": str(severity),
        "probabilities": {k: round(float(v), 2) for k, v in probabilities.items()},
        "symptoms": list(symptoms),
        "recommended_action": list(recommended_action)
    }

    db = get_db()
    if db is not None:
        try:
            res = db["plant_analyses"].insert_one(doc)
            doc["_id"] = res.inserted_id
        except Exception as e:
            print(f"[MongoDB] insert plant_analyses failed: {e}", file=sys.stderr)
            _memory_store["plant_analyses"].append(doc)
    else:
        _memory_store["plant_analyses"].append(doc)

    return _format_doc(doc)


def get_plant_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Fetches recent plant disease analyses from MongoDB Atlas (newest first)."""
    db = get_db()
    if db is not None:
        try:
            cursor = db["plant_analyses"].find().sort("timestamp", DESCENDING).limit(limit)
            return [_format_doc(d) for d in cursor]
        except Exception as e:
            print(f"[MongoDB] get_plant_history error: {e}", file=sys.stderr)

    sorted_mem = sorted(_memory_store["plant_analyses"], key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:limit]
    return [_format_doc(d) for d in sorted_mem]
