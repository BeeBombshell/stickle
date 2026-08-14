"use client";

import { useState } from "react";

// ─── Lucide SVG icons ─────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconCpu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  );
}

interface KeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
}

export default function TokensPage() {
  const [keys, setKeys] = useState<KeyRecord[]>([
    {
      id: "key-1",
      name: "Claude Desktop Local",
      key_prefix: "sk_stickle_8f9a...",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      last_used_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ]);
  const [keyName, setKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeMcpTab, setActiveMcpTab] = useState<"claude" | "cursor" | "http">("claude");
  const [configCopied, setConfigCopied] = useState(false);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const fullKey = `sk_stickle_${randomHex}`;
    const newRecord: KeyRecord = {
      id: `key-${Date.now()}`,
      name: keyName.trim(),
      key_prefix: `${fullKey.slice(0, 15)}...`,
      created_at: new Date().toISOString(),
    };

    setKeys([newRecord, ...keys]);
    setNewlyCreatedKey(fullKey);
    setKeyName("");
  };

  const handleCopyKey = () => {
    if (!newlyCreatedKey) return;
    navigator.clipboard.writeText(newlyCreatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    if (keys.length === 1) setNewlyCreatedKey(null);
  };

  const activeTokenSnippet = newlyCreatedKey || "sk_stickle_YOUR_TOKEN_HERE";

  const mcpConfigs = {
    claude: JSON.stringify(
      {
        mcpServers: {
          stickle: {
            command: "npx",
            args: ["-y", "@stickle/mcp-server", "--api-key", activeTokenSnippet],
          },
        },
      },
      null,
      2
    ),
    cursor: JSON.stringify(
      {
        mcpServers: {
          stickle: {
            command: "npx",
            args: ["-y", "@stickle/mcp-server", "--api-key", activeTokenSnippet],
          },
        },
      },
      null,
      2
    ),
    http: JSON.stringify(
      {
        mcpServers: {
          stickle: {
            url: "https://stickle.app/api/mcp",
            headers: {
              Authorization: `Bearer ${activeTokenSnippet}`,
            },
          },
        },
      },
      null,
      2
    ),
  };

  const copyConfigSnippet = () => {
    navigator.clipboard.writeText(mcpConfigs[activeMcpTab]);
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "6px" }}>
          REMOTE MCP INTEGRATION
        </span>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.3px",
            marginBottom: "6px",
          }}
        >
          API Tokens & MCP Setup
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
          Create Bearer secret keys to connect Claude Desktop, Cursor, or Antigravity with your Stickle Remote MCP server.
        </p>
      </div>

      {/* New key banner */}
      {newlyCreatedKey && (
        <div
          className="color-block color-block-navy"
          style={{ padding: "20px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--color-block-lime)",
              }}
            >
              <IconAlertTriangle />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Save this key — only shown once
              </span>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                fontSize: "18px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "12px" }}>
            Copy your API key below. For security, it will not be displayed again.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.08)",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <code
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "white",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                userSelect: "all",
              }}
            >
              {newlyCreatedKey}
            </code>
            <button
              onClick={handleCopyKey}
              className="btn-pill btn-lime"
              style={{ fontSize: "12px", padding: "6px 14px", gap: "5px", flexShrink: 0 }}
            >
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Generate form */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "10px" }}>
          Generate New Token
        </span>
        <form onSubmit={handleGenerateKey} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="e.g. Claude Desktop, Cursor Mac, Team Agent…"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
            style={{
              flex: 1,
              padding: "10px 18px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-hairline)",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              color: "var(--color-ink)",
              background: "white",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="btn-pill btn-primary"
            style={{ fontSize: "13px", gap: "6px", flexShrink: 0 }}
          >
            <IconPlus />
            Create Token
          </button>
        </form>
      </div>

      {/* Active keys */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <span className="eyebrow">Active Tokens ({keys.length})</span>
        </div>

        {keys.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 24px",
              background: "white",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-hairline)",
            }}
          >
            <p style={{ fontSize: "14px", color: "var(--color-ink-muted)" }}>
              No active tokens. Generate a token above to get started.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-hairline)",
              overflow: "hidden",
            }}
          >
            {keys.map((k, i) => (
              <div
                key={k.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "16px 20px",
                  borderTop: i > 0 ? "1px solid var(--color-hairline-soft)" : "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "4px",
                      color: "var(--color-ink)",
                    }}
                  >
                    {k.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--color-ink-muted)",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 8px",
                        background: "var(--color-surface-soft)",
                        borderRadius: "4px",
                      }}
                    >
                      {k.key_prefix}
                    </span>
                    <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
                    {k.last_used_at && (
                      <span>
                        Last used{" "}
                        {new Date(k.last_used_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(k.id)}
                  className="btn-pill btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "6px 14px",
                    gap: "5px",
                    color: "#dc2626",
                    flexShrink: 0,
                  }}
                >
                  <IconTrash />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MCP Setup Guide Section ── */}
      <div
        className="color-block color-block-soft"
        style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--color-block-lime)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#111",
            }}
          >
            <IconCpu />
          </span>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>How to Connect Stickle MCP</h3>
            <p style={{ fontSize: "13px", color: "var(--color-ink-muted)" }}>
              Expose your web sticky notes directly to Claude Desktop, Cursor, or AI coding agents.
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "claude", label: "Claude Desktop" },
            { id: "cursor", label: "Cursor IDE" },
            { id: "http", label: "Remote SSE / HTTP" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMcpTab(tab.id as any)}
              className="btn-pill"
              style={{
                fontSize: "12px",
                padding: "6px 16px",
                background:
                  activeMcpTab === tab.id
                    ? "var(--color-primary)"
                    : "white",
                color:
                  activeMcpTab === tab.id
                    ? "var(--color-on-primary)"
                    : "var(--color-ink)",
                border:
                  activeMcpTab === tab.id
                    ? "none"
                    : "1px solid var(--color-hairline)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div style={{ fontSize: "13px", color: "var(--color-ink)", lineHeight: 1.6 }}>
          {activeMcpTab === "claude" && (
            <p>
              Add the following to your <code>claude_desktop_config.json</code> file (located at <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> on macOS or <code>%APPDATA%\Claude\claude_desktop_config.json</code> on Windows):
            </p>
          )}
          {activeMcpTab === "cursor" && (
            <p>
              In Cursor, go to <strong>Settings &gt; Features &gt; MCP Servers</strong>, add a new server named <code>stickle</code>, select <code>command</code> type, and paste the config snippet below:
            </p>
          )}
          {activeMcpTab === "http" && (
            <p>
              To connect via remote SSE/HTTP stream (e.g. for cloud agents or web workers), use the Stickle Remote MCP server endpoint:
            </p>
          )}
        </div>

        {/* Code snippet block */}
        <div style={{ position: "relative" }}>
          <pre
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              background: "#111111",
              color: "#e4f579",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              overflowX: "auto",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {mcpConfigs[activeMcpTab]}
          </pre>

          <button
            onClick={copyConfigSnippet}
            className="btn-pill btn-lime"
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              fontSize: "11px",
              padding: "4px 12px",
              gap: "4px",
            }}
          >
            {configCopied ? <IconCheck /> : <IconCopy />}
            {configCopied ? "Copied!" : "Copy JSON"}
          </button>
        </div>

        {/* Features list */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            paddingTop: "8px",
          }}
        >
          <div style={{ padding: "12px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--color-hairline)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>search_stickle_notes</div>
            <div style={{ fontSize: "12px", color: "var(--color-ink-muted)" }}>Search notes by domain, keyword, or tag.</div>
          </div>
          <div style={{ padding: "12px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--color-hairline)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>get_notes_for_url</div>
            <div style={{ fontSize: "12px", color: "var(--color-ink-muted)" }}>Fetch active stickles pinned to a specific URL.</div>
          </div>
          <div style={{ padding: "12px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--color-hairline)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>export_stickle_summary</div>
            <div style={{ fontSize: "12px", color: "var(--color-ink-muted)" }}>Synthesize research notes into Markdown/Notion.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
