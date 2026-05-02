import {
    formatIncidentContext,
    formatTimelineContext,
    formatExternalKnowledge,
} from "../utils/formatter.js";

/**
 * Builds the prompt for the executive summary node.
 * The summary should read like a concise incident review, not a generic AI paragraph.
 */
export const buildSummaryPrompt = (state) => ({
    system: `You are a senior incident commander. STRICTLY CONTROL behavior and remove hallucination.
ONLY use real data. DO NOT invent anything.
Assume incident is RESOLVED. DO NOT say "incident is open" or "ongoing".
Use simple, human-readable language. No unnecessary technical jargon.`,
    human: [
        "1. Summary: A concise, factual review of the incident, impact, and recovery. Based ONLY on Incident context + Timeline evidence.",
        "",
        "2. Debugging Timeline (from War Room Chat):",
        "   - Use the buildDebuggingTimeline data provided.",
        "   - Format: * [time] user: message",
        "   - Only include meaningful debugging messages. DO NOT summarize aggressively.",
        "",
        "3. External Knowledge (Tavily Search):",
        "   - Format it like documentation with Title, Source (if available), and Key Points.",
        "   - DO NOT merge into summary text. Keep it separate.",
        "   - You MUST use external knowledge if available. If not available, say 'Not available'.",
        "",
        "CORE RULE: If data is missing for a section, explicitly say 'Not available in provided data'. DO NOT assume or guess.",
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
