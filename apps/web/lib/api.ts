// Resolve the backend base URL from the environment.
// NEXT_PUBLIC_* vars are inlined at build time, so a wrong/missing value here
// means every request silently hits the Vercel origin and gets a 404 HTML page.
// We validate up front and strip any trailing slash so `${API_URL}/api/import`
// never produces a double slash or a relative path.
function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

  // In the browser on a deployed host, a missing var is a hard misconfiguration.
  if (!raw) {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      throw new Error(
        "NEXT_PUBLIC_API_URL is not set. Configure it in your Vercel project " +
          "settings to your backend URL and redeploy."
      );
    }
    return "http://localhost:3001";
  }

  // Guard against pointing the frontend at itself (the classic vercel.app 404).
  if (
    typeof window !== "undefined" &&
    raw.replace(/\/+$/, "") === window.location.origin
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL points at the frontend's own origin. It must be the " +
        "backend API URL (e.g. your Railway URL), not the Vercel domain."
    );
  }

  return raw.replace(/\/+$/, "");
}

const API_URL = resolveApiUrl();

// Parse a fetch Response as JSON, but surface a readable error when the server
// returned HTML (e.g. a 404 page) instead — otherwise callers see the opaque
// "Unexpected token '<'" JSON parse error.
async function parseJson(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const preview = (await res.text()).slice(0, 120);
    throw new Error(
      `Expected JSON from ${res.url} but got "${contentType || "unknown"}" ` +
        `(HTTP ${res.status}). The request is likely hitting the wrong host. ` +
        `Response started with: ${preview}`
    );
  }
  return res.json();
}

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

  const data = await parseJson(res);

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
  return parseJson(res);
}
