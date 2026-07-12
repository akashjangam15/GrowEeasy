"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const import_route_1 = __importDefault(require("./routes/import.route"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// CORS — allow the frontend origin(s)
// Accepts: explicit FRONTEND_URL(s) (comma-separated), localhost in dev,
// and any Vercel preview/production deployment for this project.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
const vercelPreview = /^https:\/\/grow-eeasy-web[\w-]*\.vercel\.app$/;
app.use((0, cors_1.default)({
    origin(origin, callback) {
        // Allow non-browser clients (curl, health checks) with no Origin header.
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express_1.default.json());
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
app.use("/api/import", import_route_1.default);
// ─── Error handling ──────────────────────────────────────
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 GrowEasy API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Import CSV:   POST http://localhost:${PORT}/api/import`);
});
exports.default = app;
//# sourceMappingURL=index.js.map