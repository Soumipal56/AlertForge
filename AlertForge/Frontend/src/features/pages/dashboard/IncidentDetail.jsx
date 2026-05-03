import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Globe,
  Clock,
  CalendarDays,
  Users,
  Swords,
  ScrollText,
  Brain,
  Send,
  Lock,
  Eye,
  ChevronDown,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  Radio,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { incidentsApi } from "@/api/incidents.api";
import { postmortemApi } from "@/api/postmortem.api";
import { normalizeIncident, denormalizeStatus, normalizeStatus } from "@/lib/mapper";

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

const serviceStatusDot = {
  down: "bg-red-500",
  degraded: "bg-orange-400",
  operational: "bg-emerald-500",
};

const dropdownContentClass =
  "w-44 border border-zinc-700 bg-zinc-950 text-zinc-100 [&_[data-slot=dropdown-menu-radio-item]]:focus:bg-zinc-800 [&_[data-slot=dropdown-menu-radio-item]]:focus:text-zinc-100";

// ─── Live Timer ───────────────────────────────────────────────────────────────

function LiveTimer({ startedAt, isActive }) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!isActive || !startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, isActive]);

  return (
    <span className={`font-mono text-sm ${isActive ? "text-orange-400" : "text-zinc-400"}`}>
      {elapsed}
    </span>
  );
}

// ─── Timeline Event ───────────────────────────────────────────────────────────

function TimelineEvent({ event }) {
  const isSystem = event.type === "system";

  return (
    <div className="flex gap-3">
      {/* Icon / Avatar */}
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
          ${isSystem ? "bg-zinc-800 text-zinc-500" : "bg-violet-900/80 text-violet-200"}`}>
          {isSystem ? <Zap className="size-3" /> : (event.author?.slice(0, 2).toUpperCase() || "??")}
        </div>
        <div className="mt-1 w-px flex-1 bg-zinc-800" />
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {!isSystem && (
            <span className="text-xs font-semibold text-zinc-300">{event.authorName || "User"}</span>
          )}
          <span className="text-[11px] text-zinc-600">
            {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {/* public / internal tag */}
          <span className={`ml-auto flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5
            ${event.isPublic ? "bg-emerald-950/60 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
            {event.isPublic ? <Eye className="size-2.5" /> : <Lock className="size-2.5" />}
            {event.isPublic ? "Public" : "Internal"}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${isSystem ? "text-zinc-500 italic" : "text-zinc-300"}`}>
          {event.content}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IncidentDetail() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const feedRef = useRef(null);

  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [postmortemStatus, setPostmortemStatus] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incidentData, timelineData] = await Promise.all([
        incidentsApi.getById(incidentId),
        incidentsApi.getTimeline(incidentId)
      ]);
      setIncident(normalizeIncident(incidentData));
      setTimeline(timelineData || []);
      
      try {
          const pm = await postmortemApi.getByIncident(incidentId);
          if (pm) setPostmortemStatus("generated");
      } catch (e) {
          setPostmortemStatus(null);
      }
    } catch (err) {
      console.error("Failed to fetch incident details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [incidentId]);

  // Auto scroll timeline to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [timeline]);

  const handlePostUpdate = async () => {
    if (!update.trim()) return;
    try {
        const newEvent = await incidentsApi.addTimelineNote(incidentId, {
            content: update,
            isPublic
        });
        setTimeline((prev) => [...prev, newEvent]);
        setUpdate("");
    } catch (err) {
        console.error("Failed to post update", err);
    }
  };

  const handleStatusChange = async (val) => {
    try {
        const updated = await incidentsApi.updateStatus(incidentId, denormalizeStatus(val));
        setIncident(normalizeIncident(updated));
        // Refresh timeline as backend adds system messages
        const timelineData = await incidentsApi.getTimeline(incidentId);
        setTimeline(timelineData);
    } catch (err) {
        console.error("Failed to update status", err);
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
        await postmortemApi.generate(incidentId);
        setPostmortemStatus("generated");
        fetchData(); // Refresh everything
    } catch (err) {
        console.error("Failed to generate AI analysis", err);
    } finally {
        setAiLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500">Loading incident details...</div>;
  if (!incident) return <div className="flex items-center justify-center h-full text-red-500">Incident not found</div>;

  const isActive = incident.status !== "Resolved";

  return (
    <div className="flex flex-col gap-0">

      {/* ── Back + Action bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <button
          onClick={() => navigate("/dashboard/incidents")}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Incidents
        </button>
        <div className="flex items-center gap-2">
          {isActive && (
            <button
              onClick={() => navigate(`/dashboard/war-room/${incidentId}`)}
              className="flex items-center gap-2 rounded-md bg-red-950/60 border border-red-800/60 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-900/60 transition-colors"
            >
              <Swords className="size-3.5" />
              Open War Room
            </button>
          )}
          {!isActive && (
            <button
              onClick={() => navigate(`/dashboard/incidents/${incidentId}/postmortem`)}
              className="flex items-center gap-2 rounded-md bg-violet-950/60 border border-violet-800/60 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-900/60 transition-colors"
            >
              <ScrollText className="size-3.5" />
              View Postmortem
            </button>
          )}
        </div>
      </div>

      {/* ── Incident Header ───────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start gap-3 flex-wrap">
          {isActive && (
            <span className="relative flex h-2.5 w-2.5 shrink-0 mt-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          )}
          <h1 className="text-2xl font-bold text-zinc-100 leading-tight flex-1">
            {incident.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${severityClasses[incident.severity]}`}>
              {incident.severity}
            </span>
            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold outline-none ${statusClasses[incident.status]}`}>
                  {incident.status}
                  <ChevronDown className="size-3 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={dropdownContentClass}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-zinc-400">Change Status</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={incident.status} onValueChange={handleStatusChange}>
                    {["Active", "Investigating", "Identified", "Monitoring", "Resolved"].map((s) => (
                      <DropdownMenuRadioItem key={s} value={s} className="gap-2">
                        <span className={`size-2 shrink-0 rounded-full ${
                          s === "Active" ? "bg-red-600" :
                          s === "Monitoring" ? "bg-orange-500" :
                          s === "Investigating" ? "bg-blue-500" :
                          s === "Identified" ? "bg-purple-500" : "bg-emerald-500"
                        }`} />
                        {s}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Globe className="size-3" /> {incident.service}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3" /> {new Date(incident.startedAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3" />
            <LiveTimer startedAt={incident.startedAt} isActive={isActive} />
          </span>
          <span className="flex items-center gap-1.5">
            <Radio className="size-3" /> Source: {incident.source}
          </span>
          {incident.resolvedAt && (
            <span className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="size-3" /> Resolved: {new Date(incident.resolvedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Two column layout ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT — Timeline (60%) */}
        <div className="flex flex-col gap-4 lg:w-[60%]">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950">

            {/* Timeline header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-200">Timeline</h2>
              <span className="text-xs text-zinc-600">{timeline.length} events</span>
            </div>

            {/* Events */}
            <div ref={feedRef} className="max-h-[480px] overflow-y-auto px-4 pt-4">
              {timeline.map((event) => (
                <TimelineEvent key={event._id || event.id} event={event} />
              ))}
              {timeline.length === 0 && <div className="py-8 text-center text-zinc-600 text-sm italic">No events yet</div>}
            </div>

            {/* Update composer */}
            <div className="border-t border-zinc-800 p-4 flex flex-col gap-3">
              <textarea
                value={update}
                onChange={(e) => setUpdate(e.target.value)}
                placeholder="Post an update to the timeline..."
                rows={2}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
              />
              <div className="flex items-center justify-between">
                {/* Public / Internal toggle */}
                <button
                  onClick={() => setIsPublic((p) => !p)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors
                    ${isPublic ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}
                >
                  {isPublic ? <Eye className="size-3" /> : <Lock className="size-3" />}
                  {isPublic ? "Public" : "Internal"}
                </button>
                <button
                  onClick={handlePostUpdate}
                  disabled={!update.trim()}
                  className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  <Send className="size-3" />
                  Post Update
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Info Panel (40%) */}
        <div className="flex flex-col gap-4 lg:w-[40%]">

          {/* Details card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-2">Details</h2>
            {[
              { label: "Incident ID", value: incident.id },
              { label: "Source", value: incident.source },
              { label: "Affected URL", value: incident.affectedUrl },
              { label: "Severity", value: incident.severity },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">{label}</span>
                <span className="text-zinc-300 font-medium truncate ml-4">{value}</span>
              </div>
            ))}
          </div>

          {/* Responders card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-sm font-semibold text-zinc-200">Responders</h2>
              <Users className="size-3.5 text-zinc-600" />
            </div>
            {incident.responders.length > 0 ? incident.responders.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold bg-violet-900/80 text-violet-200`}>
                  {r.name?.slice(0, 2).toUpperCase() || "??"}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-zinc-200">{r.name}</p>
                  <p className="text-[11px] text-zinc-600">{r.role}</p>
                </div>
              </div>
            )) : <p className="text-xs text-zinc-600 italic">No responders assigned</p>}
          </div>

          {/* Affected Services card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-2">Affected Services</h2>
            {incident.affectedServices.length > 0 ? incident.affectedServices.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${serviceStatusDot[s.status] || "bg-zinc-500"}`} />
                  <span className="text-[11px] text-zinc-500 capitalize">{s.status}</span>
                </div>
              </div>
            )) : <p className="text-xs text-zinc-600 italic">No services listed</p>}
          </div>

          {/* AI Root Cause card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Brain className="size-3.5 text-violet-400" />
                <h2 className="text-sm font-semibold text-zinc-200">AI Root Cause</h2>
              </div>
              {!aiLoading && (
                <button
                  onClick={handleGenerateAI}
                  className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {incident.aiRootCause.length > 0 ? "Regenerate" : "Analyse →"}
                </button>
              )}
            </div>

            {aiLoading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="animate-pulse">Analysing incident data via postmortem pipeline...</span>
              </div>
            )}

            {incident.aiRootCause.length > 0 && !aiLoading ? (
              <ol className="flex flex-col gap-2.5">
                {incident.aiRootCause.map((cause, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-950/80 text-[9px] font-bold text-violet-300">
                      {i + 1}
                    </span>
                    {cause}
                  </li>
                ))}
              </ol>
            ) : !aiLoading && (
              <p className="text-xs text-zinc-600 italic">
                Click "Analyse" to generate probable root causes for this incident.
              </p>
            )}
          </div>

          {/* Postmortem card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <ScrollText className="size-3.5 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-200">Postmortem</h2>
            </div>
            {postmortemStatus === "generated" ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Generated
                </div>
                <button
                  onClick={() => navigate(`/dashboard/incidents/${incidentId}/postmortem`)}
                  className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  View →
                </button>
              </div>
            ) : isActive ? (
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Info className="size-3.5" />
                Available after incident is resolved
              </div>
            ) : (
              <button
                onClick={() => navigate(`/dashboard/incidents/${incidentId}/postmortem`)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Brain className="size-3.5 text-violet-400" />
                Generate with AI
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}