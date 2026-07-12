"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCsvBuffer = parseCsvBuffer;
const papaparse_1 = __importDefault(require("papaparse"));
/**
 * Parse a CSV buffer into an array of row objects.
 * Uses papaparse with header mode — first row becomes keys.
 * All values are kept as strings (no type coercion).
 */
function parseCsvBuffer(buffer) {
    const csvString = buffer.toString("utf-8");
    const result = papaparse_1.default.parse(csvString, {
        header: true,
        skipEmptyLines: "greedy", // skip lines that are empty or whitespace-only
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
    });
    if (result.errors.length > 0) {
        // Filter out only fatal errors (row-level warnings are common in messy CSVs)
        const fatalErrors = result.errors.filter((e) => e.type === "Delimiter" || e.type === "FieldMismatch");
        if (fatalErrors.length > 0 && result.data.length === 0) {
            throw new Error(`CSV parsing failed: ${fatalErrors.map((e) => e.message).join("; ")}`);
        }
    }
    const headers = result.meta.fields || [];
    return {
        headers,
        rows: result.data,
        totalRows: result.data.length,
    };
}
//# sourceMappingURL=csvParser.service.js.map