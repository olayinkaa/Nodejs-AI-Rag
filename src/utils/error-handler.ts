import type { Request, Response, NextFunction } from "express";
import { HttpException } from "../exceptions/index.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof HttpException) {
    return res.status(err.status).json({
      code: err.status,
      status: "error",
      message: err.message,
      data: err.data || undefined,
    });
  }

  console.error(err);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
