import { PostmortemActionItemSchema, PostmortemGraphInputSchema } from "./parser.js";

const STOP_WORDS = new Set([
    "the",
    "and",
    "or",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "over",
    "under",
    "when",
    "where",
    "what",
    "why",
    "how",
    "issue",
    "incident",
    "service",
    "system",
    "error",
    "failure",
    "failed",
    "outage",
    "alert",
    "problem",
]);

const regexEscape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value, fallback = "") => {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
};

const normalizeIdentifier = (value) => {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (value && typeof value.toString === "function") {
        const stringValue = value.toString();
        return stringValue === "[object Object]" ? null : stringValue;
    }

    return null;
};

const toDate = (value) => {
    if (!value) {
        return null;
    }

    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
        return null;
    }

    return dateValue;
};

const formatDate = (value) => {
    const dateValue = toDate(value);
    return dateValue ? dateValue.toISOString() : "unknown";
};

const addDays = (dateValue, days) => {
    const nextDate = toDate(dateValue) || new Date();
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate.toISOString();
};

const selectTimelineSignals = (timeline = []) =>
    timeline.filter((event) => [
        "incident.status_changed",
        "responder.assigned",
        "root_cause.identified",
        "fix.deployed",
        "incident.resolved",
    ].includes(event?.type));

/**
 * Normalizes the graph input before it enters LangGraph.
 * This keeps the nodes working with stable, predictable objects.
 */
export const normalizeGraphInput = (input = {}) => {
    const safeDateString = (d) => {
        if (!d) return null;
        if (typeof d === "string") return d;
        const dateValue = d instanceof Date ? d : new Date(d);
        return Number.isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
    };

    const incidentData = input?.incident || {};
    const parsed = PostmortemGraphInputSchema.parse({
        incident: {
            ...incidentData,
            createdAt: safeDateString(incidentData.createdAt),
            updatedAt: safeDateString(incidentData.updatedAt),
            resolvedAt: safeDateString(incidentData.resolvedAt),
        },
        timeline: (Array.isArray(input?.timeline) ? input.timeline : []).map((event) => ({
            ...event,
            createdAt: safeDateString(event?.createdAt),
        })),
        chat: typeof input?.chat === "string" ? input.chat : "",
        similarIncidents: typeof input?.similarIncidents === "string" ? input.similarIncidents : "",
    });

    return {
        incident: {
            ...parsed.incident,
            id: normalizeIdentifier(parsed.incident.id || parsed.incident._id),
            message: normalizeText(parsed.incident.message, "Incident message unavailable"),
            service: normalizeText(parsed.incident.service, "unknown service"),
            severity: normalizeText(parsed.incident.severity, "medium"),
            status: normalizeText(parsed.incident.status, "open"),
            impact: normalizeText(parsed.incident.impact, ""),
        },
        timeline: parsed.timeline.map((event) => ({
            ...event,
            type: normalizeText(event.type, "incident.status_changed"),
            label: normalizeText(event.label, "Timeline event"),
            message: normalizeText(event.message, "Timeline event recorded"),
        })),
        chat: parsed.chat,
        similarIncidents: parsed.similarIncidents,
    };
};

/**
 * Turns the incident into a compact, readable block for prompt templates.
 */
export const formatIncidentContext = (incident = {}) => [
    `Incident ID: ${normalizeText(incident.id, "unknown")}`,
    `Service: ${normalizeText(incident.service, "unknown service")}`,
    `Severity: ${normalizeText(incident.severity, "unknown")}`,
    `Status: ${normalizeText(incident.status, "unknown")}`,
    `Impact: ${normalizeText(incident.impact, "not recorded")}`,
    `Message: ${normalizeText(incident.message, "not recorded")}`,
    `Resolved At: ${formatDate(incident.resolvedAt)}`,
].join("\n");

/**
 * Formats the timeline as chronological evidence for the model.
 */
export const formatTimelineContext = (timeline = []) => {
    const orderedTimeline = [...timeline].sort((left, right) => {
        const leftTime = toDate(left?.createdAt)?.getTime() || 0;
        const rightTime = toDate(right?.createdAt)?.getTime() || 0;
        return leftTime - rightTime;
    });

    if (orderedTimeline.length === 0) {
        return "No timeline events were captured for this incident.";
    }

    return orderedTimeline.map((event, index) => [
        `${index + 1}. ${normalizeText(event.label, event.type || "Timeline event")}`,
        `   Type: ${normalizeText(event.type, "unknown")}`,
        `   Message: ${normalizeText(event.message, "not recorded")}`,
        `   Created At: ${formatDate(event.createdAt)}`,
    ].join("\n")).join("\n");
};

/**
 * Summarizes similar incidents so the model can detect recurring patterns.
 */
export const formatSimilarIncidentContext = (similarIncidents = []) => {
    if (similarIncidents.length === 0) {
        return "No similar incidents were found by message matching.";
    }

    return similarIncidents.map((incident, index) => [
        `${index + 1}. ${normalizeText(incident.message, "Similar incident")}`,
        `   Service: ${normalizeText(incident.service, "unknown service")}`,
        `   Severity: ${normalizeText(incident.severity, "unknown")}`,
        `   Status: ${normalizeText(incident.status, "unknown")}`,
        `   Created At: ${formatDate(incident.createdAt)}`,
    ].join("\n")).join("\n");
};

/**
 * Builds a safe regex from the incident message so we can find similar incidents.
 */
export const buildIncidentSearchRegex = (message = "") => {
    const tokens = normalizeText(message).toLowerCase().match(/[a-z0-9]+/g) || [];
    const meaningfulTokens = [...new Set(tokens.filter((token) => token.length > 3 && !STOP_WORDS.has(token)))].slice(0, 5);

    if (meaningfulTokens.length === 0) {
        const fallback = normalizeText(message, "incident");
        return new RegExp(regexEscape(fallback), "i");
    }

    return new RegExp(meaningfulTokens.map(regexEscape).join("|"), "i");
};

/**
 * Converts a model response into plain text when a node does not use structured output.
 */
export const toPlainText = (value) => {
    if (typeof value === "string") {
        return value.trim();
    }

    if (Array.isArray(value)) {
        return value
            .map((part) => {
                if (typeof part === "string") return part;
                if (part && typeof part.text === "string") return part.text;
                if (part && typeof part.content === "string") return part.content;
                return "";
            })
            .join(" ")
            .trim();
    }

    if (value && typeof value.content === "string") {
        return value.content.trim();
    }

    return "";
};

/**
 * Normalizes an action item before it is written to MongoDB.
 */
export const normalizeActionItem = (item = {}) => {
    const parsed = PostmortemActionItemSchema.safeParse({
        task: normalizeText(item.task),
        owner: normalizeText(item.owner),
        deadline: item.deadline,
        status: normalizeText(item.status, "pending"),
    });

    if (!parsed.success) {
        return null;
    }

    return parsed.data;
};

/**
 * Builds a stable fallback postmortem when the graph cannot complete.
 * This keeps the system resilient even if the model or API is temporarily unavailable.
 */
export const buildFallbackPostmortem = ({ incident = {}, timeline = [], similarIncidents = [] } = {}) => {
    const serviceName = normalizeText(incident.service, "the affected service");
    const severity = normalizeText(incident.severity, "unknown");
    const impactText = normalizeText(incident.impact, "");
    const resolvedAt = toDate(incident.resolvedAt) || toDate(incident.updatedAt) || toDate(incident.createdAt) || new Date();
    const timelineSignals = selectTimelineSignals(timeline);
    const hasRootCauseNote = timelineSignals.some((event) => event.type === "root_cause.identified");
    const hasFix = timelineSignals.some((event) => event.type === "fix.deployed");
    const hasResponder = timelineSignals.some((event) => event.type === "responder.assigned");
    const similarCount = similarIncidents && typeof similarIncidents === "string" && similarIncidents.length > 0 ? 1 : 0;

    const contributingFactors = [
        impactText ? `Recorded impact: ${impactText}` : "Impact was not explicitly recorded.",
        similarCount > 0 ? "Recent similar incidents suggest a recurring failure pattern." : "No close historical match was found in the incident message search.",
        hasResponder ? "" : "Responder ownership was not captured early in the response.",
        hasRootCauseNote ? "" : "A root-cause checkpoint was not captured before closure.",
        hasFix ? "" : "The timeline did not record a distinct fix deployment event.",
    ].filter(Boolean);

    return {
        summary: `The ${severity}-severity incident affecting ${serviceName} was resolved after the response team stabilized the service and confirmed it was safe to close. ${impactText ? `Recorded impact: ${impactText}.` : ""}`.trim(),
        rootCause: hasRootCauseNote
            ? normalizeText(timelineSignals.find((event) => event.type === "root_cause.identified")?.message, `The exact root cause was not captured, but the evidence points to a ${serviceName} regression or dependency issue.`)
            : `The exact root cause was not captured, but the evidence points to a ${serviceName} regression or dependency issue.`,
        contributingFactors: contributingFactors.length > 0 ? contributingFactors.slice(0, 4) : [
            "The timeline was too sparse to isolate a single cause with confidence.",
        ],
        actionItems: [
            {
                task: `Review the failure path for ${serviceName} and confirm the corrective change that prevents recurrence.`,
                owner: "Service owner",
                deadline: addDays(resolvedAt, 7),
                status: "pending",
            },
            {
                task: "Tighten alerting and detection for the signal that triggered this incident.",
                owner: "SRE / On-call",
                deadline: addDays(resolvedAt, 14),
                status: "pending",
            },
            {
                task: similarCount > 0
                    ? "Compare this incident with recent similar incidents and close the recurring operational gap."
                    : "Update the runbook with the mitigation and escalation steps used during this response.",
                owner: "Incident commander",
                deadline: addDays(resolvedAt, 21),
                status: "pending",
            },
        ],
        learnings: `Capturing a full timeline for ${serviceName} made it easier to reconstruct the response. The next improvement is to document the exact root-cause note and fix path before the incident is closed so future follow-up work is based on confirmed evidence.`,
        confidence: Number((0.42 + (hasRootCauseNote ? 0.18 : 0) + (hasFix ? 0.1 : 0) + (similarCount > 0 ? 0.05 : 0)).toFixed(2)),
    };
};
