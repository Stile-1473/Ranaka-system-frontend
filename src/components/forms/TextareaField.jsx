import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const TextareaField = forwardRef(
  (
    { label, error, className, textareaClassName, description, rows = 5, ...props },
    ref
  ) => {
    return (
      <label className={cn("flex flex-col gap-2", className)}>
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {description ? (
          <span className="text-xs text-slate-400">{description}</span>
        ) : null}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            "rounded-[1.05rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-50 shadow-[0_16px_40px_-30px_rgba(2,6,23,1)] outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/8 focus:ring-4 focus:ring-emerald-500/10",
            error && "border-rose-400/35 focus:border-rose-400/45 focus:ring-rose-500/10",
            textareaClassName
          )}
          {...props}
        />
        {error ? <span className="text-xs text-rose-300">{error}</span> : null}
      </label>
    );
  }
);

TextareaField.displayName = "TextareaField";

export default TextareaField;
