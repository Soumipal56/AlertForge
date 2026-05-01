import { useMemo, useState } from "react";
import { Outlet, useLocation, NavLink } from "react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/Sidebar";

// ─── Breadcrumb map ───────────────────────────────────────────────────────────
// Maps pathname segments → readable labels

const crumbLabels = {
  dashboard: "Dashboard",
  incidents: "Incidents",
  "war-room": "War Room",
  postmortem: "Postmortem",
  services: "Services",
  integrations: "Integrations & API Keys",
  status: "Status Page",
  team: "Team",
  settings: "Settings",
  new: "New Incident",
};

const initialIncidentRows = [
  {
    id: 1,
    incident: "API Service Down",
    team: "api.acme.com",
    severity: "P1",
    status: "Active",
    startedAt: "May 20, 2026 10:21 AM",
    duration: "00:23:41",
  },
  {
    id: 2,
    incident: "Payments Slower than usual",
    team: "payments.acme.com",
    severity: "P2",
    status: "Monitoring",
    startedAt: "May 20, 2026 09:15 AM",
    duration: "01:29:12",
  },
  {
    id: 3,
    incident: "File Upload Failing",
    team: "uploads.acme.com",
    severity: "P3",
    status: "Resolved",
    startedAt: "May 19, 2026 08:40 PM",
    duration: "01:05:32",
  },
  {
    id: 4,
    incident: "Login Issues",
    team: "auth.acme.com",
    severity: "P3",
    status: "Resolved",
    startedAt: "May 18, 2026 05:20 PM",
    duration: "00:45:10",
  },
];

const severityClasses = {
  P1: "bg-red-500/20 text-red-300 border border-red-500/30",
  P2: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  P3: "bg-green-500/20 text-green-300 border border-green-500/30",
};

const statusClasses = {
  Active: "bg-red-500/20 text-red-300 border border-red-500/30",
  Monitoring: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  Resolved: "bg-green-500/20 text-green-300 border border-green-500/30",
};

function Breadcrumbs() {
  const location = useLocation();

  // Split path and filter empty strings
  const segments = location.pathname.split("/").filter(Boolean);

  // Build cumulative paths: ["dashboard"] → ["dashboard", "dashboard/incidents"] etc
  const crumbs = segments.map((seg, i) => ({
    label: crumbLabels[seg] || seg,
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-muted-foreground/50 select-none">/</span>
          )}
          {crumb.isLast ? (
            <span className="font-medium text-white">{crumb.label}</span>
          ) : (
            <NavLink
              to={crumb.path}
              className="text-zinc-400 transition-colors hover:text-white"
            >
              {crumb.label}
            </NavLink>
          )}
        </span>
      ))}
    </nav>
  );
}

function IncidentsListCard() {
  const [tab, setTab] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [rows, setRows] = useState(initialIncidentRows);
  const [form, setForm] = useState({
    incident: "",
    team: "",
    severity: "P2",
    status: "Active",
    startedAt: "",
    duration: "",
  });

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateIncident = (event) => {
    event.preventDefault();
    if (!form.incident || !form.team || !form.startedAt || !form.duration) {
      return;
    }
    setRows((prev) => [
      {
        id: Date.now(),
        incident: form.incident,
        team: form.team,
        severity: form.severity,
        status: form.status,
        startedAt: form.startedAt,
        duration: form.duration,
      },
      ...prev,
    ]);
    setForm({
      incident: "",
      team: "",
      severity: "P2",
      status: "Active",
      startedAt: "",
      duration: "",
    });
    setOpenCreate(false);
  };

  const filteredRows = useMemo(() => {
    if (tab === "all") {
      return rows;
    }
    return rows.filter((row) => row.status.toLowerCase() === tab);
  }, [rows, tab]);

  const formatStartedAt = (value) => {
    const [datePart, timePart] = value.split(/ (\d{1,2}:\d{2} [AP]M)$/);
    return {
      date: datePart ?? value,
      time: timePart ?? "",
    };
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-0 py-4">
        <div>
          <h1 className="text-xl font-semibold">Incidents</h1>
          <p className="mt-1 text-sm text-zinc-400">List of all Incident in your team</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
          onClick={() => setOpenCreate(true)}
        >
          + Create Incident
        </button>
      </div>

      <div className="border-b border-zinc-800 px-0 py-3">
        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="pb-1">
            <TabsTrigger value="all" className="text-zinc-400 data-active:text-zinc-100">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="text-zinc-400 data-active:text-zinc-100">
              Active
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="text-zinc-400 data-active:text-zinc-100">
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-zinc-400 data-active:text-zinc-100">
              Resolved
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[2.2fr_1fr_1fr_1.4fr_1fr] gap-3 border-b border-zinc-800 px-0 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Incident</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Started At</span>
            <span>Duration</span>
          </div>

          {filteredRows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[2.2fr_1fr_1fr_1.4fr_1fr] gap-3 border-b border-zinc-800 px-0 py-4 text-sm"
            >
              <div>
                <p className="font-medium text-zinc-100">{row.incident}</p>
                <p className="mt-1 text-xs text-zinc-500">{row.team}</p>
              </div>
              <div>
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${severityClasses[row.severity]}`}>
                  {row.severity}
                </span>
              </div>
              <div>
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${statusClasses[row.status]}`}>
                  {row.status}
                </span>
              </div>
              <div className="leading-tight">
                <p className="text-zinc-300">{formatStartedAt(row.startedAt).date}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatStartedAt(row.startedAt).time}</p>
              </div>
              <p className="text-zinc-300">{row.duration}</p>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={openCreate} onOpenChange={setOpenCreate}>
        <SheetContent
          side="right"
          className="w-full border-l border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle className="text-zinc-100">Create Incident</SheetTitle>
            <SheetDescription className="text-zinc-400">
              Fill in details and create a new incident.
            </SheetDescription>
          </SheetHeader>
          <form className="mt-4 space-y-4 px-4 pb-4" onSubmit={handleCreateIncident}>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Incident</label>
              <Input
                value={form.incident}
                onChange={(event) => handleFormChange("incident", event.target.value)}
                className="border-zinc-700 bg-zinc-900 text-zinc-100"
                placeholder="API Service Down"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Service / Team</label>
              <Input
                value={form.team}
                onChange={(event) => handleFormChange("team", event.target.value)}
                className="border-zinc-700 bg-zinc-900 text-zinc-100"
                placeholder="api.acme.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Severity</label>
                <select
                  value={form.severity}
                  onChange={(event) => handleFormChange("severity", event.target.value)}
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
                  onChange={(event) => handleFormChange("status", event.target.value)}
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                >
                  <option value="Active">Active</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Started At</label>
                <Input
                  value={form.startedAt}
                  onChange={(event) => handleFormChange("startedAt", event.target.value)}
                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  placeholder="May 20, 2026 10:21 AM"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Duration</label>
                <Input
                  value={form.duration}
                  onChange={(event) => handleFormChange("duration", event.target.value)}
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
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const isDashboardRoot = location.pathname === "/dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Sticky top header with sidebar toggle + breadcrumbs */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 bg-black px-4 text-zinc-100 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-700" />
          <Breadcrumbs />
        </header>

        {/* Page content — each dashboard page renders here */}
        <main className="flex min-h-[calc(100svh-3.5rem)] flex-1 flex-col gap-4 bg-black p-6 text-zinc-100">
          {isDashboardRoot ? <IncidentsListCard /> : <Outlet />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}