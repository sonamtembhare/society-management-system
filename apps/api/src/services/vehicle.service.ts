import * as vehicleModel from "../models/vehicle.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreateVehicleInput, UpdateVehicleInput } from "../validators/vehicle.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN" || role === "SECURITY") {
    return vehicleModel.findAllWithDetails();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    return [];
  }
  return vehicleModel.findByResidentIdWithDetails(resident.id);
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

export const create = async (data: CreateVehicleInput, userId: number, role: string) => {
  let residentId: number;
  let flatId: number | null;

  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident) {
      throw new AppError("Resident profile not found", 404);
    }
    residentId = resident.id;
    flatId = resident.flat_id;
  } else {
    if (!data.resident_id) {
      throw new AppError("Owner resident is required", 400);
    }
    const resident = await residentModel.findById(data.resident_id);
    if (!resident) {
      throw new AppError("Resident not found", 404);
    }
    residentId = resident.id;
    flatId = data.flat_id ?? resident.flat_id;
  }

  const existing = await vehicleModel.findByVehicleNumber(data.vehicle_number);
  if (existing) {
    throw new AppError("Vehicle number already registered", 409);
  }

  return vehicleModel.create({
    resident_id: residentId,
    flat_id: flatId,
    vehicle_number: data.vehicle_number,
    vehicle_type: data.vehicle_type,
    brand: data.brand ?? null,
    model: data.model ?? null,
    color: data.color ?? null,
    status: "ACTIVE",
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

  if (data.vehicle_number && data.vehicle_number !== existing.vehicle_number) {
    const duplicate = await vehicleModel.findByVehicleNumber(data.vehicle_number);
    if (duplicate) {
      throw new AppError("Vehicle number already registered", 409);
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

  await vehicleModel.deactivate(id);
};

export const search = async (query: string, userId: number, role: string) => {
  if (!query || query.trim().length === 0) {
    return role === "RESIDENT"
      ? await vehicleModel.findByResidentIdWithDetails(
          (await residentModel.findByUserId(userId))?.id ?? 0
        )
      : await vehicleModel.findAllWithDetails();
  }

  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident) return [];
    return vehicleModel.searchByQueryForResident(query, resident.id);
  }

  return vehicleModel.searchByQuery(query);
};

export const recordEntry = async (id: number) => {
  const existing = await vehicleModel.findById(id);
  if (!existing) {
    throw new AppError("Vehicle not found", 404);
  }
  return vehicleModel.recordEntry(id);
};

export const recordExit = async (id: number) => {
  const existing = await vehicleModel.findById(id);
  if (!existing) {
    throw new AppError("Vehicle not found", 404);
  }
  return vehicleModel.recordExit(id);
};

export const deactivate = async (id: number, userId: number, role: string) => {
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

  if (existing.status === "INACTIVE") {
    throw new AppError("Vehicle is already inactive", 400);
  }

  return vehicleModel.deactivate(id);
};
