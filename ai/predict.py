import os
import json
import numpy as np
import onnxruntime as ort
from PIL import Image

print("=== AgroSense AI Starting ===")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(BASE_DIR, "model")

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "turmeric_model.onnx"
)

CLASS_PATH = os.path.join(
    MODEL_DIR,
    "class_info.json"
)

print("Model:", MODEL_PATH)
print("Classes:", CLASS_PATH)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"ONNX model not found: {MODEL_PATH}"
    )

if not os.path.exists(CLASS_PATH):
    raise FileNotFoundError(
        f"class_info.json not found: {CLASS_PATH}"
    )

with open(CLASS_PATH, "r", encoding="utf-8") as f:
    class_info = json.load(f)

class_names = class_info["classes"]

print("Class names:", class_names)
print("\nLoading ONNX model...")

session = ort.InferenceSession(
    MODEL_PATH,
    providers=["CPUExecutionProvider"]
)

input_name = session.get_inputs()[0].name

print("Model loaded successfully!")
print("Input name:", input_name)


def predict(image_path):

    image = Image.open(image_path).convert("RGB")
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

    predicted_index = int(np.argmax(probabilities))

    predicted_class = class_names[predicted_index]

    confidence = float(
        probabilities[predicted_index] * 100
    )

    condition = (
        "Healthy"
        if predicted_class == "Healthy_Leaf"
        else "Unhealthy"
    )

    print("\n==============================")
    print("      AGROSENSE AI")
    print("==============================")
    print("Crop       : Turmeric")
    print("Condition  :", condition)
    print("Prediction :", predicted_class)
    print(f"Confidence : {confidence:.2f}%")

    print("\nClass Probabilities")
    print("------------------------------")

    for name, probability in zip(
        class_names,
        probabilities
    ):
        print(f"{name:20} : {probability * 100:.2f}%")


print("\nReady for prediction.")

image_path = input(
    "Enter turmeric image path: "
).strip().strip('"').strip("'")

if not os.path.isfile(image_path):

    print("\nERROR: Image not found:")
    print(image_path)

else:

    predict(image_path)