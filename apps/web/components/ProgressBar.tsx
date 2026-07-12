"use client";

import styles from "./ProgressBar.module.css";

/**
 * Full-screen loading overlay shown while the backend
 * is processing the CSV through AI mapping + validation.
 */
export default function ProgressBar() {
  return (
    <div className={styles.overlay} id="progress-overlay">
      <div className={styles.card}>
        {/* Animated spinner */}
        <div className={styles.spinnerContainer}>
          <div className={styles.spinnerGlow} />
          <div className={styles.spinner} />
          <span className={styles.spinnerIcon}>⚡</span>
        </div>

        {/* Text */}
        <div className={styles.textGroup}>
          <p className={styles.title}>AI is mapping your data</p>
          <p className={styles.subtitle}>
            Analyzing columns, parsing fields, and mapping into your CRM schema…
          </p>
        </div>

        {/* Indeterminate progress bar */}
        <div className={styles.barTrack}>
          <div className={styles.barFill} />
        </div>

        {/* Bouncing dots */}
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
