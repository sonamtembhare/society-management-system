import { z } from "zod";

export const createSocietySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters").max(100),
  state: z.string().min(2, "State must be at least 2 characters").max(100),
  pincode: z.string().min(5, "Pincode must be at least 5 characters").max(10),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

export const updateSocietySchema = createSocietySchema.partial();

export type CreateSocietyInput = z.infer<typeof createSocietySchema>;
export type UpdateSocietyInput = z.infer<typeof updateSocietySchema>;
