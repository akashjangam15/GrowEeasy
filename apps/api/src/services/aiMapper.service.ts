import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { CrmRecord, SkippedRecord } from "shared-types";
import { retry } from "../utils/retry";
import {
  CRM_SCHEMA_MAPPING_SYSTEM_PROMPT,
  buildSchemaUserPrompt,
} from "../prompts/crmSchemaPrompt";

// ─── Configuration ───────────────────────────────────────

const MODEL = (process.env.AI_MODEL || "llama-3.3-70b-versatile").trim();
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

interface SchemaMappingProposal {
  mappings: { header: string; target: string | null }[];
}

function parseSchemaResponse(text: string): SchemaMappingProposal {
  let cleaned = text.trim();

  // Strip ```json ... ``` or ``` ... ``` wrappers
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned);

  if (parsed && Array.isArray(parsed.mappings)) {
    return parsed;
  }

  if (Array.isArray(parsed)) {
    return { mappings: parsed };
  }

  throw new Error("AI response is not a valid JSON object matching the expected schema");
}

// ─── Schema Proposal Retrieval ───────────────────────────

async function proposeSchemaMappingWithGemini(
  columns: { header: string; samples: string[] }[]
): Promise<SchemaMappingProposal> {
  const ai = getGeminiClient();
  const modelName = (process.env.GEMINI_MODEL || "gemini-3.5-flash").trim();

  console.log(`[aiMapper] Attempting schema mapping with Gemini using model ${modelName}...`);
  const response = await ai.models.generateContent({
    model: modelName,
    contents: buildSchemaUserPrompt(columns),
    config: {
      systemInstruction: CRM_SCHEMA_MAPPING_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: TEMPERATURE,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini AI response contains no text content");
  }

  return parseSchemaResponse(text);
}

async function proposeSchemaMappingWithGroq(
  columns: { header: string; samples: string[] }[]
): Promise<SchemaMappingProposal> {
  const client = getGroqClient();

  console.log(`[aiMapper] Attempting schema mapping with Groq using model ${MODEL}...`);
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: CRM_SCHEMA_MAPPING_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildSchemaUserPrompt(columns),
      },
    ],
    temperature: TEMPERATURE,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Groq AI response contains no text content");
  }

  return parseSchemaResponse(text);
}

async function proposeSchemaMapping(
  columns: { header: string; samples: string[] }[]
): Promise<Record<string, string | null>> {
  const mapping: Record<string, string | null> = {};

  if (columns.length === 0) return mapping;

  let proposal: SchemaMappingProposal | null = null;
  let geminiSuccess = false;

  // 1. Try Gemini first if key is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      proposal = await retry(() => proposeSchemaMappingWithGemini(columns), 3);
      geminiSuccess = true;
      console.log(`[aiMapper] Gemini schema mapping proposal successful.`);
    } catch (err) {
      console.warn(
        `[aiMapper] Gemini schema mapping failed. Falling back to Groq... Error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  } else {
    console.log(`[aiMapper] GEMINI_API_KEY not configured. Skipping Gemini...`);
  }

  // 2. Fallback to Groq if Gemini wasn't run or failed
  if (!geminiSuccess) {
    try {
      proposal = await retry(() => proposeSchemaMappingWithGroq(columns), 3);
      console.log(`[aiMapper] Groq schema mapping proposal successful.`);
    } catch (err) {
      console.error(
        `[aiMapper] Groq schema mapping failed. Falling back to deterministic mapping only. Error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  if (proposal && Array.isArray(proposal.mappings)) {
    for (const item of proposal.mappings) {
      mapping[item.header] = item.target || null;
    }
  }

  return mapping;
}

// ─── Deterministic Alias Mapping ─────────────────────────

const ALIASES: Record<string, string[]> = {
  created_at: ["created_at", "created", "created_date", "date", "timestamp", "lead_date", "createdon"],
  name: ["name", "full_name", "fullname", "contact_name", "lead_name", "customer_name", "client_name", "full_name_contact", "first_name", "last_name"],
  email: ["email", "email_address", "e_mail", "mail", "emailid", "contact_email", "email_id"],
  country_code: ["country_code", "countrycode", "dial_code", "isd", "isd_code"],
  mobile_without_country_code: ["mobile", "phone", "phone_number", "mobile_number", "contact", "contact_number", "whatsapp", "number", "mob", "phone_no", "contact_phone", "cell", "cellphone"],
  company: ["company", "company_name", "organization", "organisation", "org", "builder"],
  city: ["city", "town"],
  state: ["state", "region", "province"],
  country: ["country", "nation"],
  lead_owner: ["lead_owner", "owner", "assigned_to", "agent", "sales_owner", "salesperson"],
  crm_status: ["crm_status", "status", "lead_status", "stage", "disposition"],
  crm_note: ["crm_note", "note", "notes", "remark", "remarks", "comment", "comments"],
  data_source: ["data_source", "source", "campaign", "lead_source", "utm_source", "channel", "campaign_name"],
  possession_time: ["possession_time", "possession", "possession_date", "possessions"],
  description: ["description", "desc", "details", "about", "requirement", "requirements", "message"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const ALIAS_TO_FIELD = new Map<string, string>();
for (const field of Object.keys(ALIASES)) {
  ALIAS_TO_FIELD.set(normalizeHeader(field), field);
  for (const alias of ALIASES[field]) {
    ALIAS_TO_FIELD.set(normalizeHeader(alias), field);
  }
}

function autoMapHeader(header: string): string | null {
  const norm = normalizeHeader(header);
  return ALIAS_TO_FIELD.get(norm) || null;
}

// ─── Row Transformation Loop ─────────────────────────────

function transformRowToCrmRecord(
  row: Record<string, string>,
  mapping: Record<string, string | null>
): Partial<CrmRecord> {
  const record: any = {};
  const extraNotes: string[] = [];

  for (const [header, val] of Object.entries(row)) {
    const trimmedVal = (val || "").trim();
    if (!trimmedVal) continue;

    const targetField = mapping[header];

    if (targetField) {
      if (record[targetField]) {
        if (targetField === "email" || targetField === "mobile_without_country_code") {
          record[targetField] = `${record[targetField]} ${trimmedVal}`;
        } else if (targetField === "crm_note") {
          record[targetField] = `${record[targetField]} | ${trimmedVal}`;
        } else {
          record[targetField] = `${record[targetField]} ${trimmedVal}`;
        }
      } else {
        record[targetField] = trimmedVal;
      }
    } else {
      extraNotes.push(`${header}: ${trimmedVal}`);
    }
  }

  if (extraNotes.length > 0) {
    const extraNotesString = extraNotes.join(" | ");
    if (record.crm_note) {
      record.crm_note = `${record.crm_note} | ${extraNotesString}`;
    } else {
      record.crm_note = extraNotesString;
    }
  }

  const filledRecord: Partial<CrmRecord> = {
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
  };

  return filledRecord;
}

// ─── Public API ──────────────────────────────────────────

export interface AiMapperResult {
  mapped: Partial<CrmRecord>[];
  skipped: SkippedRecord[];
}

/**
 * Map CSV rows to CRM records deterministically based on header mapping rules.
 * Identifies column mapping rules using a deterministic alias matching combined with
 * schema-level AI inference for any ambiguous remaining headers.
 */
export async function mapRowsWithAi(
  rows: Record<string, string>[]
): Promise<AiMapperResult> {
  if (rows.length === 0) {
    return { mapped: [], skipped: [] };
  }

  const headers = Object.keys(rows[0]);
  const mapping: Record<string, string | null> = {};
  const ambiguousHeaders: string[] = [];

  // Step 1: Perform deterministic alias matching
  for (const header of headers) {
    const matched = autoMapHeader(header);
    if (matched) {
      mapping[header] = matched;
    } else {
      ambiguousHeaders.push(header);
    }
  }

  // Step 2: Query AI only for ambiguous headers, if any exist
  if (ambiguousHeaders.length > 0) {
    const columnsWithSamples = ambiguousHeaders.map((header) => {
      // Gather up to 5 unique non-empty sample values from rows
      const samples: string[] = [];
      for (const row of rows) {
        const val = (row[header] || "").trim();
        if (val && !samples.includes(val)) {
          samples.push(val);
          if (samples.length >= 5) break;
        }
      }
      return { header, samples };
    });

    const aiProposal = await proposeSchemaMapping(columnsWithSamples);
    
    // Merge AI proposals
    for (const header of ambiguousHeaders) {
      mapping[header] = aiProposal[header] || null;
    }
  }

  console.log("[aiMapper] Resolved schema mapping mappings:", mapping);

  // Step 3: Run local row transformation loop
  const mapped = rows.map((row) => transformRowToCrmRecord(row, mapping));

  return { mapped, skipped: [] };
}
