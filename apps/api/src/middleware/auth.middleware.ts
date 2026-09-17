import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { sendError } from "../utils/response";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, 401, "Access denied. No token provided.");
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    sendError(res, 401, "Invalid or expired token.");
  }
};
