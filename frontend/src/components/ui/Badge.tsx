import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "info" | "danger";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-brand-50 text-brand-700 ring-brand-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

export default function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
