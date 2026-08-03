# Stickle — Architectural & Design Decisions

This log records non-trivial decisions made during the development of Stickle.

---

## Phase 0 — Project Scaffolding & Initial Setup

### 1. Logo & Visual Branding
- **Decision:** Selected Concept 3 (Anchor Pin) from `stickle_logo_concepts.svg` as the official logo mark.
- **Rationale:** Symbolizes DOM anchoring — the core technical differentiator of Stickle. The mark features a dark rounded rectangle (`#1a1a1a`, `rx=10`) with an inset white pin graphic.

### 2. Design Tokens & Styling Strategy
- **Decision:** Implemented `styles/design-tokens.css` carrying Figma marketing-inspired monochrome core + oversized pastel color block surfaces (`block-lime`, `block-lilac`, `block-cream`, `block-mint`, `block-pink`, `block-coral`, `block-navy`).
- **Rationale:** Adheres strictly to `DESIGN.md` rules — pill CTAs (`rounded.pill`), 8px grid system, crisp typography hierarchy with Inter / system sans and JetBrains Mono for eyebrow headers.

### 3. Package Manager & Framework Choices
- **Decision:** WXT (Manifest V3, Chrome focused), TypeScript, Preact + `@preact/preset-vite`, Dexie.js for IndexedDB.
- **Rationale:** Strict adherence to locked-in decisions in `PLAN.md`.

### 4. Permissions Policy
- **Decision:** Restricted v1 manifest permissions to `["storage", "activeTab", "scripting"]`.
- **Rationale:** Minimizes extension permission footprint; avoids requesting `<all_urls>` until required by background sync features.
