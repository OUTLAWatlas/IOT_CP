import { useState } from "react";
import axios from "axios";
import { Power } from "lucide-react";

const API_BASE = "/api/device";

export default function ValveControl({ deviceId, valveOpen, setValveOpen }) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const nextState = !valveOpen;
    setValveOpen(nextState); // optimistic update

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/${encodeURIComponent(deviceId)}/valve`, {
        command: nextState ? "open" : "close",
      });
    } catch {
      setValveOpen(!nextState); // rollback on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col items-center justify-center gap-5 h-full">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
        Solenoid Valve
      </span>

      <button
        onClick={toggle}
        disabled={loading}
        className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          valveOpen
            ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50 focus-visible:ring-emerald-400"
            : "bg-red-500/20 text-red-400 ring-2 ring-red-500/50 focus-visible:ring-red-400"
        } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
        aria-label={valveOpen ? "Close valve" : "Open valve"}
      >
        <Power className="h-8 w-8" />
      </button>

      <div className="text-center">
        <p
          className={`text-lg font-bold ${valveOpen ? "text-emerald-400" : "text-red-400"}`}
        >
          {valveOpen ? "OPEN" : "CLOSED"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {loading ? "Sending command…" : "Tap to toggle"}
        </p>
      </div>
    </div>
  );
}
