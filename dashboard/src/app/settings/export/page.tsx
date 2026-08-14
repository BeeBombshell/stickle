"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default function ExportSettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleExportJson = async () => {
    setIsExporting(true);
    setStatus(null);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .is("deleted_at", null);

      if (error) throw error;

      const formattedNotes = (data || []).map((item: any) => ({
        id: item.local_id || item.id,
        url: item.url,
        pageTitle: item.page_title,
        content: item.content,
        anchor: item.anchor,
        color: item.color,
        borderStyle: item.border_style,
        collapsed: item.collapsed,
        highlightRange: item.highlight_range,
        tags: item.tags || [],
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        syncedToNotion: Boolean(item.synced_to_notion),
      }));

      const exportPkg = {
        version: 1,
        exportedAt: Date.now(),
        notesCount: formattedNotes.length,
        notes: formattedNotes,
      };

      const jsonStr = JSON.stringify(exportPkg, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `stickle_export_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({
        type: "success",
        message: `Successfully exported ${formattedNotes.length} notes to stickle_export_${dateStr}.json`,
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Export failed: ${err?.message || "Could not retrieve notes"}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const rawNotes = Array.isArray(parsed) ? parsed : Array.isArray(parsed.notes) ? parsed.notes : null;

        if (!rawNotes) {
          throw new Error("Invalid JSON format. Expected an array of notes.");
        }

        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("You must be signed in to import notes into the cloud.");
        }

        let imported = 0;
        for (const note of rawNotes) {
          if (!note.id || !note.url || typeof note.content !== "string") continue;
          const payload = {
            local_id: String(note.id),
            user_id: session.user.id,
            url: String(note.url),
            domain: note.url ? new URL(note.url).hostname : "",
            page_title: String(note.pageTitle || note.page_title || "Untitled Note"),
            content: String(note.content),
            anchor: note.anchor || { cssSelector: "body", tier: "selector", offsetX: 0, offsetY: 0 },
            color: note.color || "lime",
            border_style: note.borderStyle || note.border_style || "solid",
            collapsed: Boolean(note.collapsed),
            highlight_range: note.highlightRange || note.highlight_range || null,
            tags: Array.isArray(note.tags) ? note.tags : [],
            updated_at: new Date(note.updatedAt || note.updated_at || Date.now()).toISOString(),
          };

          await supabase.from("notes").upsert(payload, { onConflict: "user_id,local_id" });
          imported++;
        }

        setStatus({
          type: "success",
          message: `Successfully imported ${imported} notes into your Stickle database!`,
        });
      } catch (err: any) {
        setStatus({
          type: "error",
          message: `Import failed: ${err?.message || "Invalid backup file"}`,
        });
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <span className="eyebrow" style={{ marginBottom: "6px" }}>
          BACKUP & RESTORE
        </span>
        <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.4px" }}>
          JSON Backup & Portable Export
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-ink-muted)", marginTop: "4px" }}>
          Download a complete offline JSON backup of your annotations or restore notes from a backup.
        </p>
      </div>

      {status && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: status.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: status.type === "success" ? "#166534" : "#dc2626",
            border: `1px solid ${status.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {status.message}
        </div>
      )}

      {/* Export Box */}
      <div
        style={{
          padding: "24px",
          background: "white",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
            Export JSON Backup
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-ink-muted)" }}>
            Includes all text content, DOM selectors, colors, border styles, tags, and timestamps.
          </div>
        </div>
        <button
          onClick={handleExportJson}
          disabled={isExporting}
          className="btn-pill btn-primary"
          style={{ fontSize: "13px", padding: "10px 20px", flexShrink: 0 }}
        >
          <IconDownload />
          {isExporting ? "Exporting…" : "Download JSON Backup"}
        </button>
      </div>

      {/* Import Box */}
      <div
        style={{
          padding: "24px",
          background: "white",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
            Import from JSON Backup
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-ink-muted)" }}>
            Upload a previously exported Stickle JSON backup file to merge notes into your database.
          </div>
        </div>
        <label
          className="btn-pill btn-secondary"
          style={{
            fontSize: "13px",
            padding: "10px 20px",
            flexShrink: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <IconUpload />
          {isImporting ? "Importing…" : "Upload Backup File"}
          <input
            type="file"
            accept=".json"
            onChange={handleImportJson}
            disabled={isImporting}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}
