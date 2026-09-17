import { z } from "zod";

export const createMaintenanceSchema = z.object({
  flat_id: z.number().int().positive("Please select a flat"),
  amount: z.number().positive("Amount must be positive"),
  billing_period: z.string().min(1, "Billing period is required"),
  description: z.string().optional().or(z.literal("")),
  due_date: z.string().min(1, "Due date is required"),
});

export const updateMaintenanceSchema = z.object({
  amount: z.number().positive().optional(),
  billing_period: z.string().min(1).optional(),
  description: z.string().optional().or(z.literal("")),
  due_date: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
