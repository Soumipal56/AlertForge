import {
    formatIncidentContext,
    formatTimelineContext,
    formatExternalKnowledge,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the learnings node.
 * This section should capture the practical lesson the team should retain.
 */
export const buildLearningPrompt = (state) => ({
    system: `You are writing the learnings section. STRICTLY CONTROL behavior and remove hallucination.
ONLY use real data. DO NOT invent anything. Avoid blame and generic advice.
Assume incident is RESOLVED.`,
    human: [
        "Write the learnings section for this incident.",
        "",
        "CORE RULE: If data is missing for any section, explicitly say 'Not available in provided data'. DO NOT assume or guess.",
        "",
        "STRICT RULES:",
        "1. NO ASSUMPTIONS: Focus ONLY on facts from Chat, Timeline, and Incident data.",
        "2. NO BLAME: Focus on process and reliability improvements.",
        "3. NO GENERIC ADVICE: Learnings must be specific to this incident.",
        "4. YOU MUST USE external knowledge if available to provide broader industry learnings.",
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
