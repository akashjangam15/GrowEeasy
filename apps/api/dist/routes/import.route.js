"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middleware/upload");
const import_controller_1 = require("../controllers/import.controller");
const router = (0, express_1.Router)();
// POST /api/import — upload a CSV file for processing
router.post("/", upload_1.upload.single("file"), upload_1.handleMulterError, // error-handling middleware for multer
import_controller_1.importCsv);
exports.default = router;
//# sourceMappingURL=import.route.js.map