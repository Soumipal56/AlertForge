import {
    formatIncidentContext,
    formatTimelineContext,
    formatExternalKnowledge,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the action-item generation node.
 * The model should produce practical, time-bound work items with explicit ownership.
 */
export const buildActionPrompt = (state) => ({
    system: `You are an incident follow-up planner. STRICTLY CONTROL behavior and remove hallucination.
ONLY use real data. DO NOT invent advanced technical steps unless clearly supported by Chat, Timeline, or Tavily results.
Keep action items simple, grounded, and realistic.`,
    human: [
        "Generate 3 to 5 action items for the postmortem.",
        "",
        "CORE RULE: If data is missing for any section, explicitly say 'Not available in provided data'. DO NOT assume or guess.",
        "",
        "STRICT RULES:",
        "1. GROUNDED ACTION ITEMS: Should be based ONLY on Chat messages, Timeline events, or Tavily results.",
        "2. NO GENERIC TASKS: Do NOT suggest 'schedule meeting', 'improve monitoring', or 'review logs' unless they address a specific found gap. Prefer real technical fixes.",
        "3. NO OVER-ENGINEERING: Do not suggest complex refactors unless clearly supported by data.",
        "4. YOU MUST USE external knowledge if available to suggest standard prevention steps.",
        "   If not available, say 'Not available'.",
        "",
        "Context Sections:",
        "----------------",
        "Incident context:",
        formatIncidentContext(state.incident),
        "",
        "Timeline evidence:",
        formatTimelineContext(state.timeline),
        "",
        "Chat History:",
        state.chat,
        "",
        "Similar Past Incidents:",
        state.similarIncidents,
        "",
        "External Knowledge (Tavily):",
        formatExternalKnowledge(state.externalKnowledge),
    ].join("\n"),
});
