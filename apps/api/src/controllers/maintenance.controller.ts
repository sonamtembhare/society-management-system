import { Request, Response, NextFunction } from "express";
import * as maintenanceService from "../services/maintenance.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bills = await maintenanceService.getAll(req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Maintenance bills retrieved", bills);
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
    const bill = await maintenanceService.getById(id);
    sendSuccess(res, 200, "Maintenance bill retrieved", bill);
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
    const bill = await maintenanceService.create(req.body);
    sendSuccess(res, 201, "Maintenance bill created", bill);
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
    const bill = await maintenanceService.update(id, req.body);
    sendSuccess(res, 200, "Maintenance bill updated", bill);
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
    await maintenanceService.remove(id);
    sendSuccess(res, 200, "Maintenance bill deleted");
  } catch (error) {
    next(error);
  }
};
