import { z } from "zod";

export const createBillSchema = z.object({
  flat_ids: z.array(z.number().int().positive()).min(1, "At least one flat must be selected"),
  billing_month: z.number().int().min(1, "Month is required").max(12, "Invalid month"),
  billing_year: z.number().int().min(2000, "Year is required").max(2100, "Invalid year"),
  maintenance_amount: z.number().positive("Amount must be greater than 0"),
  additional_charges: z.number().min(0, "Cannot be negative").optional().default(0),
  late_fee: z.number().min(0, "Cannot be negative").optional().default(0),
  due_date: z.string().min(1, "Due date is required"),
  description: z.string().optional().or(z.literal("")),
});

export const updateBillSchema = z.object({
  maintenance_amount: z.number().positive().optional(),
  additional_charges: z.number().min(0).optional(),
  late_fee: z.number().min(0).optional(),
  due_date: z.string().optional(),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["UNPAID", "PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
});

export const recordOfflinePaymentSchema = z.object({
  paid_amount: z.number().positive("Amount must be greater than 0"),
  receipt_number: z.string().min(1, "Receipt number is required").max(100).optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const onlinePaymentSchema = z.object({
  paid_amount: z.number().positive("Amount must be greater than 0"),
  transaction_id: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type RecordOfflinePaymentInput = z.infer<typeof recordOfflinePaymentSchema>;
export type OnlinePaymentInput = z.infer<typeof onlinePaymentSchema>;
