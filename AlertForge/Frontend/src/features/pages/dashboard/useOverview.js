import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { incidentsApi } from "@/api/incidents.api";
import {
    normalizeIncident,
    normalizeSeverity,
    denormalizeSeverity,
    normalizeStatus,
    denormalizeStatus,
} from "@/lib/mapper";

export function useOverview() {
    const navigate = useNavigate();

    const [tab, setTab] = useState("all");
    const [openCreate, setOpenCreate] = useState(false);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        title: "",
        service: "",
        severity: "P2",
        status: "Active",
    });

    // ── Fetch all incidents ───────────────────────────────────────────────────
    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await incidentsApi.getAll();
            const incidents = Array.isArray(data) ? data : data?.incidents ?? [];
            setRows(incidents.map(normalizeIncident));
        } catch (err) {
            console.error("[useOverview] Failed to load incidents:", err);
            setError(err?.response?.data?.message || "Failed to load incidents");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    // ── Form ─────────────────────────────────────────────────────────────────
    const handleFormChange = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    // ── Create incident ───────────────────────────────────────────────────────
    const handleCreateIncident = async (event) => {
        event.preventDefault();
        if (!form.title || !form.service) return;

        try {
            const payload = {
                title: form.title,
                message: form.title,
                service: form.service,
                severity: denormalizeSeverity(form.severity),
                status: denormalizeStatus(form.status),
            };
            const created = await incidentsApi.create(payload);
            setRows((prev) => [normalizeIncident(created), ...prev]);
            setForm({ title: "", service: "", severity: "P2", status: "Active" });
            setOpenCreate(false);
        } catch (err) {
            console.error("[useOverview] Failed to create incident:", err);
            setError(err?.response?.data?.message || "Failed to create incident");
        }
    };

    // ── Inline severity / status update ──────────────────────────────────────
    const updateRow = useCallback(async (id, field, displayValue) => {
        // Optimistic update
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: displayValue } : r))
        );

        try {
            if (field === "severity") {
                await incidentsApi.updateSeverity(id, denormalizeSeverity(displayValue));
            } else if (field === "status") {
                await incidentsApi.updateStatus(id, denormalizeStatus(displayValue));
            }
        } catch (err) {
            console.error(`[useOverview] Failed to update ${field}:`, err);
            // Rollback on failure
            fetchIncidents();
        }
    }, [fetchIncidents]);

    // ── Filtered rows ─────────────────────────────────────────────────────────
    const filteredRows = useMemo(() => {
        if (tab === "all") return rows;
        return rows.filter((r) => r.status.toLowerCase() === tab.toLowerCase());
    }, [rows, tab]);

    const formatStartedAt = (value) => {
        if (!value) return { date: "—", time: "" };
        const d = new Date(value);
        if (isNaN(d)) return { date: value, time: "" };
        return {
            date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };
    };

    const handleRowClick = (id) => navigate(`/dashboard/incidents/${id}`);

    return {
        tab,
        setTab,
        openCreate,
        setOpenCreate,
        loading,
        error,
        rows,
        form,
        handleFormChange,
        updateRow,
        handleCreateIncident,
        filteredRows,
        formatStartedAt,
        handleRowClick,
        refresh: fetchIncidents,
    };
}
