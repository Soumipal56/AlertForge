import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Clock,
  Activity,
  Zap,
  ExternalLink,
  RefreshCw,
  Radio,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

// Generate 90 days of uptime bar data
function generateBars(pattern = "healthy") {
  return Array.from({ length: 90 }, (_, i) => {
    if (pattern === "healthy") {
      const rand = Math.random();
      if (rand > 0.97) return "outage";
      if (rand > 0.93) return "degraded";
      return "operational";
    }
    if (pattern === "mostly") {
      const rand = Math.random();
      if (rand > 0.88) return "outage";
      if (rand > 0.78) return "degraded";
      return "operational";
    }
    if (pattern === "degraded") {
      const rand = Math.random();
      if (rand > 0.7) return "degraded";
      if (rand > 0.9) return "outage";
      return "operational";
    }
    return "operational";
  });
}

const SERVICES = [
  {
    id: 1,
    name: "API Gateway",
    url: "api.acme.com",
    status: "operational",
    uptime: "99.98%",
    bars: generateBars("healthy"),
    responseTime: "112ms",
  },
  {
    id: 2,
    name: "Payment Service",
    url: "payments.acme.com",
    status: "degraded",
    uptime: "99.21%",
    bars: generateBars("mostly"),
    responseTime: "843ms",
  },
  {
    id: 3,
    name: "Auth Service",
    url: "auth.acme.com",
    status: "operational",
    uptime: "99.99%",
    bars: generateBars("healthy"),
    responseTime: "67ms",
  },
  {
    id: 4,
    name: "Upload Service",
    url: "uploads.acme.com",
    status: "operational",
    uptime: "99.72%",
    bars: generateBars("mostly"),
    responseTime: "234ms",
  },
  {
    id: 5,
    name: "Dashboard",
    url: "dashboard.acme.com",
    status: "outage",
    uptime: "98.10%",
    bars: generateBars("degraded"),
    responseTime: "—",
  },
  {
    id: 6,
    name: "CDN & Assets",
    url: "cdn.acme.com",
    status: "operational",
    uptime: "100%",
    bars: generateBars("healthy"),
    responseTime: "18ms",
  },
];

const ACTIVE_INCIDENTS = [
  {
    id: 1,
    title: "Dashboard Latency Spike",
    service: "dashboard.acme.com",
    severity: "P2",
    status: "Investigating",
    startedAt: "May 20, 2026 11:00 AM",
    duration: "00:42:15",
    updates: [
      {
        id: 1,
        message:
          "We are investigating reports of elevated latency on the dashboard service.",
        time: "11:00 AM",
      },
      {
        id: 2,
        message:
          "Issue traced to a heavy analytics query running on the primary database. Team is working on isolating it.",
        time: "11:18 AM",
      },
      {
        id: 3,
        message:
          "Mitigation deployed — monitoring response times. Some users may still experience slowness.",
        time: "11:34 AM",
      },
    ],
  },
  {
    id: 2,
    title: "Payment Service Degraded Performance",
    service: "payments.acme.com",
    severity: "P2",
    status: "Monitoring",
    startedAt: "May 20, 2026 09:15 AM",
    duration: "02:27:05",
    updates: [
      {
        id: 1,
        message:
          "We are seeing elevated response times on the Payments API. Investigation underway.",
        time: "09:15 AM",
      },
      {
        id: 2,
        message:
          "Fix deployed to production. Watching response times stabilize.",
        time: "10:44 AM",
      },
    ],
  },
];

const PAST_INCIDENTS = [
  {
    id: 3,
    title: "File Upload Failing",
    service: "uploads.acme.com",
    severity: "P3",
    status: "Resolved",
    startedAt: "May 19, 2026 08:40 PM",
    resolvedAt: "May 19, 2026 09:45 PM",
    duration: "01:05:32",
    updates: [
      {
        id: 1,
        message: "We are investigating reports of file upload failures.",
        time: "08:40 PM",
      },
      {
        id: 2,
        message:
          "Issue identified — S3 bucket policy misconfiguration after an IAM role update.",
        time: "08:50 PM",
      },
      {
        id: 3,
        message:
          "Permissions corrected and deployed. All uploads are now processing normally.",
        time: "09:45 PM",
      },
    ],
  },
  {
    id: 4,
    title: "Login Issues for EU Users",
    service: "auth.acme.com",
    severity: "P3",
    status: "Resolved",
    startedAt: "May 18, 2026 05:20 PM",
    resolvedAt: "May 18, 2026 06:05 PM",
    duration: "00:45:10",
    updates: [
      {
        id: 1,
        message:
          "EU-region users are reporting issues logging in. Investigating.",
        time: "05:20 PM",
      },
      {
        id: 2,
        message:
          "Auth token expiry bug identified and patched. Deployed to production.",
        time: "06:05 PM",
      },
    ],
  },
  {
    id: 5,
    title: "API Service Outage",
    service: "api.acme.com",
    severity: "P1",
    status: "Resolved",
    startedAt: "May 15, 2026 10:21 AM",
    resolvedAt: "May 15, 2026 10:44 AM",
    duration: "00:23:41",
    updates: [
      {
        id: 1,
        message: "API is unreachable. Incident declared, team paged.",
        time: "10:21 AM",
      },
      {
        id: 2,
        message:
          "Root cause identified — database connection pool exhausted by unoptimized query in v2.3.1.",
        time: "10:35 AM",
      },
      {
        id: 3,
        message: "Deployment v2.3.1 rolled back. All services restored.",
        time: "10:44 AM",
      },
    ],
  },
];

// ─── Style maps ───────────────────────────────────────────────────────────────

const serviceStatusConfig = {
  operational: {
    dot: "bg-emerald-500",
    label: "Operational",
    labelClass: "text-emerald-400",
    barColor: "bg-emerald-700/80 hover:bg-emerald-500",
  },
  degraded: {
    dot: "bg-orange-400",
    label: "Degraded Performance",
    labelClass: "text-orange-400",
    barColor: "bg-orange-700/80 hover:bg-orange-400",
  },
  outage: {
    dot: "bg-red-500",
    label: "Outage",
    labelClass: "text-red-400",
    barColor: "bg-red-700/80 hover:bg-red-500",
  },
};

const severityClasses = {
  P1: "bg-red-950/70 text-red-200 border border-red-800/80",
  P2: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
  P3: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
};

const incidentStatusClasses = {
  Investigating: "bg-blue-950/60 text-blue-200 border border-blue-800/70",
  Monitoring: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
  Identified: "bg-purple-950/60 text-purple-200 border border-purple-800/70",
  Resolved: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
};

// ─── Overall status banner ────────────────────────────────────────────────────

function OverallBanner({ services, activeIncidents }) {
  const hasOutage = services.some((s) => s.status === "outage");
  const hasDegraded = services.some((s) => s.status === "degraded");
  const hasActive = activeIncidents.length > 0;

  let config;
  if (hasOutage || hasActive) {
    config = {
      icon: XCircle,
      iconClass: "text-red-400",
      bg: "bg-red-950/20 border-red-900/40",
      title: "Service Disruption",
      sub: `${activeIncidents.length} active incident${activeIncidents.length !== 1 ? "s" : ""} — team is responding`,
      pulse: "bg-red-500",
    };
  } else if (hasDegraded) {
    config = {
      icon: AlertTriangle,
      iconClass: "text-orange-400",
      bg: "bg-orange-950/20 border-orange-900/40",
      title: "Degraded Performance",
      sub: "Some services are experiencing issues",
      pulse: "bg-orange-400",
    };
  } else {
    config = {
      icon: CheckCircle2,
      iconClass: "text-emerald-400",
      bg: "bg-emerald-950/20 border-emerald-900/40",
      title: "All Systems Operational",
      sub: "All services are running normally",
      pulse: "bg-emerald-500",
    };
  }

  return (
    <div
      className={`rounded-lg border ${config.bg} px-6 py-5 flex items-center gap-4`}
    >
      <div className="relative shrink-0">
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulse}`}
          />
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${config.pulse}`}
          />
        </span>
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold text-zinc-100">{config.title}</h2>
        <p className="text-sm text-zinc-400 mt-0.5">{config.sub}</p>
      </div>
      <config.icon className={`size-6 shrink-0 ${config.iconClass}`} />
    </div>
  );
}

// ─── Uptime bar graph ─────────────────────────────────────────────────────────

function UptimeBars({ bars }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative">
      <div className="flex items-end gap-px h-8">
        {bars.map((status, i) => {
          const cfg = serviceStatusConfig[status];
          const daysAgo = 89 - i;
          const label = daysAgo === 0 ? "Today" : `${daysAgo}d ago`;
          return (
            <div
              key={i}
              className="relative flex-1 group"
              onMouseEnter={() => setHovered({ i, status, label })}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={`w-full rounded-sm transition-colors duration-100 ${cfg.barColor} ${
                  status === "operational"
                    ? "h-5"
                    : status === "degraded"
                      ? "h-6"
                      : "h-8"
                }`}
              />
              {/* Tooltip */}
              {hovered?.i === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 pointer-events-none">
                  <div className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] whitespace-nowrap shadow-xl">
                    <p className="text-zinc-400">{label}</p>
                    <p className={`font-semibold ${cfg.labelClass}`}>
                      {cfg.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({ service }) {
  const cfg = serviceStatusConfig[service.status];

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="size-3.5 text-zinc-600 shrink-0" />
          <span className="text-sm font-semibold text-zinc-200 truncate">
            {service.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-medium ${cfg.labelClass}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* URL + response time */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-600 font-mono">{service.url}</span>
        <span className="flex items-center gap-1 text-zinc-600">
          <Clock className="size-3" />
          {service.responseTime}
        </span>
      </div>

      {/* Uptime bars */}
      <UptimeBars bars={service.bars} />

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-700">90 days ago</span>
        <span className={`font-semibold ${cfg.labelClass}`}>
          {service.uptime} uptime
        </span>
        <span className="text-zinc-700">Today</span>
      </div>
    </div>
  );
}

// ─── Active incident card ─────────────────────────────────────────────────────

function ActiveIncidentCard({ incident }) {
  return (
    <div className="rounded-lg border border-red-900/40 bg-red-950/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-red-900/30">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100">
              {incident.title}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
              {incident.service}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${severityClasses[incident.severity]}`}
          >
            {incident.severity}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${incidentStatusClasses[incident.status]}`}
          >
            {incident.status}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-5 px-5 py-2.5 border-b border-red-900/20 text-[11px] text-zinc-600">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3" /> Started {incident.startedAt}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-orange-400">
          <Activity className="size-3" /> {incident.duration}
        </span>
      </div>

      {/* Updates */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {incident.updates.map((u, i) => (
          <div key={u.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                <Radio className="size-2.5" />
              </div>
              {i < incident.updates.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-zinc-800/60 min-h-3" />
              )}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-zinc-600">{u.time}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {u.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Past incident row ────────────────────────────────────────────────────────

function PastIncidentRow({ incident }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-900/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-300">
              {incident.title}
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">
              {incident.service}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${severityClasses[incident.severity]}`}
          >
            {incident.severity}
          </span>
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-zinc-600">{incident.startedAt}</p>
            <p className="text-[11px] text-zinc-700 font-mono">
              {incident.duration}
            </p>
          </div>
          {open ? (
            <ChevronUp className="size-3.5 text-zinc-600" />
          ) : (
            <ChevronDown className="size-3.5 text-zinc-600" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-5 py-4 flex flex-col gap-3">
          {/* Resolved meta */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-600 mb-1">
            <CheckCircle2 className="size-3 text-emerald-500" />
            Resolved: {incident.resolvedAt} · Total duration:{" "}
            {incident.duration}
          </div>
          {/* Updates */}
          {incident.updates.map((u, i) => (
            <div key={u.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-600">
                  <Zap className="size-2.5" />
                </div>
                {i < incident.updates.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-zinc-800/60 min-h-3" />
                )}
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <span className="text-[11px] text-zinc-700 block mb-1">
                  {u.time}
                </span>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {u.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow({ services }) {
  const avgUptime =
    services.reduce((acc, s) => acc + parseFloat(s.uptime), 0) /
    services.length;

  const operational = services.filter((s) => s.status === "operational").length;
  const total = services.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "30-day Uptime",
          value: `${avgUptime.toFixed(2)}%`,
          sub: "avg across all services",
          color: "text-emerald-400",
        },
        {
          label: "Services Online",
          value: `${operational}/${total}`,
          sub: "currently operational",
          color: operational === total ? "text-emerald-400" : "text-orange-400",
        },
        {
          label: "Active Incidents",
          value: ACTIVE_INCIDENTS.length,
          sub: "being responded to",
          color:
            ACTIVE_INCIDENTS.length === 0 ? "text-zinc-400" : "text-red-400",
        },
        {
          label: "Incidents This Month",
          value: PAST_INCIDENTS.length + ACTIVE_INCIDENTS.length,
          sub: "total incidents in May",
          color: "text-zinc-400",
        },
      ].map(({ label, value, sub, color }) => (
        <div
          key={label}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-4"
        >
          <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
          <p className="text-xs font-medium text-zinc-300 mt-1">{label}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [lastChecked] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );

  return (
    <div className="flex flex-col gap-0">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Status Page</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Public-facing status for all services
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Public link */}
          <a
            href="#"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="size-3.5" />
            View public page
          </a>
          {/* Last updated */}
          <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500">
            <RefreshCw className="size-3" />
            Updated {lastChecked}
          </div>
        </div>
      </div>

      {/* ── Overall banner ─────────────────────────────────────────────────── */}
      <OverallBanner services={SERVICES} activeIncidents={ACTIVE_INCIDENTS} />

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="mt-5">
        <StatsRow services={SERVICES} />
      </div>

      {/* ── Services section ───────────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">Services</h2>
          <span className="text-[11px] text-zinc-600">
            {SERVICES.length} monitored
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>

      {/* ── Active incidents ───────────────────────────────────────────────── */}
      {ACTIVE_INCIDENTS.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <h2 className="text-sm font-semibold text-zinc-300">
              Active Incidents
            </h2>
            <span className="rounded-full bg-red-950/60 border border-red-900/50 px-2 py-0.5 text-[10px] font-semibold text-red-300">
              {ACTIVE_INCIDENTS.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {ACTIVE_INCIDENTS.map((incident) => (
              <ActiveIncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </div>
      )}

      {/* ── Incident history ───────────────────────────────────────────────── */}
      <div className="mt-6 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Incident History
          </h2>
          <span className="text-[11px] text-zinc-600">Past 30 days</span>
        </div>
        {PAST_INCIDENTS.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-8 flex flex-col items-center gap-2">
            <CheckCircle2 className="size-6 text-emerald-500" />
            <p className="text-sm text-zinc-400">
              No incidents in the past 30 days
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {PAST_INCIDENTS.map((incident) => (
              <PastIncidentRow key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
