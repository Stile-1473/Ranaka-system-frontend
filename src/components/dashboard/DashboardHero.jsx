import Card from "../ui/Card";
import Badge from "../ui/Badge";

function DashboardHero({ roleLabel, headline, description }) {
  return (
    <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(35,139,100,0.96),rgba(21,32,25,0.98))] text-white">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="bg-white/12 text-white" variant="neutral">
            {roleLabel}
          </Badge>
          <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight">
            {headline}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            {description}
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm text-white/80">
          Phase 1 focuses on foundation, routing, state, and shell quality before
          deep feature pages.
        </div>
      </div>
    </Card>
  );
}

export default DashboardHero;
