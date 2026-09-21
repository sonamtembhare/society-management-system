import { z } from "zod";

export const createPaymentSchema = z.object({
  bill_id: z.number().int().positive("Select a bill"),
  payment_method: z.enum(["ONLINE", "OFFLINE"]),
  paid_amount: z.number().positive("Amount must be greater than 0"),
  transaction_id: z.string().max(100).optional().or(z.literal("")),
  receipt_number: z.string().max(100).optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  note: z.string().optional().or(z.literal("")),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
