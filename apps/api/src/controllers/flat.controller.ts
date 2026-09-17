import { Request, Response, NextFunction } from "express";
import * as flatService from "../services/flat.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const flats = await flatService.getAll();
    sendSuccess(res, 200, "Flats retrieved", flats);
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
    const flat = await flatService.getById(id);
    sendSuccess(res, 200, "Flat retrieved", flat);
  } catch (error) {
    next(error);
  }
};

export const getBySocietyId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = Number(req.params["societyId"]);
    const flats = await flatService.getBySocietyId(societyId);
    sendSuccess(res, 200, "Flats retrieved", flats);
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
    const flat = await flatService.create(req.body);
    sendSuccess(res, 201, "Flat created", flat);
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
    const flat = await flatService.update(id, req.body);
    sendSuccess(res, 200, "Flat updated", flat);
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
    await flatService.remove(id);
    sendSuccess(res, 200, "Flat deleted");
  } catch (error) {
    next(error);
  }
};
