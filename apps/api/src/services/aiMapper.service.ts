import Anthropic from "@anthropic-ai/sdk";
import { CrmRecord, SkippedRecord } from "shared-types";
import { batchArray } from "../utils/batchArray";
import { retry } from "../utils/retry";
import {
  CRM_MAPPING_SYSTEM_PROMPT,
  buildUserPrompt,
} from "../prompts/crmMappingPrompt";

// ─── Configuration ───────────────────────────────────────

const MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";
const BATCH_SIZE = Number(process.env.AI_BATCH_SIZE) || 20;
const MAX_RETRIES = 3;
const TEMPERATURE = 0.2;

// ─── Client ──────────────────────────────────────────────

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your .env file."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
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

  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not a JSON array");
  }

  return parsed;
}

// ─── Single Batch Processing ─────────────────────────────

/**
 * Send a single batch of rows to Claude for mapping.
 * Returns an array of partially-typed CRM records.
 */
async function mapBatch(
  rows: Record<string, string>[]
): Promise<Partial<CrmRecord>[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: TEMPERATURE,
    system: CRM_MAPPING_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(rows),
      },
    ],
  });

  // Extract text content
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI response contains no text content");
  }

  const records = parseAiResponse(textBlock.text);

  // Sanity check: AI should return same number of rows as input
  if (records.length !== rows.length) {
    console.warn(
      `[aiMapper] Batch size mismatch: sent ${rows.length} rows, got ${records.length} back`
    );
  }

  return records;
}

// ─── Public API ──────────────────────────────────────────

export interface AiMapperResult {
  mapped: Partial<CrmRecord>[];
  skipped: SkippedRecord[];
}

/**
 * Map an array of raw CSV rows into CRM records using Claude.
 *
 * 1. Splits rows into batches of BATCH_SIZE
 * 2. Each batch is sent to Claude with retry (3x, exponential backoff)
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
      // All retries exhausted — mark entire batch as skipped
      const reason =
        err instanceof Error
          ? `AI processing failed: ${err.message}`
          : "AI processing failed";

      console.error(
        `[aiMapper] Batch ${batchIndex + 1} failed after ${MAX_RETRIES} retries: ${reason}`
      );

      for (let i = 0; i < batch.length; i++) {
        allSkipped.push({
          row_index: batchStartIndex + i + 1, // 1-indexed
          reason,
          raw: batch[i],
        });
      }
    }

    globalRowIndex += batch.length;
  }

  return { mapped: allMapped, skipped: allSkipped };
}
