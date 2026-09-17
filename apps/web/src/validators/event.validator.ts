import { z } from "zod";

export const createEventSchema = z.object({
  society_id: z.number().int().positive("Please select a society"),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().optional().or(z.literal("")),
  event_date: z.string().min(1, "Event date is required"),
  end_date: z.string().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
});

export const updateEventSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().optional().or(z.literal("")),
  event_date: z.string().optional(),
  end_date: z.string().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
