import { z } from "zod";

export const createVehicleSchema = z.object({
  vehicle_number: z.string().min(3, "Vehicle number is required").max(20),
  vehicle_type: z.enum(["CAR", "BIKE", "SCOOTER", "EV", "OTHER"]),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
});

export const updateVehicleSchema = z.object({
  vehicle_number: z.string().min(3).max(20).optional(),
  vehicle_type: z.enum(["CAR", "BIKE", "SCOOTER", "EV", "OTHER"]).optional(),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
