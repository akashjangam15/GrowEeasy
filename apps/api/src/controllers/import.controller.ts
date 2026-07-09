import { Request, Response } from "express";
import { parseCsvBuffer } from "../services/csvParser.service";
import { mapRowsWithAi } from "../services/aiMapper.service";
import { validateRecords } from "../services/validator.service";
import type { ImportResponse } from "shared-types";

/**
 * POST /api/import
 *
 * Full pipeline:
 * 1. Parse CSV buffer → raw rows
 * 2. AI mapper → map raw columns to CRM schema (batched, with retry)
 * 3. Validator → enforce business rules, split into parsed/skipped
 * 4. Return ImportResponse
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

    // ── Step 1: Parse CSV ──────────────────────────────────
    const csvResult = parseCsvBuffer(file.buffer);

    if (csvResult.totalRows === 0) {
      res.status(400).json({
        success: false,
        error: "The CSV file is empty or contains only headers.",
        code: "EMPTY_CSV",
      });
      return;
    }

    console.log(
      `[import] Parsed ${csvResult.totalRows} rows with headers: ${csvResult.headers.join(", ")}`
    );

    // ── Step 2: AI Mapping ─────────────────────────────────
    const aiResult = await mapRowsWithAi(csvResult.rows);

    console.log(
      `[import] AI mapped ${aiResult.mapped.length} rows, ${aiResult.skipped.length} skipped by AI`
    );

    // ── Step 3: Validate ───────────────────────────────────
    const validationResult = validateRecords(aiResult.mapped, csvResult.rows);

    // Combine AI-skipped + validation-skipped
    const allSkipped = [...aiResult.skipped, ...validationResult.skipped];

    console.log(
      `[import] Validated: ${validationResult.parsed.length} imported, ${allSkipped.length} total skipped`
    );

    // ── Step 4: Respond ────────────────────────────────────
    const response: ImportResponse = {
      success: true,
      summary: {
        total_rows: csvResult.totalRows,
        total_imported: validationResult.parsed.length,
        total_skipped: allSkipped.length,
      },
      parsed: validationResult.parsed,
      skipped: allSkipped,
    };

    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process CSV";

    console.error("[import] Error:", message);

    // Check for missing API key specifically
    if (message.includes("ANTHROPIC_API_KEY")) {
      res.status(500).json({
        success: false,
        error: "AI service is not configured. Please set ANTHROPIC_API_KEY.",
        code: "AI_NOT_CONFIGURED",
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: message,
      code: "IMPORT_ERROR",
    });
  }
}
