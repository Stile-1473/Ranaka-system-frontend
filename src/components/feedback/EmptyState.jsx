import Card from "../ui/Card";

function EmptyState({ title, description }) {
  return (
    <Card className="border-dashed">
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Card>
  );
}

export default EmptyState;
