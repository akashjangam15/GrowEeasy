"use client";

import { useState } from "react";
import type { CrmRecord, SkippedRecord } from "../lib/api";
import styles from "./ResultTable.module.css";
import { CheckCircle2, AlertTriangle, Inbox, Check, Calendar, Pencil, X } from "lucide-react";

type Tab = "imported" | "skipped";

interface ResultTableProps {
  parsed: CrmRecord[];
  skipped: SkippedRecord[];
  onUpdateRecord?: (index: number, updatedRecord: CrmRecord) => void;
}

/** Key CRM fields to display in the imported tab */
const DISPLAY_FIELDS: { key: keyof CrmRecord; label: string }[] = [
  { key: "created_at", label: "Date" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Owner" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
  { key: "possession_time", label: "Possession" },
  { key: "crm_note", label: "Notes" },
  { key: "description", label: "Description" },
];

function getStatusClass(status: string): string {
  switch (status) {
    case "GOOD_LEAD_FOLLOW_UP":
    case "SALE_DONE":
      return styles.statusGood;
    case "BAD_LEAD":
      return styles.statusBad;
    case "DID_NOT_CONNECT":
      return styles.statusNeutral;
    default:
      return styles.statusBlank;
  }
}

function formatStatus(status: string): string {
  if (!status) return "—";
  return status.replace(/_/g, " ");
}

function formatSource(source: string): string {
  if (!source) return "—";
  return source.replace(/_/g, " ");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const yyyy = date.getUTCFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return dateStr;
  }
}

/**
 * Tabbed result table showing imported (parsed) records
 * and skipped records with their skip reasons.
 */
export default function ResultTable({ parsed, skipped, onUpdateRecord }: ResultTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>("imported");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<CrmRecord | null>(null);

  const handleEditClick = (index: number, record: CrmRecord) => {
    setEditingIndex(index);
    setEditingRecord({ ...record });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIndex !== null && editingRecord !== null) {
      onUpdateRecord?.(editingIndex, editingRecord);
    }
    setEditingIndex(null);
    setEditingRecord(null);
  };

  return (
    <div className={styles.wrapper} id="result-table">
      {/* Tab bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "imported" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("imported")}
          type="button"
          id="tab-imported"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <CheckCircle2 size={16} /> Imported
          <span className={`${styles.tabBadge} ${styles.badgeImported}`}>
            {parsed.length}
          </span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === "skipped" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("skipped")}
          type="button"
          id="tab-skipped"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <AlertTriangle size={16} /> Skipped
          <span className={`${styles.tabBadge} ${styles.badgeSkipped}`}>
            {skipped.length}
          </span>
        </button>
      </div>

      {/* Imported Tab */}
      {activeTab === "imported" && (
        <>
          {parsed.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox size={48} className={styles.emptyIcon} color="var(--text-secondary)" style={{ marginBottom: "12px" }} />
              <p className={styles.emptyText}>No imported records</p>
              <p className={styles.emptySubtext}>
                All rows were skipped during processing
              </p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.rowNumHeader}>#</th>
                    {DISPLAY_FIELDS.map((f) => (
                      <th key={f.key} className={styles.th}>
                        {f.label}
                      </th>
                    ))}
                    {onUpdateRecord && <th className={styles.th} style={{ textAlign: "center" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((record, i) => (
                    <tr key={i} className={styles.tr}>
                      <td className={styles.rowNum}>{i + 1}</td>
                      {DISPLAY_FIELDS.map((f) => {
                        const val = record[f.key];
                        // Special rendering for status and source
                        if (f.key === "crm_status") {
                          return (
                            <td key={f.key} className={styles.td}>
                              <span
                                className={`${styles.statusBadge} ${getStatusClass(val)}`}
                              >
                                {formatStatus(val)}
                              </span>
                            </td>
                          );
                        }
                        if (f.key === "data_source") {
                          return (
                            <td key={f.key} className={styles.td}>
                              <span
                                className={`${styles.statusBadge} ${val ? styles.statusNeutral : styles.statusBlank}`}
                              >
                                {formatSource(val)}
                              </span>
                            </td>
                          );
                        }
                        if (f.key === "created_at") {
                          return (
                            <td key={f.key} className={styles.td} title={val || ""}>
                              {val ? (
                                <span className={styles.dateCell}>
                                  <Calendar size={13} className={styles.dateIcon} />
                                  {formatDate(val)}
                                </span>
                              ) : (
                                <span className={styles.empty}>—</span>
                              )}
                            </td>
                          );
                        }
                        return (
                          <td
                            key={f.key}
                            className={styles.td}
                            title={val || ""}
                          >
                            {val || (
                              <span className={styles.empty}>—</span>
                            )}
                          </td>
                        );
                      })}
                      {onUpdateRecord && (
                        <td className={styles.td} style={{ textAlign: "center" }}>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleEditClick(i, record)}
                            type="button"
                            title="Edit Record"
                          >
                            <Pencil size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Skipped Tab */}
      {activeTab === "skipped" && (
        <>
          {skipped.length === 0 ? (
            <div className={styles.emptyState}>
              <Check size={48} className={styles.emptyIcon} color="var(--success)" style={{ marginBottom: "12px" }} />
              <p className={styles.emptyText}>No skipped records</p>
              <p className={styles.emptySubtext}>
                All rows were successfully imported!
              </p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.rowNumHeader}>Row</th>
                    <th className={styles.th}>Reason</th>
                    {skipped.length > 0 &&
                      Object.keys(skipped[0].raw).map((key) => (
                        <th key={key} className={styles.th}>
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {skipped.map((record, i) => (
                    <tr key={i} className={styles.tr}>
                      <td className={styles.rowNum}>{record.row_index}</td>
                      <td className={styles.reasonCell}>
                        <span className={styles.reasonBadge}>
                          {record.reason}
                        </span>
                      </td>
                      {Object.keys(skipped[0].raw).map((key) => (
                        <td
                          key={key}
                          className={styles.td}
                          title={record.raw[key] || ""}
                        >
                          {record.raw[key] || (
                            <span className={styles.empty}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Edit Modal Dialog */}
      {editingRecord !== null && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} glass-card`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Lead Record</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  setEditingIndex(null);
                  setEditingRecord(null);
                }}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lead Name</label>
                  <input
                    type="text"
                    value={editingRecord.name || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    value={editingRecord.email || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, email: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Country Code</label>
                  <input
                    type="text"
                    value={editingRecord.country_code || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, country_code: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mobile Number</label>
                  <input
                    type="text"
                    value={editingRecord.mobile_without_country_code || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, mobile_without_country_code: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company</label>
                  <input
                    type="text"
                    value={editingRecord.company || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, company: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City</label>
                  <input
                    type="text"
                    value={editingRecord.city || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, city: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>State</label>
                  <input
                    type="text"
                    value={editingRecord.state || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, state: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Country</label>
                  <input
                    type="text"
                    value={editingRecord.country || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, country: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Owner</label>
                  <input
                    type="text"
                    value={editingRecord.lead_owner || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, lead_owner: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lead Status</label>
                  <select
                    value={editingRecord.crm_status || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, crm_status: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="">Select Status</option>
                    <option value="GOOD_LEAD_FOLLOW_UP">GOOD LEAD FOLLOW UP</option>
                    <option value="DID_NOT_CONNECT">DID NOT CONNECT</option>
                    <option value="BAD_LEAD">BAD LEAD</option>
                    <option value="SALE_DONE">SALE DONE</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Source</label>
                  <select
                    value={editingRecord.data_source || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, data_source: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="">Select Source</option>
                    <option value="leads_on_demand">leads_on_demand</option>
                    <option value="meridian_tower">meridian_tower</option>
                    <option value="eden_park">eden_park</option>
                    <option value="varah_swamy">varah_swamy</option>
                    <option value="sarjapur_plots">sarjapur_plots</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date (created_at)</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD HH:MM:SS"
                    value={editingRecord.created_at || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, created_at: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Possession Time</label>
                  <input
                    type="text"
                    value={editingRecord.possession_time || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, possession_time: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                  <label className={styles.formLabel}>Notes (crm_note)</label>
                  <textarea
                    value={editingRecord.crm_note || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, crm_note: e.target.value })}
                    className={styles.formTextarea}
                    rows={2}
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    value={editingRecord.description || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, description: e.target.value })}
                    className={styles.formTextarea}
                    rows={2}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    setEditingRecord(null);
                  }}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
