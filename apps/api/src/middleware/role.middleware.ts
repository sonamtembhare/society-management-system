import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "Access denied. Not authenticated.");
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 403, "Access denied. Insufficient permissions.");
      return;
    }

    next();
  };
};
