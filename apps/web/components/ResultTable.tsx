"use client";

import { useState } from "react";
import type { CrmRecord, SkippedRecord } from "../lib/api";
import styles from "./ResultTable.module.css";
import { CheckCircle2, AlertTriangle, Inbox, Check, Calendar } from "lucide-react";

type Tab = "imported" | "skipped";

interface ResultTableProps {
  parsed: CrmRecord[];
  skipped: SkippedRecord[];
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
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Tabbed result table showing imported (parsed) records
 * and skipped records with their skip reasons.
 */
export default function ResultTable({ parsed, skipped }: ResultTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>("imported");

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
    </div>
  );
}
