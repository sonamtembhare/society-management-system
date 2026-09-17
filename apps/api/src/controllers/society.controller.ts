import { Request, Response, NextFunction } from "express";
import * as societyService from "../services/society.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societies = await societyService.getAll();
    sendSuccess(res, 200, "Societies retrieved", societies);
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
    const society = await societyService.getById(id);
    sendSuccess(res, 200, "Society retrieved", society);
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
    const society = await societyService.create(req.body);
    sendSuccess(res, 201, "Society created", society);
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
    const society = await societyService.update(id, req.body);
    sendSuccess(res, 200, "Society updated", society);
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
    await societyService.remove(id);
    sendSuccess(res, 200, "Society deleted");
  } catch (error) {
    next(error);
  }
};
