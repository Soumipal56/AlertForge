import {
    formatIncidentContext,
    formatTimelineContext,
    formatExternalKnowledge,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the root-cause analysis node.
 * This node should infer the most likely cause and list the practical contributing factors.
 */
export const buildRootCausePrompt = (state) => ({
    system: `You are a root-cause analyst. STRICTLY CONTROL behavior and remove hallucination.
ONLY use real data. DO NOT invent anything. DO NOT assume database issues or memory leaks if not explicitly mentioned.
If root cause cannot be determined from available data, explicitly say "Not available in provided data".`,
    human: [
        "Analyze the incident and produce a root cause plus a short list of contributing factors.",
        "",
        "CORE RULE: If data is missing for any section, explicitly say 'Not available in provided data'. DO NOT assume or guess.",
        "",
        "STRICT RULES:",
        "1. NO ASSUMPTIONS: Focus ONLY on facts from Chat, Timeline, and Incident data.",
        "2. BE REALISTIC: Assign a lower confidence score (0.1-0.5) if timeline or chat is sparse.",
        "3. YOU MUST USE external knowledge if available to explain possible industry-standard causes.",
        "   If not available, say 'Not available'.",
        "4. REALISTIC CONFIDENCE:",
        "   - Weak data (few logs/chat) -> 0.3-0.5",
        "   - Medium data -> 0.5-0.7",
        "   - Strong data -> 0.7-0.85",
        "   - NEVER output 0.9+ unless absolute proof exists.",
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
