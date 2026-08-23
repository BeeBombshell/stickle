# 🤖 Stickle MCP Integration Guide

Stickle exposes your browser sticky notes to AI assistants via the **Model Context Protocol (MCP)**.  
There are **two independent modes** — pick the one that fits your setup:

| Mode | Transport | Needs internet? | Needs API key? | Best for |
|:---|:---|:---:|:---:|:---|
| **Local stdio** (`npx stickle mcp`) | stdin/stdout | ❌ No | ❌ No | Desktop AI clients (Claude Desktop, Cursor, Windsurf) |
| **Remote SSE** (`http://localhost:3001/sse`) | HTTP / SSE | ✅ Yes (Supabase) | ✅ Yes | Cloud-hosted agents, team-shared notes |

---

## Table of Contents

1. [How it works](#how-it-works)
2. [Mode A — Local stdio MCP (recommended for most users)](#mode-a--local-stdio-mcp-recommended-for-most-users)
   - [Step 1 — Install or run Stickle](#step-1--install-or-run-stickle-from-source)
   - [Step 2 — Export your notes from the browser](#step-2--export-your-notes-from-the-browser-extension)
   - [Step 3 — Configure your AI client](#step-3--configure-your-ai-client)
     - [Claude Desktop](#claude-desktop)
     - [Cursor](#cursor)
     - [Windsurf](#windsurf)
     - [VS Code (Copilot)](#vs-code-copilot)
     - [Zed](#zed)
   - [Step 4 — Verify the connection](#step-4--verify-the-connection)
   - [Custom notes file path](#custom-notes-file-path)
3. [Mode B — Remote SSE MCP (cloud / team sync)](#mode-b--remote-sse-mcp-cloud--team-sync)
   - [Step 1 — Start the remote server locally](#step-1--start-the-remote-server-locally)
   - [Step 2 — Generate an API key](#step-2--generate-an-api-key)
   - [Step 3 — Configure your AI client for SSE](#step-3--configure-your-ai-client-for-remote-sse)
   - [Step 4 — Deploy to Cloudflare Workers (optional)](#step-4--deploy-to-cloudflare-workers-optional)
4. [MCP Tool Reference](#mcp-tool-reference)
5. [Troubleshooting](#troubleshooting)

---

## How it works

```
┌─────────────────────────┐       stdio / SSE       ┌─────────────────────────┐
│   AI Client             │ ◄──────────────────────► │   Stickle MCP Server    │
│  (Claude, Cursor, etc.) │                          │                         │
└─────────────────────────┘                          │  reads ~/.stickle/      │
                                                     │  notes.json  (local)    │
                                                     │  OR Supabase DB (remote)│
                                                     └─────────────────────────┘
                                                               ▲
                                                               │  JSON export
                                                     ┌─────────────────────────┐
                                                     │  Chrome Extension       │
                                                     │  (stickle popup)        │
                                                     └─────────────────────────┘
```

**Local mode** reads a plain JSON file from `~/.stickle/notes.json`.  
**Remote mode** queries your Supabase cloud database and requires a valid API key.

---

## Mode A — Local stdio MCP (recommended for most users)

The local MCP server runs as a child process spawned by your AI client.  
It reads notes from a local JSON file — no server, no cloud, fully private.

### Step 1 — Install or run Stickle from source

**Option A — Run directly from source (no npm publish needed)**

```bash
# Clone the repo if you haven't
git clone https://github.com/BeeBombshell/stickle.git
cd stickle

# Install dependencies
pnpm install
```

The MCP server entry point is `mcp-server/index.ts` and is aliased as:

```bash
pnpm mcp   # runs: tsx mcp-server/index.ts
```

**Option B — Via npx (once published to npm)**

```bash
npx -y stickle mcp
```

> [!NOTE]
> The local MCP server requires **Node.js ≥ 18**. Run `node --version` to verify.

---

### Step 2 — Export your notes from the browser extension

The local MCP server reads from `~/.stickle/notes.json`.  
You need to export your notes from the Chrome extension into this file.

**How to export:**

1. Click the **Stickle icon** in the Chrome toolbar to open the popup.
2. Navigate to **Settings → Export / Backup**.
3. Click **"Export JSON"** — this downloads `stickle_export_YYYY-MM-DD.json`.
4. Move the exported file to `~/.stickle/notes.json`:

```bash
# Create the directory if it doesn't exist
mkdir -p ~/.stickle

# Copy your export (replace with the actual filename)
cp ~/Downloads/stickle_export_2026-08-21.json ~/.stickle/notes.json
```

**Alternatively, set a custom path via environment variable:**

```bash
export STICKLE_NOTES_PATH=/path/to/your/notes.json
```

> [!TIP]
> **Keeping notes in sync**: Re-export from the extension whenever you add new notes, or automate it with a cron job / shell alias. The MCP server always reads the file fresh on each tool call.

---

### Step 3 — Configure your AI client

Pick the client you use and follow the steps below.

---

#### Claude Desktop

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Step-by-step:**

1. Open (or create) the config file:

```bash
# macOS
open -a TextEdit ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

2. Add the Stickle MCP server entry. If running **from source**:

```json
{
  "mcpServers": {
    "stickle": {
      "command": "pnpm",
      "args": ["--prefix", "/absolute/path/to/stickle", "mcp"],
      "env": {
        "STICKLE_NOTES_PATH": "/Users/yourname/.stickle/notes.json"
      }
    }
  }
}
```

Or if using **npx** (once published):

```json
{
  "mcpServers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"],
      "env": {
        "STICKLE_NOTES_PATH": "/Users/yourname/.stickle/notes.json"
      }
    }
  }
}
```

3. **Restart Claude Desktop** (Cmd+Q and reopen on macOS).

4. In a new conversation, look for the 🔧 tool icon in the input bar — it should list Stickle tools. You can test with:
   > "List my Stickle notes"

---

#### Cursor

1. Open **Cursor → Settings → Features → MCP Servers** (or press `Cmd+Shift+P` → "Open MCP Settings").

2. Add a new server entry:

```json
{
  "mcpServers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"],
      "env": {
        "STICKLE_NOTES_PATH": "/Users/yourname/.stickle/notes.json"
      }
    }
  }
}
```

3. Save and **reload the Cursor window** (`Cmd+Shift+P` → "Reload Window").

4. Open the Cursor Agent panel — Stickle tools will appear in the tools list.

---

#### Windsurf

1. Open **Windsurf → Settings → MCP** (gear icon → "Cascade MCP Settings").

2. The MCP config file is located at `~/.codeium/windsurf/mcp_config.json`. Add:

```json
{
  "mcpServers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"],
      "env": {
        "STICKLE_NOTES_PATH": "/Users/yourname/.stickle/notes.json"
      }
    }
  }
}
```

3. **Restart Windsurf** or use "Reload MCP Config" from the command palette.

---

#### VS Code (Copilot)

VS Code supports MCP servers from version 1.99+.

1. Open **Settings** (`Cmd+,`) → search for "MCP".
2. Click **"Edit in settings.json"** and add:

```json
{
  "github.copilot.chat.mcp.servers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"],
      "env": {
        "STICKLE_NOTES_PATH": "/Users/yourname/.stickle/notes.json"
      }
    }
  }
}
```

3. Restart VS Code. In a Copilot Chat window, switch to **Agent mode** (`@workspace`). Stickle tools will appear in the tool picker.

---

#### Zed

1. Open `~/.config/zed/settings.json` and add:

```json
{
  "context_servers": {
    "stickle": {
      "command": {
        "path": "npx",
        "args": ["-y", "stickle", "mcp"],
        "env": {
          "STICKLE_NOTES_PATH": "/Users/yourname/.stickle/notes.json"
        }
      }
    }
  }
}
```

2. **Restart Zed** — the Stickle context server will be available in the Assistant panel.

---

### Step 4 — Verify the connection

Run the server manually to confirm it starts without errors:

```bash
# From the stickle repo root
pnpm mcp

# Expected output (on stderr):
# Stickle MCP Server running on stdio
```

Then press `Ctrl+C` to exit. If you see any errors, see [Troubleshooting](#troubleshooting).

---

### Custom notes file path

You can override the default `~/.stickle/notes.json` path in three ways:

| Method | How |
|:---|:---|
| **Environment variable** | `STICKLE_NOTES_PATH=/path/to/notes.json pnpm mcp` |
| **AI client `env` config** | Set `"STICKLE_NOTES_PATH"` in the `env` block of your client config (shown above) |
| **Symlink** | `ln -s /path/to/your/export.json ~/.stickle/notes.json` |

The server resolves the path in this priority order:
1. Argument passed programmatically (internal use)
2. `STICKLE_NOTES_PATH` environment variable
3. `~/.stickle/notes.json` (default)

---

## Mode B — Remote SSE MCP (cloud / team sync)

The remote MCP server exposes your cloud-synced Stickle notes over HTTP+SSE.  
It requires a **Supabase backend** and a **Stickle API key**.

### Step 1 — Start the remote server locally

```bash
cd remote-mcp

# Install dependencies
pnpm install

# Copy and fill in your environment variables
cp .env.example .env
```

Edit `remote-mcp/.env`:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_your_dodo_webhook_secret   # optional
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS). **Never commit this key to a public repository.**

Start the server:

```bash
pnpm dev
# Output: 🚀 Stickle Remote MCP Server running on http://localhost:3001
```

Confirm it is healthy:

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"stickle-remote-mcp","timestamp":"..."}
```

---

### Step 2 — Generate an API key

1. Open the **Stickle Web Dashboard** at `http://localhost:3001` (or `https://app.stickle.app`).
2. Navigate to **Settings → API Tokens**.
3. Click **"Create New Token"**, give it a name (e.g. `claude-desktop`), and copy the key.

The key looks like: `sk_stickle_xxxxxxxxxxxxxxxxxxxxxxxx`

> [!IMPORTANT]
> The key is shown only once. Store it in a password manager.

---

### Step 3 — Configure your AI client for remote SSE

#### Claude Desktop (SSE)

```json
{
  "mcpServers": {
    "stickle-remote": {
      "url": "http://localhost:3001/sse",
      "headers": {
        "Authorization": "Bearer sk_stickle_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

> [!NOTE]
> For the **hosted cloud endpoint**, replace `http://localhost:3001` with `https://mcp.stickle.app`.

#### Cursor (SSE)

In Cursor's MCP settings, add:

```json
{
  "mcpServers": {
    "stickle-remote": {
      "url": "http://localhost:3001/sse",
      "headers": {
        "Authorization": "Bearer sk_stickle_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

#### Any client that does not support `headers` (legacy)

Pass the API key as a query parameter instead:

```
http://localhost:3001/sse?apiKey=sk_stickle_YOUR_API_KEY_HERE
```

> [!WARNING]
> Query-parameter auth sends the key in the URL, which may be logged by proxies. Prefer the `Authorization` header where possible.

---

### Step 4 — Deploy to Cloudflare Workers (optional)

To make the remote MCP available at a public URL:

1. **Install Wrangler CLI:**

```bash
npm i -g wrangler
```

2. **Authenticate:**

```bash
npx wrangler login
```

3. **Add secrets** (never put these in `wrangler.toml`):

```bash
npx wrangler secret put SUPABASE_URL
# Paste your Supabase URL when prompted

npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key when prompted
```

4. **Deploy:**

```bash
cd remote-mcp
npx wrangler deploy
# Output: https://stickle-remote-mcp.<your-subdomain>.workers.dev
```

5. Update your AI client config to point to the deployed URL:

```json
{
  "mcpServers": {
    "stickle-remote": {
      "url": "https://stickle-remote-mcp.<your-subdomain>.workers.dev/sse",
      "headers": {
        "Authorization": "Bearer sk_stickle_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

---

## MCP Tool Reference

All tools are available in both local and remote modes, except `get_team_activity_timeline` which requires cloud sync.

| Tool | Description | Required params | Optional params |
|:---|:---|:---|:---|
| `list_stickle_notes` | List saved notes | — | `domain`, `tag`, `limit` (default 50) |
| `search_stickle_notes` | Full-text search across content, titles, URLs, tags | `query` | `tag` |
| `get_notes_for_url` | All notes anchored to a specific URL | `url` | — |
| `add_stickle_note` | Create and attach a new note to a URL | `url`, `content` | `pageTitle`, `tags[]`, `color` |
| `export_stickle_summary` | Markdown report grouped by site domain | — | `domain`, `tag` |
| `get_team_activity_timeline` | Team workspace activity feed *(remote only)* | — | `workspaceId`, `limit` |

### Color values for `add_stickle_note`

`lime` · `lilac` · `cream` · `mint` · `pink` · `coral` · `blue`

### Example prompts to try with your AI client

```
"Show me all my Stickle notes tagged #research"
"Search my web notes for anything about React Server Components"
"Add a note to https://github.com/vercel/next.js saying 'check the App Router docs'"
"Give me a Markdown summary of all my notes from github.com"
"List notes from wikipedia.org, limit 10"
```

---

## Troubleshooting

### `list_stickle_notes` returns 0 notes

**Cause:** Notes file not found or empty.

**Fix:** Confirm the file exists and is valid JSON:

```bash
ls -la ~/.stickle/notes.json
python3 -m json.tool ~/.stickle/notes.json | head -5
```

If the file is missing, re-export from the Chrome extension (see [Step 2](#step-2--export-your-notes-from-the-browser-extension)).

---

### Claude Desktop shows no Stickle tools

**Cause:** Config path error or server failed to start.

**Steps:**
1. Open the Claude Desktop developer console (`Cmd+Option+I` on macOS).
2. Look for `[MCP]` errors in the Console tab.
3. Confirm the path in `claude_desktop_config.json` is **absolute** (not `~/...`).
4. Test the command manually in a terminal:

```bash
# Replace with what is in your config
npx -y stickle mcp
# or
pnpm --prefix /absolute/path/to/stickle mcp
```

5. Fully quit and reopen Claude Desktop (`Cmd+Q`, not just close the window).

---

### Remote server returns `401 Unauthorized`

**Symptom:** `{"error":"Unauthorized: Invalid or revoked API key"}`

**Checks:**
- Confirm the key starts with `sk_stickle_`
- Regenerate the key from the Stickle dashboard if in doubt
- Verify the `Authorization` header format: `Bearer sk_stickle_...` (with the space)
- Test directly:

```bash
curl -H "Authorization: Bearer sk_stickle_YOUR_KEY" http://localhost:3001/health
```

---

### Remote server crashes with missing env vars

**Symptom:** `Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`

**Fix:**
```bash
# Confirm your .env is in remote-mcp/ (not the repo root)
cat remote-mcp/.env

# Re-run from the remote-mcp directory
cd remote-mcp && pnpm dev
```

---

### `tsx` not found when running `pnpm mcp`

**Symptom:** `Error: tsx not found` or `command not found: tsx`

**Fix:**

```bash
pnpm install   # re-installs devDependencies including tsx
# or install globally:
npm i -g tsx
```

---

### Notes exported from the extension are in a different format

The Chrome extension exports a JSON file that may have the structure:

```json
{
  "version": 1,
  "notes": [...]
}
```

The MCP server handles **both** formats — a top-level array `[...]` or an object with a `notes` key — so no manual transformation is needed.

---

## Quick-start cheatsheet

```bash
# ── Local MCP (stdio) ──────────────────────────────────────────
mkdir -p ~/.stickle
cp ~/Downloads/stickle_export_*.json ~/.stickle/notes.json   # export from extension first
pnpm mcp                                                       # verify it starts

# Add to your AI client config:
# "command": "npx", "args": ["-y", "stickle", "mcp"]

# ── Remote MCP (SSE) ───────────────────────────────────────────
cd remote-mcp
cp .env.example .env     # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
pnpm dev                 # starts on http://localhost:3001
curl http://localhost:3001/health   # confirm running

# Add to your AI client config:
# "url": "http://localhost:3001/sse"
# "headers": { "Authorization": "Bearer sk_stickle_YOUR_KEY" }
```
