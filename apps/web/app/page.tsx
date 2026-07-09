"use client";

import { useCsvImport } from "../hooks/useCsvImport";
import FileDropzone from "../components/FileDropzone";
import CsvPreviewTable from "../components/CsvPreviewTable";
import styles from "./page.module.css";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Home() {
  const { step, fileInfo, csvData, error, handleFile, reset } = useCsvImport();

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoMark}>
          <div className={styles.logoIcon}>⚡</div>
          <span className={styles.logoText}>GrowEasy</span>
        </div>
      </header>

      {/* Hero (only on upload step) */}
      {step === "upload" && (
        <section className={styles.hero}>
          <h1 className={styles.title}>
            <span className="gradient-text">AI-Powered</span> CSV Importer
          </h1>
          <p className={styles.subtitle}>
            Upload any CSV of leads — Facebook exports, Google Ads, messy
            spreadsheets — and let AI intelligently map it into your CRM schema.
          </p>
        </section>
      )}

      {/* Main content */}
      <main className={styles.main}>
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className={styles.uploadSection}>
            <FileDropzone onFile={handleFile} />
          </div>
        )}

        {/* Error state */}
        {step === "error" && (
          <div className={styles.errorSection}>
            <div className={`${styles.errorCard} glass-card`}>
              <div className={styles.errorIcon}>⚠️</div>
              <h2 className={styles.errorTitle}>Something went wrong</h2>
              <p className={styles.errorMessage}>{error}</p>
              <button
                className={styles.btnPrimary}
                onClick={reset}
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && csvData && fileInfo && (
          <div className={styles.previewSection}>
            {/* File info bar */}
            <div className={`${styles.fileInfoBar} glass-card`}>
              <div className={styles.fileDetails}>
                <span className={styles.fileIcon}>📄</span>
                <div>
                  <p className={styles.fileName}>{fileInfo.name}</p>
                  <p className={styles.fileMeta}>
                    {formatFileSize(fileInfo.size)} • {csvData.totalRows} rows •{" "}
                    {csvData.headers.length} columns
                  </p>
                </div>
              </div>
              <button
                className={styles.btnGhost}
                onClick={reset}
                type="button"
              >
                ✕ Remove
              </button>
            </div>

            {/* Preview table */}
            <CsvPreviewTable
              headers={csvData.headers}
              rows={csvData.rows}
            />

            {/* Confirm button */}
            <div className={styles.confirmBar}>
              <p className={styles.confirmHint}>
                Review your data above, then confirm to start AI mapping.
              </p>
              <button
                className={styles.btnConfirm}
                type="button"
                disabled
                title="AI mapping will be available in Phase 4"
              >
                <span className={styles.btnConfirmIcon}>🚀</span>
                Confirm & Import
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          <span>GrowEasy</span> — AI CSV Importer
        </p>
      </footer>
    </div>
  );
}
