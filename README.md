# 🚀 GrowEasy AI CSV Importer

> **Intelligent, AI-powered CSV lead ingestion for real-estate CRMs.**

GrowEasy is a state-of-the-art AI-powered CSV Importer. Instead of forcing users to manually map columns in a complex UI, GrowEasy leverages Large Language Models (supporting both **Google Gemini 2.5** and **Llama-3.3 via Groq** with an automatic fallback) to dynamically map arbitrary columns from messy exports (e.g., Facebook Leads, Google Ads, manual spreadsheets) into a fixed, canonical CRM schema. The importer validates records against strict business rules, parses multiple inputs, normalizes values, and returns clean, structured datasets ready for CRM insertion.

> [!IMPORTANT]
> **Production Demo Limitation**: If you are testing the application using our live production deployment, please use the provided sample CSV files (available in the [sample-data](GrowEasy/sample-data) directory). Because we do not have paid/high-tier AI support on the production deployment, processing large CSV files online might exceed rate/token limits.
> 
> To import large datasets or run custom uploads without limitations, please **set up this project locally** and configure your own API keys.

---

## 🏗️ Technical Architecture & Monorepo Structure

GrowEasy is managed as a high-performance monorepo using **Turborepo** and **pnpm workspaces**.

```text
GrowEasy/
├── apps/
│   ├── web/                     # Next.js 16 Frontend (App Router, Port 3000)
│   │   ├── app/                 # Upload -> Preview -> Validation flow pages
│   │   ├── components/          # Reusable UI (Dropzone, Tables, Cards, Progress)
│   │   ├── hooks/               # useCsvImport client state-machine hook
│   │   └── lib/                 # API client wrapper
│   └── api/                     # Express 5 Backend (Port 3001)
│       ├── src/
│       │   ├── index.ts         # Server entry, health endpoint & routing
│       │   ├── controllers/     # Import flow control & error handling
│       │   ├── services/        # CSV Parsing, AI Mapping, Validator services
│       │   ├── prompts/         # CRM Mapping system/user prompts
│       │   └── utils/           # Helper scripts (Batching, Exponential backoff retry)
│       └── tests/               # Vitest unit test suite (validator & mapper)
├── packages/
│   └── shared-types/            # Shared TypeScript CRM definitions (Lints & Schemas)
└── sample-data/                 # CSV files representing messy formats for testing
```

### 🛡️ Architectural Rules
1. **Separation of Concerns**: The frontend and backend communicate strictly via HTTP APIs.
2. **AI Location**: All LLM processing lives on the backend. The frontend never makes direct model calls, and API secrets are never exposed to the client.
3. **Shared Types**: Shared CRM definitions and schemas are maintained in the `shared-types` local workspace package to ensure type-safety across both ends.

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Monorepo Manager** | Turborepo + pnpm workspaces | pnpm 9.0.0+ |
| **Frontend** | Next.js (App Router, React 19) | 16.2.0 |
| **Backend** | Express.js (Node / TypeScript) | 5.1.0 |
| **CSV Parsing** | PapaParse | 5.5.2 |
| **File Handling** | Multer | 1.4.5-lts.2 |
| **AI SDK & Model** | Google Gen AI (Gemini 2.5) & OpenAI SDK (Llama 3.3 via Groq) | @google/genai & openai |
| **Testing** | Vitest | 4.1.10 |
| **Styling** | CSS Modules (Vanilla CSS) | Native |

---

## 📋 Target CRM Schema Specifications

Messy columns from the CSV are dynamically mapped into the following canonical CRM format:

### 1. Data Fields

| Field Name | Type | Allowed Values / Formatting | Description |
| :--- | :--- | :--- | :--- |
| `created_at` | `string` | ISO 8601 DateTime (or `""` if blank) | Record creation date, auto-normalized |
| `name` | `string` | Free text | Lead name |
| `email` | `string` | Single valid email | Primary email address |
| `country_code` | `string` | e.g. `+91`, `+1` | Extracted country code from mobile number |
| `mobile_without_country_code` | `string` | Numbers only | Cleaned phone number |
| `company` | `string` | Free text | User's company |
| `city` | `string` | Free text | City |
| `state` | `string` | Free text | State |
| `country` | `string` | Free text | Country |
| `lead_owner` | `string` | Free text | Assigned sales agent |
| `crm_status` | `string` | See Status Enums below | Lead quality tag |
| `crm_note` | `string` | Free text (accumulated) | Overflow data and validator comments |
| `data_source` | `string` | See Source Enums below | Origin project or platform |
| `possession_time` | `string` | Free text | Expected real estate possession timeframe |
| `description` | `string` | Free text | General notes or user comments |

### 2. Supported Enums

*   **`crm_status`**:
    *   `GOOD_LEAD_FOLLOW_UP`
    *   `DID_NOT_CONNECT`
    *   `BAD_LEAD`
    *   `SALE_DONE`
    *   `""` (Unspecified)
*   **`data_source`**:
    *   `leads_on_demand`
    *   `meridian_tower`
    *   `eden_park`
    *   `varah_swamy`
    *   `sarjapur_plots`
    *   `""` (Unspecified)

---

## ⚡ Core Business & Validation Rules

To ensure high-quality data ingestion, the backend runs a rigorous validation pipeline on the AI-mapped output:

1.  **Skip Rule (Essential Contacts)**: Any lead row that contains **neither** a valid email **nor** a valid mobile number is automatically flagged as **skipped** and excluded from the main import.
2.  **Date Normalization**: Raw dates like `"29th June 2026"` or `"12-07-2026"` are normalized into standard ISO 8601 strings. If parsing fails, the field is set to empty and the original date is stored in the notes.
3.  **Multi-Item Separation**:
    *   If a row contains multiple email addresses, the first is kept as primary. Remaining emails are appended to `crm_note`.
    *   If a row contains multiple phone numbers, the first is parsed for country code and number, while other numbers are appended to `crm_note`.
4.  **Enum Safeguards**: Values mapping to `crm_status` or `data_source` that don't match the strict whitelists are set to `""`. The raw input values are appended to `crm_note` for auditing.
5.  **Robust Error Batching**: Row mapping is sent to the LLM in configurable batches (default 20). If a batch fails (e.g. rate limit), it retries up to 3 times with exponential backoff. If it still fails, those rows are saved to `skipped` with the reason `"AI processing failed"`.
6.  **Dual-Provider Fallback**: The app attempts to process mapping through **Gemini** (free/primary tier) if `GEMINI_API_KEY` is configured. If Gemini mapping fails or is unconfigured, it automatically falls back to **Groq** (`llama-3.3-70b-versatile`) to process the batch.

---

## 💻 Local Setup & Development

Follow these steps to run the frontend and backend servers locally on your machine.

### 📋 Prerequisites
*   [Node.js](https://nodejs.org/) (Version >= 18.0.0)
*   [pnpm](https://pnpm.io/) (Version >= 9.0.0)

### 🏃 Step 1: Install Dependencies
From the root of the project directory, run:
```bash
pnpm install
```

### 🔑 Step 2: Configure Environment Variables
Navigate to the API folder and clone the example environment file:
```bash
cd apps/api
cp .env.example .env
```
Open `apps/api/.env` and update the settings:
```ini
# --- Required (At least one must be set. Gemini is primary, falling back to Groq) ---
# Get your Gemini key from: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
# Get your Groq key from: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1

# --- Optional configurations ---
GEMINI_MODEL=gemini-3.5-flash
AI_MODEL=llama-3.3-70b-versatile
PORT=3001
FRONTEND_URL=http://localhost:3000
AI_BATCH_SIZE=20
NODE_ENV=development
```

### 🚀 Step 3: Run the Application
Navigate back to the root of the repository and launch both the Next.js app and the Express API in development mode:
```bash
cd ../..
pnpm dev
```
This single command fires up:
*   **Next.js Web App**: `http://localhost:3000`
*   **Express API Server**: `http://localhost:3001`

---

## 🧪 Testing the Application

GrowEasy uses **Vitest** for server-side business validation and mapping logic verification.

### Run API Unit Tests
To execute tests for date normalization, splitting logic, enum guards, and parsing rules:
```bash
pnpm --filter api test
```

### Test Datasets
Sample CSV files are provided in `sample-data/` to test against the system's dynamic mapping capabilities:
*   [facebook_leads_export.csv](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/sample-data/facebook_leads_export.csv): Standard raw export with custom Facebook form columns.
*   [google_ads_export.csv](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/sample-data/google_ads_export.csv): CSV using structured columns from Google campaigns.
*   [messy_manual_sheet.csv](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/sample-data/messy_manual_sheet.csv): Manually input data with typos in headers (e.g., `Nmae`, `Ph no.`).
*   [real_estate_crm_export.csv](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/sample-data/real_estate_crm_export.csv): Large dataset with 1000+ entries.

---

## ☁️ Deployment

For cloud hosting, you can deploy the stack on PaaS options. See the full [PaaS Deployment Guide](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/docs/paas-deployment-guide.md) for detailed step-by-step instructions.

### Quick Recommendations
*   **Frontend (Next.js)**: Host on **Vercel Hobby** or **Netlify Starter** (Free tier). Set root directory to `apps/web` and add the `NEXT_PUBLIC_API_URL` environment variable.
*   **Backend (Express API)**: Host on **Render** as a web service. Set the build command to `pnpm install && pnpm run build --filter=api` and start command to `pnpm run start --filter=api`. Ensure `GROQ_API_KEY` is added to the backend environment configurations.
