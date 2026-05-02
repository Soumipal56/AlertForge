import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { summaryNode } from "./nodes/summary.node.js";
import { rootCauseNode } from "./nodes/rootcause.node.js";
import { actionNode } from "./nodes/action.node.js";
import { learningNode } from "./nodes/learning.node.js";
import { validatorNode } from "./nodes/validator.node.js";
import {
    IncidentContextSchema,
    TimelineEventContextSchema,
    SimilarIncidentSchema,
    PostmortemActionItemSchema,
    GraphValidationStateSchema,
    PostmortemOutputSchema,
    PostmortemGraphInputSchema,
} from "./utils/parser.js";
import { buildFallbackPostmortem, normalizeGraphInput } from "./utils/formatter.js";

/**
 * LangGraph state definition for the postmortem pipeline.
 * The graph carries the incident context plus the progressively generated AI drafts.
 */
const PostmortemGraphState = new StateSchema({
    incident: IncidentContextSchema,
    timeline: z.array(TimelineEventContextSchema).default([]),
    similarIncidents: z.array(SimilarIncidentSchema).default([]),
    summary: z.string().default(""),
    rootCause: z.string().default(""),
    contributingFactors: z.array(z.string()).default([]),
    actionItems: z.array(PostmortemActionItemSchema).default([]),
    learnings: z.string().default(""),
    confidence: z.number().min(0).max(1).default(0),
    validation: GraphValidationStateSchema.default({ isValid: false, issues: [] }),
    needsReview: z.boolean().default(false),
    reviewNotes: z.array(z.string()).default([]),
});

/**
 * Compile the LangGraph once at module load time.
 * This keeps runtime requests fast and avoids rebuilding the graph on every incident.
 */
const compiledGraph = new StateGraph(PostmortemGraphState)
    .addNode("summaryStep", summaryNode)
    .addNode("rootCauseStep", rootCauseNode)
    .addNode("actionStep", actionNode)
    .addNode("learningStep", learningNode)
    .addNode("validatorStep", validatorNode)
    .addEdge(START, "summaryStep")
    .addEdge("summaryStep", "rootCauseStep")
    .addEdge("rootCauseStep", "actionStep")
    .addEdge("actionStep", "learningStep")
    .addEdge("learningStep", "validatorStep")
    .addEdge("validatorStep", END)
    .compile();

/**
 * Runs the full postmortem graph and returns a validated structured output.
 * The caller can safely persist the returned object without additional AI parsing.
 */
export const runPostmortemGraph = async (data) => {
    try {
        const normalizedInput = normalizeGraphInput(PostmortemGraphInputSchema.parse(data));
        const graphResult = await compiledGraph.invoke(normalizedInput);

        const finalOutput = {
            summary: graphResult.summary,
            rootCause: graphResult.rootCause,
            contributingFactors: Array.isArray(graphResult.contributingFactors) ? graphResult.contributingFactors : [],
            actionItems: Array.isArray(graphResult.actionItems) ? graphResult.actionItems : [],
            learnings: graphResult.learnings,
            confidence: typeof graphResult.confidence === "number" ? graphResult.confidence : 0,
        };

        const validated = PostmortemOutputSchema.safeParse(finalOutput);
        if (!validated.success) {
            console.error("[LangGraph] Final structured output validation failed:", validated.error.flatten());
            return buildFallbackPostmortem(normalizedInput);
        }

        return validated.data;
    } catch (error) {
        console.error("[LangGraph] Graph execution failed:", error.message);
        return buildFallbackPostmortem(normalizeGraphInput(data));
    }
};
