import type { AuthenticatedRequest } from "@/types/base";
import type { NextFunction, Response } from "express";

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const accessToken = req.cookies?.["access_token"];
    if (!accessToken) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    // decoded
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthenticated user info",
    });
  }
}
