import * as societyModel from "../models/society.model";
import { AppError } from "../middleware/error.middleware";
import { CreateSocietyInput, UpdateSocietyInput } from "../validators/society.validator";

export const getAll = async () => {
  return societyModel.findAll();
};

export const getById = async (id: number) => {
  const society = await societyModel.findById(id);
  if (!society) {
    throw new AppError("Society not found", 404);
  }
  return society;
};

export const create = async (data: CreateSocietyInput) => {
  return societyModel.create({
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    phone: data.phone ?? null,
    email: data.email ?? null,
  });
};

export const update = async (id: number, data: UpdateSocietyInput) => {
  const existing = await societyModel.findById(id);
  if (!existing) {
    throw new AppError("Society not found", 404);
  }
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData["name"] = data.name;
  if (data.address !== undefined) updateData["address"] = data.address;
  if (data.city !== undefined) updateData["city"] = data.city;
  if (data.state !== undefined) updateData["state"] = data.state;
  if (data.pincode !== undefined) updateData["pincode"] = data.pincode;
  if (data.phone !== undefined) updateData["phone"] = data.phone ?? null;
  if (data.email !== undefined) updateData["email"] = data.email ?? null;
  const updated = await societyModel.update(id, updateData);
  return updated;
};

export const remove = async (id: number) => {
  const existing = await societyModel.findById(id);
  if (!existing) {
    throw new AppError("Society not found", 404);
  }
  await societyModel.remove(id);
};
