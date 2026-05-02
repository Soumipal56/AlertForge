import {
    formatIncidentContext,
    formatTimelineContext,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the executive summary node.
 * The summary should read like a concise incident review, not a generic AI paragraph.
 */
export const buildSummaryPrompt = (state) => ({
    system: "You are a senior incident commander writing the executive summary section of a production postmortem. Use only the supplied facts. Be concise, factual, and operationally useful.",
    human: [
        "Write the executive summary for the postmortem.",
        "The summary must capture the incident, visible impact, recovery, and why this matters to the team.",
        "Do not invent a root cause or action items here.",
        "",
        "Incident context:",
        formatIncidentContext(state.incident),
        "",
        "Timeline evidence:",
        formatTimelineContext(state.timeline),
        "",
        "War Room Chat:",
        state.chat,
        "",
        "Similar Past Incidents:",
        state.similarIncidents,
    ].join("\n"),
});
