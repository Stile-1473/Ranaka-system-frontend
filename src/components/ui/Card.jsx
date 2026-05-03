import { cn } from "../../utils/cn";

function Card({ className, children }) {
  return <div className={cn("glass-panel p-6", className)}>{children}</div>;
}

export default Card;
