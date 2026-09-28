import joblib
import numpy as np

# Load model
model = joblib.load("models/soil_model.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")
feature_names = joblib.load("models/feature_names.pkl")

print("=" * 60)
print("AgroSense Soil Health Predictor")
print("=" * 60)

print("\nEnter sensor values:\n")

values = []

for feature in feature_names:
    value = float(input(f"{feature}: "))
    values.append(value)

import pandas as pd

X = pd.DataFrame(
    [values],
    columns=feature_names
)

prediction = model.predict(X)[0]
probabilities = model.predict_proba(X)[0]

predicted_label = label_encoder.inverse_transform([prediction])[0]

print("\n" + "=" * 60)
print("RESULT")
print("=" * 60)

print(f"Soil Health : {predicted_label}")

print("\nConfidence Scores")

for cls, prob in zip(label_encoder.classes_, probabilities):
    print(f"{cls:20} : {prob*100:.2f}%")