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
    return [];
  }
  return visitorModel.findByResidentId(resident.id);
};

export const getTodayVisitors = async () => {
  return visitorModel.findTodayVisitors();
};

export const getStats = async () => {
  return visitorModel.countByStatus();
};

export const getById = async (id: number, userId: number, role: string) => {
  const visitor = await visitorModel.findById(id);
  if (!visitor) {
    throw new AppError("Visitor not found", 404);
  }
  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || visitor.resident_id !== resident.id) {
      throw new AppError("Visitor not found", 404);
    }
  }
  return visitor;
};

export const create = async (data: CreateVisitorInput, userId: number, role: string) => {
  let residentId: number;
  let flatId: number;

  if (role === "SECURITY") {
    if (!data.resident_id || !data.flat_id) {
      throw new AppError("Resident and flat are required for walk-in visitors", 400);
    }
    residentId = data.resident_id;
    flatId = data.flat_id;
  } else {
    const resident = await residentModel.findByUserId(userId);
    if (!resident) {
      throw new AppError("Resident profile not found", 404);
    }
    residentId = resident.id;
    flatId = resident.flat_id;
  }

  return visitorModel.create({
    resident_id: residentId,
    flat_id: flatId,
    visitor_name: data.visitor_name,
    visitor_phone: data.visitor_phone,
    purpose: data.purpose ?? null,
    vehicle_number: data.vehicle_number ?? null,
    status: role === "SECURITY" ? "CHECKED_IN" : "EXPECTED",
    visitor_type: data.visitor_type ?? "GUEST",
    expected_date: data.expected_date ?? null,
    expected_time: data.expected_time ?? null,
    notes: data.notes ?? null,
    created_by: userId,
  });
};

export const cancel = async (id: number, userId: number) => {
  const visitor = await visitorModel.findById(id);
  if (!visitor) {
    throw new AppError("Visitor not found", 404);
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident || visitor.resident_id !== resident.id) {
    throw new AppError("Visitor not found", 404);
  }
  if (visitor.status !== "EXPECTED") {
    throw new AppError("Only expected visitors can be cancelled", 400);
  }
  return visitorModel.update(id, { status: "CANCELLED" });
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
  if (!["EXPECTED", "APPROVED", "PENDING"].includes(existing.status)) {
    throw new AppError("Visitor cannot be checked in", 400);
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
        return checkIn(id);
      }
      if (data.status === "CHECKED_OUT") {
        return checkOut(id);
      }
      throw new AppError("Security can only manage check-in/check-out", 403);
    }
    updateData["status"] = data.status;
  }

  return visitorModel.update(id, updateData);
};
