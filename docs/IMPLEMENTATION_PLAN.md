# GrowEasy AI CSV Importer — Full Context & Implementation Plan

> **Last updated:** July 8, 2026  
> **Status:** Phases 1-2 complete, Phases 3-6 remaining  
> **Workspace:** `c:\Users\ASUS\OneDrive\Desktop\GrowEasy`

---

## Project Summary

An AI-powered CSV Importer for a real-estate CRM. Users upload any CSV of leads (Facebook, Google Ads, messy spreadsheets) and the system uses Claude (Anthropic API) to intelligently map arbitrary columns into a fixed CRM schema, then returns structured JSON with parsed and skipped records.

---

## Current Repo Structure

```
GrowEasy/
├── apps/
│   ├── web/                              # Next.js 16 frontend (port 3000)
│   │   ├── app/
│   │   │   ├── page.tsx                  # ✅ Upload → Preview flow
│   │   │   ├── page.module.css           # ✅ Page styles
│   │   │   ├── layout.tsx                # ✅ GrowEasy metadata + Inter font
│   │   │   ├── globals.css               # ✅ Dark design system (CSS vars)
│   │   │   └── fonts/
│   │   ├── components/
│   │   │   ├── FileDropzone.tsx           # ✅ Drag & drop upload
│   │   │   ├── FileDropzone.module.css
│   │   │   ├── CsvPreviewTable.tsx        # ✅ Sticky-header preview table
│   │   │   ├── CsvPreviewTable.module.css
│   │   │   ├── ResultTable.tsx            # ❌ Phase 5
│   │   │   ├── ImportSummaryCards.tsx      # ❌ Phase 5
│   │   │   └── ProgressBar.tsx            # ❌ Phase 5
│   │   ├── hooks/
│   │   │   └── useCsvImport.ts           # ✅ Client-side parse + state machine
│   │   ├── lib/
│   │   │   └── api.ts                    # ✅ uploadCsv() + checkHealth()
│   │   └── package.json
│   └── api/                              # Express 5 backend (port 3001)
│       ├── src/
│       │   ├── index.ts                  # ✅ Server entry, /health, /api/import
│       │   ├── routes/
│       │   │   └── import.route.ts       # ✅ POST /api/import
│       │   ├── controllers/
│       │   │   └── import.controller.ts  # ✅ Echo parsed rows (no AI yet)
│       │   ├── services/
│       │   │   ├── csvParser.service.ts  # ✅ Papaparse buffer→rows
│       │   │   ├── aiMapper.service.ts   # ❌ Phase 4
│       │   │   └── validator.service.ts  # ❌ Phase 3
│       │   ├── prompts/
│       │   │   └── crmMappingPrompt.ts   # ❌ Phase 4
│       │   ├── middleware/
│       │   │   ├── upload.ts             # ✅ Multer (5MB, CSV only)
│       │   │   └── errorHandler.ts       # ✅ Global error handler
│       │   └── utils/
│       │       ├── batchArray.ts         # ❌ Phase 4
│       │       └── retry.ts             # ❌ Phase 4
│       ├── tests/
│       │   ├── validator.test.ts         # ❌ Phase 3
│       │   └── aiMapper.test.ts          # ❌ Phase 6
│       ├── Dockerfile                    # ❌ Phase 6
│       └── package.json
├── packages/
│   └── shared-types/                     # ❌ Phase 3
│       ├── src/crm.types.ts
│       └── package.json
├── sample-data/
│   ├── facebook_leads_export.csv         # ✅ 9 rows, edge cases
│   ├── google_ads_export.csv             # ❌ Phase 4
│   ├── messy_manual_sheet.csv            # ❌ Phase 4
│   └── real_estate_crm_export.csv        # ❌ Phase 4
├── docs/
│   ├── phase-1-skeleton.md               # ✅
│   └── phase-2-upload-parse.md           # ✅
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── README.md                             # ❌ Phase 6
```

---

## Completed Phases

### Phase 1 — Skeleton ✅
- Created `apps/api` Express server with `GET /health`
- Cleaned up `apps/web` — removed broken workspace refs (`@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`)
- GrowEasy dark-mode design system in `globals.css`
- Frontend pings API health and shows status card
- Docs: [phase-1-skeleton.md](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/docs/phase-1-skeleton.md)

### Phase 2 — Upload + Parse (No AI) ✅
- Backend: Multer upload → papaparse CSV parsing → echo response at `POST /api/import`
- Frontend: `FileDropzone` (drag & drop) → `CsvPreviewTable` (sticky headers, row numbers)
- `useCsvImport` hook manages state machine: upload → preview → uploading → done → error
- `lib/api.ts` has `uploadCsv()` and `checkHealth()`
- "Confirm & Import" button is present but disabled (wired in Phase 5)
- Docs: [phase-2-upload-parse.md](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/docs/phase-2-upload-parse.md)

---

## Remaining Phases

### Phase 3 — CRM Schema + Validator (No AI dependency)

Create `packages/shared-types` and `validator.service.ts`. Fully testable in isolation.

#### `packages/shared-types/src/crm.types.ts`
```ts
export interface CrmRecord {
  created_at: string;              // parseable by new Date()
  name: string;
  email: string;
  country_code: string;            // e.g. "+91"
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE" | "";
  crm_note: string;
  data_source: "leads_on_demand" | "meridian_tower" | "eden_park" | "varah_swamy" | "sarjapur_plots" | "";
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
  summary: { total_rows: number; total_imported: number; total_skipped: number; };
  parsed: CrmRecord[];
  skipped: SkippedRecord[];
}
```

#### Business Rules (validator.service.ts)
1. `crm_status` must be one of the 4 allowed enums, or blank
2. `data_source` must be one of the 5 allowed enums, or blank
3. `created_at` must be valid for `new Date()` — normalize to ISO 8601 or blank
4. Multiple emails → first to `email`, rest appended to `crm_note`
5. Multiple phones → same pattern to `crm_note`
6. Useful text that doesn't fit → append to `crm_note`, never discard
7. **Skip rule:** if neither email nor mobile, row goes to `skipped`
8. Each record stays a single logical row

#### Tests (validator.test.ts)
- Enum enforcement, date validity, multi-email/phone splitting, skip-rule logic

---

### Phase 4 — AI Mapping

#### `prompts/crmMappingPrompt.ts`
- Role framing: data-mapping engine for real-estate CRM
- Full target schema with types/descriptions
- Exact enum whitelists for `crm_status` and `data_source`
- All 8 business rules as numbered instructions
- Few-shot example (Facebook export → CRM JSON)
- Output constraint: "ONLY valid JSON array, no markdown, no code fences"
- Use temperature ~0.2

#### `services/aiMapper.service.ts`
- Uses `@anthropic-ai/sdk` with `claude-sonnet-4-6` (or `claude-haiku-4-5-20251001`)
- Parse defensively: strip ` ```json ` fences before `JSON.parse`
- On parse failure, treat batch as failed → retry

#### `utils/batchArray.ts`
- Split rows into batches of ~20

#### `utils/retry.ts`
- Retry up to 3x with exponential backoff
- On final failure, mark batch rows as skipped with reason "AI processing failed"

#### Wire into controller
- Parser → AI mapper → validator → response
- Every input row ends up in either `parsed` or `skipped` — never silently dropped

#### Sample CSVs to create
- `google_ads_export.csv` — different column names/order
- `messy_manual_sheet.csv` — typo'd headers (`Nmae`, `Ph no.`, `emailid`)
- `real_estate_crm_export.csv` — large CSV (1000+ rows)

---

### Phase 5 — Full Frontend Result Flow

- `ResultTable.tsx` — shows parsed vs skipped rows, skipped rows show reason
- `ImportSummaryCards.tsx` — total imported / skipped / total
- `ProgressBar.tsx` — loading state while backend processes
- Update `useCsvImport.ts` — add `uploading` and `done` states
- Update `lib/api.ts` — wire `uploadCsv()` call on "Confirm & Import" click
- Enable the confirm button

---

### Phase 6 — Polish, Tests, Deploy

- `Dockerfile` for `apps/api` (multi-stage Node build)
- `aiMapper.test.ts` — mock Anthropic client, assert prompt structure
- Dark mode polish, skeleton loaders, error/empty states
- `README.md` — architecture, setup, env vars, API docs, sample data docs
- Deploy: web → Vercel, api → Render/Railway
- Env vars: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_API_URL`, `PORT`

---

## Key Architecture Rules

1. `apps/web` and `apps/api` share code ONLY through `packages/shared-types`
2. They communicate only over HTTP — `lib/api.ts` is the sole caller
3. All AI/Claude API code lives in `apps/api` only — never call Claude from the browser
4. `ANTHROPIC_API_KEY` is a server-side secret, never exposed to frontend

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Monorepo | Turborepo + pnpm | pnpm 9.0.0 |
| Frontend | Next.js (App Router) | 16.2.0 |
| UI | React + CSS Modules | React 19.2 |
| Backend | Express | 5.1.0 |
| CSV Parsing | papaparse | 5.5.2 |
| File Upload | multer | 1.4.5-lts.2 |
| AI | @anthropic-ai/sdk | TBD (Phase 4) |
| Language | TypeScript | 5.9.2 |

---

## How to Resume

```bash
cd c:\Users\ASUS\OneDrive\Desktop\GrowEasy

# Install deps
pnpm install

# Start both apps
pnpm --filter api dev    # → http://localhost:3001
pnpm --filter web dev    # → http://localhost:3000

# Or start all together
pnpm dev
```

Then continue with **Phase 3** (CRM schema + validator).
