import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".csv") {
    cb(new Error("Only .csv files are allowed"));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/**
 * Error handler specifically for multer errors (file too large, wrong type, etc.)
 */
export function handleMulterError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        error: "File size exceeds the 5MB limit",
        code: "FILE_TOO_LARGE",
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: err.message,
      code: "UPLOAD_ERROR",
    });
    return;
  }

  if (err.message === "Only .csv files are allowed") {
    res.status(400).json({
      success: false,
      error: err.message,
      code: "INVALID_FILE_TYPE",
    });
    return;
  }

  next(err);
}
