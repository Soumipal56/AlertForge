import { z } from "zod";

export const incidentSchema = z.object({
  message: z.string().min(1, "Message is required"),
  service: z.string().min(1, "Service is required"),
  severity: z.enum(["low", "medium", "high"]).optional()
});