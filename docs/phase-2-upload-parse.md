# Phase 2 — Upload + Parse (No AI)

**Date:** July 8, 2026  
**Goal:** Full CSV upload pipeline — backend receives and parses CSVs via multer + papaparse; frontend provides drag-and-drop upload with client-side CSV preview.

---

## What Was Built

### 1. Backend — `apps/api` (5 new files, 1 modified)

| File | Type | Purpose |
|------|------|---------|
| [upload.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/src/middleware/upload.ts) | NEW | Multer middleware — memory storage, 5MB limit, `.csv` only, custom error handler |
| [errorHandler.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/src/middleware/errorHandler.ts) | NEW | Global Express error handler with consistent JSON shape |
| [csvParser.service.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/src/services/csvParser.service.ts) | NEW | Parses CSV buffer → `{ headers, rows, totalRows }` using papaparse |
| [import.controller.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/src/controllers/import.controller.ts) | NEW | `POST /api/import` handler — validates file, parses CSV, echoes rows |
| [import.route.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/src/routes/import.route.ts) | NEW | Express router wiring multer → error handler → controller |
| [index.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/src/index.ts) | MODIFIED | Added `/api/import` route and global error handler |

#### API Endpoint

```
POST /api/import
Content-Type: multipart/form-data
Field: file (CSV, max 5MB)

Response (200):
{
  "success": true,
  "message": "CSV parsed successfully (AI mapping not yet applied)",
  "data": {
    "filename": "facebook_leads_export.csv",
    "fileSize": 1083,
    "totalRows": 9,
    "headers": ["full_name", "email", "phone_number", ...],
    "rows": [{ ... }, ...]
  }
}
```

#### Dependencies Added
- `multer` ^1.4.5-lts.2 — multipart file upload
- `papaparse` ^5.5.2 — CSV parsing
- `@types/multer`, `@types/papaparse` — TypeScript definitions

---

### 2. Frontend — `apps/web` (6 new files, 2 modified)

| File | Type | Purpose |
|------|------|---------|
| [FileDropzone.tsx](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/components/FileDropzone.tsx) | NEW | Drag & drop + click-to-browse file upload zone |
| [FileDropzone.module.css](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/components/FileDropzone.module.css) | NEW | Dashed border, drag-over glow, floating icon animations |
| [CsvPreviewTable.tsx](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/components/CsvPreviewTable.tsx) | NEW | Sticky-header scrollable table with row numbers, badges, truncation notice |
| [CsvPreviewTable.module.css](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/components/CsvPreviewTable.module.css) | NEW | Zebra stripes, hover highlights, sticky row numbers, ellipsis overflow |
| [useCsvImport.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/hooks/useCsvImport.ts) | NEW | State machine (upload→preview→uploading→done→error), client-side papaparse |
| [api.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/lib/api.ts) | NEW | API client — `uploadCsv()` and `checkHealth()` |
| [page.tsx](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/app/page.tsx) | MODIFIED | Upload → Preview flow with file info bar, preview table, disabled confirm button |
| [page.module.css](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/app/page.module.css) | MODIFIED | New page layout with upload/preview/error sections |

#### Dependencies Added
- `papaparse` ^5.5.2 — client-side CSV preview parsing
- `@types/papaparse` ^5.3.15 — TypeScript definitions

---

### 3. Sample Data

| File | Purpose |
|------|---------|
| [facebook_leads_export.csv](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/sample-data/facebook_leads_export.csv) | 9 rows with edge cases: multi-email, missing contact, varied date formats |

---

## User Flow

1. **Upload** — User sees the hero + FileDropzone. Drag & drop or click to browse.
2. **Preview** — Client-side papaparse parses the CSV instantly. Shows file info bar (name, size, rows, columns) + scrollable preview table.
3. **Confirm** — "Confirm & Import" button is present but disabled (AI mapping comes in Phase 4).
4. **Reset** — "✕ Remove" button clears file and returns to upload step.

---

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm install` | ✅ All deps installed |
| `POST /api/import` with CSV | ✅ Returns 9 parsed rows with correct headers |
| Upload page renders | ✅ Dropzone with icon, text, CSV badge, 5MB limit |
| CSV preview after upload | ✅ Sticky header table with 15 columns, 9 rows, file info bar |
| Remove/reset | ✅ Returns to upload step |
