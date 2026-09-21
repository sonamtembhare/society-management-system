import { z } from "zod";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const createMaintenanceSchema = z.object({
  flat_ids: z.array(z.number().int().positive("Valid flat ID is required")).min(1, "At least one flat must be selected"),
  billing_month: z.number().int().min(1, "Valid month is required").max(12, "Valid month is required"),
  billing_year: z.number().int().min(2000, "Valid year is required").max(2100, "Valid year is required"),
  maintenance_amount: z.number().positive("Maintenance amount must be greater than 0"),
  additional_charges: z.number().min(0, "Additional charges cannot be negative").optional().default(0),
  late_fee: z.number().min(0, "Late fee cannot be negative").optional().default(0),
  due_date: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
});

export const updateMaintenanceSchema = z.object({
  maintenance_amount: z.number().positive("Maintenance amount must be greater than 0").optional(),
  additional_charges: z.number().min(0, "Additional charges cannot be negative").optional(),
  late_fee: z.number().min(0, "Late fee cannot be negative").optional(),
  due_date: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["UNPAID", "PENDING", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"]).optional(),
});

export const recordPaymentSchema = z.object({
  paid_amount: z.number().positive("Paid amount must be greater than 0"),
  payment_method: z.enum(["ONLINE", "OFFLINE"], { message: "Payment method must be ONLINE or OFFLINE" }),
  transaction_id: z.string().max(100).optional(),
  receipt_number: z.string().max(100).optional(),
  note: z.string().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
