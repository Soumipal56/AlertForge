import {
    formatIncidentContext,
    formatTimelineContext,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the root-cause analysis node.
 * This node should infer the most likely cause and list the practical contributing factors.
 */
export const buildRootCausePrompt = (state) => ({
    system: "You are a root-cause analyst for incident postmortems. Separate confirmed evidence from inference. If the evidence is incomplete, state the most likely cause conservatively.",
    human: [
        "Analyze the incident and produce a root cause plus a short list of contributing factors.",
        "The root cause must be specific and grounded in the timeline.",
        "Contributing factors should be operational and actionable, not generic statements.",
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
        "",
        "Use the timeline to identify the strongest evidence for why this happened.",
    ].join("\n"),
});
