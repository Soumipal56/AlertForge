import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import incidentModel from "../model/Incident.model.js";
import timelineEventModel from "../model/TimelineEvent.model.js";
import postmortemModel from "../model/Postmortem.model.js";
import { runPostmortemGraph } from "./ai/langgraph.service.js";
import { buildIncidentSearchRegex, normalizeGraphInput } from "./ai/utils/formatter.js";
import { PostmortemOutputSchema } from "./ai/utils/parser.js";

/**
 * Validates that a string is a MongoDB ObjectId before we query the database.
 */
const validateObjectId = (incidentId) => {
    if (!mongoose.Types.ObjectId.isValid(incidentId)) {
        throw new ApiError(400, "Invalid incident ID");
    }
};

/**
 * Loads the incident, its timeline, and up to three similar incidents.
 * The service keeps data access here so the LangGraph layer stays focused on AI reasoning.
 */
const loadPostmortemContext = async (incidentId) => {
    const incident = await incidentModel.findById(incidentId).lean();

    if (!incident) {
        throw new ApiError(404, "Incident not found");
    }

    const [timeline, similarIncidents] = await Promise.all([
        timelineEventModel.find({ incidentId }).sort({ createdAt: 1 }).lean(),
        incidentModel.find({
            _id: { $ne: incident._id },
            message: buildIncidentSearchRegex(incident.message),
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("message service severity status impact resolvedAt createdAt")
            .lean(),
    ]);

    return normalizeGraphInput({
        incident,
        timeline,
        similarIncidents,
    });
};

/**
 * Fetches a previously stored postmortem for a single incident.
 */
export const getPostmortemByIncidentIdService = async (incidentId) => {
    validateObjectId(incidentId);

    return await postmortemModel.findOne({ incidentId }).lean();
};

/**
 * Generates and persists a postmortem once an incident is resolved.
 * LangGraph performs the step-by-step reasoning, while this service owns persistence.
 */
export const generatePostmortem = async (incidentId) => {
    validateObjectId(incidentId);

    const existingPostmortem = await postmortemModel.findOne({ incidentId }).lean();
    if (existingPostmortem) {
        return existingPostmortem;
    }

    const context = await loadPostmortemContext(incidentId);
    const graphResult = await runPostmortemGraph({
        incident: context.incident,
        timeline: context.timeline,
        similarIncidents: context.similarIncidents,
    });

    const validatedOutput = PostmortemOutputSchema.safeParse(graphResult);

    if (!validatedOutput.success) {
        console.error("[Postmortem] Graph output failed validation:", validatedOutput.error.flatten());
        throw new ApiError(500, "Postmortem generation produced invalid output");
    }

    const documentPayload = {
        incidentId: context.incident._id,
        summary: validatedOutput.data.summary,
        rootCause: validatedOutput.data.rootCause,
        contributingFactors: validatedOutput.data.contributingFactors,
        actionItems: validatedOutput.data.actionItems,
        learnings: validatedOutput.data.learnings,
        aiConfidence: validatedOutput.data.confidence,
    };

    try {
        return await postmortemModel.findOneAndUpdate(
            { incidentId: context.incident._id },
            {
                $setOnInsert: documentPayload,
            },
            {
                upsert: true,
                returnDocument: "after",
                runValidators: true,
            }
        ).lean();
    } catch (error) {
        if (error?.code === 11000) {
            return await postmortemModel.findOne({ incidentId }).lean();
        }

        throw error;
    }
};
