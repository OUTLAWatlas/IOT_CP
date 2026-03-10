const { Router } = require("express");

const router = Router();

/**
 * POST /api/device/:id/valve
 * Body: { command: "open" | "close" }
 *
 * Publishes the valve command to MQTT so the ESP32 actuates the solenoid.
 */
router.post("/device/:id/valve", (req, res) => {
  const { id } = req.params;
  const { command } = req.body;

  if (command !== "open" && command !== "close") {
    return res.status(400).json({ error: 'command must be "open" or "close"' });
  }

  const mqttClient = req.app.locals.mqttClient;
  if (!mqttClient || !mqttClient.connected) {
    return res.status(503).json({ error: "MQTT broker unavailable" });
  }

  const topic = `device/${id}/command`;
  const payload = JSON.stringify({ valve: command });

  mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[API] MQTT publish error for ${id}:`, err.message);
      return res.status(500).json({ error: "Failed to publish command" });
    }

    console.log(`[API] Valve ${command.toUpperCase()} → ${topic}`);
    return res.json({ success: true, deviceId: id, valve: command });
  });
});

module.exports = router;
