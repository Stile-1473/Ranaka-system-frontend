import EmptyState from "./EmptyState";

function FeatureGridPlaceholder({ items }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <EmptyState
          key={item.title}
          title={item.title}
          description={item.description}
        />
      ))}
    </div>
  );
}

export default FeatureGridPlaceholder;
