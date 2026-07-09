const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Upload a CSV file to the backend for processing.
 * Returns the parsed/mapped response.
 */
export async function uploadCsv(file: File): Promise<any> {
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

  return data;
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
