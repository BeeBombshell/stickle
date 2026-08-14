# Stickle Dashboard — Structure & Completed Progress

> Scope: route structure, auth/authorization layering, data access patterns, and Next.js best practices for the dashboard (`http://localhost:3001`).

## Stack assumptions
- Next.js App Router (Next.js 16), TypeScript strict mode
- `@supabase/ssr` for session handling and cross-context auth bridge
- Server Components for reads, Client Components for interactive views

---

## Route structure (Implemented)

```
dashboard/src/app/
  (auth)/
    login/page.tsx             # Auth login page
  auth/
    callback/route.ts          # Supabase OAuth callback route
  DashboardShell.tsx           # Global shell with collapsible sidebar (64px / 240px)
  notes/
    page.tsx                   # Notes Explorer (Search, Color & Tag filtering, Realtime sync)
  timeline/
    page.tsx                   # Activity Feed timeline
  settings/
    layout.tsx                 # Tab navigation: Profile / Import & Export / Notion / Connected MCPs / API Tokens / Billing
    page.tsx                   # User Profile & Tier details
    export/page.tsx            # Portable JSON Backup Download & Import restore
    notion/page.tsx            # Notion integration setup guide & Supabase sync stats
    mcp/page.tsx               # Connected MCP servers, 6 registered tools, & client config generators
    tokens/page.tsx            # API token management & revocation
    billing/page.tsx           # Billing preferences & Dodo Payments subscription portal
  upgrade/
    page.tsx                   # Multi-currency localized pricing upgrade page
```

---

## Completed Tasks & Feature Verification

- [x] **Active Workspace Notes Filtering**: Filtering notes rendered on webpages by selected active workspace (`personal`, `<workspace_id>`, or `all`) in real-time.
- [x] **Collapsible Side Navigation**: Persistent collapsed state (`stickle_sidebar_collapsed` in `localStorage`), 64px icon-strip with tooltips & 240px expanded navigation.
- [x] **JSON Import & Export**: Download full offline JSON backup (`stickle_export_YYYY-MM-DD.json`) and restore/merge notes.
- [x] **Connected MCPs View**: Overview of 6 registered tools (`list_stickle_notes`, `search_stickle_notes`, `get_notes_for_url`, `add_stickle_note`, `export_stickle_summary`, `get_team_activity_timeline`) with client config generators for Claude Desktop, Cursor, Windsurf, and Remote SSE on port `3001`.
- [x] **Notion Integration Setup**: Step-by-step guidance for extension-based Notion credentials and live Supabase sync status tracking.
- [x] **Resilient Anchoring & Offset Retention**: Pixel-accurate `offsetX` and `offsetY` retention during sticky note drag and highlight mark positioning.