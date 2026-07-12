"use client";

import styles from "./ImportSummaryCards.module.css";

interface ImportSummaryCardsProps {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

/**
 * Three stat cards showing import results:
 * Total Rows | Imported | Skipped
 */
export default function ImportSummaryCards({
  totalRows,
  totalImported,
  totalSkipped,
}: ImportSummaryCardsProps) {
  return (
    <div className={styles.grid} id="import-summary">
      {/* Total */}
      <div className={styles.card}>
        <div className={`${styles.iconWrap} ${styles.iconTotal}`}>📋</div>
        <div className={styles.textGroup}>
          <span className={`${styles.value} ${styles.valueTotal}`}>
            {totalRows}
          </span>
          <span className={styles.label}>Total Rows</span>
        </div>
      </div>

      {/* Imported */}
      <div className={styles.card}>
        <div className={`${styles.iconWrap} ${styles.iconImported}`}>✅</div>
        <div className={styles.textGroup}>
          <span className={`${styles.value} ${styles.valueImported}`}>
            {totalImported}
          </span>
          <span className={styles.label}>Imported</span>
        </div>
      </div>

      {/* Skipped */}
      <div className={styles.card}>
        <div className={`${styles.iconWrap} ${styles.iconSkipped}`}>⚠️</div>
        <div className={styles.textGroup}>
          <span className={`${styles.value} ${styles.valueSkipped}`}>
            {totalSkipped}
          </span>
          <span className={styles.label}>Skipped</span>
        </div>
      </div>
    </div>
  );
}
