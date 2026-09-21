import { Request, Response, NextFunction } from "express";
import * as settingsService from "../services/settings.service";
import { sendSuccess } from "../utils/response";

export const getAllSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.getAllSettings();
    sendSuccess(res, 200, "Settings retrieved", settings);
  } catch (error) {
    next(error);
  }
};

export const getAppSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.getAppSettings();
    sendSuccess(res, 200, "App settings retrieved", settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.updateSettings(req.body.settings);
    sendSuccess(res, 200, "Settings updated", settings);
  } catch (error) {
    next(error);
  }
};
