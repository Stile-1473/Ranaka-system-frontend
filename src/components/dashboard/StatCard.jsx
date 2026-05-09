import Card from "../ui/Card";

function StatCard({ label, value, tone = "brand", helper }) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
      : tone === "rose"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
        : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{value}</p>
          {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
        </div>
        <div className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses}`}>
          {label}
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
