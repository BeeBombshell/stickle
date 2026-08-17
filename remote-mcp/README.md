# Stickle Remote MCP Server (Hosted & Self-Hosted)

The **Stickle Remote MCP Server** allows AI agents (Claude Desktop, Cursor, Antigravity) to query, search, create, and summarize your web sticky notes over HTTPS/SSE without requiring the local browser extension to be open.

---

## 🚀 Features

- **Hosted SSE Transport**: Connects natively with Claude Desktop and Cursor using standard Model Context Protocol.
- **Bearer Token Auth**: Authenticates requests against SHA-256 API key hashes stored in your Supabase backend.
- **6 MCP Tools Suite**:
  1. `list_stickle_notes`: Filter notes by domain, tag, or result limit.
  2. `search_stickle_notes`: Full-text search across content, page titles, URLs, and tags.
  3. `get_notes_for_url`: Retrieve all notes anchored to a specific page URL.
  4. `add_stickle_note`: Create and pin a new sticky note to any webpage URL.
  5. `export_stickle_summary`: Generate a structured Markdown synthesis report grouped by site domain.
  6. `get_team_activity_timeline`: View shared workspace notes and team member activity.

---

## 🛠️ Environment Variables

Create a `.env` file in `remote-mcp/` or set variables in your cloud hosting provider:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_your_dodo_webhook_secret
```

- `POST /webhooks/dodopayments`: Webhook listener processing HMAC-SHA256 signed events from Dodo Payments (`payment.succeeded`, `subscription.active`, `subscription.cancelled`) to automatically provision user subscription tiers in Supabase `profiles`.

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS policies to validate API keys and query user notes securely. Never expose or commit this key to public repositories.

---

## 💻 Local Development & Testing

```bash
# Install dependencies
pnpm install

# Run in watch mode
pnpm dev

# Build for production
pnpm build
```

---

## ☁️ Deploying to Cloudflare Workers

1. Install Wrangler CLI: `npm i -g wrangler`
2. Authenticate: `npx wrangler login`
3. Add secrets:
   ```bash
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```
4. Deploy:
   ```bash
   npx wrangler deploy
   ```

---

## 🤖 Claude Desktop Configuration

Add the Remote MCP endpoint to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stickle-remote": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "https://mcp.stickle.app/sse?apiKey=sk_stickle_YOUR_API_KEY_HERE"
      ]
    }
  }
}
```
