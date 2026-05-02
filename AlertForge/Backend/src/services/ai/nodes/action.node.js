import { getMistralModel } from "../utils/llm.js";
import { ActionNodeSchema } from "../utils/parser.js";
import { buildFallbackPostmortem } from "../utils/formatter.js";
import { buildActionPrompt } from "../prompts/action.prompt.js";

/**
 * Produces the action items for the postmortem.
 * Output shape: { actionItems }.
 */
export const actionNode = async (state) => {
    try {
        const prompt = buildActionPrompt(state);
        const structuredModel = getMistralModel().withStructuredOutput(ActionNodeSchema);

        const result = await structuredModel.invoke([
            ["system", prompt.system],
            ["human", prompt.human],
        ]);

        return {
            actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
        };
    } catch (error) {
        console.error("[LangGraph][action] Failed to generate action items:", error.message);

        return {
            actionItems: buildFallbackPostmortem(state).actionItems,
            needsReview: true,
            reviewNotes: [`action node fallback: ${error.message}`],
        };
    }
};
