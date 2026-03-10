const mqtt = require("mqtt");
const { sendHazardAlert, sendPeriodicCheck } = require("./telegramBot");

// Track active hazards per device so we can send periodic reminders
const activeHazards = new Map(); // deviceId -> { type, gasPpm, flameDetected, intervalId }

const PERIODIC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Initialise the MQTT client, subscribe to topics, and wire
 * incoming messages to Socket.io + safety logic.
 * @param {import("socket.io").Server} io
 * @returns {import("mqtt").MqttClient}
 */
function initMqtt(io) {
  const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

  const opts = {};
  if (process.env.MQTT_USERNAME) {
    opts.username = process.env.MQTT_USERNAME;
    opts.password = process.env.MQTT_PASSWORD;
  }

  const client = mqtt.connect(brokerUrl, opts);

  client.on("connect", () => {
    console.log("[MQTT] Connected to broker");
    client.subscribe(["device/+/status", "device/+/lwt"], { qos: 1 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error:", err.message);
      else console.log("[MQTT] Subscribed to device/+/status & device/+/lwt");
    });
  });

  client.on("error", (err) => console.error("[MQTT] Error:", err.message));
  client.on("reconnect", () => console.log("[MQTT] Reconnecting…"));
  client.on("offline", () => console.warn("[MQTT] Client offline"));

  client.on("message", (topic, buffer) => {
    const segments = topic.split("/");
    const deviceId = segments[1];
    const channel = segments[2]; // "status" | "lwt"

    let payload;
    try {
      payload = JSON.parse(buffer.toString());
    } catch {
      console.warn(`[MQTT] Non-JSON message on ${topic}`);
      return;
    }

    if (channel === "lwt") {
      handleLwt(io, deviceId, payload);
    } else if (channel === "status") {
      handleStatus(io, client, deviceId, payload);
    }
  });

  return client;
}

// ── LWT (Last Will & Testament — device offline) ────────────────────────────
function handleLwt(io, deviceId, payload) {
  console.log(`[MQTT] LWT received for ${deviceId}`);

  const update = {
    deviceId,
    isOnline: false,
    gasPpm: payload.gasPpm ?? 0,
    flameDetected: payload.flameDetected ?? false,
    valveOpen: payload.valveOpen ?? false,
  };

  io.emit("device_update", update);

  sendHazardAlert(
    deviceId,
    "offline",
    `⚠️ *Device ${deviceId} went OFFLINE* (possible power outage).`
  );
}

// ── Live sensor status ───────────────────────────────────────────────────────
function handleStatus(io, mqttClient, deviceId, payload) {
  const { gasPpm, flameDetected, valveOpen } = payload;

  // Forward to React frontend
  const update = {
    deviceId,
    isOnline: true,
    gasPpm,
    flameDetected,
    valveOpen,
  };
  io.emit("device_update", update);

  // ── Safety Rule 1: High gas ──
  if (gasPpm > 400) {
    // Auto-close the valve
    mqttClient.publish(
      `device/${deviceId}/command`,
      JSON.stringify({ valve: "close" }),
      { qos: 1 }
    );
    console.log(`[SAFETY] Gas ${gasPpm} PPM > 400 — auto-closing valve for ${deviceId}`);

    sendHazardAlert(
      deviceId,
      "gas",
      `🚨 *HIGH GAS DETECTED*\nDevice: \`${deviceId}\`\nLevel: *${gasPpm} PPM*\n\nValve has been *automatically closed*.`
    );

    startPeriodicReminder(deviceId, "gas", gasPpm, flameDetected);
    return; // gas takes priority, skip flame branch
  }

  // ── Safety Rule 2: Flame detected — ask user ──
  if (flameDetected) {
    sendHazardAlert(
      deviceId,
      "flame",
      `🔥 *FLAME DETECTED*\nDevice: \`${deviceId}\`\n\nValve is currently *${valveOpen ? "OPEN" : "CLOSED"}*.\nChoose an action:`
    );

    startPeriodicReminder(deviceId, "flame", gasPpm, flameDetected);
    return;
  }

  // If we reach here the device is in a safe state — clear any active hazard
  clearHazard(deviceId);
}

// ── Periodic hazard reminders ────────────────────────────────────────────────
function startPeriodicReminder(deviceId, type, gasPpm, flameDetected) {
  // Already tracking — update values but don't create a duplicate timer
  if (activeHazards.has(deviceId)) {
    const h = activeHazards.get(deviceId);
    h.type = type;
    h.gasPpm = gasPpm;
    h.flameDetected = flameDetected;
    return;
  }

  const intervalId = setInterval(() => {
    const h = activeHazards.get(deviceId);
    if (!h) return;
    sendPeriodicCheck(deviceId, h.type, h.gasPpm);
  }, PERIODIC_INTERVAL_MS);

  activeHazards.set(deviceId, { type, gasPpm, flameDetected, intervalId });
}

function clearHazard(deviceId) {
  const h = activeHazards.get(deviceId);
  if (h) {
    clearInterval(h.intervalId);
    activeHazards.delete(deviceId);
    console.log(`[SAFETY] Hazard cleared for ${deviceId}`);
  }
}

module.exports = { initMqtt };
