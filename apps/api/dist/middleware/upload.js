"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.handleMulterError = handleMulterError;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") {
        cb(new Error("Only .csv files are allowed"));
        return;
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
});
/**
 * Error handler specifically for multer errors (file too large, wrong type, etc.)
 */
function handleMulterError(err, _req, res, next) {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({
                success: false,
                error: "File size exceeds the 5MB limit",
                code: "FILE_TOO_LARGE",
            });
            return;
        }
        res.status(400).json({
            success: false,
            error: err.message,
            code: "UPLOAD_ERROR",
        });
        return;
    }
    if (err.message === "Only .csv files are allowed") {
        res.status(400).json({
            success: false,
            error: err.message,
            code: "INVALID_FILE_TYPE",
        });
        return;
    }
    next(err);
}
//# sourceMappingURL=upload.js.map