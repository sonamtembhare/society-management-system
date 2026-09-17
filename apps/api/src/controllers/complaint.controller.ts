import { Request, Response, NextFunction } from "express";
import * as complaintService from "../services/complaint.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const complaints = await complaintService.getAll(req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Complaints retrieved", complaints);
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const complaint = await complaintService.getById(id, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Complaint retrieved", complaint);
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const complaint = await complaintService.create(req.body, req.user!.id);
    sendSuccess(res, 201, "Complaint created", complaint);
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const complaint = await complaintService.update(id, req.body, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Complaint updated", complaint);
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    await complaintService.remove(id);
    sendSuccess(res, 200, "Complaint deleted");
  } catch (error) {
    next(error);
  }
};
