"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";

export type ImportStep = "upload" | "preview" | "uploading" | "done" | "error";

export interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface FileInfo {
  name: string;
  size: number;
  file: File;
}

export interface UseCsvImportReturn {
  step: ImportStep;
  fileInfo: FileInfo | null;
  csvData: CsvData | null;
  error: string | null;
  handleFile: (file: File) => void;
  reset: () => void;
}

/**
 * Client-side CSV import hook.
 * Handles file selection, client-side parsing (preview), and state management.
 * The actual server upload is handled separately in Phase 5.
 */
export function useCsvImport(): UseCsvImportReturn {
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    // Validate extension
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file");
      setStep("error");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds the 5MB limit");
      setStep("error");
      return;
    }

    setFileInfo({ name: file.name, size: file.size, file });
    setError(null);

    // Parse client-side with papaparse for preview
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];

        if (results.data.length === 0) {
          setError("The CSV file is empty or contains only headers");
          setStep("error");
          return;
        }

        setCsvData({
          headers,
          rows: results.data,
          totalRows: results.data.length,
        });
        setStep("preview");
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
        setStep("error");
      },
    });
  }, []);

  const reset = useCallback(() => {
    setStep("upload");
    setFileInfo(null);
    setCsvData(null);
    setError(null);
  }, []);

  return { step, fileInfo, csvData, error, handleFile, reset };
}
