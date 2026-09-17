import * as flatModel from "../models/flat.model";
import { AppError } from "../middleware/error.middleware";
import { CreateFlatInput, UpdateFlatInput } from "../validators/flat.validator";

export const getAll = async () => {
  return flatModel.findAll();
};

export const getById = async (id: number) => {
  const flat = await flatModel.findById(id);
  if (!flat) {
    throw new AppError("Flat not found", 404);
  }
  return flat;
};

export const getBySocietyId = async (societyId: number) => {
  return flatModel.findBySocietyId(societyId);
};

export const create = async (data: CreateFlatInput) => {
  return flatModel.create({
    society_id: data.society_id,
    flat_number: data.flat_number,
    block: data.block ?? null,
    floor: data.floor ?? null,
    type: data.type ?? null,
  });
};

export const update = async (id: number, data: UpdateFlatInput) => {
  const existing = await flatModel.findById(id);
  if (!existing) {
    throw new AppError("Flat not found", 404);
  }
  const updateData: Record<string, unknown> = {};
  if (data.society_id !== undefined) updateData["society_id"] = data.society_id;
  if (data.flat_number !== undefined) updateData["flat_number"] = data.flat_number;
  if (data.block !== undefined) updateData["block"] = data.block ?? null;
  if (data.floor !== undefined) updateData["floor"] = data.floor ?? null;
  if (data.type !== undefined) updateData["type"] = data.type ?? null;
  return flatModel.update(id, updateData);
};

export const remove = async (id: number) => {
  const existing = await flatModel.findById(id);
  if (!existing) {
    throw new AppError("Flat not found", 404);
  }
  await flatModel.remove(id);
};
