import { getMistralModel } from "../utils/llm.js";
import { SummaryNodeSchema } from "../utils/parser.js";
import { buildFallbackPostmortem } from "../utils/formatter.js";
import { buildSummaryPrompt } from "../prompts/summary.prompt.js";

/**
 * Produces the executive summary for the postmortem.
 * Output shape: { summary }.
 */
export const summaryNode = async (state) => {
    try {
        const prompt = buildSummaryPrompt(state);
        const structuredModel = getMistralModel().withStructuredOutput(SummaryNodeSchema);

        const result = await structuredModel.invoke([
            ["system", prompt.system],
            ["human", prompt.human],
        ]);

        return {
            summary: result.summary.trim(),
        };
    } catch (error) {
        console.error("[LangGraph][summary] Failed to generate summary:", error.message);

        return {
            summary: buildFallbackPostmortem(state).summary,
            needsReview: true,
            reviewNotes: [`summary node fallback: ${error.message}`],
        };
    }
};
