import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Parse a CSV buffer into an array of row objects.
 * Uses papaparse with header mode — first row becomes keys.
 * All values are kept as strings (no type coercion).
 */
export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  const csvString = buffer.toString("utf-8");

  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: "greedy", // skip lines that are empty or whitespace-only
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  if (result.errors.length > 0) {
    // Filter out only fatal errors (row-level warnings are common in messy CSVs)
    const fatalErrors = result.errors.filter(
      (e: Papa.ParseError) => e.type === "Delimiter" || e.type === "FieldMismatch"
    );
    if (fatalErrors.length > 0 && result.data.length === 0) {
      throw new Error(
        `CSV parsing failed: ${fatalErrors.map((e: Papa.ParseError) => e.message).join("; ")}`
      );
    }
  }

  const headers = result.meta.fields || [];

  return {
    headers,
    rows: result.data,
    totalRows: result.data.length,
  };
}
