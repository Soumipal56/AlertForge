import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIncidentsThunk,
  createIncidentThunk,
  updateIncidentStatusThunk,
  updateIncidentSeverityThunk,
} from "@/store/slices/incidents/incidents.thunks";
import {
  selectAllIncidents,
  selectIncidentsLoading,
  selectIncidentsCreating,
  selectIncidentsError,
  selectCreateError,
  selectIncidentCounts,
} from "@/store/slices/incidents/incidents.selectors";
import {
  clearCreateError,
  clearError,
} from "@/store/slices/incidents/incidents.slice";

export function useIncidents() {
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const incidents = useSelector(selectAllIncidents);
  const isLoading = useSelector(selectIncidentsLoading);
  const isCreating = useSelector(selectIncidentsCreating);
  const error = useSelector(selectIncidentsError);
  const createError = useSelector(selectCreateError);
  const counts = useSelector(selectIncidentCounts);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    incident: "",
    team: "",
    severity: "P2",
    status: "Active",
  });

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchIncidentsThunk());
  }, [dispatch]);

  // ── Filter incidents for current tab + search ──────────────────────────────
  const filtered = useMemo(() => {
    let result = incidents;
    if (tab !== "all") {
      result = result.filter((i) => i.status.toLowerCase() === tab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.service.toLowerCase().includes(q),
      );
    }
    return result;
  }, [incidents, tab, search]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (createError) dispatch(clearCreateError());
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.incident || !form.team) return;
    const result = await dispatch(
      createIncidentThunk({
        title: form.incident,
        service: form.team,
        severity: form.severity,
        status: form.status.toLowerCase(),
      }),
    );
    if (createIncidentThunk.fulfilled.match(result)) {
      setForm({ incident: "", team: "", severity: "P2", status: "Active" });
      setOpenCreate(false);
    }
  };

  const handleUpdateStatus = (id, status) => {
    dispatch(updateIncidentStatusThunk({ id, status: status.toLowerCase() }));
  };

  const handleUpdateSeverity = (id, severity) => {
    dispatch(updateIncidentSeverityThunk({ id, severity }));
  };

  const handleOpenCreate = () => {
    dispatch(clearCreateError());
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
    dispatch(clearCreateError());
  };

  return {
    // data
    incidents,
    filtered,
    counts,
    // loading states
    isLoading,
    isCreating,
    // errors
    error,
    createError,
    // ui state
    tab,
    setTab,
    search,
    setSearch,
    openCreate,
    form,
    // handlers
    handleFormChange,
    handleCreate,
    handleUpdateStatus,
    handleUpdateSeverity,
    handleOpenCreate,
    handleCloseCreate,
  };
}
