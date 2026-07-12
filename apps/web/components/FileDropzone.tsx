"use client";

import { useRef, useState, useCallback } from "react";
import styles from "./FileDropzone.module.css";
import { UploadCloud, FileDown } from "lucide-react";

interface FileDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function FileDropzone({ onFile, disabled }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFile(files[0]);
      }
    },
    [onFile, disabled]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFile(files[0]);
      }
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [onFile]
  );

  const downloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const headers = [
      "created_at",
      "name",
      "email",
      "country_code",
      "mobile_without_country_code",
      "company",
      "city",
      "state",
      "country",
      "lead_owner",
      "crm_status",
      "crm_note",
      "data_source",
      "possession_time",
      "description"
    ].join(",");

    const sampleRow = [
      "2026-05-13 14:20:48",
      "John Doe",
      "john.doe@example.com",
      "+91",
      "9876543210",
      "GrowEasy",
      "Mumbai",
      "Maharashtra",
      "India",
      "test@gmail.com",
      "GOOD_LEAD_FOLLOW_UP",
      "Client is asking to reschedule demo",
      "",
      "",
      ""
    ].map(val => `"${val.replace(/"/g, '""')}"`).join(",");

    const csvContent = `${headers}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "groweasy_crm_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="file-dropzone"
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ""} ${
        disabled ? styles.disabled : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload CSV file"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        className={styles.hiddenInput}
        tabIndex={-1}
      />

      {/* Upload icon */}
      <div className={styles.iconWrapper}>
        <UploadCloud size={40} className={styles.icon} />
      </div>

      <div className={styles.text}>
        <p className={styles.primary}>
          {isDragging ? "Drop your CSV here" : "Drag & drop your CSV file"}
        </p>
        <p className={styles.secondary}>
          or <span className={styles.browseLink}>browse files</span>
        </p>
      </div>

      <div className={styles.meta}>
        <span className={styles.badge}>CSV</span>
        <span className={styles.limit}>Max 5MB</span>
      </div>

      <div className={styles.metaTemplate}>
        <p className={styles.templateHeaders}>
          <strong>Required headers:</strong> created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, crm_status, crm_note, data_source, possession_time, description.<br />
          <span style={{ opacity: 0.8 }}>Note: Template includes default + custom CRM fields to reduce upload errors.</span>
        </p>
        <button
          className={styles.downloadBtn}
          onClick={downloadTemplate}
          type="button"
          title="Download sample CSV template"
        >
          <FileDown size={14} /> Download Sample CSV Template
        </button>
      </div>
    </div>
  );
}
