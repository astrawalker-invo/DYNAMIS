import mqtt from "mqtt";

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const username = process.env.MQTT_USERNAME || undefined;
const password = process.env.MQTT_PASSWORD || undefined;

let client = null;
let connected = false;

/** @type {{ pattern: string, cb: (topic: string, payload: Buffer) => void }[]} */
const subscriptions = [];

function topicMatches(pattern, topic) {
  const p = pattern.split("/");
  const t = topic.split("/");
  for (let i = 0; i < p.length; i++) {
    if (p[i] === "#") return true;
    if (p[i] === "+") {
      if (i >= t.length) return false;
      continue;
    }
    if (p[i] !== t[i]) return false;
  }
  return p.length === t.length;
}

function wireClient() {
  client = mqtt.connect(brokerUrl, {
    username: username || undefined,
    password: password || undefined,
    reconnectPeriod: 5000,
    connectTimeout: 10_000,
  });

  client.on("connect", () => {
    connected = true;
    console.log("[MQTT] Connected to broker");
    const unique = [...new Set(subscriptions.map((s) => s.pattern))];
    for (const pat of unique) {
      client.subscribe(pat, (err) => {
        if (err) console.warn("[MQTT] Subscribe error", pat, err.message);
      });
    }
  });

  client.on("reconnect", () => {
    console.log("[MQTT] Reconnecting…");
  });

  client.on("error", (err) => {
    console.warn("[MQTT] Client error:", err.message);
  });

  client.on("close", () => {
    connected = false;
  });

  client.on("message", (topic, payload) => {
    for (const { pattern, cb } of subscriptions) {
      if (topicMatches(pattern, topic)) {
        try {
          cb(topic, payload);
        } catch (e) {
          console.warn("[MQTT] Handler error:", e.message);
        }
      }
    }
  });
}

export function getMqttConnected() {
  return connected;
}

export function initMqttClient() {
  if (client) return;
  try {
    wireClient();
  } catch (err) {
    console.warn(
      "MQTT broker not connected — running in demo-only mode:",
      err.message
    );
    client = null;
  }
}

export function publish(topic, payload) {
  if (!client || !connected) {
    return false;
  }
  try {
    client.publish(topic, JSON.stringify(payload), { qos: 0 });
    return true;
  } catch (err) {
    console.warn("[MQTT] Publish failed:", err.message);
    return false;
  }
}

/**
 * @param {string} pattern e.g. home/+/ldr
 * @param {(topic: string, payload: Buffer) => void} callback
 */
export function subscribe(pattern, callback) {
  subscriptions.push({ pattern, cb: callback });
  if (client && connected) {
    client.subscribe(pattern, (err) => {
      if (err) console.warn("[MQTT] Subscribe error", pattern, err.message);
    });
  }
}

export function getMqttClient() {
  return client;
}

setTimeout(() => {
  if (client && !connected) {
    console.warn(
      "MQTT broker not connected — running in demo-only mode"
    );
  }
}, 12_000);
