import { Request, Response, NextFunction } from "express";
import * as eventService from "../services/event.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = await eventService.getAll();
    sendSuccess(res, 200, "Events retrieved", events);
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
    const event = await eventService.getById(id);
    sendSuccess(res, 200, "Event retrieved", event);
  } catch (error) {
    next(error);
  }
};

export const getByResident = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = await eventService.getByResidentId(req.user!.id);
    sendSuccess(res, 200, "Events retrieved", events);
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
    const event = await eventService.create(req.body, req.user!.id);
    sendSuccess(res, 201, "Event created successfully", event);
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
    const event = await eventService.update(id, req.body);
    sendSuccess(res, 200, "Event updated", event);
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
    const event = await eventService.approve(id, req.user!.id);
    sendSuccess(res, 200, "Event approved successfully", event);
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
    const event = await eventService.reject(id, req.body.reason);
    sendSuccess(res, 200, "Event rejected successfully", event);
  } catch (error) {
    next(error);
  }
};

export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const event = await eventService.cancel(id, req.user!.id);
    sendSuccess(res, 200, "Event cancelled successfully", event);
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
    await eventService.remove(id);
    sendSuccess(res, 200, "Event deleted");
  } catch (error) {
    next(error);
  }
};
