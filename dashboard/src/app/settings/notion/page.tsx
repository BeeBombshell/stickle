"use client";

// Notion credentials (API key + Database ID) are stored in the extension's
// chrome.storage.local (keys: notionApiKey, notionDatabaseId) by the Options page.
// The dashboard cannot read/write chrome.storage.local — it has no extension context.
// This page explains how to set it up and shows sync status from Supabase.

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

function IconExternalLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function NotionSettingsPage() {
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase
          .from("notes")
          .select("synced_to_notion")
          .is("deleted_at", null);

        if (data) {
          setSyncedCount(data.filter((n: any) => n.synced_to_notion).length);
          setUnsyncedCount(data.filter((n: any) => !n.synced_to_notion).length);
        }
      } catch {
        // Silently fail — user may not be signed in yet
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <span className="eyebrow" style={{ marginBottom: "6px" }}>
          INTEGRATIONS
        </span>
        <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.4px" }}>
          Notion Database Sync
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-ink-muted)", marginTop: "4px" }}>
          Push your web annotations and highlighted snippets directly to a Notion database.
        </p>
      </div>

      {/* How it works banner */}
      <div
        style={{
          padding: "20px 24px",
          background: "var(--color-block-lime)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-hairline)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "14px" }}>
          ⚙️ Notion credentials are configured in the Extension Options
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-ink-muted)", margin: 0 }}>
          Your Notion Integration API Token and Database ID are stored securely in the extension's local storage (
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>chrome.storage.local</code>). The dashboard cannot access the extension's storage directly.
          To set up or update your Notion connection, open the extension options page.
        </p>
        <a
          href="chrome-extension://your-extension-id/options.html"
          target="_blank"
          rel="noreferrer"
          className="btn-pill btn-primary"
          style={{ fontSize: "13px", padding: "8px 16px", width: "fit-content", marginTop: "4px" }}
          onClick={(e) => {
            // Extension links only work in the extension context — show guidance instead
            e.preventDefault();
            window.open("chrome://extensions/", "_blank");
          }}
        >
          <IconExternalLink />
          Open Extension Options
        </a>
      </div>

      {/* Setup Steps */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "12px" }}>Setup Guide</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              step: "1",
              title: "Create a Notion Integration",
              desc: (
                <>
                  Go to{" "}
                  <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" style={{ color: "#111", fontWeight: 600 }}>
                    notion.so/my-integrations
                  </a>{" "}
                  and create a new internal integration. Copy the <strong>Integration Token</strong> (starts with <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>secret_</code>).
                </>
              ),
            },
            {
              step: "2",
              title: "Share your Notion Database with the Integration",
              desc: "Open your target Notion database → click ··· → Connections → add your integration. Without this step, Notion will return a 403 Forbidden error.",
            },
            {
              step: "3",
              title: "Copy your Database ID",
              desc: (
                <>
                  From your Notion database URL:{" "}
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    notion.so/workspace/<strong>[32-char-id]</strong>?v=...
                  </code>
                  . The ID is the 32-character hex string before the <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>?v=</code>.
                </>
              ),
            },
            {
              step: "4",
              title: "Enter credentials in the Extension Options",
              desc: "Click the Stickle extension icon → ⚙️ Settings, paste your Integration Token and Database ID, then click Save & Test Connection.",
            },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                padding: "16px 20px",
                background: "white",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#111",
                  color: "#e4f579",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {s.step}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{s.title}</div>
                <div style={{ fontSize: "13px", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Stats */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "12px" }}>Sync Status</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div
            style={{
              padding: "20px",
              background: "white",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-hairline)",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", color: "#166534" }}>
              {loading ? "—" : (syncedCount ?? 0)}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-ink-muted)", marginTop: "4px" }}>
              Notes synced to Notion
            </div>
          </div>
          <div
            style={{
              padding: "20px",
              background: "white",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-hairline)",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", color: unsyncedCount ? "#b45309" : "#166534" }}>
              {loading ? "—" : (unsyncedCount ?? 0)}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-ink-muted)", marginTop: "4px" }}>
              Notes pending Notion sync
            </div>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "var(--color-ink-muted)", marginTop: "8px" }}>
          Sync is triggered from the extension sidebar (📤 Sync to Notion button) or automatically when notes are created with Notion configured.
        </p>
      </div>
    </div>
  );
}
