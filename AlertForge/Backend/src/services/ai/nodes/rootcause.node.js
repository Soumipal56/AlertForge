import { getMistralModel } from "../utils/llm.js";
import { RootCauseNodeSchema } from "../utils/parser.js";
import { buildFallbackPostmortem } from "../utils/formatter.js";
import { buildRootCausePrompt } from "../prompts/rootcause.prompt.js";

/**
 * Produces the root cause and the contributing factors for the postmortem.
 * Output shape: { rootCause, contributingFactors }.
 */
export const rootCauseNode = async (state) => {
    try {
        const prompt = buildRootCausePrompt(state);
        const structuredModel = getMistralModel().withStructuredOutput(RootCauseNodeSchema);

        const result = await structuredModel.invoke([
            ["system", prompt.system],
            ["human", prompt.human],
        ]);

        return {
            rootCause: result.rootCause.trim(),
            contributingFactors: Array.isArray(result.contributingFactors)
                ? result.contributingFactors.map((factor) => factor.trim()).filter(Boolean)
                : [],
        };
    } catch (error) {
        console.error("[LangGraph][rootCause] Failed to generate root cause:", error.message);

        const fallback = buildFallbackPostmortem(state);
        return {
            rootCause: fallback.rootCause,
            contributingFactors: fallback.contributingFactors,
            needsReview: true,
            reviewNotes: [`root cause node fallback: ${error.message}`],
        };
    }
};
