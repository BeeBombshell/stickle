# 📊 Stickle — Analytics & Telemetry Documentation

> **Status**: Production Reference  
> **Telemetry Engine**: PostHog Direct HTTP Ingestion API (`lib/posthog.ts`)  
> **Privacy Philosophy**: Local-first, anonymized action metrics only — **Zero PII, Zero Page Titles, Zero URLs, Zero Note Content**

---

## 📌 1. Analytics Philosophy & Privacy Commitments

Stickle is built local-first. Telemetry is strictly limited to understanding product adoption and performance (e.g. note creation count, Notion export success rates).

### 🔒 Core Privacy Rules
1. **Zero Content Inspection**: Note text, tag titles, and user custom content are **never** captured.
2. **Zero URL / Page Title Capture**: Webpage URLs, domain names, page titles, and query parameters are **never** included in event payloads.
3. **No Session Recording**: Screen/DOM recording is disabled.
4. **No Host Page Errors**: Exception tracking is disabled in content scripts to prevent listening to third-party website errors or polluting host console logs.
5. **Zero Remote Code Execution (RCE)**: Uses direct `fetch()` JSON posts to PostHog's `/capture/` REST API. Zero dynamic `<script src="...">` tags or remote JS chunks are ever loaded, complying 100% with Manifest V3 rules.

---

## ⚙️ 2. Environment Configuration

Telemetry requires two public build environment variables:

| Variable | Description | Example |
|---|---|---|
| `WXT_PUBLIC_POSTHOG_KEY` | PostHog Project API Key | `phc_xv9run77...` |
| `WXT_PUBLIC_POSTHOG_HOST` | PostHog Instance Endpoint | `https://us.i.posthog.com` |

### 🛠️ Local Development & Fallback Behavior
* If env variables are absent (e.g. local unit tests or development without `.env`), PostHog skips initialization gracefully.
* Calling `trackEvent()` or `posthog.capture()` when keys are missing emits a non-blocking `console.warn` in DEV mode and executes as a zero-cost no-op. **Tests and extension builds will never crash due to missing telemetry keys.**

---

## 🏷️ 3. Complete Event Taxonomy & Schemas

### A. Note Creation & Editing Events (`entrypoints/content.ts`)

#### `note_created`
Fired when a user creates a new sticky note or highlight.
```ts
trackEvent('note_created', {
  creation_method: 'alt_click' | 'popup_action' | 'text_selection'
});
```

#### `note_deleted`
Fired when a note is deleted by the user.
```ts
trackEvent('note_deleted', {
  deletion_method?: 'popup_manager'
});
```

#### `note_color_changed`
Fired when a note color swatch is changed.
```ts
trackEvent('note_color_changed', {
  color: string // e.g. 'yellow', 'mint', 'sky', 'pink', 'monochrome'
});
```

---

### B. Backup & Export Events (`entrypoints/popup/App.tsx`)

#### `notes_backup_exported`
Fired when a user downloads a JSON backup of their notes.
```ts
trackEvent('notes_backup_exported', {
  note_count: number
});
```

#### `notes_backup_imported`
Fired when a user imports a JSON backup file into Stickle.
```ts
trackEvent('notes_backup_imported', {
  imported_count: number,
  updated_count: number,
  skipped_count: number
});
```

---

### C. Notion Sync Events (`components/NoteSidebar.tsx`)

#### `notion_note_exported`
Fired when a single note is exported to Notion.
```ts
trackEvent('notion_note_exported');
```

#### `notion_notes_batch_exported`
Fired when a batch of unsynced notes is exported to Notion.
```ts
trackEvent('notion_notes_batch_exported', {
  exported_count: number,
  failed_count: number
});
```

---

## 🏗️ 4. Architecture & Manifest V3 Integration

### Entrypoint Wiring
```
lib/posthog.ts (Central Config & Safe Track Helper)
├── entrypoints/content.ts     --> Note creation, deletions, color updates
├── entrypoints/popup/App.tsx   --> JSON backup import/export metrics
├── components/NoteSidebar.tsx --> Single & batch Notion export metrics
├── entrypoints/landing/       --> Web landing page initialization
├── entrypoints/onboarding/    --> Onboarding tutorial initialization
└── entrypoints/privacy/       --> Privacy policy page initialization
```

### Store Review & Permissions Compliance
* **No `host_permissions` needed:** Chrome MV3 allows extension popups and background workers to make cross-origin `fetch` calls to PostHog endpoints without requiring `https://us.i.posthog.com/*` in `host_permissions`.
* **Chrome Web Store Data Usage:** On the Developer Dashboard, declare **"Analytics / User Activity"** (Anonymized / Not tied to user identity).
