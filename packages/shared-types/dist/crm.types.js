"use strict";
// ─── CRM Record Schema ───────────────────────────────────
// The canonical shape every CSV row must be mapped into.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_SOURCE_VALUES = exports.CRM_STATUS_VALUES = void 0;
exports.CRM_STATUS_VALUES = new Set([
    "GOOD_LEAD_FOLLOW_UP",
    "DID_NOT_CONNECT",
    "BAD_LEAD",
    "SALE_DONE",
    "",
]);
exports.DATA_SOURCE_VALUES = new Set([
    "leads_on_demand",
    "meridian_tower",
    "eden_park",
    "varah_swamy",
    "sarjapur_plots",
    "",
]);
//# sourceMappingURL=crm.types.js.map