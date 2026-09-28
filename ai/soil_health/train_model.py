import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# ==============================
# Load Dataset
# ==============================

print("=" * 60)
print("Loading Dataset...")
print("=" * 60)

df = pd.read_csv("plant_health_data.csv")

print(df.head())
print("\nDataset Shape:", df.shape)

# ==============================
# Remove unnecessary columns
# ==============================

drop_cols = ["Timestamp", "Plant_ID"]

for col in drop_cols:
    if col in df.columns:
        df.drop(columns=col, inplace=True)

print("\nColumns Used:")
print(df.columns.tolist())

# ==============================
# Features & Target
# ==============================

X = df.drop("Plant_Health_Status", axis=1)

y = df["Plant_Health_Status"]

# ==============================
# Encode Labels
# ==============================

label_encoder = LabelEncoder()

y_encoded = label_encoder.fit_transform(y)

print("\nClasses:")
print(label_encoder.classes_)

# ==============================
# Train/Test Split
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)

print("\nTraining Samples :", len(X_train))
print("Testing Samples  :", len(X_test))

# ==============================
# Train Random Forest
# ==============================

print("\nTraining Random Forest...\n")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# ==============================
# Prediction
# ==============================

y_pred = model.predict(X_test)

# ==============================
# Accuracy
# ==============================

accuracy = accuracy_score(y_test, y_pred)

print("=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"\nAccuracy : {accuracy*100:.2f}%")

print("\nClassification Report\n")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=label_encoder.classes_
    )
)

print("\nConfusion Matrix\n")

print(confusion_matrix(y_test, y_pred))

# ==============================
# Feature Importance
# ==============================

importance = pd.DataFrame({
    "Feature": X.columns,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print("\nTop Important Features\n")

print(importance)

# ==============================
# Save Model
# ==============================

joblib.dump(model, "models/soil_model.pkl")
joblib.dump(label_encoder, "models/label_encoder.pkl")
joblib.dump(list(X.columns), "models/feature_names.pkl")

print("\nModels Saved Successfully")

print("models/soil_model.pkl")
print("models/label_encoder.pkl")
print("models/feature_names.pkl")

print("\nDone.")