import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Shared helper for composing Tailwind class names safely.
export const cn = (...inputs) => twMerge(clsx(inputs));
