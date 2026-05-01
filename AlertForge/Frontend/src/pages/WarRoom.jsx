import { useEffect, useMemo, useState } from "react";
import { createIncident, getIncidents, updateIncidentStatus } from "@/services/api";
import { initializeSocket, reinitializeSocket } from "@/services/socket";

const initialFormState = {
    message: "",
    service: "",
    severity: "medium",
};

const severityStyles = {
    low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    medium: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    high: "border-red-400/30 bg-red-500/10 text-red-200",
};

const statusStyles = {
    open: "bg-sky-500/15 text-sky-200 border-sky-400/30",
    resolved: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
};

const API_KEY_STORAGE_KEY = "alertforge_api_key";

const normalizeIncident = (incident) => ({
    id: incident?.id || incident?._id,
    message: incident?.message,
    service: incident?.service,
    severity: incident?.severity || "medium",
    status: incident?.status || "open",
    createdAt: incident?.createdAt,
    updatedAt: incident?.updatedAt,
});

const upsertIncident = (currentIncidents, incident) => {
    const normalized = normalizeIncident(incident);

    if (!normalized.id) {
        return currentIncidents;
    }

    const existingIndex = currentIncidents.findIndex((item) => item.id === normalized.id);

    if (existingIndex === -1) {
        return [normalized, ...currentIncidents];
    }

    const nextIncidents = [...currentIncidents];
    nextIncidents[existingIndex] = {
        ...nextIncidents[existingIndex],
        ...normalized,
    };

    return nextIncidents;
};

function WarRoom() {
    const [incidents, setIncidents] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [socketStatus, setSocketStatus] = useState("disconnected");
    const [creating, setCreating] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [form, setForm] = useState(initialFormState);
    const [roomPresence, setRoomPresence] = useState(0);
    const [activeRoom, setActiveRoom] = useState("");

    const sortedIncidents = useMemo(() => incidents, [incidents]);

    useEffect(() => {
        const savedApiKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
        if (savedApiKey) {
            setApiKey(savedApiKey);
        }
    }, []);

    useEffect(() => {
        if (apiKey.trim()) {
            window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
        }
    }, [apiKey]);

    useEffect(() => {
        if (!apiKey.trim()) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getIncidents(apiKey.trim());
                setIncidents(Array.isArray(data) ? data.map(normalizeIncident) : []);
            } catch (fetchError) {
                setError(fetchError?.response?.data?.message || fetchError?.message || "Failed to load incidents");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiKey]);

    // Re-initialize the socket (with the new API key in the handshake) whenever
    // the key changes. The new socket is created in reinitializeSocket().
    useEffect(() => {
        if (!apiKey.trim()) return;
        reinitializeSocket();
    }, [apiKey]);

    useEffect(() => {
        const socket = initializeSocket();

        const handleConnect = () => {
            setSocketStatus("connected");
            // Re-join active room after reconnect
            if (activeRoom) {
                socket.emit("join_room", activeRoom);
            }
        };
        const handleDisconnect = () => {
            setSocketStatus("disconnected");
            setRoomPresence(0);
        };
        const handlePresence = ({ count }) => setRoomPresence(count);
        const handleNewIncident = (incident) => {
            const normalized = normalizeIncident(incident);
            if (!normalized.id) {
                return;
            }

            setIncidents((current) => upsertIncident(current, normalized));
            setTimeline((current) => [
                {
                    id: `${normalized.id}-new-${Date.now()}`,
                    label: "incident:new",
                    text: normalized.message,
                    at: new Date().toISOString(),
                },
                ...current,
            ]);
        };
        const handleIncidentUpdate = (incident) => {
            const normalized = normalizeIncident(incident);
            if (!normalized.id) {
                return;
            }

            setIncidents((current) => upsertIncident(current, normalized));
            setTimeline((current) => [
                {
                    id: `${normalized.id}-update-${Date.now()}`,
                    label: "incident:update",
                    text: normalized.message,
                    at: new Date().toISOString(),
                },
                ...current,
            ]);
        };
        const handleTimelineEvent = (event) => {
            setTimeline((current) => [
                {
                    id: `${event?.incident?.id || "event"}-${Date.now()}`,
                    label: event?.type || "timeline:event",
                    text: event?.incident?.message || "Timeline event received",
                    at: new Date().toISOString(),
                },
                ...current,
            ]);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("room:presence", handlePresence);
        socket.on("incident:new", handleNewIncident);
        socket.on("incident:update", handleIncidentUpdate);
        socket.on("timeline:event", handleTimelineEvent);

        if (socket.connected) {
            setSocketStatus("connected");
            if (activeRoom) socket.emit("join_room", activeRoom);
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("room:presence", handlePresence);
            socket.off("incident:new", handleNewIncident);
            socket.off("incident:update", handleIncidentUpdate);
            socket.off("timeline:event", handleTimelineEvent);
        };
    }, [activeRoom]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    // When the user enters a service name, auto-join that War Room
    const handleServiceChange = (event) => {
        const { value } = event.target;
        setForm((current) => ({ ...current, service: value }));

        if (value.trim()) {
            const room = value.trim().toLowerCase();
            setActiveRoom(room);
            const socket = initializeSocket();
            if (socket.connected) {
                socket.emit("join_room", room);
            }
        }
    };

    const handleCreateIncident = async (event) => {
        event.preventDefault();

        try {
            setCreating(true);
            setError("");

            if (!apiKey.trim()) {
                setError("Add an API key from /api/apikeys first.");
                return;
            }

            await createIncident(
                {
                    message: form.message,
                    service: form.service,
                    severity: form.severity,
                }
            );

            setForm(initialFormState);
        } catch (createError) {
            setError(createError?.response?.data?.message || createError?.message || "Failed to create incident");
        } finally {
            setCreating(false);
        }
    };

    const handleQuickResolve = async (incidentId) => {
        try {
            if (!apiKey.trim()) {
                setError("Add an API key from /api/apikeys first.");
                return;
            }

            await updateIncidentStatus(incidentId, "resolved");
        } catch (statusError) {
            setError(statusError?.response?.data?.message || statusError?.message || "Failed to update incident");
        }
    };

    return (
        <div className="min-h-screen bg-[#07090f] text-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">AlertForge War Room</p>
                            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">Live incident dashboard</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                                Loaded from the backend incidents API and updated instantly through Socket.io events.
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 sm:grid-cols-4">
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Socket</div>
                                <div className={`mt-1 font-medium ${socketStatus === "connected" ? "text-emerald-400" : "text-red-400"}`}>{socketStatus}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">War Room</div>
                                <div className="mt-1 font-medium text-white">{activeRoom || "global"}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Responders</div>
                                <div className="mt-1 font-medium text-emerald-400">{roomPresence}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Incidents</div>
                                <div className="mt-1 font-medium text-white">{sortedIncidents.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Incidents</h2>
                                <p className="text-sm text-slate-400">New incidents are prepended automatically.</p>
                            </div>
                            {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
                        </div>

                        {error ? (
                            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {error}
                            </div>
                        ) : null}

                        <div className="space-y-4">
                            {sortedIncidents.length === 0 && !loading ? (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-slate-400">
                                    No incidents yet. Create one or trigger the API from Postman.
                                </div>
                            ) : null}

                            {sortedIncidents.map((incident) => (
                                <article key={incident.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${severityStyles[incident.severity] || severityStyles.medium}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[incident.status] || statusStyles.open}`}>
                                                    {incident.status}
                                                </span>
                                                <span className="text-xs text-slate-500">{incident.id}</span>
                                            </div>
                                            <h3 className="text-lg font-medium text-white">{incident.message}</h3>
                                            <p className="text-sm text-slate-400">Service: {incident.service || "unknown"}</p>
                                            <p className="text-xs text-slate-500">
                                                Updated: {incident.updatedAt || incident.createdAt || "just now"}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickResolve(incident.id)}
                                            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
                                        >
                                            Mark resolved
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <h2 className="text-xl font-semibold text-white">Create incident</h2>
                            <p className="mt-1 text-sm text-slate-400">Uses `POST /api/incidents` with your API key.</p>

                            <form onSubmit={handleCreateIncident} className="mt-4 space-y-4">
                                <input
                                    type="text"
                                    name="apiKey"
                                    value={apiKey}
                                    onChange={(event) => setApiKey(event.target.value)}
                                    placeholder="x-api-key (saved in browser)"
                                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                />
                                <p className="text-xs text-slate-500">
                                    The key is stored locally so the dashboard can fetch incidents again after refresh.
                                </p>
                                <input
                                    type="text"
                                    name="message"
                                    value={form.message}
                                    onChange={handleInputChange}
                                    placeholder="Incident message"
                                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                    required
                                />
                                <input
                                    type="text"
                                    name="service"
                                    value={form.service}
                                    onChange={handleServiceChange}
                                    placeholder="Affected service (joins War Room)"
                                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                    required
                                />
                                <select
                                    name="severity"
                                    value={form.severity}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                                >
                                    <option value="low">low</option>
                                    <option value="medium">medium</option>
                                    <option value="high">high</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {creating ? "Creating..." : "Create incident"}
                                </button>
                            </form>
                        </section>

                        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <h2 className="text-xl font-semibold text-white">Timeline</h2>
                            <p className="mt-1 text-sm text-slate-400">Socket event log for incident activity.</p>

                            <div className="mt-4 space-y-3">
                                {timeline.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-slate-400">
                                        Waiting for live events...
                                    </div>
                                ) : null}

                                {timeline.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                                        <div className="mt-1 text-sm text-white">{item.text}</div>
                                        <div className="mt-1 text-xs text-slate-500">{item.at}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default WarRoom;
