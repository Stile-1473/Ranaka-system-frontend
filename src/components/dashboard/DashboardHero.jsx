import Card from "../ui/Card";
import Badge from "../ui/Badge";

function DashboardHero({ roleLabel, headline, description, actions = [] }) {
  return (
    <Card className="overflow-hidden border-slate-950/15 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(20,83,45,0.88),rgba(15,23,42,0.94))] text-white">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="border-white/15 bg-white/12 text-white" variant="neutral">
            {roleLabel}
          </Badge>
          <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight">
            {headline}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            {description}
          </p>
        </div>
        <div className="grid w-full max-w-md gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {(actions.length
            ? actions
            : [
                ["Focus", "Open work that needs a decision"],
                ["Control", "Track status without switching context"],
                ["Audit", "Keep movement visible and accountable"],
              ]
          ).map(([label, helper]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm leading-6 text-white/82 backdrop-blur-xl"
            >
              <p className="font-semibold text-white">{label}</p>
              <p className="mt-1 text-xs leading-5 text-white/68">{helper}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default DashboardHero;
