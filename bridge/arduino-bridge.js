import dotenv from "dotenv";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import mqtt from "mqtt";

dotenv.config();

// --- Config from .env ---
const SERIAL_PORT = process.env.SERIAL_PORT?.trim() || "COM9";
const BAUD_RATE = parseInt(process.env.BAUD_RATE) || 9600;
const MQTT_URL = process.env.MQTT_URL?.trim();
const MQTT_USERNAME = process.env.MQTT_USERNAME?.trim() || "";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD?.trim() || "";
const HOME_ID = process.env.HOME_ID?.trim() || "home_001";

// Topic jahan backend subscribe karega
const MQTT_TOPIC = `home/${HOME_ID}/energy/sensor`;

if (!MQTT_URL) {
  console.error("❌ MQTT_URL missing in .env");
  process.exit(1);
}

// HiveMQ cloud ke liye ssl:// prefix chahiye
const brokerUrl = MQTT_URL.startsWith("mqtt") ? MQTT_URL : `mqtts://${MQTT_URL}`;

// --- MQTT Client ---
console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);

const mqttClient = mqtt.connect(brokerUrl, {
  username: MQTT_USERNAME || undefined,
  password: MQTT_PASSWORD || undefined,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
});

mqttClient.on("connect", () => {
  console.log(`✅ MQTT connected → topic: ${MQTT_TOPIC}`);
  initSerial(); // Serial sirf MQTT connect hone ke baad start karo
});

mqttClient.on("error", (err) => {
  console.error("❌ MQTT error:", err.message);
});

mqttClient.on("reconnect", () => {
  console.log("🔄 MQTT reconnecting...");
});

mqttClient.on("offline", () => {
  console.warn("⚠️  MQTT offline");
});

// --- Serial Port ---
function initSerial() {
  console.log(`🔌 Opening serial port: ${SERIAL_PORT} @ ${BAUD_RATE} baud`);

  const port = new SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE,
  });

  // Line-by-line parser — Arduino \n bhejta hai
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  port.on("open", () => {
    console.log(`✅ Serial port open: ${SERIAL_PORT}`);
  });

  port.on("error", (err) => {
    console.error("❌ Serial error:", err.message);
    console.error("   → Check: 1) Arduino connected?  2) SERIAL_PORT correct in .env?  3) Another app using port?");
  });

  port.on("close", () => {
    console.warn("⚠️  Serial port closed. Retrying in 5s...");
    setTimeout(initSerial, 5000);
  });

  parser.on("data", (line) => {
    const trimmed = line.trim();

    // Sirf JSON lines process karo (Arduino kabhi kabhi garbage bhi bhejta hai)
    if (!trimmed.startsWith("{")) return;

    try {
      const parsed = JSON.parse(trimmed);
      const ts = new Date().toISOString();
      parsed.timestamp = parsed.timestamp || ts;

      // Map bridge field names to server schema expectations
      if (parsed.volt !== undefined && parsed.voltage_estimated === undefined) {
        parsed.voltage_estimated = parsed.volt;
      }
      
      // Convert relay from number to string or use brightness
      if (typeof parsed.relay === "number") {
        parsed.relay = parsed.relay === 1 ? "on" : "off";
      } else if (parsed.brightness !== undefined && !parsed.relay) {
        parsed.relay = parsed.brightness > 0 ? "on" : "off";
      }

      let topic = MQTT_TOPIC;
      if (parsed.lux !== undefined || parsed.voltage_estimated !== undefined) {
        topic = `home/${HOME_ID}/ldr`;
      } else if (parsed.watts !== undefined || parsed.power !== undefined) {
        topic = `home/${HOME_ID}/power`;
        if (parsed.power !== undefined && parsed.watts === undefined) {
          parsed.watts = parsed.power;
        }
      } else if (parsed.occupied !== undefined && parsed.room) {
        topic = `home/${HOME_ID}/motion/${parsed.room}`;
      } else if (parsed.person_detected !== undefined && parsed.room) {
        topic = `home/${HOME_ID}/vision/${parsed.room}`;
      } else if (parsed.device !== undefined && parsed.watts !== undefined) {
        topic = `home/${HOME_ID}/nilm`;
      }

      const payload = JSON.stringify(parsed);

      mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error("❌ Publish failed:", err.message);
        } else {
          console.log(`📤 Published → ${topic} | lux: ${parsed.lux} | relay: ${parsed.relay} | voltage: ${parsed.voltage_estimated}`);
        }
      });
    } catch (e) {
      console.warn("⚠️  Invalid JSON skipped:", trimmed);
    }
  });
}

// --- Graceful shutdown ---
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down bridge...");
  mqttClient.end(true, () => process.exit(0));
});
