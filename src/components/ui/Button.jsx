import { cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "../../utils/cn";

const buttonVariants = {
  primary:
    "bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const Button = forwardRef(
  (
    {
      asChild = false,
      children,
      className,
      variant = "primary",
      type = "button",
      ...props
    },
    ref
  ) => {
    const buttonClassName = cn(
      "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
      buttonVariants[variant],
      className
    );

    // asChild lets us style links like buttons without duplicating class names
    // throughout feature pages and table actions.
    if (asChild && isValidElement(children)) {
      return cloneElement(children, {
        ...props,
        ref,
        className: cn(buttonClassName, children.props.className),
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
