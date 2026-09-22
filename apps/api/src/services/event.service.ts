import * as eventModel from "../models/event.model";
import * as residentModel from "../models/resident.model";
import * as flatModel from "../models/flat.model";
import { AppError } from "../middleware/error.middleware";
import { CreateEventInput, UpdateEventInput } from "../validators/event.validator";

export const getAll = async () => {
  return eventModel.findAll();
};

export const getAllWithDetails = async (societyId: number) => {
  return eventModel.findBySocietyIdWithDetails(societyId);
};

export const getById = async (id: number) => {
  const event = await eventModel.findById(id);
  if (!event) {
    throw new AppError("Event not found", 404);
  }
  return event;
};

export const getByResidentId = async (userId: number) => {
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return eventModel.findByResidentId(resident.id);
};

export const create = async (data: CreateEventInput, createdBy: number) => {
  const resident = await residentModel.findByUserId(createdBy);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }

  const flat = await flatModel.findById(resident.flat_id);
  if (!flat) {
    throw new AppError("Flat not found", 404);
  }

  const conflicts = await eventModel.findByFacilityAndDate(
    data.facility,
    data.event_date,
    data.start_time,
    data.end_time
  );

  if (conflicts.length > 0) {
    throw new AppError("Selected facility is already booked for this time slot", 409);
  }

  return eventModel.create({
    society_id: flat.society_id,
    title: data.title,
    description: data.description ?? null,
    event_date: new Date(data.event_date),
    end_date: null,
    location: data.location ?? null,
    created_by: createdBy,
    facility: data.facility,
    start_time: data.start_time,
    end_time: data.end_time,
    attendees: data.attendees,
    status: "PENDING",
    resident_id: resident.id,
    notes: data.notes ?? null,
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
  });
};

export const update = async (id: number, data: UpdateEventInput) => {
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw new AppError("Event not found", 404);
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData["title"] = data.title;
  if (data.description !== undefined) updateData["description"] = data.description ?? null;
  if (data.event_date !== undefined) updateData["event_date"] = new Date(data.event_date);
  if (data.location !== undefined) updateData["location"] = data.location ?? null;
  if (data.facility !== undefined) updateData["facility"] = data.facility;
  if (data.start_time !== undefined) updateData["start_time"] = data.start_time;
  if (data.end_time !== undefined) updateData["end_time"] = data.end_time;
  if (data.attendees !== undefined) updateData["attendees"] = data.attendees;
  if (data.notes !== undefined) updateData["notes"] = data.notes ?? null;

  const checkFacility = data.facility || existing.facility;
  const checkDate = data.event_date || existing.event_date;
  const checkStart = data.start_time || existing.start_time;
  const checkEnd = data.end_time || existing.end_time;

  if (data.start_time || data.end_time || data.event_date || data.facility) {
    const conflicts = await eventModel.findByFacilityAndDate(
      checkFacility,
      typeof checkDate === "string" ? checkDate : checkDate.toISOString(),
      checkStart!,
      checkEnd!,
      id
    );
    if (conflicts.length > 0) {
      throw new AppError("Selected facility is already booked for this time slot", 409);
    }
  }

  return eventModel.update(id, updateData);
};

export const approve = async (id: number, approvedBy: number) => {
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw new AppError("Event not found", 404);
  }
  if (existing.status !== "PENDING") {
    throw new AppError("Only pending events can be approved", 400);
  }
  return eventModel.update(id, {
    status: "APPROVED",
    approved_by: approvedBy,
    approved_at: new Date(),
  });
};

export const reject = async (id: number, reason?: string) => {
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw new AppError("Event not found", 404);
  }
  if (existing.status !== "PENDING") {
    throw new AppError("Only pending events can be rejected", 400);
  }
  return eventModel.update(id, {
    status: "REJECTED",
    rejection_reason: reason ?? null,
  });
};

export const cancel = async (id: number, userId: number) => {
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw new AppError("Event not found", 404);
  }

  const resident = await residentModel.findByUserId(userId);
  if (!resident || existing.resident_id !== resident.id) {
    throw new AppError("You can only cancel your own events", 403);
  }

  if (existing.status !== "PENDING" && existing.status !== "APPROVED") {
    throw new AppError("Only pending or approved events can be cancelled", 400);
  }

  return eventModel.update(id, { status: "CANCELLED" });
};

export const remove = async (id: number) => {
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw new AppError("Event not found", 404);
  }
  await eventModel.remove(id);
};
