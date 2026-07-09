import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import importRoute from "./routes/import.route";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow the frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
