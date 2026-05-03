import { useState, useEffect, useCallback } from "react";
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
import { statusApi } from "@/api/status.api";

const serviceStatusConfig = {
  operational: { dot: "bg-emerald-500", label: "Operational", labelClass: "text-emerald-400", barColor: "bg-emerald-700/80 hover:bg-emerald-500" },
  degraded: { dot: "bg-orange-400", label: "Degraded Performance", labelClass: "text-orange-400", barColor: "bg-orange-700/80 hover:bg-orange-400" },
  outage: { dot: "bg-red-500", label: "Outage", labelClass: "text-red-400", barColor: "bg-red-700/80 hover:bg-red-500" },
};

const severityClasses = { P1: "bg-red-950/70 text-red-200 border border-red-800/80", P2: "bg-orange-950/60 text-orange-200 border border-orange-800/70", P3: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70" };
const incidentStatusClasses = { Investigating: "bg-blue-950/60 text-blue-200 border border-blue-800/70", Monitoring: "bg-orange-950/60 text-orange-200 border border-orange-800/70", Identified: "bg-purple-950/60 text-purple-200 border border-purple-800/70", Resolved: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70" };

function OverallBanner({ services, activeIncidents }) {
  const hasOutage = services.some((s) => s.status === "outage");
  const hasDegraded = services.some((s) => s.status === "degraded");
  const hasActive = activeIncidents.length > 0;

  let config;
  if (hasOutage || hasActive) {
    config = { icon: XCircle, iconClass: "text-red-400", bg: "bg-red-950/20 border-red-900/40", title: "Service Disruption", sub: `${activeIncidents.length} active incidents`, pulse: "bg-red-500" };
  } else if (hasDegraded) {
    config = { icon: AlertTriangle, iconClass: "text-orange-400", bg: "bg-orange-950/20 border-orange-900/40", title: "Degraded Performance", sub: "Some services are experiencing issues", pulse: "bg-orange-400" };
  } else {
    config = { icon: CheckCircle2, iconClass: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-900/40", title: "All Systems Operational", sub: "All services are running normally", pulse: "bg-emerald-500" };
  }

  return (
    <div className={`rounded-lg border ${config.bg} px-6 py-5 flex items-center gap-4`}>
      <div className="relative shrink-0"><span className="relative flex h-3 w-3"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulse}`} /><span className={`relative inline-flex rounded-full h-3 w-3 ${config.pulse}`} /></span></div>
      <div className="flex-1"><h2 className="text-lg font-bold text-zinc-100">{config.title}</h2><p className="text-sm text-zinc-400 mt-0.5">{config.sub}</p></div>
      <config.icon className={`size-6 shrink-0 ${config.iconClass}`} />
    </div>
  );
}

function UptimeBars({ bars = [] }) {
  return (
    <div className="relative">
      <div className="flex items-end gap-px h-8">
        {bars.length === 0 ? <div className="flex-1 bg-zinc-900 rounded-sm h-5" /> : bars.map((status, i) => (
          <div key={i} className={`flex-1 rounded-sm ${serviceStatusConfig[status]?.barColor || "bg-zinc-800"} ${status === "operational" ? "h-5" : status === "degraded" ? "h-6" : "h-8"}`} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ service }) {
  const cfg = serviceStatusConfig[service.status] || serviceStatusConfig.operational;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0"><Globe className="size-3.5 text-zinc-600 shrink-0" /><span className="text-sm font-semibold text-zinc-200 truncate">{service.name}</span></div>
        <div className="flex items-center gap-1.5 shrink-0"><span className={`h-2 w-2 rounded-full ${cfg.dot}`} /><span className={`text-xs font-medium ${cfg.labelClass}`}>{cfg.label}</span></div>
      </div>
      <div className="flex items-center justify-between text-[11px]"><span className="text-zinc-600 font-mono">{service.url}</span></div>
      <UptimeBars bars={service.bars || []} />
      <div className="flex items-center justify-between text-[11px]"><span className="text-zinc-700">90 days ago</span><span className={`font-semibold ${cfg.labelClass}`}>{service.uptime}% uptime</span><span className="text-zinc-700">Today</span></div>
    </div>
  );
}

function ActiveIncidentCard({ incident }) {
  return (
    <div className="rounded-lg border border-red-900/40 bg-red-950/10 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-red-900/30">
        <div className="flex items-center gap-3 min-w-0"><span className="relative flex h-2 w-2 shrink-0 mt-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span><div><h3 className="text-sm font-semibold text-zinc-100">{incident.title}</h3><p className="text-[11px] text-zinc-500 mt-0.5 font-mono">{incident.service}</p></div></div>
        <div className="flex items-center gap-2 shrink-0"><span className={`rounded-md px-2 py-0.5 text-xs font-bold ${severityClasses[incident.severity]}`}>{incident.severity}</span><span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${incidentStatusClasses[incident.status]}`}>{incident.status}</span></div>
      </div>
      <div className="px-5 py-4"><p className="text-xs text-zinc-400 leading-relaxed">Incident in progress. Responders are actively working on it.</p></div>
    </div>
  );
}

export default function StatusPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await statusApi.getPublicStatus(user._id);
      setData(res);
    } catch (err) {
      console.error("[StatusPage] Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-8 text-center text-zinc-600 italic">Loading status page...</div>;
  if (!data) return <div className="p-8 text-center text-zinc-600 italic">No status data available.</div>;

  const services = (data.services || []).map(normalizeService);
  const activeIncidents = (data.activeIncidents || []).map(normalizeIncident);
  const pastIncidents = (data.pastIncidents || []).map(normalizeIncident);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div><h1 className="text-xl font-semibold text-zinc-100">Status Page</h1><p className="mt-1 text-sm text-zinc-400">Public-facing status for your services</p></div>
        <div className="flex items-center gap-3">
          <a href={`/status/${user._id}`} target="_blank" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"><ExternalLink className="size-3.5" /> View public page</a>
        </div>
      </div>

      <OverallBanner services={services} activeIncidents={activeIncidents} />

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Services</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {services.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
      </div>

      {activeIncidents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Active Incidents</h2>
          <div className="flex flex-col gap-3">
            {activeIncidents.map((i) => <ActiveIncidentCard key={i.id} incident={i} />)}
          </div>
        </div>
      )}

      <div className="mt-6 mb-2">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Incident History</h2>
        {pastIncidents.length === 0 ? <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-8 text-center text-zinc-500 text-sm">No recent incidents.</div> : 
          <div className="flex flex-col gap-2">
            {pastIncidents.map((i) => (
                <div key={i.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-zinc-300">{i.title}</p><p className="text-[11px] text-zinc-600">{i.service}</p></div>
                    <span className="text-[11px] text-zinc-700">{new Date(i.resolvedAt).toLocaleDateString()}</span>
                </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
