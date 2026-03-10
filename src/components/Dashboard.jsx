import { useState, useEffect, useCallback } from "react";
import { Activity, Flame, Gauge, Wifi, WifiOff, FlaskConical } from "lucide-react";
import axios from "axios";
import StatusCard from "./StatusCard";
import ValveControl from "./ValveControl";
import GasChart from "./GasChart";

const DEMO_COOLDOWN_SEC = 60;

export default function Dashboard({ device, history, setValveOpen }) {
  const { isOnline, gasPpm, flameDetected, valveOpen, deviceId } = device;

  const [demoRemaining, setDemoRemaining] = useState(0);
  const demoRunning = demoRemaining > 0;

  useEffect(() => {
    if (demoRemaining <= 0) return;
    const timer = setTimeout(() => setDemoRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [demoRemaining]);

  const triggerDemo = useCallback(async () => {
    if (demoRunning) return;
    setDemoRemaining(DEMO_COOLDOWN_SEC);
    try {
      await axios.post(`/api/device/${encodeURIComponent(deviceId)}/demo`);
    } catch {
      /* backend may not be connected yet — demo lock still counts down */
    }
  }, [demoRunning, deviceId]);

  const gasLevel =
    gasPpm > 400 ? "CRITICAL" : gasPpm > 200 ? "WARNING" : "NORMAL";
  const gasColor =
    gasPpm > 400
      ? "text-red-400"
      : gasPpm > 200
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2 grid-cols-1">
      {/* Row 1 — Status Cards */}
      <StatusCard
        title="Device Status"
        value={isOnline ? "Online" : "Offline"}
        icon={isOnline ? Wifi : WifiOff}
        valueColor={isOnline ? "text-emerald-400" : "text-red-400"}
        subtitle={deviceId}
        indicator={isOnline ? "bg-emerald-400" : "bg-red-400"}
      />

      <StatusCard
        title="Gas Concentration"
        value={`${gasPpm} PPM`}
        icon={Gauge}
        valueColor={gasColor}
        subtitle={gasLevel}
      />

      <StatusCard
        title="Flame Sensor"
        value={flameDetected ? "DETECTED" : "Clear"}
        icon={Flame}
        valueColor={flameDetected ? "text-red-400" : "text-emerald-400"}
        subtitle="IR Sensor"
        indicator={flameDetected ? "bg-red-400" : "bg-emerald-400"}
      />

      <StatusCard
        title="System Health"
        value={gasPpm > 400 || flameDetected ? "ALERT" : "Normal"}
        icon={Activity}
        valueColor={
          gasPpm > 400 || flameDetected ? "text-red-400" : "text-emerald-400"
        }
        subtitle="Auto-monitoring"
      />

      {/* Row 2 — Chart + Valve */}
      <div className="lg:col-span-3 md:col-span-2">
        <GasChart data={history} />
      </div>

      <div className="lg:col-span-1 md:col-span-2">
        <ValveControl
          deviceId={deviceId}
          valveOpen={valveOpen}
          setValveOpen={setValveOpen}
        />
      </div>

      {/* Row 3 — Demo Trigger */}
      <div className="lg:col-span-4 md:col-span-2">
        <button
          onClick={triggerDemo}
          disabled={demoRunning}
          className={`w-full flex items-center justify-center gap-3 rounded-2xl border px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            demoRunning
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300 cursor-not-allowed"
              : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400/60 cursor-pointer focus-visible:ring-indigo-400"
          }`}
        >
          <FlaskConical className="h-5 w-5" />
          {demoRunning
            ? `Demo Running… (${demoRemaining}s)`
            : "Run Presentation Demo"}
        </button>
      </div>
    </div>
  );
}
