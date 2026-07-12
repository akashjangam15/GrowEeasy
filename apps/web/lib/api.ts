const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Import Response Types ────────────────────────────────
// Mirrors the backend ImportResponse from shared-types.
// Kept local to avoid adding shared-types as a web dependency.

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  row_index: number;
  reason: string;
  raw: Record<string, string>;
}

export interface ImportResponse {
  success: boolean;
  summary: {
    total_rows: number;
    total_imported: number;
    total_skipped: number;
  };
  parsed: CrmRecord[];
  skipped: SkippedRecord[];
}

/**
 * Upload a CSV file to the backend for AI mapping + validation.
 * Returns the fully typed ImportResponse.
 */
export async function uploadCsv(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/import`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Server error (${res.status})`);
  }

  return data as ImportResponse;
}

/**
 * Check API health status.
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: string;
  uptime: number;
}> {
  const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
