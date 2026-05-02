import { z } from "zod";

const dateLikeSchema = z.union([z.string(), z.date(), z.null()]);

/**
 * Shared schemas for the LangGraph postmortem pipeline.
 * Keeping the schemas in one place makes future loop/validator changes safer.
 */
export const IncidentContextSchema = z.object({
    id: z.string().nullable().optional().default(null),
    message: z.string().default(""),
    service: z.string().default(""),
    severity: z.string().default(""),
    status: z.string().default(""),
    impact: z.string().default(""),
    resolvedAt: dateLikeSchema.optional().default(null),
    createdAt: dateLikeSchema.optional().default(null),
    updatedAt: dateLikeSchema.optional().default(null),
    metadata: z.unknown().nullable().optional().default(null),
}).passthrough();

export const TimelineEventContextSchema = z.object({
    type: z.string().default("unknown"),
    label: z.string().default("Timeline event"),
    message: z.string().default(""),
    createdAt: dateLikeSchema.optional().default(null),
}).passthrough();

export const SimilarIncidentSchema = z.object({
    id: z.string().nullable().optional().default(null),
    message: z.string().default(""),
    service: z.string().default(""),
    severity: z.string().default(""),
    status: z.string().default(""),
    impact: z.string().default(""),
    resolvedAt: dateLikeSchema.optional().default(null),
    createdAt: dateLikeSchema.optional().default(null),
}).passthrough();

export const PostmortemActionItemSchema = z.object({
    task: z.string().min(1, "Action item task is required"),
    owner: z.string().min(1, "Action item owner is required"),
    deadline: z.coerce.date(),
    status: z.enum(["pending", "done"]),
}).strict();

export const SummaryNodeSchema = z.object({
    summary: z.string().min(1, "Summary is required"),
}).strict();

export const RootCauseNodeSchema = z.object({
    rootCause: z.string().min(1, "Root cause is required"),
    contributingFactors: z.array(z.string().min(1)).default([]),
}).strict();

export const ActionNodeSchema = z.object({
    actionItems: z.array(PostmortemActionItemSchema).min(1, "At least one action item is required"),
}).strict();

export const LearningNodeSchema = z.object({
    learnings: z.string().min(1, "Learnings are required"),
}).strict();

export const PostmortemOutputSchema = z.object({
    summary: z.string().min(1, "Summary is required"),
    rootCause: z.string().min(1, "Root cause is required"),
    contributingFactors: z.array(z.string().min(1)).default([]),
    actionItems: z.array(PostmortemActionItemSchema).min(1, "At least one action item is required"),
    learnings: z.string().min(1, "Learnings are required"),
    confidence: z.number().min(0).max(1),
}).strict();

export const GraphValidationStateSchema = z.object({
    isValid: z.boolean(),
    issues: z.array(z.string()).default([]),
}).strict();

export const PostmortemGraphInputSchema = z.object({
    incident: IncidentContextSchema,
    timeline: z.array(TimelineEventContextSchema).default([]),
    similarIncidents: z.array(SimilarIncidentSchema).default([]),
}).strict();
