import * as complaintModel from "../models/complaint.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreateComplaintInput, UpdateComplaintInput } from "../validators/complaint.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return complaintModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return complaintModel.findByResidentId(resident.id);
};

export const getById = async (id: number, userId: number, role: string) => {
  const complaint = await complaintModel.findById(id);
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== complaint.resident_id) {
      throw new AppError("Access denied", 403);
    }
  }

  return complaint;
};

export const create = async (data: CreateComplaintInput, userId: number) => {
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
  }
  return complaintModel.create({
    resident_id: resident.id,
    title: data.title,
    description: data.description,
    category: data.category ?? null,
    status: "PENDING",
  });
};

export const update = async (id: number, data: UpdateComplaintInput, userId: number, role: string) => {
  const existing = await complaintModel.findById(id);
  if (!existing) {
    throw new AppError("Complaint not found", 404);
  }

  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== existing.resident_id) {
      throw new AppError("Access denied", 403);
    }
    const { status, ...rest } = data;
    void status;
    const updateData: Record<string, unknown> = {};
    if (rest.title !== undefined) updateData["title"] = rest.title;
    if (rest.description !== undefined) updateData["description"] = rest.description;
    if (rest.category !== undefined) updateData["category"] = rest.category ?? null;
    return complaintModel.update(id, updateData);
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData["title"] = data.title;
  if (data.description !== undefined) updateData["description"] = data.description;
  if (data.category !== undefined) updateData["category"] = data.category ?? null;
  if (data.status !== undefined) {
    updateData["status"] = data.status;
    if (data.status === "RESOLVED" || data.status === "REJECTED") {
      updateData["resolved_at"] = new Date();
    }
  }
  return complaintModel.update(id, updateData);
};

export const remove = async (id: number) => {
  const existing = await complaintModel.findById(id);
  if (!existing) {
    throw new AppError("Complaint not found", 404);
  }
  await complaintModel.remove(id);
};
