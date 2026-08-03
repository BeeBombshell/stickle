# Stickle — DOM-Anchored Web Sticky Notes

![Stickle Header Banner](./assets/banner.svg)

> A local-first Chrome extension that lets you pin floating sticky notes to dynamic web content using robust 3-tier DOM anchoring.

---

## Features (Phase 0 Scaffolded)

- 📌 **DOM Anchoring**: Pin notes to elements, text fragments, or fuzzy text matches.
- 🎨 **Figma-inspired Aesthetics**: Crisp monochrome frame paired with signature pastel color-block surfaces (`#e4f579` lime, `#e8d5ff` lilac, etc.).
- 🔒 **Local-First & Private**: Data stored in IndexedDB via Dexie.js.
- ⚡ **Lightweight UI**: Preact + Vite bundler built on WXT framework.

---

## How to Load This Extension in Chrome

1. Build or run the development server:
   ```bash
   pnpm install
   pnpm build
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the output directory: `.output/chrome-mv3` inside this repository.
6. The Stickle extension icon (Anchor Pin mark) will appear in your Chrome toolbar!

---

## Development & Scripts

- `pnpm dev` — Start WXT dev server with hot reload
- `pnpm build` — Production build targeting Chrome MV3 (`.output/chrome-mv3`)
- `pnpm compile` — Run TypeScript type checking without emitting files
- `pnpm test` — Run Vitest unit tests

---

## Project Layout

```
stickle/
├── DECISIONS.md          # Architectural judgment calls log
├── README.md
├── package.json
├── tsconfig.json
├── wxt.config.ts
├── assets/               # Extension icons & brand marks
├── styles/               # Design system tokens (Figma marketing aesthetic)
├── entrypoints/
│   ├── background.ts    # Background service worker (PING/PONG handler)
│   ├── content.ts       # Content script injected on web pages
│   └── popup/           # Popup extension manager (Preact)
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── lib/
│   ├── db.ts            # Dexie schema & IndexedDB CRUD operations
│   ├── anchoring.ts     # 3-tier DOM anchor resolution logic
│   ├── notion.ts        # Notion export client
│   └── types.ts         # StickleNote & NoteAnchor type definitions
├── components/          # Preact UI components
│   ├── NoteBubble.tsx   # In-page floating note UI
│   ├── NoteSidebar.tsx  # Popup note list & manager
│   └── Settings.tsx     # Notion & app settings
├── tests/               # Vitest & Playwright test suites
└── test-fixtures/      # HTML pages for testing anchoring robustness
```
