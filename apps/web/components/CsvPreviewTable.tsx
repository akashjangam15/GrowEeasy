"use client";

import styles from "./CsvPreviewTable.module.css";

interface CsvPreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  maxPreviewRows?: number;
}

export default function CsvPreviewTable({
  headers,
  rows,
  maxPreviewRows = 50,
}: CsvPreviewTableProps) {
  const displayRows = rows.slice(0, maxPreviewRows);
  const hasMore = rows.length > maxPreviewRows;

  return (
    <div className={styles.wrapper}>
      {/* Header bar */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.tableIcon}>📊</span>
          <span className={styles.title}>CSV Preview</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.badge}>{headers.length} columns</span>
          <span className={styles.badge}>{rows.length} rows</span>
        </div>
      </div>

      {/* Scrollable table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rowNumHeader}>#</th>
              {headers.map((h) => (
                <th key={h} className={styles.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} className={styles.tr}>
                <td className={styles.rowNum}>{i + 1}</td>
                {headers.map((h) => (
                  <td key={h} className={styles.td} title={row[h] || ""}>
                    {row[h] || <span className={styles.empty}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Truncation notice */}
      {hasMore && (
        <div className={styles.truncated}>
          Showing {maxPreviewRows} of {rows.length} rows
        </div>
      )}
    </div>
  );
}
