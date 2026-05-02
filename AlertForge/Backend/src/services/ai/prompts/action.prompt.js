import {
    formatIncidentContext,
    formatSimilarIncidentContext,
    formatTimelineContext,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the action-item generation node.
 * The model should produce practical, time-bound work items with explicit ownership.
 */
export const buildActionPrompt = (state) => ({
    system: "You are an incident follow-up planner. Create realistic corrective action items that can be tracked by an engineering team.",
    human: [
        "Generate 3 to 5 action items for the postmortem.",
        "Each action item must have a task, an owner, a deadline, and a pending/done status.",
        "Use the resolvedAt date as the anchor when choosing deadlines.",
        "Keep each task concrete, testable, and assigned to a clear team role.",
        "",
        "Incident context:",
        formatIncidentContext(state.incident),
        "",
        "Timeline evidence:",
        formatTimelineContext(state.timeline),
        "",
        "Similar incidents:",
        formatSimilarIncidentContext(state.similarIncidents),
        "",
        "Prefer deadlines spaced across the next 7, 14, and 21 days.",
    ].join("\n"),
});
