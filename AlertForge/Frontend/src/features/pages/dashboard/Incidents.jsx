import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Globe, Clock, CalendarDays, ArrowRight, Radio } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Data ─────────────────────────────────────────────────────────────────────

const initialIncidents = [];

// ─── Style maps ───────────────────────────────────────────────────────────────

const severityClasses = {
  P1: "bg-red-950/70 text-red-200 border border-red-800/80",
  P2: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
  P3: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
};

const statusClasses = {
  Active: "bg-red-950/70 text-red-200 border border-red-800/80",
  Monitoring: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
  Resolved: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
  Identified: "bg-purple-950/60 text-purple-200 border border-purple-800/70",
  Investigating: "bg-blue-950/60 text-blue-200 border border-blue-800/70",
};

const cardBorderClasses = {
  Active: "border-l-red-700",
  Monitoring: "border-l-orange-600",
  Investigating: "border-l-blue-600",
  Identified: "border-l-purple-600",
  Resolved: "border-l-zinc-700",
};

const avatarColors = [
  "bg-violet-900/80 text-violet-200",
  "bg-blue-900/80 text-blue-200",
  "bg-emerald-900/80 text-emerald-200",
  "bg-orange-900/80 text-orange-200",
];

// ─── Incident Card ────────────────────────────────────────────────────────────

function IncidentCard({ incident }) {
  const navigate = useNavigate();
  const isActive = incident.status !== "Resolved";

  return (
    <div
      className={`
        relative flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950
        border-l-2 ${cardBorderClasses[incident.status] ?? "border-l-zinc-700"}
        p-5 transition-all duration-200
        hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/60
        ${incident.status === "Resolved" ? "opacity-70" : ""}
      `}
    >
      {/* Top row — title + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pulsing dot for active */}
          {isActive && (
            <span className="relative flex h-2 w-2 shrink-0 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug">
            {incident.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${severityClasses[incident.severity]}`}
          >
            {incident.severity}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusClasses[incident.status]}`}
          >
            {incident.status}
          </span>
        </div>
      </div>

      {/* Service */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Globe className="size-3 shrink-0" />
        <span>{incident.service}</span>
      </div>

      {/* Meta row — started + duration */}
      <div className="flex items-center gap-5 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3 shrink-0" />
          {incident.startedAt}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3 shrink-0" />
          {isActive ? (
            <span className="text-orange-400 font-mono">
              {incident.duration}
            </span>
          ) : (
            <span className="font-mono">{incident.duration}</span>
          )}
        </span>
      </div>

      {/* Responders */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600">Responders</span>
        <div className="flex -space-x-1.5">
          {incident.responders.map((initials, i) => (
            <div
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1 ring-black ${avatarColors[i % avatarColors.length]}`}
            >
              {initials}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Last update */}
      <div className="flex items-start gap-2">
        <Radio className="size-3 shrink-0 text-zinc-600 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 italic truncate">
            "{incident.lastUpdate}"
          </p>
          <p className="text-[11px] text-zinc-700 mt-0.5">
            {incident.updatedAgo}
          </p>
        </div>
      </div>

      {/* View details button */}
      <button
        type="button"
        onClick={() => navigate(`/dashboard/incidents/${incident.id}`)}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700"
      >
        View Incident Details
        <ArrowRight className="size-3" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Incidents() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [incidents, setIncidents] = useState(initialIncidents);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    service: "",
    severity: "P2",
    status: "Active",
    startedAt: "",
    duration: "",
  });

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title || !form.service) return;
    setIncidents((prev) => [
      {
        id: Date.now(),
        title: form.title,
        service: form.service,
        severity: form.severity,
        status: form.status,
        startedAt: form.startedAt || "Just now",
        duration: form.duration || "00:00:00",
        responders: [],
        lastUpdate: "Incident created manually",
        updatedAgo: "Just now",
      },
      ...prev,
    ]);
    setForm({
      title: "",
      service: "",
      severity: "P2",
      status: "Active",
      startedAt: "",
      duration: "",
    });
    setOpenCreate(false);
  };

  const filtered = useMemo(() => {
    let result = incidents;
    if (tab !== "all")
      result = result.filter((i) => i.status.toLowerCase() === tab);
    if (search.trim())
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.service.toLowerCase().includes(search.toLowerCase()),
      );
    return result;
  }, [incidents, tab, search]);

  const counts = useMemo(
    () => ({
      active: incidents.filter((i) => i.status === "Active").length,
      monitoring: incidents.filter((i) => i.status === "Monitoring").length,
      resolved: incidents.filter((i) => i.status === "Resolved").length,
    }),
    [incidents],
  );

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Incidents</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track, manage and respond to all incidents
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
        >
          + Create Incident
        </button>
      </div>

      {/* Search + Tabs row */}
      <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="pb-1">
            <TabsTrigger
              value="all"
              className="text-zinc-400 data-active:text-zinc-100"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="text-zinc-400 data-active:text-zinc-100"
            >
              Active{" "}
              {counts.active > 0 && (
                <span className="ml-1 rounded-full bg-red-900/60 px-1.5 text-[10px] text-red-300">
                  {counts.active}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="monitoring"
              className="text-zinc-400 data-active:text-zinc-100"
            >
              Monitoring{" "}
              {counts.monitoring > 0 && (
                <span className="ml-1 rounded-full bg-orange-900/60 px-1.5 text-[10px] text-orange-300">
                  {counts.monitoring}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              className="text-zinc-400 data-active:text-zinc-100"
            >
              Resolved
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <Field orientation="horizontal" className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 h-8 text-sm"
          />
          <Button
            size="sm"
            className="border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 h-8"
          >
            Search
          </Button>
        </Field>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <p className="text-sm">No incidents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}

      {/* Create sheet */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="border border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Create Incident</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Fill in details and create a new incident.
            </DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-4 px-4 pb-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Incident</label>
              <Input
                value={form.incident}
                onChange={(e) => handleFormChange("incident", e.target.value)}
                className="border-zinc-700 bg-zinc-900 text-zinc-100"
                placeholder="API Service Down"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Service / Team</label>
              <Input
                value={form.team}
                onChange={(e) => handleFormChange("team", e.target.value)}
                className="border-zinc-700 bg-zinc-900 text-zinc-100"
                placeholder="api.acme.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => handleFormChange("severity", e.target.value)}
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                >
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleFormChange("status", e.target.value)}
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                >
                  <option>Active</option>
                  <option>Monitoring</option>
                  <option>Investigating</option>
                  <option>Identified</option>
                  <option>Resolved</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Started At</label>
                <Input
                  value={form.startedAt}
                  onChange={(e) =>
                    handleFormChange("startedAt", e.target.value)
                  }
                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  placeholder="May 20, 2026 10:21 AM"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Duration</label>
                <Input
                  value={form.duration}
                  onChange={(e) => handleFormChange("duration", e.target.value)}
                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  placeholder="00:23:41"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700"
            >
              Create Incident
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
