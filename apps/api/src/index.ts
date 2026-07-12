import "dotenv/config";
import express from "express";
import cors from "cors";
import importRoute from "./routes/import.route";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow the frontend origin(s)
// Accepts: explicit FRONTEND_URL(s) (comma-separated), localhost in dev,
// and any Vercel preview/production deployment for this project.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const vercelPreview = /^https:\/\/grow-eeasy-web[\w-]*\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, health checks) with no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ─── Routes ──────────────────────────────────────────────

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// CSV import
app.use("/api/import", importRoute);

// ─── Error handling ──────────────────────────────────────

app.use(errorHandler as any);

app.listen(PORT, () => {
  console.log(`🚀 GrowEasy API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Import CSV:   POST http://localhost:${PORT}/api/import`);
});

export default app;
