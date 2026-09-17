import { z } from "zod";

export const createVisitorSchema = z.object({
  resident_id: z.number().int().positive("Valid resident ID is required"),
  flat_id: z.number().int().positive("Valid flat ID is required"),
  visitor_name: z.string().min(2, "Visitor name is required").max(100),
  visitor_phone: z.string().min(10, "Valid phone number is required").max(20),
  purpose: z.string().max(200).optional(),
  vehicle_number: z.string().max(20).optional(),
});

export const updateVisitorSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CHECKED_IN", "CHECKED_OUT"]).optional(),
  purpose: z.string().max(200).optional(),
  vehicle_number: z.string().max(20).optional(),
});

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;
export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>;
