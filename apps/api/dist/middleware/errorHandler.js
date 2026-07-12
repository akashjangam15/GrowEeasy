"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
/**
 * Global error handler — catches unhandled errors and returns a consistent JSON shape.
 */
function errorHandler(err, _req, res, _next) {
    console.error("Unhandled error:", err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
        code: "INTERNAL_ERROR",
    });
}
//# sourceMappingURL=errorHandler.js.map