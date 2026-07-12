"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDate = normalizeDate;
exports.splitEmails = splitEmails;
exports.splitPhones = splitPhones;
exports.splitCountryCode = splitCountryCode;
exports.validateRecords = validateRecords;
exports.validateSingleRecord = validateSingleRecord;
const shared_types_1 = require("shared-types");
// ─── Helpers ─────────────────────────────────────────────
/** Build a blank CrmRecord with all fields set to empty strings. */
function blankRecord() {
    return {
        created_at: "",
        name: "",
        email: "",
        country_code: "",
        mobile_without_country_code: "",
        company: "",
        city: "",
        state: "",
        country: "",
        lead_owner: "",
        crm_status: "",
        crm_note: "",
        data_source: "",
        possession_time: "",
        description: "",
    };
}
const MONTH_MAP = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8, sept: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
};
/**
 * Try to normalise an arbitrary date string to ISO 8601.
 * Returns the ISO string on success, or empty string on failure.
 */
function normalizeDate(raw) {
    if (!raw || !raw.trim())
        return "";
    const trimmed = raw.trim();
    // Handle dd/mm/yyyy and dd-mm-yyyy patterns (prefer DD/MM/YYYY, fallback to MM/DD/YYYY in UTC)
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
        const [, first, second, year] = ddmmyyyy;
        // 1. Try first = day, second = month (DD/MM/YYYY)
        const d = new Date(`${year}-${second.padStart(2, "0")}-${first.padStart(2, "0")}T00:00:00Z`);
        if (!isNaN(d.getTime()))
            return d.toISOString();
        // 2. Try first = month, second = day (MM/DD/YYYY)
        const d2 = new Date(`${year}-${first.padStart(2, "0")}-${second.padStart(2, "0")}T00:00:00Z`);
        if (!isNaN(d2.getTime()))
            return d2.toISOString();
    }
    // Handle ordinal dates like "29th June 2026", "1st Jan 2025" in UTC
    const ordinal = trimmed.match(/^(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})$/i);
    if (ordinal) {
        const [, day, month, year] = ordinal;
        const monthLower = month.toLowerCase();
        const monthIndex = MONTH_MAP[monthLower];
        if (monthIndex !== undefined) {
            const d = new Date(Date.UTC(Number(year), monthIndex, Number(day)));
            if (!isNaN(d.getTime()))
                return d.toISOString();
        }
    }
    // Fallback: let Date() handle it
    const d = new Date(trimmed);
    if (!isNaN(d.getTime()))
        return d.toISOString();
    return "";
}
/**
 * Split a string that may contain multiple emails separated by
 * spaces, commas, or semicolons. Returns [primary, ...extras].
 */
function splitEmails(raw) {
    if (!raw || !raw.trim())
        return [];
    return raw
        .split(/[\s,;]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && e.includes("@"));
}
/**
 * Split a string that may contain multiple phone numbers separated
 * by spaces, commas, or semicolons. Returns [primary, ...extras].
 */
function splitPhones(raw) {
    if (!raw || !raw.trim())
        return [];
    return raw
        .split(/[\s,;]+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && /\d/.test(p));
}
/**
 * Extract the country code (e.g. "+91") from a full phone number.
 * Returns [countryCode, localNumber].
 * If no country code is detected, returns ["", fullNumber].
 *
 * Uses a known set of common country codes to disambiguate
 * (e.g. +91 vs +919 for Indian numbers).
 */
// Common country codes — covers the vast majority of real-estate leads
const KNOWN_COUNTRY_CODES = new Set([
    "+1", "+7",
    "+20", "+27", "+30", "+31", "+32", "+33", "+34", "+36", "+39",
    "+40", "+41", "+43", "+44", "+45", "+46", "+47", "+48", "+49",
    "+51", "+52", "+53", "+54", "+55", "+56", "+57", "+58",
    "+60", "+61", "+62", "+63", "+64", "+65", "+66",
    "+70", "+71", "+72", "+73", "+74", "+75", "+76", "+77", "+78", "+79",
    "+81", "+82", "+84", "+86",
    "+90", "+91", "+92", "+93", "+94", "+95", "+98",
    "+212", "+213", "+216", "+218", "+220", "+221", "+222", "+223",
    "+234", "+249", "+251", "+252", "+253", "+254", "+255", "+256",
    "+260", "+261", "+263", "+264", "+265", "+266", "+267", "+268",
    "+351", "+352", "+353", "+354", "+355", "+356", "+357", "+358",
    "+370", "+371", "+372", "+373", "+374", "+375", "+376", "+377", "+378", "+380", "+381",
    "+420", "+421", "+423",
    "+852", "+853", "+855", "+856",
    "+880", "+886",
    "+960", "+961", "+962", "+963", "+964", "+965", "+966", "+967", "+968", "+971", "+972", "+973", "+974", "+975", "+976", "+977",
    "+992", "+993", "+994", "+995", "+996", "+998",
]);
function splitCountryCode(phone) {
    const trimmed = phone.trim();
    if (!trimmed.startsWith("+")) {
        return ["", trimmed];
    }
    // Try matching against known codes: longest first (3 digits, then 2, then 1)
    for (const len of [4, 3, 2]) { // +XXX, +XX, +X
        if (trimmed.length > len) {
            const candidate = trimmed.substring(0, len);
            if (KNOWN_COUNTRY_CODES.has(candidate)) {
                return [candidate, trimmed.substring(len).trim()];
            }
        }
    }
    // Fallback: take first 1-3 digits after +
    const match = trimmed.match(/^(\+\d{1,3})(.+)$/);
    if (match) {
        return [match[1], match[2].trim()];
    }
    return ["", trimmed];
}
/**
 * Append a note to the crm_note field, separated by " | ".
 */
function appendNote(existing, addition) {
    if (!addition.trim())
        return existing;
    return existing ? `${existing} | ${addition}` : addition;
}
// ─── Main Validator ──────────────────────────────────────
/**
 * Validate and normalise an array of AI-mapped records.
 *
 * Business rules:
 * 1. crm_status must be a valid enum or blank
 * 2. data_source must be a valid enum or blank
 * 3. created_at normalised to ISO 8601 or blank
 * 4. Multiple emails → first to email, rest appended to crm_note
 * 5. Multiple phones → same pattern to crm_note
 * 6. Useful text that doesn't fit → append to crm_note
 * 7. Skip if neither email nor mobile present
 * 8. Each record stays a single logical row
 *
 * @param records – AI-mapped partial CRM records
 * @param rawRows – Original raw CSV rows (for skipped-record reporting)
 */
function validateRecords(records, rawRows) {
    const parsed = [];
    const skipped = [];
    for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const raw = rawRows[i] || {};
        try {
            const validated = validateSingleRecord(rec);
            parsed.push(validated);
        }
        catch (err) {
            skipped.push({
                row_index: i + 1, // 1-indexed for human readability
                reason: err instanceof Error ? err.message : "Validation failed",
                raw,
            });
        }
    }
    return { parsed, skipped };
}
/**
 * Validate and normalise a single record.
 * Throws if the record must be skipped.
 */
function validateSingleRecord(rec) {
    const result = blankRecord();
    // Copy simple string fields
    result.name = (rec.name || "").trim();
    result.company = (rec.company || "").trim();
    result.city = (rec.city || "").trim();
    result.state = (rec.state || "").trim();
    result.country = (rec.country || "").trim();
    result.lead_owner = (rec.lead_owner || "").trim();
    result.possession_time = (rec.possession_time || "").trim();
    result.description = (rec.description || "").trim();
    let noteAccumulator = (rec.crm_note || "").trim();
    // ── Rule 1: crm_status enum ────────────────────────────
    const rawStatus = (rec.crm_status || "").trim();
    if (shared_types_1.CRM_STATUS_VALUES.has(rawStatus)) {
        result.crm_status = rawStatus;
    }
    else {
        // Invalid status → blank it out, note it
        result.crm_status = "";
        if (rawStatus) {
            noteAccumulator = appendNote(noteAccumulator, `Original status: ${rawStatus}`);
        }
    }
    // ── Rule 2: data_source enum ───────────────────────────
    const rawSource = (rec.data_source || "").trim();
    if (shared_types_1.DATA_SOURCE_VALUES.has(rawSource)) {
        result.data_source = rawSource;
    }
    else {
        result.data_source = "";
        if (rawSource) {
            noteAccumulator = appendNote(noteAccumulator, `Original source: ${rawSource}`);
        }
    }
    // ── Rule 3: created_at → ISO 8601 ─────────────────────
    result.created_at = normalizeDate(rec.created_at || "");
    // ── Rule 4: email — split multiples ────────────────────
    const emails = splitEmails(rec.email || "");
    result.email = emails[0] || "";
    if (emails.length > 1) {
        noteAccumulator = appendNote(noteAccumulator, `Additional emails: ${emails.slice(1).join(", ")}`);
    }
    // ── Rule 5: phone — split multiples ────────────────────
    const rawPhone = (rec.mobile_without_country_code || "").trim();
    const rawCountryCode = (rec.country_code || "").trim();
    // If the AI put the full phone (with country code) in mobile_without_country_code,
    // try to reconstruct. Otherwise, take what was given.
    let fullPhoneString = rawPhone;
    if (rawCountryCode && rawPhone && !rawPhone.startsWith("+")) {
        fullPhoneString = `${rawCountryCode}${rawPhone}`;
    }
    const phones = splitPhones(fullPhoneString);
    if (phones.length > 0) {
        const [cc, local] = splitCountryCode(phones[0]);
        result.country_code = cc || rawCountryCode;
        result.mobile_without_country_code = local;
        if (phones.length > 1) {
            noteAccumulator = appendNote(noteAccumulator, `Additional phones: ${phones.slice(1).join(", ")}`);
        }
    }
    else {
        result.country_code = rawCountryCode;
        result.mobile_without_country_code = "";
    }
    // ── Rule 6: crm_note (accumulated) ────────────────────
    result.crm_note = noteAccumulator;
    // ── Rule 7: skip if no email AND no mobile ─────────────
    if (!result.email && !result.mobile_without_country_code) {
        throw new Error("Missing both email and mobile number");
    }
    return result;
}
//# sourceMappingURL=validator.service.js.map