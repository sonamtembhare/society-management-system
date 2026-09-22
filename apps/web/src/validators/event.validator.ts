import { z } from "zod";

export const FACILITY_OPTIONS = [
  { value: "GYM", label: "Gym" },
  { value: "SWIMMING_POOL", label: "Swimming Pool" },
  { value: "YOGA", label: "Yoga" },
  { value: "SOCIETY_HALL", label: "Society Hall" },
  { value: "OTHER", label: "Other" },
] as const;

export const FACILITY_VALUES = ["GYM", "SWIMMING_POOL", "YOGA", "SOCIETY_HALL", "OTHER"] as const;

export const createEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  facility: z.enum(FACILITY_VALUES, { required_error: "Facility is required" }),
  event_date: z.string().min(1, "Event date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  attendees: z.coerce.number().int().positive("Attendees must be a positive number"),
  description: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
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
  facility: z.enum(FACILITY_VALUES).optional(),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  attendees: z.coerce.number().int().positive().optional(),
  description: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const rejectEventSchema = z.object({
  reason: z.string().optional().or(z.literal("")),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type RejectEventInput = z.infer<typeof rejectEventSchema>;
