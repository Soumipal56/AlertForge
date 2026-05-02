// src/components/shared/Badges.jsx
// Import these anywhere you need severity or status badges
// Usage: <SeverityBadge severity="P1" /> or <StatusBadge status="Active" />

export const severityClasses = {
    P1: "bg-red-950/70 text-red-200 border border-red-800/80",
    P2: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
    P3: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
  };
  
  export const statusClasses = {
    Active:        "bg-red-950/70 text-red-200 border border-red-800/80",
    Monitoring:    "bg-orange-950/60 text-orange-200 border border-orange-800/70",
    Resolved:      "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
    Identified:    "bg-purple-950/60 text-purple-200 border border-purple-800/70",
    Investigating: "bg-blue-950/60 text-blue-200 border border-blue-800/70",
  };
  
  export const severityDot = {
    P1: "bg-red-600",
    P2: "bg-orange-500",
    P3: "bg-emerald-500",
  };
  
  export const statusDot = {
    Active:        "bg-red-600",
    Monitoring:    "bg-orange-500",
    Investigating: "bg-blue-500",
    Identified:    "bg-purple-500",
    Resolved:      "bg-emerald-500",
  };
  
  export function SeverityBadge({ severity, className = "" }) {
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${severityClasses[severity] ?? ""} ${className}`}>
        {severity}
      </span>
    );
  }
  
  export function StatusBadge({ status, className = "" }) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${statusClasses[status] ?? ""} ${className}`}>
        <span className={`size-1.5 rounded-full shrink-0 ${statusDot[status] ?? "bg-zinc-500"}`} />
        {status}
      </span>
    );
  }