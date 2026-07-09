# Phase 1 — Skeleton

**Date:** July 8, 2026  
**Goal:** Establish the foundational monorepo structure with a working Express API backend and Next.js frontend, connected via a health check round-trip.

---

## What Was Built

### 1. `apps/api` — Express Backend (NEW)

A standalone Express 5 server with TypeScript, running on port 3001.

| File | Purpose |
|------|---------|
| [package.json](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/package.json) | Express, cors, dotenv, ts-node-dev |
| [tsconfig.json](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/tsconfig.json) | Target ES2020, commonjs modules, outDir `dist/` |
| [src/index.ts](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/api/src/index.ts) | Server entry — CORS, `GET /health` endpoint |

**`GET /health` response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-08T07:35:25.337Z",
  "uptime": 25.81
}
```

---

### 2. `apps/web` — Next.js Frontend (MODIFIED)

Cleaned up the Turborepo boilerplate and replaced it with a GrowEasy-branded landing page that pings the API.

#### Files Changed

| File | What Changed |
|------|-------------|
| [package.json](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/package.json) | Removed broken workspace deps (`@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`) |
| [tsconfig.json](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/tsconfig.json) | Inlined compiler options (was extending deleted `@repo/typescript-config/nextjs.json`) |
| [eslint.config.js](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/eslint.config.js) | Replaced `@repo/eslint-config` import with minimal standalone config |
| [app/layout.tsx](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/app/layout.tsx) | Updated metadata for GrowEasy, added Inter from Google Fonts, removed local font refs |
| [app/globals.css](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/app/globals.css) | Full dark-mode design system with CSS custom properties, glassmorphism utilities, keyframes |
| [app/page.module.css](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/app/page.module.css) | New component styles — hero section, status card, ambient glows, responsive layout |
| [app/page.tsx](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/apps/web/app/page.tsx) | Client component with health check fetch, glassmorphic status card, gradient branding |

---

### 3. Root Config Changes

| File | What Changed |
|------|-------------|
| [turbo.json](file:///c:/Users/ASUS/OneDrive/Desktop/GrowEasy/turbo.json) | Added `dist/**` to build outputs for the API app |

---

## Design System (CSS Custom Properties)

The design system is defined in `globals.css` with these tokens:

- **Brand:** `--ge-primary` (#6C5CE7 purple), `--ge-accent` (#00cec9 teal)
- **Surfaces:** Dark theme — `--ge-bg-primary` (#0a0b10), `--ge-bg-card` (translucent)
- **Text:** Three tiers — `--ge-text-primary`, `--ge-text-secondary`, `--ge-text-muted`
- **Effects:** Glassmorphism (`.glass-card`), gradient text (`.gradient-text`), ambient radial glows
- **Animations:** `fadeInUp`, `pulse-ring`, `float`, `shimmer`, `spin`

---

## How to Run

```bash
# Install dependencies
pnpm install

# Start both apps via Turborepo
pnpm dev

# Or start individually
pnpm --filter api dev    # → http://localhost:3001
pnpm --filter web dev    # → http://localhost:3000
```

---

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm install` | ✅ No missing workspace errors |
| API `GET /health` | ✅ Returns `{ status: "ok" }` |
| Frontend loads | ✅ Renders GrowEasy branding |
| Health ping round-trip | ✅ Shows "Connected" with green dot |
