import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/response";
import { RegisterInput, LoginInput } from "../validators/auth.validator";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.register(req.body as RegisterInput);
    sendSuccess(res, 201, "Registration successful", result);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(req.body as LoginInput);
    sendSuccess(res, 200, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, 200, "User profile retrieved", user);
  } catch (error) {
    next(error);
  }
};
