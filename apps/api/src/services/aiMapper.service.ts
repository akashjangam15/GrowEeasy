import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { CrmRecord, SkippedRecord } from "shared-types";
import { batchArray } from "../utils/batchArray";
import { retry } from "../utils/retry";
import {
  CRM_MAPPING_SYSTEM_PROMPT,
  buildUserPrompt,
} from "../prompts/crmMappingPrompt";

// ─── Configuration ───────────────────────────────────────

const MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";
const BATCH_SIZE = Number(process.env.AI_BATCH_SIZE) || 500;
const MAX_RETRIES = 3;
const TEMPERATURE = 0.2;

// ─── Clients ─────────────────────────────────────────────

let _groqClient: OpenAI | null = null;
let _geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!_geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    console.log(
      `[aiMapper] Using Gemini API key: ${apiKey.substring(0, 8)}... model: ${process.env.GEMINI_MODEL || "gemini-3.5-flash"}`
    );
    _geminiClient = new GoogleGenAI({ apiKey });
  }
  return _geminiClient;
}

function getGroqClient(): OpenAI {
  if (!_groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Get a key from https://console.groq.com/keys and add it to your .env file."
      );
    }
    console.log(
      `[aiMapper] Using Groq API key: ${apiKey.substring(0, 8)}... model: ${MODEL}`
    );
    _groqClient = new OpenAI({
      baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      apiKey,
    });
  }
  return _groqClient;
}

// ─── JSON Parsing ────────────────────────────────────────

/**
 * Defensively parse AI response text into a JSON array.
 * Strips markdown code fences if the model wraps the output.
 */
function parseAiResponse(text: string): Partial<CrmRecord>[] {
  let cleaned = text.trim();

  // Strip ```json ... ``` or ``` ... ``` wrappers
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.records)) {
    return parsed.records;
  }

  throw new Error("AI response is not a valid JSON array or object containing 'records'");
}

// ─── Single Batch Processing ─────────────────────────────

async function mapBatchWithGemini(
  rows: Record<string, string>[]
): Promise<Partial<CrmRecord>[]> {
  const ai = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  console.log(`[aiMapper] Attempting mapping with Gemini using model ${modelName}...`);
  const response = await ai.models.generateContent({
    model: modelName,
    contents: buildUserPrompt(rows),
    config: {
      systemInstruction: CRM_MAPPING_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: TEMPERATURE,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini AI response contains no text content");
  }

  return parseAiResponse(text);
}

async function mapBatchWithGroq(
  rows: Record<string, string>[]
): Promise<Partial<CrmRecord>[]> {
  const client = getGroqClient();

  console.log(`[aiMapper] Attempting mapping with Groq using model ${MODEL}...`);
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: CRM_MAPPING_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserPrompt(rows),
      },
    ],
    temperature: TEMPERATURE,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Groq AI response contains no text content");
  }

  return parseAiResponse(text);
}

async function mapBatch(
  rows: Record<string, string>[]
): Promise<Partial<CrmRecord>[]> {
  let records: Partial<CrmRecord>[] = [];
  let geminiSuccess = false;

  // 1. Try Gemini first if key is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      records = await mapBatchWithGemini(rows);
      geminiSuccess = true;
      console.log(`[aiMapper] Gemini mapping successful.`);
    } catch (err) {
      console.warn(
        `[aiMapper] Gemini mapping failed. Falling back to Groq... Error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  } else {
    console.log(`[aiMapper] GEMINI_API_KEY not configured. Skipping Gemini...`);
  }

  // 2. Fallback to Groq if Gemini wasn't run or failed
  if (!geminiSuccess) {
    records = await mapBatchWithGroq(rows);
    console.log(`[aiMapper] Groq mapping successful.`);
  }

  // Reconstruct target schema fields with default empty strings to handle sparse output
  const filledRecords = records.map((record) => ({
    created_at: record.created_at || "",
    name: record.name || "",
    email: record.email || "",
    country_code: record.country_code || "",
    mobile_without_country_code: record.mobile_without_country_code || "",
    company: record.company || "",
    city: record.city || "",
    state: record.state || "",
    country: record.country || "",
    lead_owner: record.lead_owner || "",
    crm_status: record.crm_status || "",
    crm_note: record.crm_note || "",
    data_source: record.data_source || "",
    possession_time: record.possession_time || "",
    description: record.description || "",
  })) as Partial<CrmRecord>[];

  // Sanity check: AI should return same number of rows as input
  if (filledRecords.length !== rows.length) {
    console.warn(
      `[aiMapper] Batch size mismatch: sent ${rows.length} rows, got ${filledRecords.length} back`
    );
  }

  return filledRecords;
}

function isFatalAiError(message: string): boolean {
  const lowercase = message.toLowerCase();
  return (
    lowercase.includes("resource_exhausted") ||
    lowercase.includes("quota exceeded") ||
    lowercase.includes("429") ||
    lowercase.includes("api key not valid") ||
    lowercase.includes("api_key_invalid") ||
    lowercase.includes("invalid api key") ||
    lowercase.includes("groq_api_key is not set") ||
    lowercase.includes("gemini_api_key is not set") ||
    lowercase.includes("model not found") ||
    lowercase.includes("model_not_found") ||
    lowercase.includes("401") ||
    lowercase.includes("authentication") ||
    lowercase.includes("unauthorized") ||
    (lowercase.includes("not found") && lowercase.includes("model"))
  );
}

// ─── Public API ──────────────────────────────────────────

export interface AiMapperResult {
  mapped: Partial<CrmRecord>[];
  skipped: SkippedRecord[];
}

/**
 * Map an array of raw CSV rows into CRM records using Groq.
 *
 * 1. Splits rows into batches of BATCH_SIZE
 * 2. Each batch is sent to Groq with retry (3x, exponential backoff)
 * 3. On final failure, batch rows go to skipped[]
 * 4. Returns all mapped records + any skipped rows
 */
export async function mapRowsWithAi(
  rows: Record<string, string>[]
): Promise<AiMapperResult> {
  if (rows.length === 0) {
    return { mapped: [], skipped: [] };
  }

  const batches = batchArray(rows, BATCH_SIZE);
  const allMapped: Partial<CrmRecord>[] = [];
  const allSkipped: SkippedRecord[] = [];

  let globalRowIndex = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchStartIndex = globalRowIndex;

    console.log(
      `[aiMapper] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} rows)`
    );

    try {
      const mapped = await retry(() => mapBatch(batch), MAX_RETRIES);
      allMapped.push(...mapped);
    } catch (err) {
      const reason =
        err instanceof Error
          ? err.message
          : "AI processing failed";

      if (err instanceof Error && isFatalAiError(reason)) {
        throw err;
      }

      console.error(
        `[aiMapper] Batch ${batchIndex + 1} failed after ${MAX_RETRIES} retries: AI processing failed: ${reason}`
      );

      for (let i = 0; i < batch.length; i++) {
        allSkipped.push({
          row_index: batchStartIndex + i + 1, // 1-indexed
          reason: `AI processing failed: ${reason}`,
          raw: batch[i],
        });
      }
    }

    globalRowIndex += batch.length;

    // Add a delay between batches to stay within rate limits (e.g. 4 seconds)
    if (batchIndex < batches.length - 1) {
      console.log(`[aiMapper] Rate limiting: sleeping for 4000ms...`);
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  }

  return { mapped: allMapped, skipped: allSkipped };
}
