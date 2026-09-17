import * as visitorModel from "../models/visitor.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreateVisitorInput, UpdateVisitorInput } from "../validators/visitor.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN" || role === "SECURITY") {
    return visitorModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return visitorModel.findByResidentId(resident.id);
};

export const getById = async (id: number) => {
  const visitor = await visitorModel.findById(id);
  if (!visitor) {
    throw new AppError("Visitor not found", 404);
  }
  return visitor;
};

export const create = async (data: CreateVisitorInput) => {
  return visitorModel.create({
    resident_id: data.resident_id,
    flat_id: data.flat_id,
    visitor_name: data.visitor_name,
    visitor_phone: data.visitor_phone,
    purpose: data.purpose ?? null,
    vehicle_number: data.vehicle_number ?? null,
    status: "PENDING",
  });
};

export const approve = async (id: number, approvedBy: number) => {
  const existing = await visitorModel.findById(id);
  if (!existing) {
    throw new AppError("Visitor not found", 404);
  }
  if (existing.status !== "PENDING") {
    throw new AppError("Visitor is not pending approval", 400);
  }
  return visitorModel.update(id, {
    status: "APPROVED",
    approved_by: approvedBy,
  });
};

export const reject = async (id: number) => {
  const existing = await visitorModel.findById(id);
  if (!existing) {
    throw new AppError("Visitor not found", 404);
  }
  if (existing.status !== "PENDING") {
    throw new AppError("Visitor is not pending approval", 400);
  }
  return visitorModel.update(id, { status: "REJECTED" });
};

export const checkIn = async (id: number) => {
  const existing = await visitorModel.findById(id);
  if (!existing) {
    throw new AppError("Visitor not found", 404);
  }
  if (existing.status !== "APPROVED") {
    throw new AppError("Visitor must be approved before check-in", 400);
  }
  return visitorModel.update(id, {
    status: "CHECKED_IN",
    check_in_time: new Date(),
  });
};

export const checkOut = async (id: number) => {
  const existing = await visitorModel.findById(id);
  if (!existing) {
    throw new AppError("Visitor not found", 404);
  }
  if (existing.status !== "CHECKED_IN") {
    throw new AppError("Visitor is not checked in", 400);
  }
  return visitorModel.update(id, {
    status: "CHECKED_OUT",
    check_out_time: new Date(),
  });
};

export const update = async (id: number, data: UpdateVisitorInput, role: string) => {
  const existing = await visitorModel.findById(id);
  if (!existing) {
    throw new AppError("Visitor not found", 404);
  }

  const updateData: Record<string, unknown> = {};
  if (data.purpose !== undefined) updateData["purpose"] = data.purpose ?? null;
  if (data.vehicle_number !== undefined) updateData["vehicle_number"] = data.vehicle_number ?? null;

  if (data.status !== undefined) {
    if (role === "SECURITY") {
      if (data.status === "CHECKED_IN") {
        return thisCheckIn(id);
      }
      if (data.status === "CHECKED_OUT") {
        return thisCheckOut(id);
      }
      throw new AppError("Security can only manage check-in/check-out", 403);
    }
    updateData["status"] = data.status;
  }

  return visitorModel.update(id, updateData);
};

const thisCheckIn = async (id: number) => {
  const existing = await visitorModel.findById(id);
  if (!existing) {
    throw new AppError("Visitor not found", 404);
  }
  if (existing.status !== "APPROVED") {
    throw new AppError("Visitor must be approved before check-in", 400);
  }
  return visitorModel.update(id, {
    status: "CHECKED_IN",
    check_in_time: new Date(),
  });
};

const thisCheckOut = async (id: number) => {
  const existing = await visitorModel.findById(id);
  if (!existing) {
    throw new AppError("Visitor not found", 404);
  }
  if (existing.status !== "CHECKED_IN") {
    throw new AppError("Visitor is not checked in", 400);
  }
  return visitorModel.update(id, {
    status: "CHECKED_OUT",
    check_out_time: new Date(),
  });
};
