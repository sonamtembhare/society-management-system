import { v2 as cloudinary } from "cloudinary";
import * as complaintModel from "../models/complaint.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreateComplaintInput, UpdateComplaintInput } from "../validators/complaint.validator";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return complaintModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    return [];
  }
  return complaintModel.findByResidentId(resident.id);
};

export const getByResidentId = async (residentId: number, userId: number, role: string) => {
  if (role === "RESIDENT") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== residentId) {
      throw new AppError("Access denied", 403);
    }
  }
  return complaintModel.findByResidentId(residentId);
};

export const getById = async (id: number, userId: number, role: string) => {
  if (role === "ADMIN") {
    const complaint = await complaintModel.findByIdWithDetails(id);
    if (!complaint) {
      throw new AppError("Complaint not found", 404);
    }
    return complaint;
  }

  const complaint = await complaintModel.findById(id);
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const resident = await residentModel.findByUserId(userId);
  if (!resident || resident.id !== complaint.resident_id) {
    throw new AppError("Access denied", 403);
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
    priority: data.priority || "NORMAL",
    images: data.images || [],
    video_url: data.video_url ?? null,
    video_type: data.video_type ?? null,
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
    if (rest.priority !== undefined) updateData["priority"] = rest.priority;
    if (rest.images !== undefined) updateData["images"] = rest.images;
    if (rest.video_url !== undefined) updateData["video_url"] = rest.video_url ?? null;
    if (rest.video_type !== undefined) updateData["video_type"] = rest.video_type ?? null;
    return complaintModel.update(id, updateData);
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData["title"] = data.title;
  if (data.description !== undefined) updateData["description"] = data.description;
  if (data.category !== undefined) updateData["category"] = data.category ?? null;
  if (data.priority !== undefined) updateData["priority"] = data.priority;
  if (data.images !== undefined) updateData["images"] = data.images;
  if (data.video_url !== undefined) updateData["video_url"] = data.video_url ?? null;
  if (data.video_type !== undefined) updateData["video_type"] = data.video_type ?? null;
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
  if (existing.images && existing.images.length > 0) {
    for (const url of existing.images) {
      const parts = url.split("/");
      const folderAndFile = parts.slice(parts.indexOf("society-complaints")).join("/");
      const publicId = folderAndFile.replace(/\.[^.]+$/, "");
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // ignore cleanup errors
      }
    }
  }
  if (existing.video_url) {
    const parts = existing.video_url.split("/");
    const folderAndFile = parts.slice(parts.indexOf("society-complaints")).join("/");
    const publicId = folderAndFile.replace(/\.[^.]+$/, "");
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    } catch {
      // ignore cleanup errors
    }
  }
  await complaintModel.remove(id);
};
