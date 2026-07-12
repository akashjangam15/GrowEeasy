import { describe, it, expect } from "vitest";
import {
  validateRecords,
  validateSingleRecord,
  normalizeDate,
  splitEmails,
  splitPhones,
  splitCountryCode,
} from "../src/services/validator.service";
import type { CrmRecord } from "shared-types";

// ─── Helper ──────────────────────────────────────────────

/** Build a minimal valid partial record */
function minimal(overrides: Partial<CrmRecord> = {}): Partial<CrmRecord> {
  return {
    name: "Test User",
    email: "test@example.com",
    mobile_without_country_code: "9876543210",
    country_code: "+91",
    ...overrides,
  };
}

// ─── normalizeDate ───────────────────────────────────────

describe("normalizeDate", () => {
  it("should normalise ISO 8601 with timezone", () => {
    const result = normalizeDate("2026-06-15T10:30:00+0530");
    expect(result).toBeTruthy();
    expect(new Date(result).getFullYear()).toBe(2026);
  });

  it("should normalise dd/mm/yyyy format", () => {
    const result = normalizeDate("29/06/2026");
    expect(result).toBeTruthy();
    const d = new Date(result);
    expect(d.getUTCDate()).toBe(29);
    expect(d.getUTCMonth()).toBe(5); // June = 5
    expect(d.getUTCFullYear()).toBe(2026);
  });

  it("should normalise ordinal date format", () => {
    const result = normalizeDate("29th June 2026");
    expect(result).toBeTruthy();
    const d = new Date(result);
    expect(d.getUTCDate()).toBe(29);
  });

  it("should return empty string for invalid date", () => {
    expect(normalizeDate("not a date")).toBe("");
    expect(normalizeDate("")).toBe("");
  });

  it("should return empty string for blank input", () => {
    expect(normalizeDate("   ")).toBe("");
  });

  it("should handle mixed ambiguous and unambiguous formats (dd/mm/yyyy vs mm/dd/yyyy)", () => {
    // 12/07/2026 -> ambiguous, parses as DD/MM/YYYY (July 12)
    const resultAmbiguous = normalizeDate("12/07/2026");
    const dAmbiguous = new Date(resultAmbiguous);
    expect(dAmbiguous.getUTCDate()).toBe(12);
    expect(dAmbiguous.getUTCMonth()).toBe(6); // July = 6

    // 06/29/2026 -> unambiguous MM/DD/YYYY, falls back and parses as June 29
    const resultUnambiguous = normalizeDate("06/29/2026");
    const dUnambiguous = new Date(resultUnambiguous);
    expect(dUnambiguous.getUTCDate()).toBe(29);
    expect(dUnambiguous.getUTCMonth()).toBe(5); // June = 5
  });
});

// ─── splitEmails ─────────────────────────────────────────

describe("splitEmails", () => {
  it("should return single email in array", () => {
    expect(splitEmails("user@test.com")).toEqual(["user@test.com"]);
  });

  it("should split space-separated emails", () => {
    expect(splitEmails("a@b.com c@d.com")).toEqual(["a@b.com", "c@d.com"]);
  });

  it("should split comma-separated emails", () => {
    expect(splitEmails("a@b.com,c@d.com")).toEqual(["a@b.com", "c@d.com"]);
  });

  it("should return empty array for no input", () => {
    expect(splitEmails("")).toEqual([]);
    expect(splitEmails("   ")).toEqual([]);
  });

  it("should filter out non-email tokens", () => {
    expect(splitEmails("hello a@b.com world")).toEqual(["a@b.com"]);
  });
});

// ─── splitPhones ─────────────────────────────────────────

describe("splitPhones", () => {
  it("should return single phone", () => {
    expect(splitPhones("+919876543210")).toEqual(["+919876543210"]);
  });

  it("should split space-separated phones", () => {
    const result = splitPhones("+919876543210 +919876543211");
    expect(result).toHaveLength(2);
  });

  it("should return empty for blank input", () => {
    expect(splitPhones("")).toEqual([]);
  });
});

// ─── splitCountryCode ────────────────────────────────────

describe("splitCountryCode", () => {
  it("should extract +91 from Indian number", () => {
    expect(splitCountryCode("+919876543210")).toEqual(["+91", "9876543210"]);
  });

  it("should extract +1 from US number", () => {
    expect(splitCountryCode("+12125551234")).toEqual(["+1", "2125551234"]);
  });

  it("should return empty code for no prefix", () => {
    expect(splitCountryCode("9876543210")).toEqual(["", "9876543210"]);
  });
});

// ─── validateSingleRecord ────────────────────────────────

describe("validateSingleRecord", () => {
  it("should pass a fully valid record", () => {
    const result = validateSingleRecord(
      minimal({
        crm_status: "GOOD_LEAD_FOLLOW_UP",
        data_source: "eden_park",
        created_at: "2026-06-15T10:30:00+0530",
        city: "Bangalore",
      })
    );

    expect(result.name).toBe("Test User");
    expect(result.email).toBe("test@example.com");
    expect(result.crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(result.data_source).toBe("eden_park");
    expect(result.created_at).toBeTruthy();
    expect(result.city).toBe("Bangalore");
  });

  it("should allow blank crm_status and data_source", () => {
    const result = validateSingleRecord(
      minimal({ crm_status: "", data_source: "" })
    );
    expect(result.crm_status).toBe("");
    expect(result.data_source).toBe("");
  });

  // ── Rule 1: crm_status enum enforcement ──────────────

  it("should blank invalid crm_status and note it", () => {
    const result = validateSingleRecord(
      minimal({ crm_status: "INVALID_STATUS" as any })
    );
    expect(result.crm_status).toBe("");
    expect(result.crm_note).toContain("Original status: INVALID_STATUS");
  });

  it("should accept all valid crm_status values", () => {
    for (const status of [
      "GOOD_LEAD_FOLLOW_UP",
      "DID_NOT_CONNECT",
      "BAD_LEAD",
      "SALE_DONE",
    ] as const) {
      const result = validateSingleRecord(minimal({ crm_status: status }));
      expect(result.crm_status).toBe(status);
    }
  });

  // ── Rule 2: data_source enum enforcement ─────────────

  it("should blank invalid data_source and note it", () => {
    const result = validateSingleRecord(
      minimal({ data_source: "facebook_campaign" as any })
    );
    expect(result.data_source).toBe("");
    expect(result.crm_note).toContain("Original source: facebook_campaign");
  });

  it("should accept all valid data_source values", () => {
    for (const source of [
      "leads_on_demand",
      "meridian_tower",
      "eden_park",
      "varah_swamy",
      "sarjapur_plots",
    ] as const) {
      const result = validateSingleRecord(minimal({ data_source: source }));
      expect(result.data_source).toBe(source);
    }
  });

  // ── Rule 3: created_at normalisation ─────────────────

  it("should normalise created_at to ISO 8601", () => {
    const result = validateSingleRecord(
      minimal({ created_at: "29/06/2026" })
    );
    expect(result.created_at).toBeTruthy();
    expect(new Date(result.created_at).getUTCFullYear()).toBe(2026);
  });

  it("should blank invalid created_at", () => {
    const result = validateSingleRecord(
      minimal({ created_at: "not-a-date" })
    );
    expect(result.created_at).toBe("");
  });

  // ── Rule 4: multiple emails ──────────────────────────

  it("should split multiple emails and note extras", () => {
    const result = validateSingleRecord(
      minimal({
        email: "primary@test.com secondary@test.com third@test.com",
      })
    );
    expect(result.email).toBe("primary@test.com");
    expect(result.crm_note).toContain("secondary@test.com");
    expect(result.crm_note).toContain("third@test.com");
  });

  // ── Rule 5: multiple phones ──────────────────────────

  it("should split multiple phones and note extras", () => {
    const result = validateSingleRecord(
      minimal({
        country_code: "",
        mobile_without_country_code: "+919876543210 +919876543211",
      })
    );
    expect(result.mobile_without_country_code).toBe("9876543210");
    expect(result.country_code).toBe("+91");
    expect(result.crm_note).toContain("+919876543211");
  });

  // ── Rule 7: skip rule ────────────────────────────────

  it("should throw when both email and mobile are missing", () => {
    expect(() =>
      validateSingleRecord(
        minimal({
          email: "",
          mobile_without_country_code: "",
          country_code: "",
        })
      )
    ).toThrow("Missing both email and mobile number");
  });

  it("should NOT skip when only email is present", () => {
    const result = validateSingleRecord(
      minimal({
        mobile_without_country_code: "",
        country_code: "",
      })
    );
    expect(result.email).toBe("test@example.com");
  });

  it("should NOT skip when only mobile is present", () => {
    const result = validateSingleRecord(
      minimal({
        email: "",
      })
    );
    expect(result.mobile_without_country_code).toBeTruthy();
  });
});

// ─── validateRecords (batch) ─────────────────────────────

describe("validateRecords", () => {
  it("should separate valid and invalid records", () => {
    const records: Partial<CrmRecord>[] = [
      minimal(),
      minimal({ email: "", mobile_without_country_code: "", country_code: "" }),
      minimal({ name: "Valid Two", email: "valid@test.com" }),
    ];

    const rawRows = [
      { full_name: "Test User", email: "test@example.com" },
      { full_name: "Missing", email: "" },
      { full_name: "Valid Two", email: "valid@test.com" },
    ];

    const result = validateRecords(records, rawRows);

    expect(result.parsed).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].row_index).toBe(2); // 1-indexed
    expect(result.skipped[0].reason).toContain("Missing both email and mobile");
    expect(result.skipped[0].raw).toEqual(rawRows[1]);
  });

  it("should handle empty input", () => {
    const result = validateRecords([], []);
    expect(result.parsed).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });

  it("should preserve all crm_note accumulations in batch", () => {
    const records: Partial<CrmRecord>[] = [
      minimal({
        email: "a@b.com c@d.com",
        crm_status: "INVALID" as any,
      }),
    ];
    const rawRows = [{ email: "a@b.com c@d.com" }];

    const result = validateRecords(records, rawRows);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].crm_note).toContain("Original status: INVALID");
    expect(result.parsed[0].crm_note).toContain("c@d.com");
  });
});
