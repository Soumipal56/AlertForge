import { z } from "zod";

export const incidentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().optional(),
  service: z.string().min(1, "Service is required"),
  severity: z.enum(["P1", "P2", "P3"]).optional(),
  status: z.enum(["investigating", "identified", "monitoring", "resolved", "active"]).optional(),
});