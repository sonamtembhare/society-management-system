import { Request, Response, NextFunction } from "express";
import * as vehicleService from "../services/vehicle.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vehicles = await vehicleService.getAll(req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Vehicles retrieved", vehicles);
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
    const vehicle = await vehicleService.getById(id, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Vehicle retrieved", vehicle);
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
    const vehicle = await vehicleService.create(req.body, req.user!.id);
    sendSuccess(res, 201, "Vehicle created", vehicle);
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
    const vehicle = await vehicleService.update(id, req.body, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Vehicle updated", vehicle);
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
    await vehicleService.remove(id, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Vehicle deleted");
  } catch (error) {
    next(error);
  }
};
