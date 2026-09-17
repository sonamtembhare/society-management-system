import * as maintenanceModel from "../models/maintenance.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreateMaintenanceInput, UpdateMaintenanceInput } from "../validators/maintenance.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return maintenanceModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return maintenanceModel.findByResidentId(resident.id);
};

export const getById = async (id: number) => {
  const bill = await maintenanceModel.findById(id);
  if (!bill) {
    throw new AppError("Maintenance bill not found", 404);
  }
  return bill;
};

export const create = async (data: CreateMaintenanceInput) => {
  return maintenanceModel.create({
    flat_id: data.flat_id,
    amount: data.amount,
    billing_period: data.billing_period,
    description: data.description ?? null,
    due_date: new Date(data.due_date),
    status: "PENDING",
  });
};

export const update = async (id: number, data: UpdateMaintenanceInput) => {
  const existing = await maintenanceModel.findById(id);
  if (!existing) {
    throw new AppError("Maintenance bill not found", 404);
  }
  const updateData: Record<string, unknown> = {};
  if (data.amount !== undefined) updateData["amount"] = data.amount;
  if (data.billing_period !== undefined) updateData["billing_period"] = data.billing_period;
  if (data.description !== undefined) updateData["description"] = data.description ?? null;
  if (data.due_date !== undefined) updateData["due_date"] = new Date(data.due_date);
  if (data.status !== undefined) updateData["status"] = data.status;
  return maintenanceModel.update(id, updateData);
};

export const remove = async (id: number) => {
  const existing = await maintenanceModel.findById(id);
  if (!existing) {
    throw new AppError("Maintenance bill not found", 404);
  }
  await maintenanceModel.remove(id);
};
