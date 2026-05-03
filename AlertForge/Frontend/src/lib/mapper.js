/**
 * ALERTFORGE — Data Mapper / Normalizer
 *
 * Bridges the backend enum values (low/medium/high, open/resolved…)
 * and the frontend display values (P1/P2/P3, Active/Resolved…).
 */

// ── Severity ────────────────────────────────────────────────────────────────

/** Backend → Frontend display label */
export const severityToLabel = {
    critical: "P1",
    high: "P1",
    medium: "P2",
    low: "P3",
};

/** Frontend label → Backend value */
export const labelToSeverity = {
    P1: "high",
    P2: "medium",
    P3: "low",
};

export const normalizeSeverity = (raw) =>
    severityToLabel[raw?.toLowerCase()] ?? raw ?? "P2";

export const denormalizeSeverity = (label) =>
    labelToSeverity[label] ?? label?.toLowerCase() ?? "medium";

// ── Status ───────────────────────────────────────────────────────────────────

/** Backend → Frontend display label */
export const statusToLabel = {
    open: "Active",
    investigating: "Investigating",
    identified: "Identified",
    monitoring: "Monitoring",
    resolved: "Resolved",
};

/** Frontend label → Backend value */
export const labelToStatus = {
    Active: "open",
    Investigating: "investigating",
    Identified: "identified",
    Monitoring: "monitoring",
    Resolved: "resolved",
};

export const normalizeStatus = (raw) =>
    statusToLabel[raw?.toLowerCase()] ?? raw ?? "Active";

export const denormalizeStatus = (label) =>
    labelToStatus[label] ?? label?.toLowerCase() ?? "open";

// ── Incident ─────────────────────────────────────────────────────────────────

/** Normalize a raw backend incident into a stable frontend shape */
export const normalizeIncident = (raw) => {
    if (!raw) return null;
    return {
        id: raw._id ?? raw.id,
        title: raw.title ?? raw.message ?? "Untitled Incident",
        message: raw.message ?? raw.title ?? "",
        service: raw.service ?? raw.affectedService ?? "—",
        severity: normalizeSeverity(raw.severity),
        severityRaw: raw.severity,
        status: normalizeStatus(raw.status),
        statusRaw: raw.status,
        source: raw.source ?? "Manual",
        affectedUrl: raw.affectedUrl ?? raw.service ?? "",
        startedAt: raw.createdAt ?? raw.startedAt ?? new Date().toISOString(),
        resolvedAt: raw.resolvedAt ?? null,
        responders: raw.responders ?? [],
        affectedServices: raw.affectedServices ?? [],
        aiRootCause: raw.aiRootCause ?? [],
        joinCode: raw.joinCode ?? null,
        joinToken: raw.joinToken ?? null,
        organizationId: raw.organizationId,
    };
};

// ── Team Member ───────────────────────────────────────────────────────────────

export const normalizeMember = (raw) => ({
    id: raw._id ?? raw.id,
    name: raw.name ?? raw.email,
    email: raw.email,
    role: raw.role
        ? raw.role.charAt(0).toUpperCase() + raw.role.slice(1)
        : "Viewer",
    online: raw.isOnline ?? false,
    incidentsResponded: raw.incidentCount ?? 0,
    joinedAt: raw.createdAt
        ? new Date(raw.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "—",
    organizationId: raw.organizationId,
});

// ── Service ───────────────────────────────────────────────────────────────────

export const normalizeService = (raw) => ({
    id: raw._id ?? raw.id,
    name: raw.name,
    url: raw.url ?? "",
    status: raw.status ?? "operational",
    monitorType: raw.monitorType ?? "manual",
    incidentCount: raw.incidentCount ?? 0,
    uptime: raw.uptime ?? 100,
    createdAt: raw.createdAt,
});

// ── Postmortem ────────────────────────────────────────────────────────────────

export const normalizePostmortem = (raw) => ({
    id: raw._id ?? raw.id,
    incidentId: raw.incidentId ?? raw.incident,
    status: raw.status ?? "draft",
    summary: raw.summary ?? "",
    rootCauses: raw.rootCauses ?? raw.rootCause ?? [],
    impact: raw.impact ?? "",
    whatWentWell: raw.whatWentWell ?? [],
    whatWentWrong: raw.whatWentWrong ?? [],
    actionItems: raw.actionItems ?? [],
    timeline: raw.timeline ?? [],
    responders: raw.responders ?? [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
});
