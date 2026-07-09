import { Request, Response, NextFunction } from "express";

/**
 * Global error handler — catches unhandled errors and returns a consistent JSON shape.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
    code: "INTERNAL_ERROR",
  });
}
