import { z } from "zod";

export const createVisitorSchema = z.object({
  resident_id: z.number().int().positive("Please select a resident"),
  flat_id: z.number().int().positive("Please select a flat"),
  visitor_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  visitor_phone: z.string().min(10, "Phone must be at least 10 characters").max(20),
  purpose: z.string().max(200).optional().or(z.literal("")),
  vehicle_number: z.string().max(20).optional().or(z.literal("")),
});

export const updateVisitorSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CHECKED_IN", "CHECKED_OUT"]).optional(),
  purpose: z.string().max(200).optional().or(z.literal("")),
  vehicle_number: z.string().max(20).optional().or(z.literal("")),
});

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;
export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>;
