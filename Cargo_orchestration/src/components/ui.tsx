import { cn } from "../utils/cn";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-200">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatBadge({
  label,
  value,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "warn" | "danger" | "info";
  sub?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-50 text-slate-700 border-slate-200/70",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    warn: "bg-amber-50 text-amber-700 border-amber-200/70",
    danger: "bg-rose-50 text-rose-700 border-rose-200/70",
    info: "bg-sky-50 text-sky-700 border-sky-200/70",
  };
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 flex flex-col",
        tones[tone]
      )}
    >
      <span className="text-[10px] uppercase tracking-wider font-medium opacity-80">
        {label}
      </span>
      <span className="text-lg font-semibold tracking-tight">{value}</span>
      {sub && <span className="text-[10px] mt-0.5 opacity-75">{sub}</span>}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
  size = "sm",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger" | "info" | "violet";
  size?: "xs" | "sm";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
  };
  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        sizes[size],
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500",
    secondary:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger:
      "bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-200",
  };
  const sizes: Record<string, string> = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-3.5 py-2",
    lg: "text-sm px-4 py-2.5",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  className,
  title,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors",
        active
          ? "bg-indigo-100 text-indigo-700"
          : "hover:bg-slate-100 hover:text-slate-700",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ProgressBar({
  value,
  tone = "info",
  size = "md",
}: {
  value: number; // 0-1
  tone?: "info" | "success" | "warn" | "danger" | "violet";
  size?: "sm" | "md";
}) {
  const tones: Record<string, string> = {
    info: "from-sky-500 to-cyan-500",
    success: "from-emerald-500 to-green-500",
    warn: "from-amber-500 to-orange-500",
    danger: "from-rose-500 to-red-500",
    violet: "from-indigo-500 to-violet-500",
  };
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-slate-100",
        size === "sm" ? "h-1.5" : "h-2"
      )}
    >
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}
