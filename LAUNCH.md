# 🚀 Stickle — Product Hunt & Marketing Launch Plan (v1)

> **Status**: Pre-Launch Working Doc — update URLs before going live  
> **Repository**: [github.com/YOUR_USERNAME/stickle](https://github.com/YOUR_USERNAME/stickle) ← **replace before launch**  
> **Version**: v1.0 (Local-First Chrome MV3 Extension)

---

## 📌 Positioning

**Stickle** is a local-first Chrome Extension that lets you drop persistent, positioned sticky notes on any element of any webpage. Notes survive page reloads, SPA re-renders, and DOM layout shifts via a custom 3-Tier Anchoring Engine. One-click Notion export syncs your research into your existing knowledge base.

### The One-Liner
> **"Leave notes in the margins of the web — right where your thoughts happen."**

### What This Is *Not*
- Not a highlighter (no text selection needed)
- Not a web clipper (doesn't save the page — saves your *thinking* about the page)
- Not another note app you have to switch to

### Category
Spatial Web Annotation · Personal Knowledge Management (PKM) · Developer Productivity

---

## 🎨 1. Product Hunt Launch Kit

### A. Metadata

| Field | Value |
|---|---|
| **Name** | Stickle |
| **Tagline** ✅ **Chosen** | *Drop sticky notes anywhere on the web. They stay exactly where you left them.* |
| **Tagline Alt** | *The web is your notebook — annotate any page without leaving it.* |
| **Why not "Write in the margins"** | ⚠️ That's Hypothes.is's positioning verbatim. Avoid. |
| **Tags** | `Chrome Extensions` · `Productivity` · `Note Taking` · `Developer Tools` · `Notion` |
| **Pricing** | Free & Open Source *(Pro tier with cloud sync — Coming Soon)* |

> **Day of week advice**: Launch **Tuesday, Wednesday, or Thursday**. PH traffic peaks midweek. Avoid Mondays (big startup launches) and weekends (low votes, low visibility).

---

### B. Product Hunt Description (Plain text — PH renders no markdown in descriptions)

```
Ever read something online and wished you could scribble a note right on the page?

Stickle is a Chrome extension that lets you drop floating sticky notes anywhere on any webpage — no highlighting, no text selection, just Alt + Click and type.

The notes stick. Even when you close the tab, come back a week later, or the page re-renders in React — your notes are right where you left them. Built on a 3-tier DOM anchoring engine that uses XPath fallbacks, neighbor content hashing, and fuzzy text matching to survive layout changes.

When you're done reading, push your notes to Notion in one click — complete with source URL, page title, and timestamps.

→ 100% local-first. Works offline. No account needed.
→ Notion sync for your existing knowledge base.
→ Central popup manager to search notes across every site.
→ Open source on GitHub.

Built for researchers, developers, students, and anyone who thinks better with a pen in hand — even on the web.
```

---

### C. Maker's First Comment

> ⚠️ Product Hunt does NOT render markdown. No `###`, `**bold**`, or bullet `-` syntax — it shows as raw characters. Write in plain prose with emoji for structure.

```
Hey Product Hunt! 👋 I'm Bhavya, maker of Stickle.

I read a lot — documentation, GitHub issues, research papers, Hacker News threads. My old workflow: have a thought, alt-tab to Notion, paste the URL, write the note, try to find my place again. Half the time I'd lose context, and three weeks later I'd have no idea why I saved that link.

I built Stickle because I wanted to write notes *on* the page — like sticky notes in a book — without switching apps.

The hard part was making notes stay attached to the right spot when pages reload or re-render. I ended up building a 3-tier DOM anchoring engine: it tries XPath first, falls back to neighbor content hashing, and finally fuzzy-matches text if the structure changes completely. It works on dynamic SPAs including Twitter, Reddit, and GitHub issues.

What's in v1:
📌 Alt + Click any element to drop a note
🔒 Local-first, offline, no sign-up
🚀 1-click Notion export with source URL + timestamps
🎨 5 pastel color options with clean monochrome frames
📖 Interactive onboarding sandbox on first install

What I'm building next:
☁️ Cloud sync for cross-device access
👥 Team shared annotations
🤖 Remote MCP server — so AI agents like Claude and Cursor can read your web notes as context
📊 Web dashboard with search, timeline, and team activity

Stickle is fully open source. If you're a fellow Notion nerd or just someone who annotates a lot of tabs — would love your feedback in the comments!

Happy note-taking 📌
```

---

### D. Chrome Web Store Listing Copy

*(Separate from PH — Web Store has its own description field, max 132 chars for short description)*

**Short description (132 chars max)**:
```
Drop persistent sticky notes anywhere on any webpage. Local-first, Notion sync, no sign-up needed.
```

**Full description**:
```
Stickle turns the entire web into your notebook.

HOW IT WORKS
• Hold Alt (Option on Mac) and click any element — text, heading, image, code block — to drop a sticky note.
• Your note attaches to that exact element using a robust 3-tier anchoring engine.
• Notes persist across tab closes, browser restarts, and page re-renders.

WHAT MAKES IT DIFFERENT
Unlike highlighters (Liner, Hypothesis), you don't need to select text.
Unlike web clippers (Notion Clipper, Pocket), you're saving your thoughts — not the whole page.
Unlike regular note apps, you never leave the page you're reading.

KEY FEATURES
✓ Alt + Click or right-click context menu to add notes
✓ 5 pastel colors with Figma-inspired minimal design
✓ Resilient 3-tier DOM anchoring (survives React, Vue, Twitter, Reddit re-renders)
✓ Works 100% offline — local-first with IndexedDB storage
✓ One-click Notion export with source URL, page title, and timestamp
✓ Central popup to search and filter notes across all your tabs
✓ Interactive onboarding tutorial on first install

PRIVACY
Stickle does not track your browsing, read your note content, or send any data to external servers. Notion sync goes directly from your browser to Notion's official API using your own API key.

Open source: github.com/YOUR_USERNAME/stickle
```

---

### E. Product Hunt Media & Asset Checklist

| Asset | Spec | Content |
|---|---|---|
| **Thumbnail** | 240×240 PNG | Static: sticky note icon on a webpage grid. Or animated GIF: note pins to a live page. |
| **Gallery 1 — Hero** | 1270×760 PNG | Large tagline + Stickle notes floating on a GitHub page & a Wikipedia article. Show the in-situ placement. |
| **Gallery 2 — Anchoring** | 1270×760 PNG | Diagram: "How notes survive page changes" — 3 tiers visualized (XPath → Hash → Fuzzy). |
| **Gallery 3 — Notion Export** | 1270×760 PNG | Side by side: extension popup with notes + resulting Notion database with URL/title/timestamp columns. |
| **Gallery 4 — Popup Manager** | 1270×760 PNG | Extension popup: search bar, filter tabs (Today / This Week / All Time), note list, "jump to tab" button. |
| **Gallery 5 — Coming Soon** | 1270×760 PNG | Clean "What's Next" slide: Cloud Sync · Team Notes · MCP for AI Agents · Web Dashboard. |
| **Demo Video** | 30–45s MP4 | Flow: Alt+Click doc page → type note → change color → close tab → reopen (note persists) → batch Notion export. |

> **Demo video tip**: Record at 2x resolution, export 1080p. Show the note "snapping" back to position on re-open — this is the most impressive thing Stickle does and most viewers won't expect it.

---

## 🌐 2. Landing Page Blueprint

### Structure (Scroll Order)

```
1. Nav Bar         — Logo · "Add to Chrome" CTA · GitHub link
2. Hero            — Headline · Subheadline · Dual CTA · Product GIF/Screenshot
3. Problem         — Short "the broken workflow" framing
4. Features        — 3-column value props + expanded feature cards
5. Anchoring Tech  — How the 3-tier engine works (appeals to PKM & dev audiences)
6. Notion Demo     — GIF or screenshot of Notion export result
7. Coming Soon     — Teaser for cloud sync, team sharing, MCP, dashboard
8. Open Source     — GitHub section with star count badge
9. Comparison      — Stickle vs alternatives table
10. FAQ            — 4–5 questions
11. Footer         — Links · License · Social
```

---

### Section Copy

#### Hero
- **Eyebrow badge**: `New — v1.0 is Live & Open Source`
- **Headline**: `Leave notes in the margins of the web.`
- **Subheadline**: `Alt + Click any part of any webpage to drop a sticky note. It stays pinned there — through reloads, re-renders, and revisits — and syncs to Notion in one click.`
- **CTA 1**: `Add to Chrome — Free`
- **CTA 2**: `View on GitHub ⭐`
- **Beneath CTAs**: `No account needed  ·  Works offline  ·  Local-first  ·  Open Source`

---

#### The Problem (3 sentences)
> You read something interesting online, have a thought — and then you alt-tab to Notion, lose the context, and paste a link you'll never fully remember. Highlighters only capture text you select. Web clippers save the page, not your thinking.
>
> Stickle closes the gap: write where you read.

---

#### Value Props (3-column grid)

| 📍 Write where you read | 🎯 Notes that don't drift | ⚡ Into Notion, instantly |
|---|---|---|
| Drop a note on any element — heading, paragraph, code block, image — without leaving the page or selecting text first. | A 3-tier anchoring engine keeps notes attached to the right spot even when React re-renders, ads reload, or you revisit weeks later. | Push individual notes or batch-export your research to any Notion database. URL, title, and timestamp included automatically. |

---

#### Feature Cards

**🖱️ Alt + Click to annotate**
> One shortcut. Hold Alt (or Option on Mac), click anything on the page, and a sticky note appears. No toolbar, no selection, no friction. Right-click also works for those who prefer a context menu.

**🎨 Designed to live on any site**
> Five signature pastel colors — lime, lilac, cream, mint, pink — with high-contrast monochrome frames that stay readable on light and dark pages.

**🔍 Central note manager**
> Search every note you've ever taken across the entire web. Filter by domain, by active tab, or by date (Today / This Week / All Time). Jump directly back to the exact tab and position in one click.

**🔒 Local-first & private**
> Your notes never leave your device without your action. Stored in IndexedDB. Works completely offline. When you do sync to Notion, it goes directly from your browser to Notion's API — nothing passes through our servers.

---

#### How the Anchoring Works (Engineering / PKM audience)

> Most web annotation tools silently break when pages update. Stickle uses a 3-tier fallback system:
>
> **Tier 1 — Structural**: XPath + CSS selector for exact structural position.  
> **Tier 2 — Content Hash**: Captures parent/sibling text context. Survives minor layout refactors.  
> **Tier 3 — Fuzzy Match**: Searches DOM text nodes when structure changes completely.
>
> If all three tiers miss, the note lands in a graceful "unanchored" state rather than disappearing silently.

---

#### Coming Soon — What's Next

> We're building the cloud backend layer for v2. No timelines yet — but here's what's coming:

| Feature | What it means |
|---|---|
| **👤 User Accounts & Cloud Sync** | Access your web notes from any Chrome device, signed in to your account. |
| **👥 Team Sharing** | Share annotated views of web pages with teammates. See who noted what and when. |
| **🤖 Remote MCP for AI Agents** | Expose your web notes as context over Model Context Protocol — so Cursor, Claude Desktop, and other LLM tools can query your annotations. |
| **📊 Web Dashboard** | Full browser-based UI for searching, sorting, filtering, and reviewing notes across all sites. Timeline view, user attribution, export tools. |

> [Join the waitlist / follow on GitHub for updates] ← add link before launch

---

#### Comparison Table

| | Stickle | Hypothes.is | Notion Web Clipper | Readwise / Liner |
|---|:---:|:---:|:---:|:---:|
| **Free-form placement (no text selection)** | ✅ | ❌ | ❌ | ❌ |
| **Resilient DOM anchoring** | ✅ 3-Tier | ⚠️ Basic | ❌ | ❌ |
| **Works offline / local-first** | ✅ | ❌ | ❌ | ❌ |
| **Direct Notion export** | ✅ | ❌ | ⚠️ Full page only | ⚠️ Highlights only |
| **No account to start** | ✅ | ❌ | ❌ | ❌ |
| **Open Source** | ✅ | ⚠️ Partial | ❌ | ❌ |

---

#### FAQ

**Does Stickle work offline?**  
Yes. Notes are stored immediately in Chrome's IndexedDB on your device. Notion sync is the only feature that requires a connection.

**What happens if a page re-renders or updates its layout?**  
Stickle's 3-tier anchoring engine tries three different methods to find where your note belongs. It handles React/Vue SPAs, Reddit, Twitter, and most dynamic pages. If it can't resolve the position, the note enters a recoverable "unanchored" state rather than disappearing.

**Is my data private?**  
Stickle v1 sends zero telemetry. When you connect Notion, your API key and note data go directly to Notion's API — nothing routes through any Stickle server.

**Do I need an account?**  
No. Install and start taking notes immediately. Accounts are a v2 feature (for cloud sync and team sharing).

**Which browsers are supported?**  
Chrome and Chromium-based browsers (Brave, Arc, Edge) via the Chrome Web Store. Firefox support is planned.

---

## 📣 3. Multi-Channel Launch Strategy

### Day & Time
Launch on a **Tuesday or Wednesday at 12:01 AM PST** — votes accumulate over the PST day, and US East Coast morning is peak browsing time for PH.

### Distribution Timeline

```
D-7  ──  Submit to Chrome Web Store for review (can take 24–72h)
D-7  ──  Build GitHub repo README, star the repo from personal accounts, post to social "launching soon"
D-3  ──  Prepare all copy for PH, HN, Twitter, LinkedIn, Reddit (drafted, not posted)
D-1  ──  Schedule PH listing for 12:01 AM PST
         Notify any personal contacts / community members who might upvote

D+0  ──  12:01 AM PST: PH live → post maker comment immediately
         04:00 AM PST: Twitter/X launch thread
         05:00 AM PST: LinkedIn post
         06:00 AM PST: Hacker News "Show HN"
         07:00 AM PST: Reddit posts (stagger by 30 min to avoid spam detection)
         All day: Reply to every comment, upvote genuine feedback, engage on GitHub issues

D+1  ──  Thank you post on Twitter ("We made it to #X on PH!")
         GitHub Discussions enabled for feature requests
```

---

### Channel Copy

#### Hacker News — Show HN

**Title**: `Show HN: Stickle – Persistent sticky notes anchored to DOM elements, local-first`

```
Hi HN — I built Stickle, a Chrome extension that lets you Alt+Click any element on 
a webpage to drop a floating sticky note that stays pinned there.

The technical challenge I found interesting: making notes re-attach to the right 
DOM element after page reloads, SPA re-renders, or layout refactors.

I ended up with a 3-tier fallback:
  1. XPath + CSS selector (structural match)
  2. Neighbor content hash (parent/sibling text fingerprint)
  3. Fuzzy text match across DOM nodes

If all three fail, the note enters a graceful unanchored state rather than silently 
disappearing — which felt like the right UX tradeoff.

Stack: WXT (MV3 framework), Preact, Dexie.js (IndexedDB), Vitest for anchoring tests.
Notion export uses their official API with retry/backoff.

Happy to discuss the anchoring algorithm or any of the extension architecture tradeoffs.
Repo: [link]
```

---

#### Twitter / X — 5-Tweet Thread

**Tweet 1 (hook + visual):**
```
The web is where reading happens. But note-taking still makes you leave the page.

Launching Stickle today — sticky notes for the entire web. 📌

Alt + Click any element. Type. Done.
Your note stays right there, even when you come back a week later.

🧵 How it works 👇
[Attach: GIF of Alt+Click on a documentation page]
```

**Tweet 2 (the hard part):**
```
The tricky bit: webpages change.

React re-renders. Ads reload. Layouts shift.

Stickle uses a 3-tier DOM anchoring engine:
  🎯 XPath + CSS (structural)
  🧬 Neighbor content hashing (contextual)
  🔍 Fuzzy text matching (resilient)

Your notes stay where you left them.
```

**Tweet 3 (Notion):**
```
When you're done reading, push everything to Notion.

1 click → your notes land in your database with:
• Source URL
• Page title  
• Timestamp

Your web research finally connects to your second brain.
```

**Tweet 4 (the AI angle — this will get traction in 2025):**
```
Coming next: a Remote MCP server.

So Cursor, Claude Desktop, and other AI agents can query your web annotations directly as context.

"What did I note about this topic last week?" — your agent will actually know.
```

**Tweet 5 (CTA):**
```
Stickle is free, local-first, and fully open source.

🔗 Product Hunt: [link]
⭐ GitHub: [link]
🛒 Chrome Web Store: [link]

Any upvote, comment, or star genuinely helps. Thanks 🙏
```

---

#### Reddit — Post per community

**`r/Notion` title**: `I made a Chrome extension that lets you sticky-note any webpage and sync directly to Notion`

**`r/PKMS` title**: `Stickle — local-first browser annotation that syncs to Notion. Alt+Click any DOM element.`

**`r/webdev` title**: `Show r/webdev: I built a 3-tier DOM anchoring system so sticky notes survive React re-renders`

**`r/chrome_extensions` title**: `Stickle – persistent sticky notes for any webpage (local-first, Notion export, MV3)`

**Body (adapt per sub):**
```
Hey! I built an open-source Chrome extension called Stickle.

The idea: Alt+Click anywhere on a webpage to drop a sticky note. It stays 
attached to that exact element — through reloads, tab closes, and page re-renders.

The interesting part was the anchoring algorithm. DOM structures change all the 
time on modern web apps. I wrote a 3-tier fallback: XPath first, then a content 
fingerprint of neighboring elements, then fuzzy text matching across the DOM.

One-click Notion export with source URL + timestamps included.

100% local-first, no account needed, open source: [GitHub link]
Chrome Web Store: [link]

Would love feedback from this community especially!
```

---

## 💰 4. Monetization Strategy

### Model: Open-Core

The core extension (local-first, Notion sync) is and will remain **free and open source forever**.

Cloud backend features become the paid tier:

| | **Free** | **Pro** | **Teams** |
|---|---|---|---|
| **Price** | $0 | $29 one-time *or* $5/mo | $9/user/mo *(annual)* |
| Local notes (unlimited) | ✅ | ✅ | ✅ |
| Notion export | ✅ | ✅ | ✅ |
| Offline support | ✅ | ✅ | ✅ |
| Cross-device cloud sync | — | ✅ | ✅ |
| Central web dashboard | — | ✅ | ✅ |
| Remote MCP server | — | ✅ | ✅ |
| Auto-sync rules | — | ✅ | ✅ |
| Team shared annotations | — | — | ✅ |
| Workspace audit log | — | — | ✅ |
| User role permissions | — | — | ✅ |

> **On the $29 lifetime option**: PKM and developer tools have a proven track record with one-time payments (Obsidian, Raycast Pro, Tot). It lowers friction at launch, provides immediate revenue, and signals "I'm not going to pull the rug." Introduce it as a **"Supporter Early Access"** price before cloud is actually live.

> **On Teams pricing**: Don't commit to $9/user/mo publicly yet. The backend doesn't exist. Instead, add a "Teams — Early Access" waitlist on the landing page with a "contact us" CTA. Price once you understand actual team use cases.

---

### Feature Flag Architecture

Gate v2 features cleanly so the extension can ship "coming soon" UI without dead code paths:

```typescript
// lib/flags.ts
export type FeatureFlag =
  | 'cloudSync'
  | 'teamSharing'
  | 'remoteMCP'
  | 'centralDashboard'
  | 'autoSync';

// In v1, all gated features are off.
// In v2, these will be read from the user's subscription state.
export const FLAGS: Record<FeatureFlag, boolean> = {
  cloudSync: false,
  teamSharing: false,
  remoteMCP: false,
  centralDashboard: false,
  autoSync: false,
};

export const isEnabled = (flag: FeatureFlag): boolean => FLAGS[flag];
```

Use `isEnabled('cloudSync')` in the popup to conditionally show "Coming Soon" badges vs. active UI.

---

## 📊 5. Analytics — PostHog

### Important: Chrome Extension Constraints

PostHog's browser SDK (`posthog-js`) uses `document.createElement('script')` dynamically, which **violates Chrome Extension Content Security Policy (CSP)**. Don't import it directly into content scripts or the popup entry.

**Correct approach**:
1. Load PostHog only in the **background service worker** or a trusted extension page.
2. Content scripts send messages to the background worker, which proxies events to PostHog.
3. Or use PostHog's **server-side API** (HTTP POST to `app.posthog.com/capture`) directly from the background worker — no SDK needed.
4. If you do use the SDK in popup/onboarding HTML pages, add the PostHog CDN URL to your `content_security_policy` in `manifest.json`.

### Privacy Rules (Chrome Web Store Compliance)
- **Opt-in only**: Show a toggle in Settings: `Enable anonymous usage analytics`. Default: **off**.
- **Never capture**: note text, URLs beyond hostname, Notion API tokens, or any user-entered content.
- **Disclose in the Web Store privacy policy** that you use PostHog for aggregated analytics.

### Event Taxonomy

```typescript
// Fired from background service worker via PostHog HTTP API
export const Events = {
  // Onboarding
  EXTENSION_INSTALLED:     'extension_installed',
  ONBOARDING_COMPLETED:    'onboarding_completed',
  ONBOARDING_SKIPPED:      'onboarding_skipped',

  // Note lifecycle (no content captured)
  NOTE_CREATED:            'note_created',     // { trigger: 'alt_click'|'context_menu', color }
  NOTE_EDITED:             'note_edited',      // { age_seconds }
  NOTE_DELETED:            'note_deleted',     // { age_seconds }
  NOTE_REANCHORED:         'note_reanchored',  // { tier: 'xpath'|'hash'|'fuzzy'|'failed', ms }

  // Notion sync
  NOTION_CONNECTED:        'notion_connected',
  NOTION_SYNC_TRIGGERED:   'notion_sync',      // { mode: 'single'|'batch', count, success }

  // Popup usage
  POPUP_OPENED:            'popup_opened',
  SEARCH_EXECUTED:         'search_executed',  // { result_count }
  TAB_JUMPED:              'tab_jumped',

  // Upgrade intent (critical for pricing validation)
  PRO_BANNER_CLICKED:      'pro_banner_clicked', // { feature }
  WAITLIST_SIGNUP:         'waitlist_signup',     // { source }
} as const;
```

> `NOTE_REANCHORED` with `tier: 'failed'` is the most important metric — it tells you how often the anchoring engine breaks in the wild, which directly impacts retention.

---

## ✅ Launch Execution Checklist

**One Week Before**
- [ ] Chrome Web Store submission complete (allow 48–72h review)
- [ ] Landing page live with "Coming Soon" section and waitlist form
- [ ] All 5 gallery images + demo GIF/video captured
- [ ] GitHub README polished (star count badge, GIF demo, clear install instructions)
- [ ] Announce "Launching next week" on Twitter/X for early upvote warmup

**Day Before**
- [ ] PH post scheduled for 12:01 AM PST
- [ ] Maker comment drafted and ready to paste immediately at launch
- [ ] All channel drafts ready (Twitter, HN, LinkedIn, Reddit)
- [ ] Extension URL confirmed live on Chrome Web Store
- [ ] Test: full flow from fresh Chrome profile (install → onboard → create note → Notion export)

**Launch Day**
- [ ] 12:01 AM PST — PH goes live, post maker comment
- [ ] 04:00 AM PST — Twitter/X thread published
- [ ] 05:00 AM PST — LinkedIn post
- [ ] 06:00 AM PST — Hacker News "Show HN"
- [ ] 07:00 AM PST — Reddit posts (stagger 30 min between communities)
- [ ] **Respond to every comment** — especially critical in the first 3 hours on PH

**Post-Launch**
- [ ] Thank you tweet with PH final ranking
- [ ] Open GitHub Discussions for feature requests
- [ ] Compile top feedback into v1.1 / v2 planning

---

*This is a living document. Update URLs, pricing, and copy as the product evolves.*
