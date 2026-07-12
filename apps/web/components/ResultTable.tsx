"use client";

import { useState } from "react";
import type { CrmRecord, SkippedRecord } from "../lib/api";
import styles from "./ResultTable.module.css";

type Tab = "imported" | "skipped";

interface ResultTableProps {
  parsed: CrmRecord[];
  skipped: SkippedRecord[];
}

/** Key CRM fields to display in the imported tab */
const DISPLAY_FIELDS: { key: keyof CrmRecord; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
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
        >
          ✅ Imported
          <span className={`${styles.tabBadge} ${styles.badgeImported}`}>
            {parsed.length}
          </span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === "skipped" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("skipped")}
          type="button"
          id="tab-skipped"
        >
          ⚠️ Skipped
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
              <span className={styles.emptyIcon}>📭</span>
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
              <span className={styles.emptyIcon}>🎉</span>
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
