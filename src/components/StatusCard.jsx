export default function StatusCard({
  title,
  value,
  icon: Icon,
  valueColor = "text-white",
  subtitle,
  indicator,
}) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <Icon className="h-5 w-5 text-slate-500" />
      </div>

      <div className="flex items-center gap-2">
        {indicator && (
          <span
            className={`h-2.5 w-2.5 rounded-full ${indicator} animate-pulse`}
          />
        )}
        <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>
          {value}
        </span>
      </div>

      {subtitle && (
        <span className="text-xs text-slate-500">{subtitle}</span>
      )}
    </div>
  );
}
