import { AlertTriangle, Flame } from "lucide-react";

export default function AlertBanner({ visible, flameDetected, gasPpm }) {
  if (!visible) return null;

  return (
    <div className="animate-flash bg-red-600/90 backdrop-blur text-white px-6 py-3 flex items-center justify-center gap-3 font-semibold text-sm">
      {flameDetected && (
        <span className="flex items-center gap-1.5">
          <Flame className="h-5 w-5" />
          FLAME DETECTED
        </span>
      )}
      {flameDetected && gasPpm > 400 && (
        <span className="text-red-200">|</span>
      )}
      {gasPpm > 400 && (
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-5 w-5" />
          GAS LEVEL CRITICAL — {gasPpm} PPM
        </span>
      )}
    </div>
  );
}
