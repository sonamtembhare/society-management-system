import { Request, Response, NextFunction } from "express";
import * as residentService from "../services/resident.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const residents = await residentService.getAll(req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Residents retrieved", residents);
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
    const resident = await residentService.getById(id, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Resident retrieved", resident);
  } catch (error) {
    next(error);
  }
};

export const getOwnProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resident = await residentService.getOwnProfile(req.user!.id);
    sendSuccess(res, 200, "Resident profile retrieved", resident);
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
    const resident = await residentService.create(req.body);
    sendSuccess(res, 201, "Resident created", resident);
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
    const resident = await residentService.update(
      id,
      req.body,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, 200, "Resident updated", resident);
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
    await residentService.remove(id);
    sendSuccess(res, 200, "Resident deleted");
  } catch (error) {
    next(error);
  }
};
