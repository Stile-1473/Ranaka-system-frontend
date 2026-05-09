import { cn } from "../../utils/cn";

function SkeletonLine({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-slate-200/80",
        className
      )}
    />
  );
}

function SkeletonBlock({ variant = "card", rows = 4, className }) {
  if (variant === "chart") {
    return (
      <div
        className={cn(
          "flex h-full min-h-64 flex-col justify-end rounded-2xl border border-white/70 bg-white/58 p-5 backdrop-blur-xl",
          className
        )}
      >
        <div className="flex h-full items-end gap-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex-1 animate-pulse rounded-t-xl bg-slate-200/80"
              style={{ height: `${28 + ((index * 17) % 54)}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/70 bg-white/58 p-5 backdrop-blur-xl",
        className
      )}
    >
      <SkeletonLine className="h-4 w-32" />
      <SkeletonLine className="mt-4 h-7 w-2/3" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid animate-pulse gap-3 rounded-xl border border-white/70 bg-white/64 p-4 md:grid-cols-[1.4fr_0.7fr_0.7fr]"
          >
            <div>
              <SkeletonLine className="h-4 w-3/4" />
              <SkeletonLine className="mt-3 h-3 w-1/2" />
            </div>
            <SkeletonLine className="h-4 w-24 md:justify-self-center" />
            <SkeletonLine className="h-4 w-20 md:justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkeletonBlock;
