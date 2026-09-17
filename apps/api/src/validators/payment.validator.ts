import { z } from "zod";

export const createPaymentSchema = z.object({
  maintenance_id: z.number().int().positive("Valid maintenance ID is required"),
  resident_id: z.number().int().positive("Valid resident ID is required"),
  amount: z.number().positive("Amount must be positive"),
  payment_method: z.string().max(50).optional(),
  transaction_id: z.string().max(100).optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  payment_method: z.string().max(50).optional(),
  transaction_id: z.string().max(100).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
