"use client";

import { useState } from "react";

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type ClientTab = "claude" | "cursor" | "windsurf" | "remote_sse";

// The actual registered tools from remote-mcp/src/mcp-handler.ts
const MCP_TOOLS = [
  { name: "list_stickle_notes", desc: "List all your saved notes from Supabase cloud sync" },
  { name: "search_stickle_notes", desc: "Full-text search across your notes by keyword" },
  { name: "get_notes_for_url", desc: "Retrieve notes anchored to a specific webpage URL" },
  { name: "add_stickle_note", desc: "Create and pin a new sticky note programmatically" },
  { name: "export_stickle_summary", desc: "Generate a Markdown synthesis report of your notes" },
  { name: "get_team_activity_timeline", desc: "Retrieve the activity timeline for a shared workspace" },
];

const CONFIGS: Record<ClientTab, { label: string; path: string; content: string }> = {
  claude: {
    label: "Claude Desktop",
    path: "~/Library/Application Support/Claude/claude_desktop_config.json",
    content: `{
  "mcpServers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"]
    }
  }
}`,
  },
  cursor: {
    label: "Cursor IDE",
    path: ".cursor/mcp.json (project root)",
    content: `{
  "mcpServers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"]
    }
  }
}`,
  },
  windsurf: {
    label: "Windsurf",
    path: "~/.codeium/windsurf/mcp_config.json",
    content: `{
  "mcpServers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"]
    }
  }
}`,
  },
  remote_sse: {
    label: "Remote SSE (Claude / ChatGPT)",
    path: "claude_desktop_config.json — remote transport",
    content: `{
  "mcpServers": {
    "stickle-remote": {
      "url": "http://localhost:3001/sse",
      "headers": {
        "Authorization": "Bearer YOUR_STICKLE_API_TOKEN"
      }
    }
  }
}`,
  },
};

export default function ConnectedMcpsPage() {
  const [activeTab, setActiveTab] = useState<ClientTab>("claude");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CONFIGS[activeTab].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <span className="eyebrow" style={{ marginBottom: "6px" }}>
          MODEL CONTEXT PROTOCOL
        </span>
        <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.4px" }}>
          Connected MCP Servers
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-ink-muted)", marginTop: "4px" }}>
          Connect your web annotations to Claude Desktop, Cursor, Windsurf, and remote LLM agents via MCP.
          API tokens are managed under the{" "}
          <a href="/settings/tokens" style={{ color: "#111", fontWeight: 600 }}>API Tokens</a> tab.
        </p>
      </div>

      {/* Transport Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div
          style={{
            padding: "20px",
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-hairline)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>Stdio (Local)</div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "50px",
                background: "#f0fdf4",
                color: "#166534",
                fontWeight: 600,
              }}
            >
              Always available
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-ink-muted)", margin: 0 }}>
            Runs as a child process via <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>npx stickle mcp</code>. Works offline — no API key needed. Best for Claude Desktop and Cursor.
          </p>
        </div>

        <div
          style={{
            padding: "20px",
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-hairline)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>HTTP/SSE (Remote)</div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "50px",
                background: "var(--color-block-lime)",
                color: "#111",
                fontWeight: 600,
              }}
            >
              Requires API Token
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-ink-muted)", margin: 0 }}>
            HTTP Server-Sent Events on <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>:3001/sse</code>. Authenticated via Bearer token. Deploy via Cloudflare Workers (<code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>wrangler deploy</code>).
          </p>
        </div>
      </div>

      {/* Registered Tools */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "12px" }}>
          Registered Tools ({MCP_TOOLS.length})
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {MCP_TOOLS.map((tool) => (
            <div
              key={tool.name}
              style={{
                padding: "14px 16px",
                background: "white",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                {tool.name}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-ink-muted)" }}>{tool.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Config Generator */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span className="eyebrow">Config Generator</span>
          <button
            onClick={handleCopy}
            className="btn-pill btn-secondary"
            style={{ fontSize: "11px", padding: "4px 12px", gap: "6px" }}
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Client tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          {(Object.keys(CONFIGS) as ClientTab[]).map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                fontSize: "12px",
                padding: "5px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--color-hairline)",
                background: activeTab === id ? "#111" : "white",
                color: activeTab === id ? "#fff" : "var(--color-ink)",
                cursor: "pointer",
                fontWeight: activeTab === id ? 600 : 400,
              }}
            >
              {CONFIGS[id].label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: "12px", color: "var(--color-ink-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
          📂 {CONFIGS[activeTab].path}
        </p>

        <pre
          style={{
            padding: "16px",
            background: "#111111",
            color: "#e4f579",
            borderRadius: "var(--radius-lg)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            overflowX: "auto",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {CONFIGS[activeTab].content}
        </pre>

        {activeTab === "remote_sse" && (
          <p style={{ fontSize: "12px", color: "var(--color-ink-muted)", marginTop: "10px" }}>
            ⚠️ Replace <code style={{ fontFamily: "var(--font-mono)" }}>YOUR_STICKLE_API_TOKEN</code> with a token from the{" "}
            <a href="/settings/tokens" style={{ color: "#111", fontWeight: 600 }}>API Tokens</a> tab.
          </p>
        )}
      </div>
    </div>
  );
}
