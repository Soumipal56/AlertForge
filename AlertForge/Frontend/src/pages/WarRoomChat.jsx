import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { getSocket, initializeSocket, reinitializeSocket } from "@/services/socket";
import UpdateFeed from "@/components/warroom/UpdateFeed";
import UpdateComposer from "@/components/warroom/UpdateComposer";

/**
 * Normalizes a message from the socket payload or the Mongo history payload.
 * The UI only cares about a stable id, room id, content, sender, and timestamp.
 */
const normalizeMessage = (message) => ({
    id: message?.id || message?._id,
    roomId: message?.roomId,
    content: message?.content,
    fileUrl: message?.fileUrl,
    fileType: message?.fileType,
    sender: {
        apiKeyId: message?.sender?.apiKeyId || "",
        name: message?.sender?.name || "Unknown",
        serviceName: message?.sender?.serviceName || "",
    },
    createdAt: message?.createdAt,
});

function WarRoomChat() {
    const params = useParams();
    const [incidentStatus, setIncidentStatus] = useState("open");
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [activeApiKey, setActiveApiKey] = useState("");
    const [activeName, setActiveName] = useState("");
    const [roomId, setRoomId] = useState("");
    const [messages, setMessages] = useState([]);
    const [presence, setPresence] = useState(0);
    const [socketStatus, setSocketStatus] = useState("disconnected");
    const [messageInput, setMessageInput] = useState("");
    const [pendingFile, setPendingFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");

    const sortedMessages = useMemo(() => messages, [messages]);

    useEffect(() => {
        if (!activeApiKey.trim()) {
            setMessages([]);
            setRoomId("");
            setPresence(0);
            setSocketStatus("disconnected");
            return undefined;
        }

        const socket = reinitializeSocket(activeApiKey.trim(), activeName.trim());
        const { incidentId } = params;

        // Once the socket connects, join either a specific incident room (if deep-linked)
        // or the default service-level war room resolved from the API key.
        const handleConnect = () => {
            setSocketStatus("connected");

            if (incidentId) {
                // Scenario: Deep-linkable incident room.
                console.log(`[Socket Debug] Attempting to join incident room: ${incidentId}`);
                console.log(`[Socket Debug] With API Key: ${activeApiKey.substring(0, 8)}...`);
                
                socket.emit("join_incident_room", { incidentId }, (ack) => {
                    if (!ack?.success) {
                        setError(ack?.message || `Failed to join incident room ${incidentId}`);
                        return;
                    }

                    setRoomId(ack.room || "");
                    setPresence(ack.count || 0);
                    setMessages((ack.messages || []).map(normalizeMessage));
                    setIncidentStatus(ack.status || "open");
                });
            } else {
                // Scenario: Global/Service war room.
                socket.emit("join_warroom", null, (ack) => {
                    if (!ack?.success) {
                        setError(ack?.message || "Failed to join war room");
                        return;
                    }

                    setRoomId(ack.room || "");
                    setPresence(ack.count || 0);
                    setMessages((ack.messages || []).map(normalizeMessage));
                    setIncidentStatus("open");
                });
            }
        };

        const handleIncidentResolved = (payload) => {
            if (payload.incidentId === incidentId) {
                setIncidentStatus("resolved");
                setError("This incident has been resolved. Chat is now read-only.");
            }
        };

        const handleDisconnect = () => {
            setSocketStatus("disconnected");
            setPresence(0);
        };

        const handlePresence = ({ count }) => {
            setPresence(count || 0);
        };

        // Keep the message list in sync with live socket broadcasts.
        const handleChatMessage = (message) => {
            const normalized = normalizeMessage(message);
            if (!normalized.id) return;

            setMessages((current) => {
                if (current.some((item) => item.id === normalized.id)) {
                    return current;
                }

                return [...current, normalized];
            });
        };

        const handleChatError = ({ message }) => {
            setError(message || "Chat error");
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("room:presence", handlePresence);
        socket.on("chat:message", handleChatMessage);
        socket.on("error:event", handleChatError);
        socket.on("incident:resolved", handleIncidentResolved);

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("room:presence", handlePresence);
            socket.off("chat:message", handleChatMessage);
            socket.off("error:event", handleChatError);
            socket.off("incident:resolved", handleIncidentResolved);
        };
    }, [activeApiKey, params.incidentId, activeName]);

    const handleConnect = (event) => {
        event.preventDefault();

        const key = apiKeyInput.trim();
        const name = nameInput.trim();

        if (!key) {
            setError("Enter an API key to join the War Room.");
            return;
        }

        setError("");
        setActiveApiKey(key);
        setActiveName(name);
    };

    const handleSendMessage = (event) => {
        if (event) event.preventDefault();

        if (incidentStatus === "resolved") {
            setError("This incident is resolved. You cannot send messages.");
            return;
        }

        const socket = getSocket() || initializeSocket(activeApiKey.trim(), activeName.trim());
        const content = messageInput.trim();

        if (!roomId) {
            setError("Join the War Room first.");
            return;
        }

        // Must have either text or a file
        if (!content && !pendingFile) {
            setError("Type a message or select a file before sending.");
            return;
        }

        socket.emit("chat:message", { 
            content,
            fileUrl: pendingFile?.url || null,
            fileType: pendingFile?.type || null
        }, (ack) => {
            if (!ack?.success) {
                setError(ack?.message || "Failed to send message");
                return;
            }

            setMessageInput("");
            setPendingFile(null);
        });
    };

    /**
     * Handles file selection and uploads it to the backend.
     * On success, emits a chat:message event with the file URL and type.
     */
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (incidentStatus === "resolved") {
            setError("This incident is resolved. You cannot upload files.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploading(true);
            setError("");

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/upload`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Upload failed");
            }

            // Store file metadata (DO NOT SEND IMMEDIATELY)
            setPendingFile({
                url: data.url,
                type: data.fileType,
                name: file.name
            });

        } catch (err) {
            console.error("[Upload] Error:", err.message);
            setError(err.message || "Failed to upload file.");
        } finally {
            setIsUploading(false);
            // Reset file input
            event.target.value = "";
        }
    };

    return (
        <div className="min-h-screen bg-[#07090f] text-white">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">War Room Chat</p>
                    <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
                        {params.incidentId ? "Incident War Room" : "Group war room"}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                        {params.incidentId 
                            ? `Collaborate in real-time to resolve incident ${params.incidentId}.`
                            : "Enter an API key, join the matching room, and chat in real time with everyone using the same room scope."}
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Join Room</h2>
                                <p className="mt-1 text-sm text-slate-400">API key is the only auth method.</p>
                            </div>
                            <div className={`rounded-full border px-3 py-1 text-xs ${socketStatus === "connected" ? "border-emerald-400/30 text-emerald-200" : "border-red-400/30 text-red-200"}`}>
                                {socketStatus}
                            </div>
                        </div>

                        {error ? (
                            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {error}
                            </div>
                        ) : null}

                        <form onSubmit={handleConnect} className="mt-5 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">Your Name (Optional)</label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(event) => setNameInput(event.target.value)}
                                    placeholder="e.g. Ritam"
                                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">API Key</label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(event) => setApiKeyInput(event.target.value)}
                                    placeholder="Paste API key"
                                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
                            >
                                Join War Room
                            </button>
                        </form>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Room</div>
                            <div className="mt-1 font-medium text-white">{roomId || "Not joined yet"}</div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Presence</div>
                            <div className="mt-1 font-medium text-emerald-300">{presence}</div>
                        </div>
                    </section>

                    <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                        <div className="border-b border-white/5 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">Messages</h2>
                                    <p className="mt-1 text-sm text-slate-400">All messages are scoped to the joined room.</p>
                                </div>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    live
                                </div>
                            </div>
                        </div>

                        {/* Resolved Banner */}
                        {incidentStatus === "resolved" && (
                            <div className="flex items-center gap-3 border-b border-yellow-500/20 bg-yellow-500/10 px-6 py-3 text-sm text-yellow-200">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-[10px] font-bold">!</div>
                                This incident is resolved. Chat is read-only.
                            </div>
                        )}

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <UpdateFeed messages={sortedMessages} />
                        </div>

                        {/* Chat Input Area */}
                        <UpdateComposer 
                            messageInput={messageInput}
                            setMessageInput={setMessageInput}
                            pendingFile={pendingFile}
                            setPendingFile={setPendingFile}
                            onSendMessage={handleSendMessage}
                            onFileChange={handleFileChange}
                            isUploading={isUploading}
                            disabled={!roomId || incidentStatus === "resolved"}
                            placeholder={
                                !roomId 
                                    ? "Join a room to chat" 
                                    : incidentStatus === "resolved" 
                                        ? "Incident resolved (Read-only)" 
                                        : "Type your message..."
                            }
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}

export default WarRoomChat;
