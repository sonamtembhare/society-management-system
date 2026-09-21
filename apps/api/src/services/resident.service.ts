import * as residentModel from "../models/resident.model";
import * as maintenanceModel from "../models/maintenance.model";
import * as flatModel from "../models/flat.model";
import * as settingsService from "./settings.service";
import { AppError } from "../middleware/error.middleware";
import { CreateResidentInput, UpdateResidentInput } from "../validators/resident.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return residentModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return [resident];
};

export const getById = async (id: number, userId: number, role: string) => {
  const resident = await residentModel.findDetailsById(id);
  if (!resident) {
    throw new AppError("Resident not found", 404);
  }

  if (role === "RESIDENT") {
    const ownResident = await residentModel.findByUserId(userId);
    if (!ownResident || ownResident.id !== id) {
      throw new AppError("Access denied", 403);
    }
  }

  return resident;
};

export const getOwnProfile = async (userId: number) => {
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return residentModel.findDetailsById(resident.id);
};

export const create = async (data: CreateResidentInput) => {
  const existing = await residentModel.findByUserId(data.user_id);
  if (existing) {
    throw new AppError("User already has a resident profile", 409);
  }
  const resident = await residentModel.create({
    user_id: data.user_id,
    flat_id: data.flat_id,
    phone: data.phone ?? null,
    emergency_contact: data.emergency_contact ?? null,
    moving_date: data.moving_date ? new Date(data.moving_date) : null,
  });

  const now = new Date();
  const appSettings = await settingsService.getAppSettings();
  const billingMonth = now.getMonth() + 1;
  const billingYear = now.getFullYear();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), appSettings.dueDay);
  if (dueDate <= now) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  const flat = await flatModel.findById(data.flat_id);
  const maintenanceAmount = appSettings.rates[flat?.type ?? ""] ?? 0;

  const lateFee = now > dueDate ? appSettings.lateFee : 0;

  await maintenanceModel.create({
    flat_id: data.flat_id,
    resident_id: resident.id,
    billing_month: billingMonth,
    billing_year: billingYear,
    maintenance_amount: maintenanceAmount,
    additional_charges: 0,
    late_fee: lateFee,
    total_amount: maintenanceAmount + lateFee,
    due_date: dueDate,
    status: "UNPAID",
    description: "Monthly maintenance charges",
  });

  return resident;
};

export const update = async (
  id: number,
  data: UpdateResidentInput,
  userId: number,
  role: string
) => {
  const existing = await residentModel.findById(id);
  if (!existing) {
    throw new AppError("Resident not found", 404);
  }

  if (role === "RESIDENT" && existing.user_id !== userId) {
    throw new AppError("Access denied", 403);
  }

  const updateData: Record<string, unknown> = {};
  if (data.user_id !== undefined) updateData["user_id"] = data.user_id;
  if (data.flat_id !== undefined) updateData["flat_id"] = data.flat_id;
  if (data.phone !== undefined) updateData["phone"] = data.phone ?? null;
  if (data.emergency_contact !== undefined) updateData["emergency_contact"] = data.emergency_contact ?? null;
  if (data.moving_date !== undefined) updateData["moving_date"] = data.moving_date ? new Date(data.moving_date) : null;

  return residentModel.update(id, updateData);
};

export const remove = async (id: number) => {
  const existing = await residentModel.findById(id);
  if (!existing) {
    throw new AppError("Resident not found", 404);
  }
  await residentModel.remove(id);
};
