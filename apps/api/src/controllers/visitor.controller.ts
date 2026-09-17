import { Request, Response, NextFunction } from "express";
import * as visitorService from "../services/visitor.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const visitors = await visitorService.getAll(req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Visitors retrieved", visitors);
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
    const visitor = await visitorService.getById(id);
    sendSuccess(res, 200, "Visitor retrieved", visitor);
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
    const visitor = await visitorService.create(req.body);
    sendSuccess(res, 201, "Visitor created", visitor);
  } catch (error) {
    next(error);
  }
};

export const approve = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const visitor = await visitorService.approve(id, req.user!.id);
    sendSuccess(res, 200, "Visitor approved", visitor);
  } catch (error) {
    next(error);
  }
};

export const reject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const visitor = await visitorService.reject(id);
    sendSuccess(res, 200, "Visitor rejected", visitor);
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const visitor = await visitorService.checkIn(id);
    sendSuccess(res, 200, "Visitor checked in", visitor);
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const visitor = await visitorService.checkOut(id);
    sendSuccess(res, 200, "Visitor checked out", visitor);
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
    const visitor = await visitorService.update(id, req.body, req.user!.role);
    sendSuccess(res, 200, "Visitor updated", visitor);
  } catch (error) {
    next(error);
  }
};
