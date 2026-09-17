import { z } from "zod";

export const createPaymentSchema = z.object({
  maintenance_id: z.number().int().positive("Please select a maintenance bill"),
  resident_id: z.number().int().positive("Please select a resident"),
  amount: z.number().positive("Amount must be positive"),
  payment_method: z.string().max(50).optional().or(z.literal("")),
  transaction_id: z.string().max(100).optional().or(z.literal("")),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  payment_method: z.string().max(50).optional().or(z.literal("")),
  transaction_id: z.string().max(100).optional().or(z.literal("")),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
