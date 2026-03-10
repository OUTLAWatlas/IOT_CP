const TelegramBot = require("node-telegram-bot-api");

let bot = null;
let mqttClient = null;

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Initialise the Telegram bot and wire up callback‑query handling
 * so inline‑keyboard buttons can publish valve commands via MQTT.
 * @param {import("mqtt").MqttClient} mqtt
 * @returns {TelegramBot}
 */
function initTelegramBot(mqtt) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token === "YOUR_BOT_TOKEN_HERE") {
    console.warn("[TELEGRAM] Bot token not configured — alerts disabled");
    return null;
  }

  mqttClient = mqtt;
  bot = new TelegramBot(token, { polling: true });

  bot.on("polling_error", (err) =>
    console.error("[TELEGRAM] Polling error:", err.message)
  );

  // Handle inline‑keyboard button presses (valve open / close)
  bot.on("callback_query", (query) => {
    const data = query.data; // e.g. "valve:sensor-01:open"
    const parts = data.split(":");

    if (parts[0] !== "valve" || parts.length !== 3) return;

    const deviceId = parts[1];
    const command = parts[2]; // "open" | "close"

    if (command !== "open" && command !== "close") return;

    // Publish MQTT command
    if (mqttClient && mqttClient.connected) {
      mqttClient.publish(
        `device/${deviceId}/command`,
        JSON.stringify({ valve: command }),
        { qos: 1 }
      );
    }

    const label = command === "open" ? "OPENED" : "CLOSED";
    bot.answerCallbackQuery(query.id, { text: `Valve ${label}` });
    bot.editMessageText(
      `✅ Valve for *${deviceId}* has been *${label}* via Telegram.`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: "Markdown",
      }
    );

    console.log(`[TELEGRAM] User ${label} valve for ${deviceId}`);
  });

  console.log("[TELEGRAM] Bot initialised");
  return bot;
}

// ── Public helpers ───────────────────────────────────────────────────────────

/**
 * Send a hazard alert to the configured Telegram chat.
 * For flame events an inline keyboard with OPEN / CLOSE buttons is attached.
 */
function sendHazardAlert(deviceId, type, message) {
  if (!bot || !CHAT_ID) return;

  const opts = { parse_mode: "Markdown" };

  if (type === "flame") {
    opts.reply_markup = {
      inline_keyboard: [
        [
          { text: "🟢 Open Valve", callback_data: `valve:${deviceId}:open` },
          { text: "🔴 Close Valve", callback_data: `valve:${deviceId}:close` },
        ],
      ],
    };
  }

  bot.sendMessage(CHAT_ID, message, opts).catch((err) =>
    console.error("[TELEGRAM] Send error:", err.message)
  );
}

/**
 * Periodic reminder sent while a hazard is still active.
 */
function sendPeriodicCheck(deviceId, type, gasPpm) {
  if (!bot || !CHAT_ID) return;

  let text;
  if (type === "gas") {
    text = `⏰ *Periodic Update*\nDevice \`${deviceId}\` still reports *${gasPpm} PPM* gas. Valve remains closed.`;
  } else {
    text = `⏰ *Periodic Update*\nDevice \`${deviceId}\` still detects flame.`;
  }

  const opts = { parse_mode: "Markdown" };

  if (type === "flame") {
    opts.reply_markup = {
      inline_keyboard: [
        [
          { text: "🟢 Open Valve", callback_data: `valve:${deviceId}:open` },
          { text: "🔴 Close Valve", callback_data: `valve:${deviceId}:close` },
        ],
      ],
    };
  }

  bot.sendMessage(CHAT_ID, text, opts).catch((err) =>
    console.error("[TELEGRAM] Periodic send error:", err.message)
  );
}

module.exports = { initTelegramBot, sendHazardAlert, sendPeriodicCheck };
