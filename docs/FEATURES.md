# FEATURES.md — AIVault Feature Specification

This document details the functional specifications implemented across Phase 1, Phase 2, Phase 3A, and Phase 3B of AIVault.

---

## 1. Master Dataset & Data Engine (Phase 3A)
- **Comprehensive 3,938-Tool Catalog:** Contains 3,938 AI tools spanning 14 canonical categories without fabricated or hallucinated entries.
- **Zero-Dependency Architecture:** Pure static local data bundled in `data/ai-tools.js` with open-source dataset batches staged in `data/ai-tools-dataset.json`, import metadata in `data/ai-tools-import-metadata.json`, and licensing documentation in `docs/DATA-SOURCES.md`.
- **Runtime Schema Validator:** `validate-dataset.js` and in-browser checks ensure unique IDs, unique URLs, canonical taxonomy, valid pricing, ratings, and safe endpoints.
- **Progressive Chunk Rendering:** Initial page render mounts exactly 12 cards, with "Load More" progressively batching 12 cards at a time using `DocumentFragment` until all 3,938 tools are loaded, keeping memory overhead minimal.
- **Full-Dataset Memory Indexing:** Search and multi-facet filtering query the complete 3,938-tool memory array `state.allTools` rather than visible DOM elements. Sub-millisecond token search (< 0.20 ms) across all 3,938 tools.

---

## 2. Navigation & Header
- **Sticky Header:** Persists at the top of the viewport (`z-index: 100`) with a subtle 1px border divider.
- **Brand Identity:** SVG logo mark, custom wordmark typography, and "DIRECTORY" badge.
- **Top Navigation Links:** Anchor links for quick jumping to Explore, Categories, Trending, and Collections.
- **Keyboard Search Trigger:** Visual button with `<kbd>/</kbd>` shortcut indicator that focuses the hero search input.
- **Live Favorites Counter:** Dynamic numeric badge indicating how many tools are saved in the user's favorites library.
- **Theme Toggle:** Switch between modern Light SaaS theme and slate Dark theme with immediate DOM update and localStorage persistence.
- **Mobile Menu Toggle:** Accessible hamburger button that triggers the slide-out navigation drawer on screens <= 768px.

---

## 3. Left Sidebar & Library
- **Taxonomy Categories:** Lists 14 core AI categories with real-time tool counts generated directly from the dataset (summing to 3,938):
  - Business (1,331)
  - Productivity (335)
  - Image Generation (327)
  - AI Agents (302)
  - Writing (235)
  - Marketing (232)
  - Video (231)
  - Coding (211)
  - Design (194)
  - Audio (132)
  - Research (128)
  - Education (113)
  - Voice (101)
  - AI Chat (66)
- **Active State Indication:** Highlighted blue indicator background and count badge for the currently active category.
- **My Library Section:**
  - **Favorites:** Filters directory view to show only bookmarked tools.
  - **Recently Viewed:** Chronologically lists tools opened in the modal.
- **Sidebar Footer Card:** Promotional submission card inviting builders to submit their AI tool.
- **Mobile Drawer Mode:** Transforms into an off-canvas drawer with smooth transition, backdrop overlay, and dedicated close button.

---

## 4. Hero & Full-Dataset Search
- **Headline & Supporting Copy:** Clean SaaS typography highlighting the platform proposition.
- **Large Search Bar:**
  - Icon-affixed search input with smooth focus ring expansion.
  - Instant real-time multi-token search across tool names, categories, descriptions, tags, features, and target audience (`bestFor`).
  - Capable of resolving tools ranked deep in the catalog (e.g. #1,000+, #3,900+) in 0.20 ms.
  - Clear button (`✕`) appears when query is present.
  - Global Shortcuts: Press `/` anywhere on the page to focus the search bar; `Esc` to clear.

---

## 5. Multi-Facet Filtering Bar
- **Pricing Filters:** Pills for `All`, `Free`, `Freemium`, and `Paid`.
- **Category Dropdown:** Synced with sidebar selection for quick mobile/tablet access.
- **Rating Dropdown:** Filters items by minimum rating (`★ 4.8+`, `★ 4.5+`, `★ 4.0+`).
- **Sort By Dropdown:**
  - `Popular` (sorted by review count descending)
  - `Rating` (sorted by rating value descending)
  - `A-Z` (alphabetical by name ascending)
  - `Newest` (sorted by `dateAdded` descending)
- **Active Filter Chips:** Visible chips displaying each active filter condition with individual remove buttons and a master "Reset" button.

---

## 6. Curated Card Grids
- **Featured Tools Section:** Curated carousel/grid of top-tier AI models.
- **Trending Tools Section:** High-velocity tools currently surging in adoption.
- **All AI Tools Section:** Responsive card grid (3–4 columns on desktop, 2 on tablet, 1 on mobile).
- **Dynamic Counter:** Displays exact matching tool count (`Business · 1,331 tools`, `All AI Tools · 3,938 tools`).
- **Empty State:** Informative illustration, clear explanation, and "Clear All Filters" button when zero matches occur.
- **Load More Button:** Progressive pagination appending 12 cards per batch; automatically hides when all matching items are rendered.

---

## 7. Tool Card Interactions (Dual Action Architecture)
- **Visuals:** SVG icon badge with custom tool accent color, tool name, tagline, description, category badge, and up to 3 keyword tags.
- **Metrics:** Star rating (★), review count, and color-coded pricing pill (`Free`, `Freemium`, `Paid`).
- **Dual Navigation Actions:**
  - **Quick View:** Button triggers the lightweight in-page modal dialog for rapid previewing without leaving the page.
  - **View Details:** Direct anchor link navigating to the static crawlable detail page (`/tools/<tool-id>/`).
- **Favorite Heart Toggle:** Instant `localStorage` persistence with toast notification and real-time counter updates.
- **Hover Micro-interactions:** Subtle 3px lift, soft shadow expansion, and border emphasis.

---

## 8. Reusable Detail Modal & URL Safety
- **Dynamic Data Population:** Single reusable DOM dialog populated on the fly for any tool ID.
- **Content:**
  - Tool branding (logo, name, tagline, category, pricing, rating)
  - Full descriptive overview
  - All tags and keyword badges
  - Key features checklist with vector icons
  - "Best Suited For" target audience advisory card
  - Direct external website link with outbound icon
  - In-modal favorite toggle button
  - **"View Full Details →" Button:** Links directly to the dedicated static detail page (`/tools/<id>/`).
- **Accessibility:** Modal backdrop blur, focus trapping, `Escape` key close handler, and outside click close handler.
- **URL Safety:** Outbound links strictly enforce `target="_blank" rel="noopener noreferrer"`.
- **Activity Logging:** Opening a modal automatically pushes the tool ID to the "Recently Viewed" history in `localStorage`.

---

## 9. Static Tool Detail Pages (Phase 3B Architecture)
- **Scale:** 3,938 individual static HTML pages generated in `tools/<tool-id>/index.html`.
- **Semantic Structure:**
  - Breadcrumb navigation (`Home > Category > Tool Name`).
  - Tool hero section with logo, title, category, pricing pill, rating star, and evaluations.
  - Official Outbound Website CTA with safe attributes (`target="_blank" rel="noopener noreferrer"`).
  - Add to Favorites button with live synchronization to `localStorage.getItem("aivault_favorites")`.
  - Content sections: About, Key Features checklist, Best Suited For advisory card, Tags & Topics.
  - Quick Facts sidebar: Primary Category, Pricing Model, Rating & Reviews, Official Domain, Catalog Date.
  - Related Tools section with 6 factually matched alternatives.
  - Back-navigation links to Category hub and All Tools directory.
- **Client Parity:** Theme switcher, favorites toggles, and recently viewed tracking work without dependencies.

---

## 10. Factual Related Tools Engine (Phase 3B Architecture)
- **Relevance Scoring:** Computes 6 related tools using deterministic dataset heuristics:
  - Category match (+10)
  - Shared tags (+3 each)
  - Shared audience bestFor (+2 each)
  - Shared feature keywords (+1 each)
- **Strict Self-Exclusion:** The current tool is never included in its own related tools list.
- **Deterministic Sort:** Highest score $\rightarrow$ rating $\rightarrow$ review count $\rightarrow$ name.

---

## 11. Static Category Landing Pages & SEO Infrastructure (Phase 3B Architecture)
- **14 Category Hubs:** Static landing pages generated in `category/<category-slug>/index.html`.
- **Category Content:** Breadcrumb, category title, factual introduction, exact dataset count badge (`211 Listed Tools`), and category switcher pills linking across all 14 hubs.
- **Full Internal Linking:** Category page cards link directly to each tool's static detail page.
- **Canonical URLs:** Unique canonical `<link>` tags on every page with configurable `SITE_URL` base (default: `https://YOUR-DOMAIN.com`).
- **Social Metadata:** Unique Open Graph (`og:title`, `og:description`, `og:url`, `og:type`) and Twitter Cards (`summary`).
- **Structured Data:** Valid JSON-LD `BreadcrumbList` and `SoftwareApplication` graphs on all tool and category pages. Omits fabricated ratings if 0.
- **XML Sitemap:** Comprehensive `sitemap.xml` containing all 3,953 crawlable URLs (1 home + 14 categories + 3,938 tools).
- **Automated Verification:** 73 / 73 automated E2E browser tests passing with zero runtime errors.

---

## 12. Advanced Search & Discovery Engine (Phase 4A & Phase 4A.1)
- **Deterministic Multi-Field Relevance Engine:**
  - Full tool name matching: Exact (+50,000), AlphaNumeric (+45,000), Prefix (+25,000), Substring (+15,000).
  - Exact multi-word query phrase matching across all 6 metadata fields (+12,000 Name down to +2,000 Description).
  - Domain synonym phrase variants (e.g., `"video editor"` $\leftrightarrow$ `"video editing"`) with +15,000 Name boost down to +4,000 Description.
  - Canonical Category Intent Mapping (+4,000 points) for query intent keywords.
  - Inverse Document Frequency (IDF) term weighting: downweights generic words (`ai`, `tool`, `app`, `software` at $\text{IDF} = 0.2$) while boosting specific keywords ($\approx 3.0$) so generic tokens never overpower specific terms.
  - Name Contradiction Penalty (-15,000 points) when queries specify video but tool name contains image/photo.
  - Token coverage bonus (+5,000 points) for 100% token coverage.
  - Deterministic 4-level tie breaking: relevance score $\rightarrow$ rating $\rightarrow$ review count $\rightarrow$ A-Z.
- **Accessible Autocomplete Suggestions (ARIA Combobox):**
  - Instant dropdown triggering on $\ge 1$ char input, capped at 8 high-relevance suggestions.
  - Distinct badge types: Category, Tag, and Tool.
  - Full keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`) with synchronized `aria-activedescendant`.
- **Active Filter Chips & Clear All:**
  - Dynamic chips for category, pricing, rating, search query, and library views.
  - Individual chip dismissal and instant master "Clear All" button.
- **Client-Side URL Query State:**
  - Synchronizes `?q=...&category=...&pricing=...` via `window.history.replaceState`.
  - Seamless state restoration on reload and link sharing.
- **XSS-Safe Term Highlighting:**
  - Pure text-range interval segmentation (`highlightMatch`) with complete HTML escaping.
- **Ultra-High Performance:**
  - 3.184 ms average latency across all 3,938 tools in automated 100-iteration benchmarks.
  - Sub-5ms search requirement achieved with zero external dependencies.

---

## 13. Tool Comparison System (Phase 4B Architecture)
- **100% Frontend-Only Architecture:**
  - Zero external APIs, backends, databases, or AI APIs.
  - Powered by vanilla JavaScript, local static data, and browser `localStorage` (`aivault_compare`).
  - Graceful defense against stale/deleted IDs; limits list to 4 valid tools.
- **Comparison Limits & Enforcement:**
  - Minimum 2 tools required to generate side-by-side comparison table.
  - Maximum 4 tools allowed simultaneously.
  - Attempting to add a 5th tool is prevented with a clear toast notification: *"Maximum 4 tools can be compared at once. Remove one to add another."*
  - Duplicate selection toggles the tool off.
- **Card, Modal & Page Compare Controls:**
  - Tool cards on Homepage and Category Hubs include `.btn-card-compare` with checkbox indicator (`☐ Compare` / `☑ Compare`). Event propagation is stopped (`e.stopPropagation()`) so card modal is not triggered.
  - Quick View modal footer includes `#modal-compare-btn` switching between *"Add to Compare"* and *"Remove from Compare"*.
  - Static tool detail pages (`tools/<id>/`) include `#detail-compare-btn` in hero action buttons.
- **Floating Comparison Bar (`#compare-bar`):**
  - Pinned bottom bar appearing whenever $\ge 1$ tool is selected.
  - Displays count `(X/4)`, tool pills with remove buttons (`×`), **"Compare Now"** CTA linking to `compare/`, and **"Clear All"** button.
- **Dedicated Comparison Page (`compare/index.html`):**
  - Static SEO-friendly route with canonical tag and social metadata.
  - Empty state when $< 2$ tools selected with browse CTA.
  - Side-by-side responsive table for 2 to 4 tools comparing 7 factual dimensions: Category, Pricing Model, Rating & Evaluations, Overview, Key Features, Best Suited For, and Official Website.
  - Neutral difference highlighting (`.diff-highlight` and subtle `diff` badge) on differing fields.
  - Zero subjective rankings, winner claims, or marketing hype.
  - Full mobile responsiveness at 390px viewport with horizontal table scrolling and zero page overflow.
- **Automated Verification:**
  - Suite expanded to **97 / 97 automated tests passing** in `test-e2e.mjs` with 0 console errors and 0 warnings.

---

## 14. Collections / My Library System (Phase 4C Architecture)
- **100% Frontend-Only Architecture:**
  - Zero external APIs, user accounts, authentication services, backends, or databases.
  - Powered by vanilla JavaScript, local static data, and browser `localStorage` (`aivault_collections`).
  - Strict separation of state: completely decoupled from favorites, recently viewed, and comparison systems.
  - Stale ID defense: missing/deleted tool IDs are filtered safely without crashing or fabricating placeholder tools.
  - Malformed storage recovery: safely handles invalid non-JSON data falling back to `[]`.
- **Collections Limits & Constraints:**
  - Maximum 20 collections per user.
  - Maximum 100 tools per collection.
  - Clear user toast notifications on limit boundaries; never silently truncates or overwrites user data.
  - Name validation: non-empty, whitespace-trimmed, and case-insensitive uniqueness enforcement.
- **Card, Modal, Detail & Category Picker Integration:**
  - Tool cards on Homepage and Category Hubs include `.btn-card-col` icon action. Event propagation is stopped (`e.stopPropagation()`) preventing quick view modal interference.
  - Quick View modal footer includes `#modal-col-btn` with folder icon.
  - Static tool detail pages (`tools/<id>/`) include `#detail-col-btn` in hero actions and `.btn-card-col` on related cards.
  - Collection picker modal (`#col-modal`) provides interactive multi-collection checklist, real-time tool counts, and inline collection creation.
- **Dedicated Collections Page (`collections/index.html`):**
  - **Hub View (`collections/`)**:
    - Responsive card grid (`#collections-grid`) showing all user collections.
    - Each collection card displays title, tool count, up to 3 real member tool preview pills, "Open" link, "Rename" button, and "Delete" button.
    - Empty state when 0 collections exist with a primary "+ Create Collection" CTA.
  - **Detail View (`collections/?collection=<id>`)**:
    - URL query parameter-driven view (`?collection=<id>`) with dynamic breadcrumbs.
    - Full tools grid displaying member tools with standard tool card actions plus `.btn-remove-from-col` action.
    - Action bar with "Add More Tools" link, "Rename" button, and "Delete" button.
    - Empty state when collection has 0 tools with "Browse AI Tools" link.
  - **Semantic Dialog Modal (`#col-dialog-modal`)**:
    - Reusable modal dialog for collection creation, renaming, and deletion confirmation with full keyboard navigation (`Enter` confirm, `Escape` cancel).
- **Security & XSS Neutralization:**
  - User-provided collection names are rendered strictly via `textContent` or `escapeHtml()`.
  - Malicious inputs such as `<script>alert(1)</script>` or SVG image hooks are neutralized with zero script execution.
- **Automated Verification:**
  - Suite expanded to **126 / 126 automated tests passing** in `test-e2e.mjs` with 0 console errors, 0 warnings, and zero page horizontal overflow across all viewports.

