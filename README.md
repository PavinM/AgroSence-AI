# AgroSense AI

AI-powered precision agriculture platform for turmeric crop monitoring, plant disease detection, and soil health analysis.

AgroSense AI combines computer vision, machine learning, and IoT sensor data to give farmers and agronomists real-time, actionable insights — from leaf disease classification to soil stress prediction.

---

## Features

### Plant Disease Detection

- Upload turmeric leaf images and get instant AI-powered diagnosis
- Powered by a custom **ONNX-optimized deep learning model** (224×224 input)
- Detects 4 classes with per-class confidence probabilities:

  | Class | Condition |
  |---|---|
  | Healthy Leaf | Healthy |
  | Aphids Disease | Unhealthy |
  | Blotch | Unhealthy |
  | Leaf Spot | Unhealthy |

- Returns severity rating, symptoms, and recommended actions

### Soil Health Prediction

- Predicts soil health status: **Healthy**, **Moderate Stress**, or **High Stress**
- Uses a **Random Forest Classifier** (100% accuracy on 1,200 samples)
- 11 sensor features: Moisture, Temperature, pH, N/P/K, Chlorophyll, Humidity, Light, Electrochemical Signal
- Provides dynamic "Why this result?" explanations and tailored recommendations

### Dashboard and Monitoring

- **Farm Overview** — Live summary of crop and soil status
- **Sensor Charts** — Real-time and historical sensor data visualization (Recharts)
- **Soil Monitoring** — Continuous soil parameter tracking
- **Soil Health History** — Trend analysis over time
- **Recent Analyses** — History of plant disease scans
- **Smart Recommendations** — Context-aware agronomic suggestions
- **System Status** — Backend connectivity and AI model health indicators

---

## Architecture

```
AgroSence AI/
├── backend/               # FastAPI backend (Python)
│   └── main.py            # All API endpoints + ONNX inference
├── frontend/              # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       ├── components/    # 13 UI components
│       └── services/
│           └── plantAiService.js   # API client + utility functions
├── ai/
│   ├── model/
│   │   ├── turmeric_model.onnx     # Turmeric disease ONNX model
│   │   └── class_info.json         # Class label mapping
│   └── soil_health/
│       └── models/                 # soil_model.pkl, label_encoder.pkl, feature_names.pkl
├── esp32/                 # IoT firmware (ESP32 sensor node)
├── DataSets/              # Training datasets
├── docs/                  # Documentation
├── render.yaml            # Render deployment config
└── requirements.txt
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- ONNX model file: `ai/model/turmeric_model.onnx`
- Soil health model files: `ai/soil_health/models/`

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AgroSence-AI.git
cd "AgroSence AI"
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit VITE_API_BASE_URL if needed (default: http://localhost:8000)
```

### 4. Run Locally

**Start the backend** (from project root):

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Start the frontend** (in a separate terminal):

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

Base URL: `http://localhost:8000`

### Health Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend + AI model status |
| `GET` | `/api/soil/health` | Soil model metadata and feature importances |

### Plant Disease Detection

```
POST /api/plant/analyze
Content-Type: multipart/form-data

file: <image file>  (JPEG, PNG, or WEBP)
```

**Response:**

```json
{
  "crop": "Turmeric",
  "condition": "Unhealthy",
  "prediction": "Leaf_Spot",
  "disease": "Leaf Spot",
  "confidence": 91.2,
  "severity": "Medium",
  "probabilities": { "Healthy_Leaf": 2.5, "Leaf_Spot": 91.2 },
  "symptoms": ["..."],
  "recommended_action": ["..."]
}
```

### Soil Health Prediction

```
POST /api/soil/predict
Content-Type: application/json
```

**Request body:**

```json
{
  "Soil_Moisture": 55.0,
  "Ambient_Temperature": 28.0,
  "Soil_Temperature": 26.0,
  "Humidity": 60.0,
  "Light_Intensity": 700.0,
  "Soil_pH": 6.5,
  "Nitrogen_Level": 40.0,
  "Phosphorus_Level": 25.0,
  "Potassium_Level": 35.0,
  "Chlorophyll_Content": 45.0,
  "Electrochemical_Signal": 1.2
}
```

**Response:**

```json
{
  "health_status": "Healthy",
  "confidence": 98.5,
  "probabilities": { "Healthy": 98.5, "Moderate Stress": 1.2, "High Stress": 0.3 },
  "recommendation": ["..."],
  "why_explanation": ["..."]
}
```

---

## Deployment

### Deploy on Render (Full-Stack)

This project is configured for full-stack deployment on [Render](https://render.com). The React frontend is built and served directly by the FastAPI backend.

1. Push your code to GitHub
2. Connect your repository to Render
3. Render uses `render.yaml` automatically:
   - **Build:** `cd frontend && npm install && npm run build && pip install -r requirements.txt`
   - **Start:** `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables in the Render dashboard:

| Variable | Description |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins (or `*`) |
| `VITE_API_BASE_URL` | Frontend API base URL (set during build) |

### Deploy Frontend Only (Vercel)

A `vercel.json` is included in the `frontend/` directory.

```bash
cd frontend
npm run build
vercel --prod
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `ALLOWED_ORIGINS` | see `.env.example` | CORS allowed origins |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, TailwindCSS 3, Recharts, Lucide React |
| **Backend** | FastAPI, Uvicorn, Pydantic |
| **AI / ML** | ONNX Runtime, scikit-learn (Random Forest), NumPy, Pillow, joblib |
| **Data** | pandas, NumPy |
| **IoT** | ESP32 sensor node firmware |
| **Deployment** | Render (full-stack), Vercel (frontend) |

---

## Python Dependencies

```
fastapi
uvicorn
onnxruntime
pillow
numpy
joblib
pandas
scikit-learn
pydantic
python-multipart
```

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with love for smarter, sustainable agriculture.
