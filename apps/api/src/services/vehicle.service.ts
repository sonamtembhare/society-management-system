import * as vehicleModel from "../models/vehicle.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreateVehicleInput, UpdateVehicleInput } from "../validators/vehicle.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return vehicleModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return vehicleModel.findByResidentId(resident.id);
};

export const getById = async (id: number, userId: number, role: string) => {
  const vehicle = await vehicleModel.findById(id);
  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== vehicle.resident_id) {
      throw new AppError("Access denied", 403);
    }
  }

  return vehicle;
};

export const create = async (data: CreateVehicleInput, userId: number) => {
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return vehicleModel.create({
    resident_id: resident.id,
    vehicle_number: data.vehicle_number,
    vehicle_type: data.vehicle_type,
    brand: data.brand ?? null,
    model: data.model ?? null,
    color: data.color ?? null,
  });
};

export const update = async (id: number, data: UpdateVehicleInput, userId: number, role: string) => {
  const existing = await vehicleModel.findById(id);
  if (!existing) {
    throw new AppError("Vehicle not found", 404);
  }

  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== existing.resident_id) {
      throw new AppError("Access denied", 403);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.vehicle_number !== undefined) updateData["vehicle_number"] = data.vehicle_number;
  if (data.vehicle_type !== undefined) updateData["vehicle_type"] = data.vehicle_type;
  if (data.brand !== undefined) updateData["brand"] = data.brand ?? null;
  if (data.model !== undefined) updateData["model"] = data.model ?? null;
  if (data.color !== undefined) updateData["color"] = data.color ?? null;

  return vehicleModel.update(id, updateData);
};

export const remove = async (id: number, userId: number, role: string) => {
  const existing = await vehicleModel.findById(id);
  if (!existing) {
    throw new AppError("Vehicle not found", 404);
  }

  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== existing.resident_id) {
      throw new AppError("Access denied", 403);
    }
  }

  await vehicleModel.remove(id);
};
