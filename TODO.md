# Stickle — Popup Redesign TODO

## Problem
The popup currently tries to be a quick-action tool, a full settings page, and an account/billing dashboard all at once (see: Settings tab stacking Stickle Cloud status, Team Workspaces, note theme/border pickers, Notion integration, data export/import, and resource links in one scroll). Fix: split into three surfaces by job, not just visual cleanup.

## New surface split
| Surface | Access | Contains |
|---|---|---|
| **Popup** | Click extension icon | View/add notes, search, workspace switcher, on/off, sync status |
| **Options page** | `chrome-extension://.../options.html`, right-click icon → Options, or gear icon in popup | Notion integration, default note theme/border, data export/import, links (Landing/Sandbox/Privacy) |
| **Web dashboard** | Login-gated, opened via icon in popup footer | Team workspace creation/management, plan/billing/feature status, MCP token management, cross-device timeline |

**Why this split and not "move everything to the dashboard":** the dashboard requires a Supabase login. Notion integration, note defaults, and local export/import currently work with zero account for free/local-only users — moving them behind a login would break that for anyone not signed up for cloud sync. The options page keeps them extension-native with no login required.

---

## Tasks

### 1. Build the options page (new)
- [x] Add `entrypoints/options/index.html` + `main.tsx` (WXT supports this out of the box — `options_ui` in manifest)
- [x] Move from `Settings.tsx` into the options page: Notion Integration form (token + database ID + Save), Data Backup & Portability (Export/Import buttons), Product & Resources links
- [x] Move here too: Default Note Theme swatches, Default Border Style — these configure note *creation* defaults, not per-session actions, so they belong in a settings surface, not the popup
- [x] Reuse existing logic from `lib/db.ts` / `lib/notion.ts` as-is — this is a relocation of UI, not new backend logic
- [x] Add a persistent left-nav or top-tab layout on the options page (Notion / Defaults / Data / About) since it now has room to breathe — don't just recreate the popup's cramped stacking at a bigger size

### 2. Simplify the popup to two tabs
- [x] Remove the "Settings" tab from the popup's tab bar entirely
- [x] Keep only "This Page" and "All Notes" as the segmented control
- [x] Collapse the tag filter row (`#all #architecture #team-review`) and date filter row (`All Today This Week`) into a single filter icon/popover next to the search bar — don't show both rows permanently, most sessions won't need filtering at all
- [x] Simplify the active-page banner: keep page name, note count, and the Add Note button; the banner doesn't need to be as visually heavy as it currently is (drop to a smaller accent treatment, not a full-height color block)

### 3. Add a popup footer (new, replaces the old Settings tab entry point)
- [x] Small bottom row: sync status text (e.g. "Synced 2m ago" for cloud users, or nothing for local-only), a gear icon that opens the new options page, and an external-link icon that opens the web dashboard in a new tab (only show the dashboard icon if the user is signed in — don't show a dead link to a login wall for local-only users)

### 4. Fix the "Stickle Cloud" feature list bug
- [x] The current Settings screenshot shows Cross-Device Sync, Team Workspaces, Remote MCP, and Central Dashboard all marked `ACTIVE` — confirm this isn't hardcoded and actually reflects `workspace.plan` server-side. If it's currently hardcoded true for testing, that's the same entitlement-enforcement issue flagged earlier in DECISIONS.md — fix before this ships to real users, not just cosmetically
- [x] This entire feature-status block moves to the web dashboard's billing/plan page once built (Phase B3) — it's account-status information, not a popup or options-page concern

### 5. Team Workspaces card
- [x] The "Create New Team Workspace" flow and workspace mode switching move to the web dashboard once accounts exist (Phase B2 in plan-v2-backend.md)
- [x] Until the backend ships, the popup keeps only a simple read-only workspace indicator (the "Personal" pill) — no creation flow in the popup at any point, even pre-backend

### 6. Visual pass (after structural changes land)
- [x] Reduce the active-page banner's color weight — it currently competes with the note list for attention; it should announce context, not dominate the view
- [x] Confirm popup height stays reasonable with two tabs instead of three sections — target: no scrolling needed for the default "This Page" view with 1-2 notes

## Acceptance criteria
- [x] Popup no longer contains any Notion config, theme/border defaults, export/import, or resource links
- [x] Options page is reachable both via the popup's gear icon and Chrome's native extension options entry point
- [x] A free/local-only user (no Supabase account) can still fully configure Notion, export/import data, and set note defaults — none of this requires login
- [x] Team workspace creation is not present anywhere in the popup
- [x] Feature-status "ACTIVE" badges reflect real entitlement, not a hardcoded value