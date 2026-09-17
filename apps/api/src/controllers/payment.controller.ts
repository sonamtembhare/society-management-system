import { Request, Response, NextFunction } from "express";
import * as paymentService from "../services/payment.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payments = await paymentService.getAll(req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Payments retrieved", payments);
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
    const payment = await paymentService.getById(id);
    sendSuccess(res, 200, "Payment retrieved", payment);
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
    const payment = await paymentService.create(req.body);
    sendSuccess(res, 201, "Payment created", payment);
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
    const payment = await paymentService.update(id, req.body);
    sendSuccess(res, 200, "Payment updated", payment);
  } catch (error) {
    next(error);
  }
};
