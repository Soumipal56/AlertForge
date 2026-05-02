import { getMistralModel } from "../utils/llm.js";
import { LearningNodeSchema } from "../utils/parser.js";
import { buildFallbackPostmortem } from "../utils/formatter.js";
import { buildLearningPrompt } from "../prompts/learning.prompt.js";

/**
 * Produces the learning statement for the postmortem.
 * Output shape: { learnings }.
 */
export const learningNode = async (state) => {
    try {
        const prompt = buildLearningPrompt(state);
        const structuredModel = getMistralModel().withStructuredOutput(LearningNodeSchema);

        const result = await structuredModel.invoke([
            ["system", prompt.system],
            ["human", prompt.human],
        ]);

        return {
            learnings: result.learnings.trim(),
        };
    } catch (error) {
        console.error("[LangGraph][learning] Failed to generate learnings:", error.message);

        return {
            learnings: buildFallbackPostmortem(state).learnings,
            needsReview: true,
            reviewNotes: [`learning node fallback: ${error.message}`],
        };
    }
};
