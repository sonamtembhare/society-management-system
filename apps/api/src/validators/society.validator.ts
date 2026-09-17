import { z } from "zod";

export const createSocietySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z.string().min(5, "Valid pincode is required").max(10),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
});

export const updateSocietySchema = createSocietySchema.partial();

export type CreateSocietyInput = z.infer<typeof createSocietySchema>;
export type UpdateSocietyInput = z.infer<typeof updateSocietySchema>;
