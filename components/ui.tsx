import clsx from "clsx";
import type { Severity, Status } from "@prisma/client";
import { SEVERITY_LABELS, STATUS_LABELS } from "@/lib/labels";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const SEVERITY_STYLE: Record<Severity, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

const STATUS_STYLE: Record<Status, string> = {
  NEW: "bg-sky-100 text-sky-800",
  UNDER_REVIEW: "bg-violet-100 text-violet-800",
  FORWARDED: "bg-brand-100 text-brand-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  DISMISSED: "bg-slate-100 text-slate-600",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", SEVERITY_STYLE[severity])}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function formatDate(d: Date | string, withTime = false) {
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Lagos",
  });
}
