/*
 * AgroSense AI - ESP32 Physical Prototype Firmware
 * =================================================
 * Hardware Setup:
 * 1. ESP32 Dev Board (NodeMCU / WROOM-32)
 * 2. Capacitive Soil Moisture Sensor v1.2 -> Connected to GPIO 34 (ADC1)
 * 3. DHT11 Temperature & Humidity Sensor   -> Connected to GPIO 4
 * 4. Wi-Fi connection to AgroSense FastAPI Backend
 *
 * Telemetry Destination:
 * POST http://<SERVER_IP>:8000/api/sensors/readings
 *
 * Payload:
 * {
 *   "device_id": "ESP32_001",
 *   "Soil_Moisture": 55.2,
 *   "Ambient_Temperature": 28.4,
 *   "Humidity": 61.3
 * }
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ------------------------------------------------
// Wi-Fi & Backend Server Configuration
// ------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your FastAPI backend IP or domain:
// Example local: "http://192.168.1.100:8000/api/sensors/readings"
// Example cloud: "https://agrosense-ai-backend.onrender.com/api/sensors/readings"
const char* BACKEND_SERVER_URL = "http://192.168.1.100:8000/api/sensors/readings";

const char* DEVICE_ID = "ESP32_001";

// ------------------------------------------------
// Sensor Pin Assignments
// ------------------------------------------------
#define DHT_PIN 4
#define DHT_TYPE DHT11

#define SOIL_MOISTURE_PIN 34  // Analog ADC1 pin

// Calibration values for Capacitive Soil Moisture Sensor
// Calibrate in air (dry) vs immersed in cup of water (wet)
const int SOIL_AIR_VALUE   = 3200; // Dry air ADC value
const int SOIL_WATER_VALUE = 1300; // Immersed in water ADC value

DHT dht(DHT_PIN, DHT_TYPE);

// Telemetry interval (e.g. every 10 seconds)
const unsigned long SEND_INTERVAL_MS = 10000;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==========================================");
  Serial.println("   AgroSense AI - ESP32 Sensor Node");
  Serial.println("==========================================");

  // Initialize DHT11 sensor
  dht.begin();
  pinMode(SOIL_MOISTURE_PIN, INPUT);

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Connection timed out. Will retry during loop.");
  }
}

float readSoilMoisturePercentage() {
  // Take 5 sample readings and compute average to reduce ADC noise
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(SOIL_MOISTURE_PIN);
    delay(20);
  }
  int rawValue = sum / 5;

  // Map analog range to 0.0 - 100.0%
  // Constrain between water and air calibration values
  float moisture = map(rawValue, SOIL_AIR_VALUE, SOIL_WATER_VALUE, 0, 100);
  if (moisture < 0.0) moisture = 0.0;
  if (moisture > 100.0) moisture = 100.0;

  return moisture;
}

void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // Check Wi-Fi connection
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[Wi-Fi] Reconnecting...");
      WiFi.disconnect();
      WiFi.reconnect();
      return;
    }

    // 1. Read DHT11 Temperature & Humidity
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    // 2. Read Soil Moisture Sensor
    float soilMoisture = readSoilMoisturePercentage();

    // Validate sensor reading values
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("[DHT11] Warning: Failed to read from DHT11 sensor. Retrying next cycle.");
      return;
    }

    Serial.println("\n------------------------------------");
    Serial.printf("[Sensors] Soil Moisture: %.1f %%\n", soilMoisture);
    Serial.printf("[Sensors] Ambient Temp : %.1f °C\n", temperature);
    Serial.printf("[Sensors] Humidity     : %.1f %%\n", humidity);

    // 3. Construct JSON Payload
    String jsonPayload = "{";
    jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    jsonPayload += "\"Soil_Moisture\":" + String(soilMoisture, 1) + ",";
    jsonPayload += "\"Ambient_Temperature\":" + String(temperature, 1) + ",";
    jsonPayload += "\"Humidity\":" + String(humidity, 1);
    jsonPayload += "}";

    // 4. Send HTTP POST to FastAPI Backend
    HTTPClient http;
    http.begin(BACKEND_SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    Serial.printf("[HTTP] Posting payload to %s ...\n", BACKEND_SERVER_URL);
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("[HTTP] Response code: %d\n", httpResponseCode);
      Serial.printf("[HTTP] Response body: %s\n", response.c_str());
    } else {
      Serial.printf("[HTTP] Error sending POST: %s (code %d)\n", http.errorToString(httpResponseCode).c_str(), httpResponseCode);
    }

    http.end();
  }
}
