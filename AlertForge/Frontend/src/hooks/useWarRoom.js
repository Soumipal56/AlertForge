import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { initializeSocket, getSocket } from "@/services/socket";
import { incidentApi, normalizeIncident } from "@/services/incidents.service";

/**
 * Custom hook to manage real-time War Room state and actions.
 */
export function useWarRoom() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { apiKey } = useAuth();

  const [incident, setIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);

  const joinRoom = useCallback(() => {
    if (!socketRef.current || !id) return;

    socketRef.current.emit("join_incident_room", { incidentId: id }, (response) => {
      if (response?.success) {
        setMessages(response.messages || []);
        setPresence(response.count || 1);
        setLoading(false);
      } else {
        setError(response?.message || "Failed to join war room");
        setLoading(false);
      }
    });
  }, [id]);

  useEffect(() => {
    async function fetchIncident() {
      try {
        const data = await incidentApi.getById(id);
        setIncident(normalizeIncident(data));
      } catch (err) {
        console.error("[useWarRoom] Failed to fetch incident:", err);
        setError("Could not load incident details.");
      }
    }

    if (id) {
      fetchIncident();
    }
  }, [id]);

  useEffect(() => {
    if (!apiKey && !token) return;

    const socket = initializeSocket(apiKey || token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      joinRoom();
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("room:presence", (data) => {
      if (data.count !== undefined) {
        setPresence(data.count);
      }
    });

    socket.on("incident:update", (updatedIncident) => {
      if (updatedIncident.id === id) {
        setIncident((prev) => ({ ...prev, ...updatedIncident }));
      }
    });

    socket.on("room:suggestion", (data) => {
        if (data.suggestions) {
            setIncident(prev => ({
                ...prev,
                aiRootCause: data.suggestions
            }));
        }
    });

    // If socket is already connected (e.g. from a previous page), join immediately
    if (socket.connected) {
      setSocketConnected(true);
      joinRoom();
    }

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message:new");
      socket.off("room:presence");
      socket.off("incident:update");
      socket.off("room:suggestion");
    };
  }, [apiKey, token, id, joinRoom]);

  const sendMessage = (content) => {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit("message:new", { content });
    }
  };

  const updateStatus = async (status) => {
    try {
      await incidentApi.updateStatus(id, status);
      // Status update will be broadcasted via socket
    } catch (err) {
      console.error("[useWarRoom] Failed to update status:", err);
    }
  };

  const toggleTask = (messageId, isCompleted) => {
    if (socketRef.current) {
      socketRef.current.emit("task:update", { messageId, isCompleted });
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
  };
}
