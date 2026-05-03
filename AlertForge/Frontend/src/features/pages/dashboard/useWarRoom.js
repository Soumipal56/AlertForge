import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router";
import { incidentsApi } from "@/api/incidents.api";
import { warroomApi } from "@/api/warroom.api";
import { apiKeyApi } from "@/api/auth.api";
import { normalizeIncident, denormalizeStatus } from "@/lib/mapper";
import { initSocket, joinIncidentRoom, SOCKET_EVENTS, sendMessage as socketSendMessage } from "@/lib/socket";

export function useWarRoom() {
  const { incidentId } = useParams();
  const [incident, setIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("alertforge.warroom.apiKey") || "");

  const socketRef = useRef(null);

  // ── Fetch Incident Data ────────────────────────────────────────────────────
  const fetchIncident = useCallback(async () => {
    try {
      const data = await incidentsApi.getById(incidentId);
      setIncident(normalizeIncident(data));
    } catch (err) {
      console.error("[useWarRoom] Failed to fetch incident:", err);
      setError("Failed to load incident data");
    }
  }, [incidentId]);

  // ── Fetch API Key if missing ───────────────────────────────────────────────
  const ensureApiKey = useCallback(async () => {
    if (apiKey) return apiKey;
    try {
      const keys = await apiKeyApi.list();
      if (keys && keys.length > 0) {
        const key = keys[0].key; // Assuming the backend returns the raw key on list for the owner or we pick a dedicated one
        localStorage.setItem("alertforge.warroom.apiKey", key);
        setApiKey(key);
        return key;
      }
      return null;
    } catch (err) {
      console.error("[useWarRoom] Failed to fetch API keys:", err);
      return null;
    }
  }, [apiKey]);

  // ── Socket Initialization ──────────────────────────────────────────────────
  useEffect(() => {
    if (!incidentId) return;

    let mounted = true;

    const setupSocket = async () => {
      const key = await ensureApiKey();
      if (!key) {
        setError("API Key required for War Room connection. Please generate one in Integrations.");
        setLoading(false);
        return;
      }

      const socket = initSocket(key, "Dashboard User");
      socketRef.current = socket;

      socket.on("connect", () => {
        if (!mounted) return;
        setSocketConnected(true);
        joinIncidentRoom(incidentId).catch(console.error);
      });

      socket.on("disconnect", () => {
        if (mounted) setSocketConnected(false);
      });

      socket.on(SOCKET_EVENTS.MESSAGE_NEW, (msg) => {
        if (mounted) setMessages((prev) => [...prev, msg]);
      });

      socket.on(SOCKET_EVENTS.ROOM_PRESENCE, ({ count }) => {
        if (mounted) setPresence(count);
      });

      socket.on(SOCKET_EVENTS.INCIDENT_UPDATE, (updated) => {
        if (mounted) setIncident(normalizeIncident(updated));
      });

      socket.on(SOCKET_EVENTS.INCIDENT_RESOLVED, () => {
        if (mounted) {
            fetchIncident();
            // Optional: toast or redirect
        }
      });
    };

    fetchIncident().then(() => {
        if (mounted) setupSocket().then(() => setLoading(false));
    });

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off(SOCKET_EVENTS.MESSAGE_NEW);
        socketRef.current.off(SOCKET_EVENTS.ROOM_PRESENCE);
        socketRef.current.off(SOCKET_EVENTS.INCIDENT_UPDATE);
        socketRef.current.off(SOCKET_EVENTS.INCIDENT_RESOLVED);
      }
    };
  }, [incidentId, ensureApiKey, fetchIncident]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const sendMessage = async (content, fileUrl = null, fileType = null) => {
    try {
      await socketSendMessage({ content, fileUrl, fileType });
    } catch (err) {
      console.error("[useWarRoom] Failed to send message:", err);
    }
  };

  const updateStatus = async (status) => {
    try {
      const updated = await incidentsApi.updateStatus(incidentId, denormalizeStatus(status));
      setIncident(normalizeIncident(updated));
    } catch (err) {
      console.error("[useWarRoom] Failed to update status:", err);
    }
  };

  const toggleTask = async (taskId, completed) => {
    try {
      await warroomApi.toggleTask({ incidentId, taskId, completed });
      // Usually socket will broadcast this, but we can also update locally or re-fetch
    } catch (err) {
      console.error("[useWarRoom] Failed to toggle task:", err);
    }
  };

  return {
    incident,
    messages,
    presence,
    loading,
    error,
    socketConnected,
    sendMessage,
    updateStatus,
    toggleTask,
    refresh: fetchIncident,
  };
}
