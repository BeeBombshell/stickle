# Beta Testing Strategy for Stickle

## Overview

Stickle is an open-source, local-first browser extension that anchors sticky notes to dynamic web content. Although Stickle is open source, **beta testing is critical** before releasing updates to general users on the Chrome Web Store and Firefox Add-ons.

### Why Beta Test an Open-Source Browser Extension?

1. **Open Source ≠ Developer Audience**: Most extension users install packaged builds via web stores rather than building from source. A beta program gives community members early access without requiring local `wxt` setup.
2. **DOM & Website Variability**: Web content varies wildly (React/Vue SPAs, Shadow DOMs, dynamic hydration, virtualized lists). Beta testers surface anchoring bugs and layout shifts across real-world browsing workflows.
3. **Store Review Delays**: Web store reviews (Chrome Web Store, Firefox AMO) can take hours to days. Pushing a broken build to 100% of production users means waiting through another review cycle for a hotfix. Beta channels isolate risk.
4. **Permission & API Security**: Permission changes (e.g. host permissions or storage APIs) can trigger store review flags or temporarily disable extensions for users. Testing permission shifts early avoids disruptions.

---

## Distribution Channels

Stickle uses a tiered distribution strategy for beta testing:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Stickle Release Pipelines                       │
├────────────────────────────────┬───────────────────────────────────────┤
│          Beta Channel          │           Production Channel          │
├────────────────────────────────┼───────────────────────────────────────┤
│ • GitHub Pre-Releases (.zip)   │ • Chrome Web Store (Public)           │
│ • Unlisted Firefox Build (.xpi)│ • Firefox Add-ons AMO (Public)        │
│ • Chrome Trusted Testers       │                                       │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Channel 1: GitHub Pre-Releases (Zip / Unpacked Builds) — *Primary Beta*
* **Target Audience**: Tech-savvy contributors, GitHub community.
* **Mechanism**:
  1. Build extension archives: `pnpm zip` (generates Chrome & Firefox zips in `.output/`).
  2. Create a GitHub Pre-Release with tag `vX.Y.Z-beta.N`.
  3. Attach zip artifacts to the release.
* **Tester Setup**:
  * Chrome: Enable **Developer mode** in `chrome://extensions` → **Load unpacked** (or zip folder).
  * Firefox: Load temporary add-on via `about:debugging`.

### Channel 2: Chrome Web Store (Unlisted / Trusted Testers)
* **Target Audience**: Non-technical beta testers who require auto-updates.
* **Mechanism**:
  * Deploy a separate Chrome Web Store listing titled **Stickle (Beta)**.
  * Set visibility to **Unlisted** (direct link access) or **Private / Trusted Testers** (restricted to a specific Google Group email list).
* **Benefits**: Background auto-updates managed by Chrome Web Store.

### Channel 3: Firefox AMO Signed Unlisted `.xpi`
* **Target Audience**: Firefox users who want one-click installs without developer mode.
* **Mechanism**:
  * Submit `pnpm build:firefox` artifact to Mozilla Developer Hub as an **Unlisted** add-on.
  * Upload signed `.xpi` artifact directly to the GitHub Pre-Release.

### Channel 4: In-App Experimental Toggles (Feature Flags)
* **Target Audience**: Production users opting in to experimental features.
* **Mechanism**:
  * Feature flags in the Options Page (`chrome.storage.sync` / `local`) under an **Experimental Features** section.

---

## Beta Build Workflow & Commands

### 1. Build and Package
```bash
# Type check & run unit tests
pnpm compile
pnpm test

# Build production/beta ZIP packages for Chrome and Firefox
pnpm zip
```

Output directory: `.output/`
* `stickle-<version>-chrome.zip`
* `stickle-<version>-firefox.zip`

### 2. Versioning Conventions
Follow Semantic Versioning with pre-release identifiers:
* Alpha builds: `v0.2.0-alpha.1`
* Beta builds: `v0.2.0-beta.1`
* Release Candidates: `v0.2.0-rc.1`
* Production: `v0.2.0`

---

## Telemetry & Feedback Triaging

1. **Telemetry Isolation**:
   * Set `POSTHOG_ENV=beta` for pre-release builds to separate beta telemetry from production metrics.
   * Log anchoring failures and unhandled runtime errors automatically.
2. **Feedback Channels**:
   * **GitHub Issues**: Dedicated `kind/beta-feedback` issue template.
   * **In-Extension Report**: "Send Beta Feedback" button on the Options page linking to GitHub Discussions.

---

## Tester Validation Checklist

Before promoting a beta build to production, verify:

- [ ] **DOM Anchoring**: Notes anchor stably across dynamic SPAs (GitHub, Twitter/X, Notion, YouTube).
- [ ] **Storage Syncing**: Local Dexie DB and IndexedDB persist properly across browser restarts.
- [ ] **Popup & Options UI**: Responsive layout renders cleanly on standard and high-DPI displays.
- [ ] **Permissions**: No unexpected permission escalation prompts on upgrade.
- [ ] **Performance**: Extension background script & content scripts keep CPU/RAM overhead minimal (< 50MB RSS).
