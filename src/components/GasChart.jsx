import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const THRESHOLD = 400;

export default function GasChart({ data }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Gas Concentration (MQ-5)
        </span>
        <span className="text-xs text-slate-500 font-mono">
          Last {data.length} readings
        </span>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              domain={[0, "auto"]}
              unit=" ppm"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "0.75rem",
                fontSize: 12,
                color: "#e2e8f0",
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <ReferenceLine
              y={THRESHOLD}
              stroke="#ef4444"
              strokeDasharray="6 4"
              label={{
                value: "Critical (400 PPM)",
                fill: "#ef4444",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
            <Line
              type="monotone"
              dataKey="ppm"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#38bdf8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
