import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Brain,
  Radio,
  CheckSquare,
  FileText,
  Paperclip,
  Link2,
  Send,
  Lock,
  Eye,
  Bell,
  Users,
  ChevronRight,
  CheckCircle2,
  Square,
  Plus,
  X,
  Zap,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  ScrollText,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INCIDENT = {
  id: 1,
  title: "API Service Down",
  service: "api.acme.com",
  severity: "P1",
  startedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
  responders: [
    {
      initials: "MU",
      name: "Mustafa",
      role: "Lead",
      online: true,
      color: "bg-violet-900/80 text-violet-200",
    },
    {
      initials: "AL",
      name: "Ali",
      role: "Support",
      online: true,
      color: "bg-blue-900/80 text-blue-200",
    },
    {
      initials: "SA",
      name: "Sara",
      role: "Support",
      online: false,
      color: "bg-emerald-900/80 text-emerald-200",
    },
    {
      initials: "ZA",
      name: "Zara",
      role: "Observer",
      online: false,
      color: "bg-orange-900/80 text-orange-200",
    },
  ],
};

const INITIAL_UPDATES = [
  {
    id: 1,
    type: "system",
    message: "Incident auto-created via UptimeRobot — site unreachable",
    time: "10:21 AM",
    isPublic: true,
  },
  {
    id: 2,
    type: "system",
    message: "Severity auto-detected as P1 — error rate exceeded threshold",
    time: "10:21 AM",
    isPublic: false,
  },
  {
    id: 3,
    type: "manual",
    author: "MU",
    name: "Mustafa",
    message: "On it — checking DB connection pool and recent deployments",
    time: "10:24 AM",
    isPublic: false,
  },
  {
    id: 4,
    type: "manual",
    author: "AL",
    name: "Ali",
    message:
      "Confirmed high error rate on /api/payments — traces showing DB timeout",
    time: "10:28 AM",
    isPublic: false,
  },
];

const INITIAL_TASKS = [
  {
    id: 1,
    text: "Check database connection pool",
    done: true,
    assignee: "Mustafa",
    time: "10:22 AM",
  },
  {
    id: 2,
    text: "Review recent deployments (v2.3.1)",
    done: true,
    assignee: "Ali",
    time: "10:25 AM",
  },
  {
    id: 3,
    text: "Check third-party gateway status",
    done: false,
    assignee: "Mustafa",
    time: "10:27 AM",
  },
  {
    id: 4,
    text: "Review error logs for spike pattern",
    done: false,
    assignee: null,
    time: "10:28 AM",
  },
];

const INITIAL_NOTES = [
  {
    id: 1,
    author: "AL",
    name: "Ali",
    message:
      "Error logs show: ETIMEDOUT on pool.connect() — connection pool at max capacity (100/100)",
    time: "10:26 AM",
  },
];

const INITIAL_FILES = [
  {
    id: 1,
    author: "MU",
    name: "Mustafa",
    filename: "error-logs-10-21.txt",
    type: "file",
    time: "10:23 AM",
  },
  {
    id: 2,
    author: "AL",
    name: "Ali",
    filename: "https://grafana.acme.com/d/api-dashboard",
    type: "link",
    time: "10:27 AM",
  },
];

const AI_CAUSES = [
  "Database connection pool exhausted — max connections reached under load",
  "Recent deployment (v2.3.1) introduced unoptimized query in /api/payments",
  "Third-party payment gateway timeout causing retry storm",
];

const STATUSES = ["Investigating", "Identified", "Monitoring", "Resolved"];
const severityBg = {
  P1: "bg-red-950/30",
  P2: "bg-orange-950/20",
  P3: "bg-zinc-950",
};
const severityBorder = {
  P1: "border-red-900/40",
  P2: "border-orange-900/30",
  P3: "border-zinc-800",
};
const severityAccent = {
  P1: "text-red-400",
  P2: "text-orange-400",
  P3: "text-emerald-400",
};
const severityBadge = {
  P1: "bg-red-950/70 text-red-200 border border-red-800/80",
  P2: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
  P3: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
};

// ─── Live Timer ───────────────────────────────────────────────────────────────

function LiveTimer({ startedAt, severity, stoppedAtMs = null }) {
  const [parts, setParts] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    const applyEnd = (endMs) => {
      const diff = Math.max(
        0,
        Math.floor((endMs - new Date(startedAt).getTime()) / 1000),
      );
      setParts({
        h: String(Math.floor(diff / 3600)).padStart(2, "0"),
        m: String(Math.floor((diff % 3600) / 60)).padStart(2, "0"),
        s: String(diff % 60).padStart(2, "0"),
      });
    };

    if (stoppedAtMs != null) {
      applyEnd(stoppedAtMs);
      return;
    }

    const tick = () => applyEnd(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, stoppedAtMs]);

  return (
    <div
      className={`flex items-end gap-1 font-mono font-bold ${severityAccent[severity]}`}
    >
      <span className="text-5xl leading-none tabular-nums">{parts.h}</span>
      <span className="text-3xl leading-none pb-1 opacity-60">:</span>
      <span className="text-5xl leading-none tabular-nums">{parts.m}</span>
      <span className="text-3xl leading-none pb-1 opacity-60">:</span>
      <span className="text-5xl leading-none tabular-nums">{parts.s}</span>
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-2xl shadow-black/60 min-w-[260px] animate-in slide-in-from-bottom-2 duration-300"
        >
          <t.Icon className={`size-4 shrink-0 mt-0.5 ${t.color}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200">{t.title}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
              {t.body}
            </p>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-zinc-600 hover:text-zinc-400 mt-0.5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Status Stepper ───────────────────────────────────────────────────────────

function StatusStepper({ status, onChange }) {
  const idx = STATUSES.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUSES.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200
              ${
                active
                  ? "bg-white/15 text-white border border-white/20"
                  : done
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-700 hover:text-zinc-500"
              }`}
          >
            {done && <CheckCircle2 className="size-3 text-emerald-500" />}
            {active && (
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
            )}
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ─── War Room ─────────────────────────────────────────────────────────────────

export default function WarRoom() {
  const { incidentId: id } = useParams();
  const navigate = useNavigate();
  const feedRef = useRef(null);

  const [status, setStatus] = useState("Investigating");
  const [activeTab, setActiveTab] = useState("updates");
  const [updates, setUpdates] = useState(INITIAL_UPDATES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [input, setInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [tabBadges, setTabBadges] = useState({
    updates: 0,
    tasks: 0,
    notes: 0,
    files: 0,
  });
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  /** Wall-clock time when user confirmed resolve — freezes `LiveTimer`. */
  const [resolvedAtMs, setResolvedAtMs] = useState(null);

  // Auto scroll feed
  useEffect(() => {
    if (feedRef.current)
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [updates, tasks, notes, files, activeTab]);

  const pushToast = (Icon, title, body, color = "text-zinc-400") => {
    const t = { id: Date.now(), Icon, title, body, color };
    setToasts((p) => [...p, t]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 3500);
  };

  const dismissToast = (id) => setToasts((p) => p.filter((x) => x.id !== id));

  const bumpBadge = (tab) => {
    if (activeTab !== tab) setTabBadges((p) => ({ ...p, [tab]: p[tab] + 1 }));
  };

  const clearBadge = (tab) => setTabBadges((p) => ({ ...p, [tab]: 0 }));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearBadge(tab);
  };

  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── Quick Actions ──────────────────────────────────────────────────────────

  const quickAction = (tab) => {
    handleTabChange(tab);
    if (tab === "tasks") setShowTaskInput(true);
  };

  // ── Submit handlers ────────────────────────────────────────────────────────

  const handlePostUpdate = () => {
    if (!input.trim()) return;
    const e = {
      id: Date.now(),
      type: "manual",
      author: "MU",
      name: "Mustafa",
      message: input,
      time: timeNow(),
      isPublic,
    };
    setUpdates((p) => [...p, e]);
    setInput("");
    bumpBadge("updates");
    pushToast(
      Radio,
      "Mustafa posted an update",
      input.slice(0, 50),
      "text-blue-400",
    );
  };

  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    const t = {
      id: Date.now(),
      text: taskInput,
      done: false,
      assignee: null,
      time: timeNow(),
    };
    setTasks((p) => [...p, t]);
    setTaskInput("");
    setShowTaskInput(false);
    bumpBadge("tasks");
    pushToast(
      CheckSquare,
      "Task added",
      taskInput.slice(0, 50),
      "text-emerald-400",
    );
  };

  const toggleTask = (taskId) => {
    setTasks((p) =>
      p.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    );
  };

  const handleAddNote = () => {
    if (!input.trim()) return;
    const n = {
      id: Date.now(),
      author: "MU",
      name: "Mustafa",
      message: input,
      time: timeNow(),
    };
    setNotes((p) => [...p, n]);
    setInput("");
    bumpBadge("notes");
    pushToast(FileText, "Note added", input.slice(0, 50), "text-blue-400");
  };

  const handleAddFile = () => {
    if (!input.trim()) return;
    const isLink = input.startsWith("http");
    const f = {
      id: Date.now(),
      author: "MU",
      name: "Mustafa",
      filename: input,
      type: isLink ? "link" : "file",
      time: timeNow(),
    };
    setFiles((p) => [...p, f]);
    setInput("");
    bumpBadge("files");
    pushToast(Paperclip, "File added", input.slice(0, 50), "text-orange-400");
  };

  const handleSubmit = () => {
    if (activeTab === "updates") handlePostUpdate();
    else if (activeTab === "notes") handleAddNote();
    else if (activeTab === "files") handleAddFile();
  };

  const handleResolve = () => {
    const now = Date.now();
    setStatus("Resolved");
    setIsResolved(true);
    setResolvedAtMs(now);
    setShowResolveModal(false);
    pushToast(
      CheckCircle2,
      "Incident Resolved",
      "Postmortem button is now active.",
      "text-emerald-400",
    );
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    const e = {
      id: Date.now(),
      type: "system",
      message: `Status updated to ${val}`,
      time: timeNow(),
      isPublic: true,
    };
    setUpdates((p) => [...p, e]);
    pushToast(
      RefreshCw,
      `Status → ${val}`,
      "Timeline updated and team notified",
      "text-orange-400",
    );
  };

  // ── Tab content ────────────────────────────────────────────────────────────

  const tabs = [
    { key: "updates", label: "Updates", icon: Radio },
    { key: "tasks", label: "Tasks", icon: CheckSquare },
    { key: "notes", label: "Notes", icon: FileText },
    { key: "files", label: "Files", icon: Paperclip },
  ];

  const placeholders = {
    updates: "Post a live update to the timeline...",
    notes: "Write a note — paste logs, theories, findings...",
    files: "Paste a file name or link (https://...)",
    tasks: "",
  };

  return (
    <div
      className={`-mx-6 -mt-6 -mb-6 flex min-h-0 w-[calc(100%+3rem)] max-w-none flex-1 flex-col overflow-hidden ${severityBg[INCIDENT.severity]}`}
    >
      {/* ── Command Bar ───────────────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between gap-4 border-b ${severityBorder[INCIDENT.severity]} bg-black/60 backdrop-blur-sm px-5 py-3 shrink-0`}
      >
        {/* Left — back + title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
           onClick={() => {
            console.log("CLICKED", { id, isResolved });
            if (id != null && id !== "") {
              navigate(`/dashboard/incidents/${id}/postmortem`);
            } else {
              navigate("/dashboard/incidents");
            }
          }}
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Pulsing severity dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${INCIDENT.severity === "P1" ? "bg-red-500" : "bg-orange-500"}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${INCIDENT.severity === "P1" ? "bg-red-500" : "bg-orange-500"}`}
              />
            </span>
            <h1 className="text-sm font-bold text-zinc-100 truncate">
              {INCIDENT.title}
            </h1>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold shrink-0 ${severityBadge[INCIDENT.severity]}`}
            >
              {INCIDENT.severity}
            </span>
          </div>
        </div>

        {/* Center — status stepper */}
        <div className="hidden lg:flex items-center">
          <StatusStepper status={status} onChange={handleStatusChange} />
        </div>

        {/* Right — bell + resolve */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Bell className="size-4 text-zinc-500" />
            {Object.values(tabBadges).some((v) => v > 0) && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">
                {Object.values(tabBadges).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowResolveModal(true)}
            className="flex items-center gap-2 rounded-md border border-red-800/60 bg-red-950/50 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/50 transition-colors"
          >
            <CheckCircle2 className="size-3.5" />
            Resolve Incident
          </button>
        </div>
      </div>

      {/* ── Timer Bar ─────────────────────────────────────────────────────── */}
      <div
        className={`border-b ${severityBorder[INCIDENT.severity]} bg-black/40 px-5 py-4 shrink-0 flex items-center justify-between`}
      >
        {/* Left — service */}
        <div className="hidden sm:flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
            Service
          </p>
          <p className="text-sm font-mono text-zinc-400">{INCIDENT.service}</p>
        </div>

        {/* Center — timer */}
        <div className="flex flex-col items-center gap-2 mx-auto">
          {/* Started at */}
          <p className="text-[11px] text-zinc-600 tracking-wide">
            Started{" "}
            {INCIDENT.startedAt
              ? new Date(INCIDENT.startedAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </p>
          {/* Timer */}
          <LiveTimer
            startedAt={INCIDENT.startedAt}
            severity={isResolved ? "P3" : INCIDENT.severity}
            stoppedAtMs={resolvedAtMs}
          />
          {/* Live badge */}
          {!isResolved && (
            <div className="flex items-center gap-1.5 rounded-full border border-red-900/50 bg-red-950/40 px-3 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400">
                Live
              </span>
            </div>
          )}
          {isResolved && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-900/50 bg-emerald-950/40 px-3 py-1">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                Resolved
              </span>
            </div>
          )}
        </div>

        {/* Right — postmortem button */}
        <div className="hidden sm:flex flex-col items-end gap-1">
          <button
            disabled={!isResolved || id == null || id === ""}
            onClick={() =>
              id != null && id !== ""
                ? navigate(`/dashboard/incidents/${id}/postmortem`)
                : navigate("/dashboard/incidents")
            }
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-all duration-200
        ${
          isResolved
            ? "border border-violet-800/60 bg-violet-950/60 text-violet-300 hover:bg-violet-900/60 cursor-pointer"
            : "border border-zinc-800 bg-zinc-900/40 text-zinc-700 cursor-not-allowed"
        }`}
          >
            <ScrollText className="size-3.5" />
            {isResolved ? "Generate Postmortem" : "Resolve to unlock"}
          </button>
        </div>
      </div>

      {/* ── Main 3-zone layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Presence + Quick Actions (20%) */}
        <div
          className={`hidden lg:flex flex-col w-[220px] shrink-0 border-r ${severityBorder[INCIDENT.severity]} overflow-y-auto`}
        >
          {/* Who's online */}
          <div className="p-4 border-b border-zinc-800/60">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-3.5 text-zinc-600" />
              <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                In this room
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {INCIDENT.responders.map((r) => (
                <div key={r.initials} className="flex items-center gap-2.5">
                  <div className="relative">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${r.color}`}
                    >
                      {r.initials}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black ${r.online ? "bg-emerald-500" : "bg-zinc-600"}`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-300">
                      {r.name}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {r.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold block mb-3">
              Quick Actions
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  icon: FileText,
                  label: "Add Note",
                  tab: "notes",
                  color: "hover:border-blue-800/60 hover:text-blue-300",
                },
                {
                  icon: CheckSquare,
                  label: "Add Task",
                  tab: "tasks",
                  color: "hover:border-emerald-800/60 hover:text-emerald-300",
                },
                {
                  icon: Paperclip,
                  label: "Add File",
                  tab: "files",
                  color: "hover:border-orange-800/60 hover:text-orange-300",
                },
                {
                  icon: Link2,
                  label: "Share Link",
                  tab: "files",
                  color: "hover:border-violet-800/60 hover:text-violet-300",
                },
              ].map(({ icon: Icon, label, tab, color }) => (
                <button
                  key={label}
                  onClick={() => quickAction(tab)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-zinc-500 transition-all duration-200 ${color}`}
                >
                  <Icon className="size-4" />
                  <span className="text-[10px] font-medium leading-tight text-center">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Root Cause */}
          <div className="p-4 border-t border-zinc-800/60 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="size-3.5 text-violet-400" />
              <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                AI Root Cause
              </span>
            </div>
            <ol className="flex flex-col gap-3">
              {AI_CAUSES.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-violet-950/80 text-[9px] font-bold text-violet-300 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {c}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* CENTER — Tabbed Workspace (50%) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div
            className={`flex items-center gap-1 border-b ${severityBorder[INCIDENT.severity]} px-4 pt-2 shrink-0`}
          >
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors duration-200 border-b-2
                  ${activeTab === key ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                <Icon className="size-3.5" />
                {label}
                {tabBadges[key] > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-bold text-white">
                    {tabBadges[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div
            ref={feedRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            {/* UPDATES */}
            {activeTab === "updates" &&
              updates.map((e) => (
                <div key={e.id} className="flex gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
                  ${e.type === "system" ? "bg-zinc-800 text-zinc-500" : "bg-violet-900/80 text-violet-200"}`}
                  >
                    {e.type === "system" ? (
                      <Zap className="size-3" />
                    ) : (
                      e.author
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {e.type !== "system" && (
                        <span className="text-xs font-semibold text-zinc-300">
                          {e.name}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-600">
                        {e.time}
                      </span>
                      <span
                        className={`ml-auto flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5
                      ${e.isPublic ? "bg-emerald-950/60 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}
                      >
                        {e.isPublic ? (
                          <Eye className="size-2.5" />
                        ) : (
                          <Lock className="size-2.5" />
                        )}
                        {e.isPublic ? "Public" : "Internal"}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${e.type === "system" ? "text-zinc-500 italic" : "text-zinc-300"}`}
                    >
                      {e.message}
                    </p>
                  </div>
                </div>
              ))}

            {/* TASKS */}
            {activeTab === "tasks" && (
              <div className="flex flex-col gap-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors
                      ${t.done ? "border-zinc-800/40 bg-zinc-900/20 opacity-60" : "border-zinc-800 bg-zinc-900/60"}`}
                  >
                    <button
                      onClick={() => toggleTask(t.id)}
                      className="mt-0.5 shrink-0"
                    >
                      {t.done ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <Square className="size-4 text-zinc-600 hover:text-zinc-300 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${t.done ? "line-through text-zinc-600" : "text-zinc-200"}`}
                      >
                        {t.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {t.assignee && (
                          <span className="text-[11px] text-zinc-600">
                            → {t.assignee}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-700">
                          {t.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Inline task input */}
                {showTaskInput && (
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
                    <input
                      autoFocus
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTask();
                        if (e.key === "Escape") setShowTaskInput(false);
                      }}
                      placeholder="Describe the task..."
                      className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
                    />
                    <button
                      onClick={handleAddTask}
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                    <button
                      onClick={() => setShowTaskInput(false)}
                      className="text-zinc-600 hover:text-zinc-400"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowTaskInput(true)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-800 p-3 text-xs text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Add task
                </button>
              </div>
            )}

            {/* NOTES */}
            {activeTab === "notes" &&
              notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-900/80 text-[10px] font-bold text-violet-200">
                      {n.author}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">
                      {n.name}
                    </span>
                    <span className="text-[11px] text-zinc-600">{n.time}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">
                    {n.message}
                  </p>
                </div>
              ))}

            {/* FILES */}
            {activeTab === "files" &&
              files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                    {f.type === "link" ? (
                      <Link2 className="size-4" />
                    ) : (
                      <Paperclip className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-300 truncate">
                      {f.filename}
                    </p>
                    <p className="text-[11px] text-zinc-600">
                      {f.name} · {f.time}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Composer — hidden for tasks tab */}
          {activeTab !== "tasks" && (
            <div
              className={`border-t ${severityBorder[INCIDENT.severity]} p-4 shrink-0`}
            >
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={placeholders[activeTab]}
                  rows={2}
                  className="flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
                />
                <div className="flex flex-col gap-2">
                  {activeTab === "updates" && (
                    <button
                      onClick={() => setIsPublic((p) => !p)}
                      className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors
                        ${isPublic ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}
                    >
                      {isPublic ? (
                        <Eye className="size-3" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                      {isPublic ? "Public" : "Private"}
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-700 transition-colors flex-1"
                  >
                    <Send className="size-3" />
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — AI Checklist (30%) — desktop only */}
        <div
          className={`hidden xl:flex flex-col w-[280px] shrink-0 border-l ${severityBorder[INCIDENT.severity]} overflow-y-auto`}
        >
          <div className="p-4 border-b border-zinc-800/60">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="size-3.5 text-violet-400" />
              <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                Investigation Checklist
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 mt-1">
              AI-suggested steps — check off as you go
            </p>
          </div>

          <div className="p-4 flex flex-col gap-2">
            {[
              { text: "Check database connection pool usage", done: true },
              { text: "Review recent deployments in last 2 hours", done: true },
              { text: "Check third-party gateway status page", done: false },
              {
                text: "Review error rate spike on monitoring dashboard",
                done: false,
              },
              { text: "Verify auto-scaling rules are active", done: false },
              { text: "Check if rollback is needed for v2.3.1", done: false },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 rounded-lg p-2.5 transition-colors
                ${item.done ? "opacity-50" : "hover:bg-zinc-900/60"}`}
              >
                {item.done ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Square className="size-4 text-zinc-700 shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-xs leading-relaxed ${item.done ? "line-through text-zinc-600" : "text-zinc-400"}`}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Has this happened before */}
          <div className="p-4 border-t border-zinc-800/60 mt-auto">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-3.5 text-orange-400" />
              <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                Similar Past Incidents
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                {
                  title: "DB pool exhausted",
                  date: "Mar 12",
                  resolved: "47 min",
                },
                {
                  title: "API payment timeout",
                  date: "Feb 28",
                  resolved: "1h 12m",
                },
              ].map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                >
                  <p className="text-xs font-medium text-zinc-300">{p.title}</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    {p.date} · Resolved in {p.resolved}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Resolve Modal ──────────────────────────────────────────────────── */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-800/60">
                <CheckCircle2 className="size-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  Resolve Incident?
                </h2>
                <p className="text-xs text-zinc-500">
                  This action will notify all responders
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Marking this incident as resolved will update the public status
              page, notify all responders, and prompt AI postmortem generation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 rounded-lg border border-emerald-800/60 bg-emerald-950/60 py-2.5 text-sm font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
              >
                Yes, Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
