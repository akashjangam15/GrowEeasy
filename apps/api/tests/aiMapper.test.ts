import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock @google/genai to prevent external network calls and simulate AI responses
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: async (args: any) => {
          const contentStr = args.contents;
          const parsed = JSON.parse(contentStr);
          const columns = parsed.columnsToMap || [];
          
          const mappings = columns.map((c: any) => {
            if (c.header.startsWith("Email")) {
              return { header: c.header, target: "email" };
            }
            return { header: c.header, target: null };
          });

          return {
            text: JSON.stringify({ mappings })
          };
        }
      }
    }
  };
});

import { mapRowsWithAi } from "../src/services/aiMapper.service";

describe("aiMapper Service", () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = "mock_gemini_key";
  });

  it("should deterministically map obvious headers using aliases", async () => {
    const rawRows = [
      {
        "Full Name": "Alice Smith",
        "Email Address": "alice@example.com",
        "Phone Number": "1234567890",
        "City": "Mumbai",
        "Notes": "Looking for 2BHK",
      },
    ];

    const result = await mapRowsWithAi(rawRows);

    expect(result.mapped.length).toBe(1);
    const mappedRecord = result.mapped[0];

    expect(mappedRecord.name).toBe("Alice Smith");
    expect(mappedRecord.email).toBe("alice@example.com");
    expect(mappedRecord.mobile_without_country_code).toBe("1234567890");
    expect(mappedRecord.city).toBe("Mumbai");
    expect(mappedRecord.crm_note).toBe("Looking for 2BHK");
  });

  it("should combine unmapped columns into crm_note", async () => {
    const rawRows = [
      {
        "Full Name": "Bob Jones",
        "Email Address": "bob@example.com",
        "Ad Campaign": "Eden Park Promo",
        "Form ID": "fb_123",
      },
    ];

    const result = await mapRowsWithAi(rawRows);

    expect(result.mapped.length).toBe(1);
    const mappedRecord = result.mapped[0];

    expect(mappedRecord.name).toBe("Bob Jones");
    expect(mappedRecord.email).toBe("bob@example.com");
    // "Ad Campaign" and "Form ID" are not aliases and should return null from mock AI mapping, so they go into crm_note
    expect(mappedRecord.crm_note).toContain("Ad Campaign: Eden Park Promo");
    expect(mappedRecord.crm_note).toContain("Form ID: fb_123");
  });

  it("should aggregate values when multiple columns map to the same field", async () => {
    const rawRows = [
      {
        "First Name": "Charlie",
        "Last Name": "Brown",
        "Email 1": "charlie1@example.com",
        "Email 2": "charlie2@example.com",
      },
    ];

    const result = await mapRowsWithAi(rawRows);

    expect(result.mapped.length).toBe(1);
    const mappedRecord = result.mapped[0];

    // Both "First Name" and "Last Name" map to "name" in aliases
    expect(mappedRecord.name).toContain("Charlie");
    expect(mappedRecord.name).toContain("Brown");

    // Both "Email 1" and "Email 2" map to "email" via dynamic mock AI mapping
    expect(mappedRecord.email).toContain("charlie1@example.com");
    expect(mappedRecord.email).toContain("charlie2@example.com");
  });
});
