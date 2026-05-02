import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

const getCurrentTime = () =>
  new Date().toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const initialIncidentRows = [
  {
    id: 1,
    incident: "API Service Down",
    team: "api.acme.com",
    severity: "P1",
    status: "Active",
    startedAt: "May 20, 2026 10:21 AM",
    duration: "00:23:41",
  },
  {
    id: 2,
    incident: "Payments Slower than usual",
    team: "payments.acme.com",
    severity: "P2",
    status: "Monitoring",
    startedAt: "May 20, 2026 09:15 AM",
    duration: "01:29:12",
  },
  {
    id: 3,
    incident: "File Upload Failing",
    team: "uploads.acme.com",
    severity: "P3",
    status: "Resolved",
    startedAt: "May 19, 2026 08:40 PM",
    duration: "01:05:32",
  },
  {
    id: 4,
    incident: "Login Issues",
    team: "auth.acme.com",
    severity: "P3",
    status: "Resolved",
    startedAt: "May 18, 2026 05:20 PM",
    duration: "00:45:10",
  },
];

export function useOverview() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [rows, setRows] = useState(initialIncidentRows);
  const [form, setForm] = useState({
    incident: "",
    team: "",
    severity: "P2",
    status: "Active",
    startedAt: getCurrentTime(),
    duration: "",
  });

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateRow = (id, field, value) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

  const handleCreateIncident = (event) => {
    event.preventDefault();
    if (!form.incident || !form.team || !form.startedAt || !form.duration)
      return;
    setRows((prev) => [
      {
        id: Date.now(),
        incident: form.incident,
        team: form.team,
        severity: form.severity,
        status: form.status,
        startedAt: form.startedAt,
        duration: form.duration,
      },
      ...prev,
    ]);
    setForm({
      incident: "",
      team: "",
      severity: "P2",
      status: "Active",
      startedAt: getCurrentTime(),
      duration: "",
    });
    setOpenCreate(false);
  };

  const filteredRows = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((row) => row.status.toLowerCase() === tab);
  }, [rows, tab]);

  const formatStartedAt = (value) => {
    const [datePart, timePart] = value.split(/ (\d{1,2}:\d{2} [AP]M)$/);
    return { date: datePart ?? value, time: timePart ?? "" };
  };

  const handleRowClick = (id) => navigate(`/dashboard/incidents/${id}`);

  return {
    tab,
    setTab,
    openCreate,
    setOpenCreate,
    rows,
    form,
    handleFormChange,
    updateRow,
    handleCreateIncident,
    filteredRows,
    formatStartedAt,
    handleRowClick,
  };
}
