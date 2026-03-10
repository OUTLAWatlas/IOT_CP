import { Activity, Flame, Gauge, Wifi, WifiOff } from "lucide-react";
import StatusCard from "./StatusCard";
import ValveControl from "./ValveControl";
import GasChart from "./GasChart";

export default function Dashboard({ device, history, setValveOpen }) {
  const { isOnline, gasPpm, flameDetected, valveOpen, deviceId } = device;

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
    </div>
  );
}
