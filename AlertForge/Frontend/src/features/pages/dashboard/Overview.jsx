import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SeverityBadge, StatusBadge } from "@/components/shared/Badges";
import { dropdownContentClass } from "@/constants/styles";
import { useIncidents } from "@/hooks/useIncidents";
import { useNavigate } from "react-router";

export function Overview() {
  const {
    filtered,
    tab,
    setTab,
    openCreate,
    form,
    handleFormChange,
    handleCreate,
    handleUpdateStatus,
    handleUpdateSeverity,
    handleOpenCreate,
    handleCloseCreate,
  } = useIncidents();

  const formatStartedAt = (date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
    };
  };

  const navigate = useNavigate();

  const handleRowClick = (id) => {
    navigate(`/incidents/${id}`);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-0 py-4">
        <div>
          <h1 className="text-xl font-semibold">Incidents</h1>
          <p className="mt-1 text-sm text-zinc-400">
            List of all incidents in your team
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
          onClick={handleOpenCreate}
        >
          + Create Incident
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 px-0 py-3">
        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="pb-1">
            {["all", "active", "monitoring", "resolved"].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="text-zinc-400 data-active:text-zinc-100 capitalize"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[2.2fr_1fr_1fr_1.4fr_1fr_auto] gap-3 border-b border-zinc-800 px-0 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Incident</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Started At</span>
            <span>Duration</span>
            <span className="sr-only">Open</span>
          </div>

          {filtered.map((row) => (
            <div
              key={row._id}
              role="link"
              tabIndex={0}
              onClick={() => handleRowClick(row._id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleRowClick(row._id);
                }
              }}
              className="grid grid-cols-[2.2fr_1fr_1fr_1.4fr_1fr_auto] gap-3 border-b border-zinc-800 px-0 py-4 text-sm outline-none transition-colors hover:bg-zinc-950/80 focus-visible:bg-zinc-950/80 cursor-pointer"
            >
              <div>
                <p className="font-medium text-zinc-100">{row.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{row.service}</p>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold outline-none`}
                    >
                      <SeverityBadge severity={row.severity} />
                      <ChevronDown className="size-3 shrink-0 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className={dropdownContentClass}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-zinc-400">
                        Severity
                      </DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={row.severity}
                        onValueChange={(v) => handleUpdateSeverity(row._id, v)}
                      >
                        {[
                          ["P1", "bg-red-700"],
                          ["P2", "bg-orange-500"],
                          ["P3", "bg-emerald-500"],
                        ].map(([val, dot]) => (
                          <DropdownMenuRadioItem
                            key={val}
                            value={val}
                            className="gap-2"
                          >
                            <span
                              className={`size-2 shrink-0 rounded-full ${dot}`}
                            />{" "}
                            {val}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold outline-none"
                    >
                      <StatusBadge status={row.status} />
                      <ChevronDown className="size-3 shrink-0 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className={dropdownContentClass}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-zinc-400">
                        Status
                      </DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={row.status}
                        onValueChange={(v) => handleUpdateStatus(row._id, v)}
                      >
                        {[
                          ["Active", "bg-red-600"],
                          ["Monitoring", "bg-orange-500"],
                          ["Investigating", "bg-blue-500"],
                          ["Identified", "bg-purple-500"],
                          ["Resolved", "bg-emerald-500"],
                        ].map(([val, dot]) => (
                          <DropdownMenuRadioItem
                            key={val}
                            value={val}
                            className="gap-2"
                          >
                            <span
                              className={`size-2 shrink-0 rounded-full ${dot}`}
                            />{" "}
                            {val}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="leading-tight">
                <p className="text-zinc-300">
                  {formatStartedAt(row.startedAt).date}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatStartedAt(row.startedAt).time}
                </p>
              </div>
              <p className="text-zinc-300">{row.duration}</p>
              <div
                className="flex items-center justify-end text-zinc-500"
                aria-hidden
              >
                <ChevronRight className="size-4 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={openCreate}
        onOpenChange={(v) => (v ? handleOpenCreate() : handleCloseCreate())}
      >
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
              <label className="text-sm text-zinc-300">Service</label>
              <Input
                value={form.team}
                onChange={(e) => handleFormChange("team", e.target.value)}
                className="border-zinc-700 bg-zinc-900 text-zinc-100"
                placeholder="Select or enter a service name"
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
