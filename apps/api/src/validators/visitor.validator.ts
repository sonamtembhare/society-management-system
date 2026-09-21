import { z } from "zod";

export const createVisitorSchema = z.object({
  visitor_name: z.string().min(2, "Visitor name is required").max(100),
  visitor_phone: z.string().min(10, "Valid phone number is required").max(20),
  purpose: z.string().max(200).optional(),
  vehicle_number: z.string().max(20).optional(),
  visitor_type: z.enum(["GUEST", "DELIVERY", "SERVICE", "CAB", "OTHER"]).optional(),
  expected_date: z.string().optional(),
  expected_time: z.string().optional(),
  notes: z.string().max(500).optional(),
  resident_id: z.number().int().positive().optional(),
  flat_id: z.number().int().positive().optional(),
});

export const updateVisitorSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPECTED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]).optional(),
  purpose: z.string().max(200).optional(),
  vehicle_number: z.string().max(20).optional(),
});

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;
export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>;
