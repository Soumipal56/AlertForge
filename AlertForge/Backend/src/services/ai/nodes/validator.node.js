import { getMistralModel } from "../utils/llm.js";
import { PostmortemOutputSchema, GraphValidationStateSchema } from "../utils/parser.js";
import { buildFallbackPostmortem } from "../utils/formatter.js";

/**
 * Final validator node.
 * It consolidates the earlier drafts into strict structured output and assigns a confidence score.
 */
export const validatorNode = async (state) => {
    try {
        const structuredModel = getMistralModel().withStructuredOutput(PostmortemOutputSchema);
        const prompt = [
            "You are the final QA validator for a production postmortem.",
            "Normalize the drafted postmortem into strict JSON that matches the schema exactly.",
            "Do not invent facts that are not supported by the incident, timeline, or earlier drafts.",
            "If a field is uncertain, phrase it conservatively rather than guessing.",
            "",
            "Incident:",
            JSON.stringify(state.incident, null, 2),
            "",
            "Timeline:",
            JSON.stringify(state.timeline, null, 2),
            "",
            "Similar incidents:",
            JSON.stringify(state.similarIncidents, null, 2),
            "",
            "Draft summary:",
            state.summary || "",
            "",
            "Draft root cause:",
            state.rootCause || "",
            "",
            "Draft contributing factors:",
            JSON.stringify(state.contributingFactors || [], null, 2),
            "",
            "Draft action items:",
            JSON.stringify(state.actionItems || [], null, 2),
            "",
            "Draft learnings:",
            state.learnings || "",
        ].join("\n");

        const result = await structuredModel.invoke([
            ["system", "You are the final postmortem validator."],
            ["human", prompt],
        ]);

        const validation = GraphValidationStateSchema.parse({
            isValid: true,
            issues: [],
        });

        return {
            summary: result.summary.trim(),
            rootCause: result.rootCause.trim(),
            contributingFactors: Array.isArray(result.contributingFactors) ? result.contributingFactors : [],
            actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
            learnings: result.learnings.trim(),
            confidence: result.confidence,
            validation,
            needsReview: result.confidence < 0.75,
            reviewNotes: result.confidence < 0.75 ? ["Confidence is below the review threshold and should be inspected before use."] : [],
        };
    } catch (error) {
        console.error("[LangGraph][validator] Failed to validate postmortem:", error.message);

        const fallback = buildFallbackPostmortem(state);
        const validation = GraphValidationStateSchema.parse({
            isValid: false,
            issues: [error.message],
        });

        return {
            ...fallback,
            validation,
            needsReview: true,
            reviewNotes: [error.message],
        };
    }
};
