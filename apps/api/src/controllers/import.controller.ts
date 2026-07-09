import { Request, Response } from "express";
import { parseCsvBuffer } from "../services/csvParser.service";

/**
 * POST /api/import
 * Phase 2: Parse CSV and echo back the parsed rows.
 * Phase 4+ will add AI mapping and validation.
 */
export async function importCsv(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded. Please attach a CSV file.",
        code: "NO_FILE",
      });
      return;
    }

    // Parse the CSV
    const parsed = parseCsvBuffer(file.buffer);

    if (parsed.totalRows === 0) {
      res.status(400).json({
        success: false,
        error: "The CSV file is empty or contains only headers.",
        code: "EMPTY_CSV",
      });
      return;
    }

    // Phase 2: echo parsed rows without AI mapping
    res.json({
      success: true,
      message: "CSV parsed successfully (AI mapping not yet applied)",
      data: {
        filename: file.originalname,
        fileSize: file.size,
        totalRows: parsed.totalRows,
        headers: parsed.headers,
        rows: parsed.rows,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse CSV";
    res.status(400).json({
      success: false,
      error: message,
      code: "PARSE_ERROR",
    });
  }
}
