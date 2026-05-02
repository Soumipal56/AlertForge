import { useState } from "react";
import {
  Copy,
  Check,
  Key,
  Code2,
  Webhook,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
  Terminal,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("bash", bash);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const WEBHOOK_URL = "https://api.alertforge.io/webhooks/inbound/team_k8x2mNpQr4vL9wZ";

const INITIAL_KEYS = [
  {
    id: 1,
    label: "Production SDK",
    preview: "af_live_••••••••••••Kx9p",
    createdAt: "May 10, 2026",
    lastUsed: "2 hours ago",
  },
  {
    id: 2,
    label: "Staging",
    preview: "af_live_••••••••••••mR3t",
    createdAt: "Apr 28, 2026",
    lastUsed: "3 days ago",
  },
];

// ─── Code snippets ────────────────────────────────────────────────────────────

const CODE_TABS = [
  {
    key: "install",
    label: "Install",
    lang: "bash",
    code: `npm install @alertforge/sdk`,
  },
  {
    key: "init",
    label: "Initialize",
    lang: "javascript",
    code: `import { IncidentReporter } from "@alertforge/sdk";

const reporter = new IncidentReporter({
  apiKey: process.env.ALERTFORGE_API_KEY,
});`,
  },
  {
    key: "report",
    label: "Report Incident",
    lang: "javascript",
    code: `// Call this when your service detects an issue
const incident = await reporter.report({
  service: "payment-api",
  title: "Payment API — High Error Rate",
  severity: "P1",           // "P1" | "P2" | "P3"
  errorRate: 0.42,          // 42% error rate
  responseTimeMs: 4800,     // current response time
});

console.log(incident.id);  // INC-0012`,
  },
  {
    key: "resolve",
    label: "Resolve",
    lang: "javascript",
    code: `// Call this when the issue is resolved
await reporter.resolve({
  incidentId: incident.id,
  message: "Error rate back to normal after rollback.",
});`,
  },
  {
    key: "update",
    label: "Post Update",
    lang: "javascript",
    code: `// Post a timeline update mid-incident
await reporter.update({
  incidentId: incident.id,
  message: "Identified root cause — rolling back v2.3.1",
  isPublic: true,   // shows on status page
});`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };
  return { copied, copy };
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ icon: Icon, iconClass = "text-zinc-500", title, description, children }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-start gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
          <Icon className={`size-4 ${iconClass}`} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
          {description && (
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

// ─── Copy field ───────────────────────────────────────────────────────────────

function CopyField({ value, label, mono = true }) {
  const { copied, copy } = useCopy();

  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide">{label}</p>}
      <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5">
        <span className={`flex-1 text-xs text-zinc-300 truncate ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
        <button
          onClick={() => copy(value)}
          className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ─── Webhook section ──────────────────────────────────────────────────────────

function WebhookSection() {
  const [tested, setTested] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => { setTesting(false); setTested(true); }, 1800);
  };

  return (
    <Section
      icon={Webhook}
      iconClass="text-orange-400"
      title="UptimeRobot Webhook"
      description="Paste this URL into UptimeRobot's Alert Contacts. AlertForge will automatically create and resolve incidents when your monitors go down or recover."
    >
      <div className="flex flex-col gap-4">
        <CopyField value={WEBHOOK_URL} label="Your webhook URL" />

        {/* Test button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200
              ${testing
                ? "border-zinc-700 bg-zinc-900 text-zinc-600 cursor-not-allowed"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
          >
            <Zap className={`size-3.5 ${testing ? "animate-pulse text-orange-400" : ""}`} />
            {testing ? "Sending test payload..." : "Send Test Payload"}
          </button>
          {tested && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="size-3.5" />
              Test received — check your incidents
            </div>
          )}
        </div>

        {/* Setup steps */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-3">
          <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Setup steps</p>
          {[
            "Copy your webhook URL above",
            "Go to UptimeRobot → Alert Contacts → Add Alert Contact",
            'Select "Webhook" as the type and paste your URL',
            "Set the format to JSON and save",
            "Assign this alert contact to your monitors",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-500">
                {i + 1}
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{step}</p>
            </div>
          ))}
        </div>

        <a
          href="https://uptimerobot.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-fit"
        >
          <ExternalLink className="size-3" />
          Open UptimeRobot dashboard
        </a>
      </div>
    </Section>
  );
}

// ─── SDK section ──────────────────────────────────────────────────────────────

function SDKSection() {
  const [activeTab, setActiveTab] = useState("install");
  const { copied, copy } = useCopy();

  const tab = CODE_TABS.find((t) => t.key === activeTab);

  // Custom syntax highlighter style overrides
  const codeStyle = {
    ...atomOneDark,
    hljs: {
      ...atomOneDark.hljs,
      background: "transparent",
      padding: "0",
      fontSize: "12px",
      lineHeight: "1.7",
    },
  };

  return (
    <Section
      icon={Code2}
      iconClass="text-violet-400"
      title="SDK Integration"
      description="Drop the AlertForge SDK into your own backend to report incidents programmatically — no UptimeRobot required."
    >
      <div className="flex flex-col gap-4">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-zinc-800 pb-0 -mx-0 flex-wrap">
          {CODE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors duration-150
                ${activeTab === t.key
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code block */}
        <div className="relative rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          {/* Lang badge */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="size-3 text-zinc-600" />
              <span className="text-[11px] text-zinc-600 font-mono">{tab.lang}</span>
            </div>
            <button
              onClick={() => copy(tab.code)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="px-4 py-4 overflow-x-auto">
            <SyntaxHighlighter
              language={tab.lang}
              style={codeStyle}
              wrapLongLines={false}
            >
              {tab.code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Env var reminder */}
        <div className="flex items-start gap-2.5 rounded-lg border border-orange-900/40 bg-orange-950/10 px-4 py-3">
          <AlertTriangle className="size-3.5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Never hardcode your API key. Use{" "}
            <code className="font-mono text-orange-300 bg-orange-950/40 px-1 rounded">
              process.env.ALERTFORGE_API_KEY
            </code>{" "}
            or your secrets manager.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ─── API Keys section ─────────────────────────────────────────────────────────

function APIKeysSection() {
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [newLabel, setNewLabel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newlyCreated, setNewlyCreated] = useState(null); // shows the full key once
  const { copied, copy } = useCopy();

  const handleGenerate = () => {
    if (!newLabel.trim()) return;
    const fakeKey = `af_live_${"x".repeat(20)}${Math.random().toString(36).slice(2, 6)}`;
    const newKey = {
      id: Date.now(),
      label: newLabel.trim(),
      preview: `af_live_••••••••••••${fakeKey.slice(-4)}`,
      createdAt: "Just now",
      lastUsed: "Never",
    };
    setKeys((prev) => [newKey, ...prev]);
    setNewlyCreated({ ...newKey, full: fakeKey });
    setNewLabel("");
    setShowForm(false);
  };

  const handleRevoke = (id) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    if (newlyCreated?.id === id) setNewlyCreated(null);
  };

  return (
    <Section
      icon={Key}
      iconClass="text-blue-400"
      title="API Keys"
      description="Use API keys to authenticate SDK requests. Keys are shown only once on creation — store them securely."
    >
      <div className="flex flex-col gap-4">

        {/* Newly created key — show once */}
        {newlyCreated && (
          <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">API key created — copy it now</p>
            </div>
            <p className="text-[11px] text-zinc-500">
              This is the only time your full key will be shown. Store it somewhere safe.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-emerald-800/40 bg-zinc-900 px-3 py-2.5">
              <code className="flex-1 text-xs font-mono text-emerald-300 truncate">
                {newlyCreated.full}
              </code>
              <button
                onClick={() => copy(newlyCreated.full)}
                className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <button
              onClick={() => setNewlyCreated(null)}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors text-left"
            >
              I've copied it — dismiss
            </button>
          </div>
        )}

        {/* Generate form */}
        {showForm ? (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
                if (e.key === "Escape") { setShowForm(false); setNewLabel(""); }
              }}
              placeholder="Key label (e.g. Production SDK)"
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={!newLabel.trim()}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Key className="size-3" />
              Generate
            </button>
            <button
              onClick={() => { setShowForm(false); setNewLabel(""); }}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <Plus className="size-4 rotate-45" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-md border border-dashed border-zinc-700 px-4 py-3 text-xs font-medium text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors w-fit"
          >
            <Plus className="size-3.5" />
            Generate New Key
          </button>
        )}

        {/* Keys table */}
        {keys.length > 0 && (
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_auto] gap-4 border-b border-zinc-800 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
              <span>Label</span>
              <span>Created</span>
              <span>Last Used</span>
              <span className="sr-only">Revoke</span>
            </div>

            {keys.map((key, i) => (
              <div
                key={key.id}
                className={`grid grid-cols-[2fr_1.5fr_1.5fr_auto] gap-4 items-center px-4 py-3.5 text-sm
                  ${i < keys.length - 1 ? "border-b border-zinc-800" : ""}
                  ${newlyCreated?.id === key.id ? "bg-emerald-950/10" : "hover:bg-zinc-900/40"}
                  transition-colors`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">{key.label}</p>
                  <p className="text-[11px] font-mono text-zinc-600 mt-0.5 truncate">{key.preview}</p>
                </div>
                <p className="text-[11px] text-zinc-600">{key.createdAt}</p>
                <p className="text-[11px] text-zinc-600">{key.lastUsed}</p>
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-600 hover:border-red-900/60 hover:bg-red-950/20 hover:text-red-400 transition-all duration-150"
                >
                  <Trash2 className="size-3" />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}

        {keys.length === 0 && (
          <div className="rounded-lg border border-zinc-800 px-5 py-8 flex flex-col items-center gap-2 text-center">
            <Key className="size-5 text-zinc-700" />
            <p className="text-sm text-zinc-500">No API keys yet</p>
            <p className="text-[11px] text-zinc-700">Generate one above to start using the SDK</p>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Integrations() {
  return (
    <div className="flex flex-col gap-0">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Integrations & API Keys</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Connect AlertForge to UptimeRobot or your own backend via the SDK
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">
        <WebhookSection />
        <SDKSection />
        <APIKeysSection />
      </div>
    </div>
  );
}