"use client";

import { useEffect, useState } from "react";
import { useCsvImport } from "../hooks/useCsvImport";
import FileDropzone from "../components/FileDropzone";
import CsvPreviewTable from "../components/CsvPreviewTable";
import ProgressBar from "../components/ProgressBar";
import ImportSummaryCards from "../components/ImportSummaryCards";
import ResultTable from "../components/ResultTable";
import styles from "./page.module.css";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Home() {
  const {
    step,
    fileInfo,
    csvData,
    importResult,
    error,
    handleFile,
    confirmImport,
    reset,
  } = useCsvImport();

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoMark}>
          <div className={styles.logoIcon}>⚡</div>
          <span className={styles.logoText}>GrowEasy</span>
        </div>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          type="button"
          title="Toggle light/dark mode"
        >
          {theme === "light" ? "🌙 Night Mode" : "☀️ Light Mode"}
        </button>
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

        {/* Step 2: Preview modal overlay */}
        {step === "preview" && csvData && fileInfo && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
              <button
                className={styles.modalCloseBtn}
                onClick={reset}
                type="button"
                aria-label="Close"
              >
                ✕
              </button>

              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Import Leads via CSV</h2>
                <p className={styles.modalSubtitle}>
                  Upload a CSV file to bulk import leads into your system.
                </p>
              </div>

              {/* Selected File Card */}
              <div className={styles.fileCard}>
                <div className={styles.fileIconWrapper}>
                  <span>📄</span>
                  <span className={styles.fileIconLabel}>CSV</span>
                </div>
                <div className={styles.fileTextInfo}>
                  <p className={styles.modalFileName}>{fileInfo.name}</p>
                  <p className={styles.fileSize}>{formatFileSize(fileInfo.size)}</p>
                </div>
                <button
                  className={styles.fileRemoveBtn}
                  onClick={reset}
                  type="button"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>

              {/* Preview table */}
              <CsvPreviewTable
                headers={csvData.headers}
                rows={csvData.rows}
              />

              {/* Footer buttons */}
              <div className={styles.modalFooter}>
                <button
                  className={styles.btnCancel}
                  onClick={reset}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.btnUpload}
                  onClick={confirmImport}
                  type="button"
                  id="btn-confirm-import"
                >
                  Upload File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Uploading — ProgressBar overlay */}
        {step === "uploading" && <ProgressBar />}

        {/* Step 4: Done — Results */}
        {step === "done" && importResult && (
          <div className={styles.resultSection}>
            {/* Result header */}
            <div className={styles.resultHeader}>
              <div>
                <h2 className={styles.resultTitle}>
                  <span className="gradient-text">Import Complete</span> 🎉
                </h2>
                <p className={styles.resultSubtitle}>
                  {fileInfo?.name
                    ? `${fileInfo.name} — processed successfully`
                    : "Your CSV has been processed successfully"}
                </p>
              </div>
              <button
                className={styles.btnPrimary}
                onClick={reset}
                type="button"
                id="btn-import-another"
              >
                ↻ Import Another
              </button>
            </div>

            {/* Summary cards */}
            <ImportSummaryCards
              totalRows={importResult.summary.total_rows}
              totalImported={importResult.summary.total_imported}
              totalSkipped={importResult.summary.total_skipped}
            />

            {/* Result table */}
            <ResultTable
              parsed={importResult.parsed}
              skipped={importResult.skipped}
            />
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
