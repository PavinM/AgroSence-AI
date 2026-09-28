import os, pandas as pd, joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, 'plant_health_data.csv')
MODELS_DIR = os.path.join(SCRIPT_DIR, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

print('=' * 60)
print('AgroSense AI -- 3-Feature Soil Model Training')
print('=' * 60)

df = pd.read_csv(CSV_PATH)
print(f'Dataset shape: {df.shape}')

FEATURE_COLS = ['Soil_Moisture', 'Ambient_Temperature', 'Humidity']
TARGET_COL = 'Plant_Health_Status'

X = df[FEATURE_COLS].copy()
y = df[TARGET_COL].copy()
print(f'Class distribution:')
print(y.value_counts())

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
print(f'Classes: {list(label_encoder.classes_)}')

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)
print(f'Training: {len(X_train)}, Testing: {len(X_test)}')

model = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print('=' * 60)
print('MODEL PERFORMANCE -- 3-Feature Soil Health Classifier')
print('=' * 60)
print(f'Test Accuracy: {accuracy * 100:.2f}%')
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
print('Confusion Matrix:')
print(confusion_matrix(y_test, y_pred))

import pandas as pd2
importance_df = pd.DataFrame({'Feature': FEATURE_COLS, 'Importance (%)': model.feature_importances_ * 100}).sort_values('Importance (%)', ascending=False)
print('Feature Importances:')
print(importance_df.to_string(index=False))

joblib.dump(model, os.path.join(MODELS_DIR, 'soil_model_3features.pkl'))
joblib.dump(label_encoder, os.path.join(MODELS_DIR, 'label_encoder.pkl'))
joblib.dump(FEATURE_COLS, os.path.join(MODELS_DIR, 'feature_names.pkl'))
joblib.dump(round(accuracy * 100, 2), os.path.join(MODELS_DIR, 'model_accuracy.pkl'))
print('Models saved. Done.')
