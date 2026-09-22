import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  facility: z.enum(["GYM", "SWIMMING_POOL", "YOGA", "SOCIETY_HALL", "OTHER"]),
  event_date: z.string().min(1, "Event date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  attendees: z.number().int().positive("Attendees must be a positive number"),
  description: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().max(200).optional(),
}).refine(
  (data) => {
    if (data.start_time && data.end_time) {
      return data.end_time > data.start_time;
    }
    return true;
  },
  { message: "End time must be after start time", path: ["end_time"] }
);

export const updateEventSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  facility: z.enum(["GYM", "SWIMMING_POOL", "YOGA", "SOCIETY_HALL", "OTHER"]).optional(),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  attendees: z.number().int().positive().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().max(200).optional(),
});

export const rejectEventSchema = z.object({
  reason: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type RejectEventInput = z.infer<typeof rejectEventSchema>;
