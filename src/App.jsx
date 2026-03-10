import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import AlertBanner from "./components/AlertBanner";
import Dashboard from "./components/Dashboard";

const SOCKET_URL = "ws://localhost:5000";

const MOCK_DEVICE = {
  deviceId: "sensor-01",
  isOnline: true,
  gasPpm: 120,
  flameDetected: false,
  valveOpen: true,
};

const MOCK_HISTORY = Array.from({ length: 20 }, (_, i) => ({
  time: new Date(Date.now() - (19 - i) * 60_000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
  ppm: Math.floor(80 + Math.random() * 60),
}));

export default function App() {
  const [device, setDevice] = useState(MOCK_DEVICE);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("device_update", (payload) => {
      setDevice(payload);
      setHistory((prev) => {
        const next = [
          ...prev,
          {
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            ppm: payload.gasPpm,
          },
        ];
        return next.length > 60 ? next.slice(-60) : next;
      });
    });

    return () => socket.disconnect();
  }, []);

  const setValveOpen = useCallback((open) => {
    setDevice((prev) => ({ ...prev, valveOpen: open }));
  }, []);

  const isCritical = device.flameDetected || device.gasPpm > 400;

  return (
    <div className="min-h-screen flex flex-col">
      <AlertBanner
        visible={isCritical}
        flameDetected={device.flameDetected}
        gasPpm={device.gasPpm}
      />

      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Gas Leak &amp; Flame Detection
          </h1>
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              connected ? "bg-emerald-400" : "bg-slate-600"
            }`}
            title={connected ? "WebSocket connected" : "WebSocket disconnected"}
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {device.deviceId}
        </span>
      </header>

      <main className="flex-1 p-6">
        <Dashboard
          device={device}
          history={history}
          setValveOpen={setValveOpen}
        />
      </main>
    </div>
  );
}
