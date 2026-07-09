import { Router } from "express";
import { upload, handleMulterError } from "../middleware/upload";
import { importCsv } from "../controllers/import.controller";

const router = Router();

// POST /api/import — upload a CSV file for processing
router.post(
  "/",
  upload.single("file"),
  handleMulterError as any, // error-handling middleware for multer
  importCsv as any
);

export default router;
