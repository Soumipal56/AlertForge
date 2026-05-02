import {
    formatIncidentContext,
    formatTimelineContext,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the learnings node.
 * This section should capture the practical lesson the team should retain.
 */
export const buildLearningPrompt = (state) => ({
    system: "You are writing the learnings section of an incident postmortem. Focus on process, observability, automation, and reliability improvements.",
    human: [
        "Write the learnings section for this incident.",
        "Explain what the team should remember and what should change next time.",
        "Keep the language practical and avoid moralizing or blame.",
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
