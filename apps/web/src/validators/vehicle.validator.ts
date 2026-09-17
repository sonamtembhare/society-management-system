import { z } from "zod";

export const createVehicleSchema = z.object({
  vehicle_number: z.string().min(3, "Vehicle number must be at least 3 characters").max(20),
  vehicle_type: z.enum(["CAR", "BIKE", "SCOOTER", "OTHER"]),
  brand: z.string().max(50).optional().or(z.literal("")),
  model: z.string().max(50).optional().or(z.literal("")),
  color: z.string().max(30).optional().or(z.literal("")),
});

export const updateVehicleSchema = z.object({
  vehicle_number: z.string().min(3).max(20).optional(),
  vehicle_type: z.enum(["CAR", "BIKE", "SCOOTER", "OTHER"]).optional(),
  brand: z.string().max(50).optional().or(z.literal("")),
  model: z.string().max(50).optional().or(z.literal("")),
  color: z.string().max(30).optional().or(z.literal("")),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
