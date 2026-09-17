import * as eventModel from "../models/event.model";
import { AppError } from "../middleware/error.middleware";
import { CreateEventInput, UpdateEventInput } from "../validators/event.validator";

export const getAll = async () => {
  return eventModel.findAll();
};

export const getById = async (id: number) => {
  const event = await eventModel.findById(id);
  if (!event) {
    throw new AppError("Event not found", 404);
  }
  return event;
};

export const getBySocietyId = async (societyId: number) => {
  return eventModel.findBySocietyId(societyId);
};

export const create = async (data: CreateEventInput, createdBy: number) => {
  return eventModel.create({
    society_id: data.society_id,
    title: data.title,
    description: data.description ?? null,
    event_date: new Date(data.event_date),
    end_date: data.end_date ? new Date(data.end_date) : null,
    location: data.location ?? null,
    created_by: createdBy,
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
  if (data.end_date !== undefined) updateData["end_date"] = data.end_date ? new Date(data.end_date) : null;
  if (data.location !== undefined) updateData["location"] = data.location ?? null;
  return eventModel.update(id, updateData);
};

export const remove = async (id: number) => {
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw new AppError("Event not found", 404);
  }
  await eventModel.remove(id);
};
