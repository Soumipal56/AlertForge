import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  MoreHorizontal,
  Share2,
  Bell,
  Trash2,
  Brain,
  MessageSquare,
  ListTodo,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useWarRoom } from "@/hooks/useWarRoom";


// ─── Style maps ───────────────────────────────────────────────────────────────

const statusConfig = {
  Investigating: {
    icon: Brain,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  Identified: {
    icon: Zap,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
  Monitoring: {
    icon: Shield,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  Resolved: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
};

const severityClasses = {
  P1: "bg-red-950/70 text-red-200 border border-red-800/80",
  P2: "bg-orange-950/60 text-orange-200 border border-orange-800/70",
  P3: "bg-emerald-950/60 text-emerald-200 border border-emerald-800/70",
};

// ─── Chat Message component ───────────────────────────────────────────────────

function ChatMessage({ msg }) {
  const isSystem = msg.type === "system";
  const initials = msg.author?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="flex gap-3 px-4 py-2 hover:bg-zinc-900/40 transition-colors">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold 
        ${isSystem ? "bg-zinc-800 text-zinc-500" : "bg-violet-900/80 text-violet-200"}`}>
        {isSystem ? <Zap className="size-3.5" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-zinc-300">{msg.authorName || (isSystem ? "System" : "User")}</span>
          <span className="text-[10px] text-zinc-600">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${isSystem ? "text-zinc-500 italic" : "text-zinc-400"}`}>
          {msg.content}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WarRoom() {
  const navigate = useNavigate();
  const { incident, messages, presence, loading, error, socketConnected, sendMessage, updateStatus, toggleTask } = useWarRoom();
  
  const [activeTab, setActiveTab] = useState("updates");
  const [input, setInput] = useState("");
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500">Initializing secure war room...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <AlertTriangle className="size-12 text-red-500" />
        <h2 className="text-xl font-bold text-zinc-100">Connection Failed</h2>
        <p className="text-sm text-zinc-500 max-w-md">{error}</p>
        <button onClick={() => navigate("/dashboard/integrations")} className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700">Manage API Keys</button>
    </div>
  );

  const steps = ["Investigating", "Identified", "Monitoring", "Resolved"];
  const currentStepIdx = steps.indexOf(incident.status) === -1 ? 0 : steps.indexOf(incident.status);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-black overflow-hidden border border-zinc-800 rounded-xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 px-4 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-zinc-100 truncate max-w-[300px]">{incident.title}</h1>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${severityClasses[incident.severity]}`}>
                {incident.severity}
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 flex items-center gap-1.5 mt-0.5">
              <Clock className="size-3" />
              Started {new Date(incident.startedAt).toLocaleString()} • {incident.service}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/20 border border-emerald-900/30">
            <div className={`h-1.5 w-1.5 rounded-full ${socketConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
            <span className="text-[10px] font-mono text-emerald-500">{socketConnected ? "LIVE" : "OFFLINE"}</span>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
            <Share2 className="size-4" />
          </button>
          <button className="flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors" onClick={() => updateStatus("Resolved")}>
            Resolve Incident
          </button>
        </div>
      </div>

      {/* ── Status Stepper ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/30 px-6 py-4 shrink-0">
        <div className="flex flex-1 items-center gap-0">
          {steps.map((step, i) => {
            const isCompleted = i < currentStepIdx;
            const isCurrent = i === currentStepIdx;
            const StepIcon = statusConfig[step].icon;

            return (
              <div key={step} className="flex flex-1 items-center">
                <button 
                    onClick={() => updateStatus(step)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300
                    ${isCompleted ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : 
                      isCurrent ? "border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : 
                      "border-zinc-800 bg-zinc-900 text-zinc-600 group-hover:border-zinc-600"}`}>
                    {isCompleted ? <CheckCircle2 className="size-4" /> : <StepIcon className="size-4" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors
                    ${isCurrent ? "text-blue-400" : isCompleted ? "text-emerald-500" : "text-zinc-600"}`}>
                    {step}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`mx-4 h-px flex-1 ${i < currentStepIdx ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel — Presence (20%) */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-950/20 flex flex-col hidden lg:flex shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-zinc-400" />
              <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-tight">Responders</h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              {presence}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-[10px] text-zinc-600 px-3 py-2 uppercase font-bold">In This Room</p>
            {/* We could map a local list of connected users if backend sends them */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-900/50 group">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">You</span>
            </div>
          </div>
        </div>

        {/* Center — Chat/Updates (55%) */}
        <div className="flex-1 flex flex-col bg-zinc-950/10">
          <div className="flex items-center gap-4 px-4 border-b border-zinc-800 bg-zinc-950/40 shrink-0">
            {[
              { id: "updates", label: "Updates", icon: MessageSquare },
              { id: "tasks", label: "Tasks", icon: ListTodo },
              { id: "files", label: "Files", icon: FileText },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-1 py-3 text-xs font-bold transition-all relative
                  ${activeTab === t.id ? "text-zinc-100" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                <t.icon className="size-3.5" />
                {t.label}
                {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
              </button>
            ))}
          </div>

          <div ref={feedRef} className="flex-1 overflow-y-auto py-2">
            {activeTab === "updates" && (
                <>
                  {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
                  {messages.length === 0 && <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600"><MessageSquare className="size-8 opacity-20" /><p className="text-sm italic">No messages yet. Start collaborating.</p></div>}
                </>
            )}
            {activeTab === "tasks" && (
                <div className="p-4 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase mb-4">Incident Checklist</h3>
                    {/* Placeholder for real tasks */}
                    <p className="text-xs text-zinc-600 italic">Fetch tasks for incident {incident.id}...</p>
                </div>
            )}
            {activeTab === "files" && <div className="p-8 text-center text-zinc-700 text-sm italic">No files shared in this room.</div>}
          </div>

          <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 shrink-0">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2 focus-within:border-zinc-600 transition-colors">
              <button className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300">
                <Plus className="size-4" />
              </button>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Post an update or type a command..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 px-1"
              />
              <button onClick={handleSend} disabled={!input.trim()} className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — AI Investigation (25%) */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-950/20 hidden xl:flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <Brain className="size-4 text-violet-400" />
            <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-tight">AI Insights</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Probable Causes</h3>
                    <Zap className="size-3 text-violet-400" />
                </div>
                {incident.aiRootCause.length > 0 ? incident.aiRootCause.map((c, i) => (
                    <div key={i} className="rounded-md bg-violet-950/10 border border-violet-900/20 p-3 text-xs text-zinc-400 leading-relaxed">
                        {c}
                    </div>
                )) : <p className="text-xs text-zinc-600 italic">No AI insights generated yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
