import { Request, Response, NextFunction } from "express";
import * as maintenanceService from "../services/maintenance.service";
import * as reminderService from "../services/reminder.service";
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
    const bill = await maintenanceService.getById(id, req.user!.id, req.user!.role);
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
    const results = await maintenanceService.create(req.body, req.user!.id);
    sendSuccess(res, 201, "Maintenance bills processed", results);
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

export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const bill = await maintenanceService.cancel(id);
    sendSuccess(res, 200, "Maintenance bill cancelled", bill);
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billId = Number(req.params["id"]);
    const payments = await maintenanceService.getPaymentHistory(billId, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Payment history retrieved", payments);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await maintenanceService.getStats();
    sendSuccess(res, 200, "Stats retrieved", stats);
  } catch (error) {
    next(error);
  }
};

export const generateLastMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await maintenanceService.generateLastMonthBills();
    sendSuccess(res, 201, "Last month maintenance bills generated successfully", result);
  } catch (error) {
    next(error);
  }
};

export const sendReminders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reminderService.sendPaymentReminders(req.user!.id);
    sendSuccess(res, 200, "Payment reminders processed", result);
  } catch (error) {
    next(error);
  }
};
