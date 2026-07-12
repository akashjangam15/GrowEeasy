/**
 * Allowed values for crm_status. Empty string means unset.
 */
export type CrmStatus = "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE" | "";
export declare const CRM_STATUS_VALUES: ReadonlySet<string>;
/**
 * Allowed values for data_source. Empty string means unset.
 */
export type DataSource = "leads_on_demand" | "meridian_tower" | "eden_park" | "varah_swamy" | "sarjapur_plots" | "";
export declare const DATA_SOURCE_VALUES: ReadonlySet<string>;
/**
 * A single CRM lead record — the target schema that every
 * imported CSV row is mapped into.
 */
export interface CrmRecord {
    created_at: string;
    name: string;
    email: string;
    country_code: string;
    mobile_without_country_code: string;
    company: string;
    city: string;
    state: string;
    country: string;
    lead_owner: string;
    crm_status: CrmStatus;
    crm_note: string;
    data_source: DataSource;
    possession_time: string;
    description: string;
}
/**
 * A row that could not be imported — carries the reason and the original data.
 */
export interface SkippedRecord {
    row_index: number;
    reason: string;
    raw: Record<string, string>;
}
/**
 * The full response shape returned by POST /api/import.
 */
export interface ImportResponse {
    success: boolean;
    summary: {
        total_rows: number;
        total_imported: number;
        total_skipped: number;
    };
    parsed: CrmRecord[];
    skipped: SkippedRecord[];
}
//# sourceMappingURL=crm.types.d.ts.map