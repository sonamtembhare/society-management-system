import { Request, Response, NextFunction } from "express";
import * as noticeService from "../services/notice.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notices = await noticeService.getAll(req.user!.role);
    sendSuccess(res, 200, "Notices retrieved", notices);
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
    const notice = await noticeService.getById(id);
    sendSuccess(res, 200, "Notice retrieved", notice);
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
    const notice = await noticeService.create(req.body, req.user!.id);
    sendSuccess(res, 201, "Notice created", notice);
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
    const notice = await noticeService.update(id, req.body);
    sendSuccess(res, 200, "Notice updated", notice);
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
    await noticeService.remove(id);
    sendSuccess(res, 200, "Notice deleted");
  } catch (error) {
    next(error);
  }
};
