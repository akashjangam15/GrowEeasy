"use strict";
/**
 * CRM Mapping Prompt for Claude
 *
 * Constructs the system + user prompt that instructs the AI to map
 * arbitrary CSV columns into the fixed CRM schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEW_SHOT_EXAMPLE = exports.CRM_MAPPING_SYSTEM_PROMPT = void 0;
exports.buildUserPrompt = buildUserPrompt;
// ─── System Prompt ───────────────────────────────────────
exports.CRM_MAPPING_SYSTEM_PROMPT = `You are a data-mapping engine for a real-estate CRM system.

Your task: given a batch of CSV rows (as JSON objects with arbitrary column names), map each row into the target CRM schema below. You must intelligently infer which source column maps to which target field, even when column names are misspelled, abbreviated, or in a different language.

## Target Schema

Each output record must be a JSON object with these exact fields:

| Field | Type | Description |
|-------|------|-------------|
| created_at | string | Date/time the lead was created. Keep original format — normalisation happens downstream. |
| name | string | Full name of the lead. Combine first + last name if separate columns exist. |
| email | string | Email address(es). If multiple exist in the source, include all separated by spaces. |
| country_code | string | Phone country code, e.g. "+91". Extract from full phone if needed. |
| mobile_without_country_code | string | Phone number WITHOUT country code. If multiple phones exist, include all separated by spaces. |
| company | string | Company or organisation name. |
| city | string | City name. |
| state | string | State or province. |
| country | string | Country name. |
| lead_owner | string | Name of the person who owns/manages this lead. |
| crm_status | string | Must be EXACTLY one of: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE", or "" (empty). |
| crm_note | string | Any useful text that doesn't fit other fields. Never discard information — append here. |
| data_source | string | Must be EXACTLY one of: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots", or "" (empty). Infer from ad/campaign names if possible. |
| possession_time | string | When the buyer wants possession (e.g. "Immediate", "6 months"). |
| description | string | Any additional description or notes about the lead. |

## Business Rules

1. **crm_status** must be EXACTLY one of the 4 allowed values or empty string "". Do NOT invent new statuses.
2. **data_source** must be EXACTLY one of the 5 allowed values or empty string "". Infer from campaign/ad names:
   - "Eden Park" in ad name → "eden_park"
   - "Meridian Tower" in ad name → "meridian_tower"
   - "Sarjapur Plots" in ad name → "sarjapur_plots"
   - "Varah Swamy" in ad name → "varah_swamy"
   - "Leads on Demand" in ad name → "leads_on_demand"
   - Otherwise → ""
3. **created_at**: preserve the original date string as-is. Downstream code will normalise it.
4. **Multiple emails**: if a source field contains multiple emails, put them ALL in the email field separated by spaces.
5. **Multiple phones**: if a source field contains multiple phone numbers, put them ALL in mobile_without_country_code separated by spaces. Extract country codes from the first phone.
6. **Never discard data**: if a column has useful information but doesn't clearly map to a field, append it to crm_note with the original column name as prefix (e.g. "ad_name: Eden Park 3BHK").
7. If a field has no matching source data, set it to empty string "".
8. Each input row produces exactly ONE output row. Never split or merge rows.

## Output Format

Return ONLY a valid JSON object with a single key "records" pointing to the array of mapped objects. No markdown, no code fences, no explanations, no extra text.
Every object in the array must have ALL 15 fields listed above.`;
// ─── Few-Shot Example ────────────────────────────────────
exports.FEW_SHOT_EXAMPLE = {
    input: [
        {
            full_name: "Rahul Sharma",
            email: "rahul.sharma@gmail.com",
            phone_number: "+919876543210",
            ad_name: "Eden Park 3BHK",
            form_name: "Facebook Lead Form",
            created_time: "2026-06-15T10:30:00+0530",
            city: "Bangalore",
        },
    ],
    output: {
        records: [
            {
                created_at: "2026-06-15T10:30:00+0530",
                name: "Rahul Sharma",
                email: "rahul.sharma@gmail.com",
                country_code: "+91",
                mobile_without_country_code: "9876543210",
                company: "",
                city: "Bangalore",
                state: "",
                country: "",
                lead_owner: "",
                crm_status: "",
                crm_note: "ad_name: Eden Park 3BHK | form_name: Facebook Lead Form",
                data_source: "eden_park",
                possession_time: "",
                description: "",
            },
        ],
    },
};
// ─── Build User Prompt ───────────────────────────────────
/**
 * Build the user message containing the CSV rows to map.
 * Includes the few-shot example for better accuracy.
 */
function buildUserPrompt(rows) {
    return `Here is a few-shot example of how to map rows:

INPUT:
${JSON.stringify(exports.FEW_SHOT_EXAMPLE.input, null, 2)}

OUTPUT:
${JSON.stringify(exports.FEW_SHOT_EXAMPLE.output, null, 2)}

---

Now map the following ${rows.length} row(s). Return ONLY a valid JSON object with a single key "records" containing ${rows.length} mapped objects:

${JSON.stringify(rows, null, 2)}`;
}
//# sourceMappingURL=crmMappingPrompt.js.map