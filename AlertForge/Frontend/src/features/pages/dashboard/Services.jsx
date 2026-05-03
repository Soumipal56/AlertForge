import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Globe,
  Plus,
  Trash2,
  MoreHorizontal,
  Webhook,
  Code2,
  Hand,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  Activity,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { servicesApi } from "@/api/services.api";
import { normalizeService } from "@/lib/mapper";

const MONITOR_TYPES = ["UptimeRobot", "SDK", "Manual"];

const statusConfig = {
  operational: {
    dot: "bg-emerald-500",
    label: "Operational",
    labelClass: "text-emerald-400",
    badge: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
    icon: CheckCircle2,
    cardBorder: "border-l-emerald-800",
  },
  degraded: {
    dot: "bg-orange-400",
    label: "Degraded",
    labelClass: "text-orange-400",
    badge: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
    icon: AlertTriangle,
    cardBorder: "border-l-orange-700",
  },
  outage: {
    dot: "bg-red-500",
    label: "Outage",
    labelClass: "text-red-400",
    badge: "bg-red-950/70 text-red-200 border border-red-800/80",
    icon: XCircle,
    cardBorder: "border-l-red-700",
  },
};

const monitorConfig = {
  UptimeRobot: {
    icon: Webhook,
    badge: "bg-orange-950/40 text-orange-300 border border-orange-900/50",
    iconClass: "text-orange-400",
  },
  SDK: {
    icon: Code2,
    badge: "bg-violet-950/40 text-violet-300 border border-violet-900/50",
    iconClass: "text-violet-400",
  },
  Manual: {
    icon: Hand,
    badge: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    iconClass: "text-zinc-500",
  },
};

const dropdownContentClass =
  "w-44 border border-zinc-700 bg-zinc-950 text-zinc-100 [&_[data-slot=dropdown-menu-item]]:focus:bg-zinc-800";

function StatsBar({ services }) {
  const operational = services.filter((s) => s.status === "operational").length;
  const degraded = services.filter((s) => s.status === "degraded").length;
  const outage = services.filter((s) => s.status === "outage").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Services", value: services.length, sub: "registered", color: "text-zinc-100" },
        { label: "Operational", value: operational, sub: "running normally", color: "text-emerald-400" },
        { label: "Degraded", value: degraded, sub: "performance issues", color: "text-orange-400" },
        { label: "Outage", value: outage, sub: "currently down", color: "text-red-400" },
      ].map(({ label, value, sub, color }) => (
        <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
          <p className="text-xs font-medium text-zinc-300 mt-1">{label}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function UptimeBanner({ onDismiss }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-900/40 bg-orange-950/10 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <Webhook className="size-4 text-orange-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-zinc-200">Connect UptimeRobot for automatic monitoring</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Grab your webhook URL from Integrations and paste it into UptimeRobot.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => navigate("/dashboard/integrations")} className="flex items-center gap-1.5 rounded-md border border-orange-800/50 bg-orange-950/40 px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-900/40 transition-colors">
          Go to Integrations
          <ArrowRight className="size-3" />
        </button>
        <button onClick={onDismiss} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1.5">Dismiss</button>
      </div>
    </div>
  );
}

function ServiceCard({ service, onDelete, onStatusChange }) {
  const navigate = useNavigate();
  const sCfg = statusConfig[service.status] || statusConfig.operational;
  const mCfg = monitorConfig[service.monitorType] || monitorConfig.Manual;
  const MonitorIcon = mCfg.icon;
  const StatusIcon = sCfg.icon;

  return (
    <div className={`relative flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950 border-l-2 ${sCfg.cardBorder} p-5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/40`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
            <Globe className="size-4 text-zinc-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-200 truncate">{service.name}</p>
            <a href={service.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors font-mono truncate mt-0.5">
              {service.url}
              <ExternalLink className="size-2.5 shrink-0" />
            </a>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors outline-none shrink-0">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={dropdownContentClass}>
            <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onClick={() => navigate(`/dashboard/incidents?service=${service.id}`)}>
              <Activity className="size-3.5" />
              View Incidents
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {["operational", "degraded", "outage"].map((s) => (
              <DropdownMenuItem key={s} className="gap-2 text-xs cursor-pointer capitalize" onClick={() => onStatusChange(service.id, s)}>
                <span className={`h-2 w-2 rounded-full ${statusConfig[s].dot}`} />
                Set {statusConfig[s].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="gap-2 text-xs text-red-400 focus:text-red-300 focus:bg-red-950/40 cursor-pointer" onClick={() => onDelete(service.id)}>
              <Trash2 className="size-3.5" />
              Delete Service
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${sCfg.badge}`}>
          <StatusIcon className="size-3" />
          {sCfg.label}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${mCfg.badge}`}>
          <MonitorIcon className="size-3" />
          {service.monitorType}
        </span>
      </div>

      <div className="flex items-center gap-5 text-[11px] text-zinc-600 border-t border-zinc-800 pt-3">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="size-3" />
          {service.incidentCount} incident{service.incidentCount !== 1 ? "s" : ""}
        </span>
        <span className={`font-semibold ${sCfg.labelClass}`}>
          {service.uptime}% uptime
        </span>
        <span className="ml-auto">Since {new Date(service.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function AddServiceSheet({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState({ name: "", url: "", monitorType: "Manual" });

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    onAdd({
      name: form.name.trim(),
      url: form.url.trim(),
      monitorType: form.monitorType,
    });
    setForm({ name: "", url: "", monitorType: "Manual" });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-zinc-100">Add Service</SheetTitle>
          <SheetDescription className="text-zinc-400">Register a new service to monitor.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4 pb-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Service Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Payment API" className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Service URL</label>
            <input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://api.acme.com" className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Monitoring Type</label>
            <div className="flex flex-col gap-2">
              {MONITOR_TYPES.map((type) => {
                const cfg = monitorConfig[type] || monitorConfig.Manual;
                const Icon = cfg.icon;
                const selected = form.monitorType === type;
                return (
                  <button key={type} type="button" onClick={() => set("monitorType", type)} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${selected ? "border-zinc-600 bg-zinc-800" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 mt-0.5">
                      <Icon className={`size-3.5 ${cfg.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">{type}</span>
                        {selected && <CheckCircle2 className="size-3.5 text-emerald-500 ml-auto" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <button type="submit" className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
            <Plus className="size-4" />
            Add Service
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showBanner, setShowBanner] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await servicesApi.getAll();
      setServices((data.services || []).map(normalizeService));
    } catch (err) {
      console.error("Failed to fetch services", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDelete = async (id) => {
    try {
      await servicesApi.delete(id);
      setServices((p) => p.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete service", err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await servicesApi.updateStatus(id, status);
      setServices((p) => p.map((s) => (s.id === id ? { ...s, status } : s)));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleAdd = async (payload) => {
    try {
      const created = await servicesApi.create(payload);
      setServices((p) => [normalizeService(created), ...p]);
    } catch (err) {
      console.error("Failed to add service", err);
    }
  };

  const filtered = useMemo(() => {
    let result = services;
    if (filter !== "all") result = result.filter((s) => s.status === filter);
    if (search.trim()) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.url.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }, [services, search, filter]);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Services</h1>
          <p className="mt-1 text-sm text-zinc-400">Register and monitor the services your team is responsible for</p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 transition-colors">
          <Plus className="size-4" />
          Add Service
        </button>
      </div>

      {showBanner && <div className="mb-5"><UptimeBanner onDismiss={() => setShowBanner(false)} /></div>}

      <div className="mb-5">
        {loading ? <div className="py-8 text-center text-zinc-600 text-sm italic">Loading stats...</div> : <StatsBar services={services} />}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4 mb-5">
        <div className="flex items-center gap-1">
          {["all", "operational", "degraded", "outage"].map((f) => {
            const count = f === "all" ? services.length : services.filter((s) => s.status === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${filter === f ? "bg-zinc-800 text-zinc-100" : "text-zinc-600 hover:text-zinc-400"}`}>
                {f}
                <span className="ml-1.5 text-zinc-700">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-900 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors" />
        </div>
      </div>

      {loading ? <div className="py-16 text-center text-zinc-600 text-sm italic">Loading services...</div> :
       filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-16 flex flex-col items-center gap-2 text-center">
          <Globe className="size-6 text-zinc-700" />
          <p className="text-sm text-zinc-500">No services found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((service) => <ServiceCard key={service.id} service={service} onDelete={handleDelete} onStatusChange={handleStatusChange} />)}
        </div>
      )}

      <AddServiceSheet open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
    </div>
  );
}