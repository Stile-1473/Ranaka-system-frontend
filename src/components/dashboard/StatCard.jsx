import Card from "../ui/Card";

function StatCard({ label, value, tone = "brand", helper }) {
  const toneClasses =
    tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : tone === "rose"
        ? "bg-rose-50 text-rose-700"
        : "bg-brand-50 text-brand-700";

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <div className={`rounded-md px-2.5 py-1 text-xs font-medium ${toneClasses}`}>
          {label}
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
