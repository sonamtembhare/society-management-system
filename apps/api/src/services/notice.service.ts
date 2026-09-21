import * as noticeModel from "../models/notice.model";
import { AppError } from "../middleware/error.middleware";
import { CreateNoticeInput, UpdateNoticeInput } from "../validators/notice.validator";

export const getAll = async (role: string) => {
  if (role === "ADMIN") {
    return noticeModel.findAllForAdmin();
  }
  return noticeModel.findAll();
};

export const getById = async (id: number) => {
  const notice = await noticeModel.findById(id);
  if (!notice) {
    throw new AppError("Notice not found", 404);
  }
  return notice;
};

export const getBySocietyId = async (societyId: number) => {
  return noticeModel.findBySocietyId(societyId);
};

export const create = async (data: CreateNoticeInput, createdBy: number) => {
  return noticeModel.create({
    society_id: data.society_id,
    title: data.title,
    content: data.content,
    priority: data.priority ?? "NORMAL",
    notice_type: data.notice_type ?? "GENERAL",
    created_by: createdBy,
    expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
  });
};

export const update = async (id: number, data: UpdateNoticeInput) => {
  const existing = await noticeModel.findById(id);
  if (!existing) {
    throw new AppError("Notice not found", 404);
  }
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData["title"] = data.title;
  if (data.content !== undefined) updateData["content"] = data.content;
  if (data.priority !== undefined) updateData["priority"] = data.priority;
  if (data.notice_type !== undefined) updateData["notice_type"] = data.notice_type;
  if (data.is_active !== undefined) updateData["is_active"] = data.is_active;
  if (data.expiry_date !== undefined) updateData["expiry_date"] = data.expiry_date ? new Date(data.expiry_date) : null;
  return noticeModel.update(id, updateData);
};

export const remove = async (id: number) => {
  const existing = await noticeModel.findById(id);
  if (!existing) {
    throw new AppError("Notice not found", 404);
  }
  await noticeModel.remove(id);
};
