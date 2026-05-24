export function Metric({ label, value, tone = "cyan" }) {
  const color = tone === "danger" ? "text-danger" : tone === "amber" ? "text-amber" : "text-cyan";
  return (
    <div className="panel p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value ?? "-"}</p>
    </div>
  );
}
