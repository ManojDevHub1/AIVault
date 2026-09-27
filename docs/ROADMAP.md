# ROADMAP.md — AIVault Evolution Roadmap

This document outlines the phased rollout plan for AIVault from Phase 1 foundation to a 3,900+ AI tools directory.

---

## Phase 1: Frontend Application Shell & Design System (COMPLETED)
- [x] Responsive layout shell (sticky navbar, desktop sticky sidebar, mobile drawer, main layout).
- [x] Light SaaS visual identity with custom CSS variables and optional dark theme tokens.
- [x] Initial sample dataset of 12 representative AI tools across core categories.
- [x] Dynamic card rendering pipeline with category, pricing, rating, and search filters.
- [x] Reusable accessible tool detail modal dialog.
- [x] LocalStorage persistence for user favorites, recently viewed history, and theme settings.
- [x] Baseline documentation suite and directory structure.

---

## Phase 2: Scalable Dataset & Advanced Directory Engine (COMPLETED)
- [x] Scalable static dataset architecture with normalized schema (46 verified real tools).
- [x] Canonical 14-category taxonomy with dynamic live counting.
- [x] High-performance multi-field search engine across name, category, description, tags, features, and bestFor.
- [x] Combined multi-facet filtering (Search + Category + Pricing + Rating + Sort).
- [x] Non-mutating sort engine (Popular, Rating, A-Z, Newest by dateAdded).
- [x] Progressive chunk rendering (Pagination / Load More) via DocumentFragments.
- [x] Event delegation on card grids to eliminate listener overhead for 1000+ items.
- [x] Development-time dataset validator `validateToolDataset()` with schema checks.
- [x] URL query state synchronization (`?category=...&pricing=...&q=...`).
- [x] Robust favorites & recently viewed handling with stale ID defense.
- [x] Comprehensive 20-point automated E2E browser verification suite.

---

## Phase 3A: Master Dataset Import & Verification (COMPLETED)
- [x] Ingest and stage verified open-dataset batch from `tioraicom/ai-tools-dataset` and `LichAmnesia/awesome-ai-tools-dataset` (3,893 records).
- [x] Safely deduplicate against existing curated catalog: 126 duplicate collisions resolved by retaining rich hand-curated records; 5 internal batch duplicates filtered; 3,762 unique verified tools imported.
- [x] Merge into production static dataset `data/ai-tools.js` (3,938 total verified tools across all 14 canonical categories).
- [x] Zero data fabrication rule strictly enforced (no hallucinated tools, fake URLs, or synthetic filler entries).
- [x] Create confidence and provenance tracking (`data/ai-tools-import-metadata.json`, `data/excluded-records-log.json`, `docs/DATA-SOURCES.md`).
- [x] Validate zero errors across all 3,938 records via `validate-dataset.js`.
- [x] Verify all 14 canonical categories and dynamic sidebar count synchronizations (summing to 3,938).
- [x] 25 / 25 automated E2E browser tests passing via `test-e2e.mjs`.

---

## Phase 3B: Tool Detail Experience + Related Tools + Static SEO Architecture (COMPLETED)
- [x] 3,938 static tool detail pages generated in `tools/<tool-id>/index.html`.
- [x] 14 static category landing pages generated in `category/<category-slug>/index.html`.
- [x] Factual related-tools recommendation engine with multi-factor scoring (6 related tools, strict self-exclusion).
- [x] Dual-action card navigation on homepage (`Quick View` modal + direct `Details →` link).
- [x] Modal compatibility: Retain quick preview modal and add `View Full Details →` button.
- [x] Static SEO architecture: Unique `<title>`, `<meta name="description">`, Open Graph, and Twitter Cards.
- [x] Canonical URL generation with configurable `SITE_URL` base.
- [x] JSON-LD structured data for `SoftwareApplication` and `BreadcrumbList` (safely omitting unverified ratings).
- [x] XML Sitemap generation containing all 3,953 URLs (`sitemap.xml`).
- [x] Search crawler access specification (`robots.txt`).
- [x] Seamless client-side state synchronization (favorites, recently viewed, and theme persistence).
- [x] 35 / 35 automated E2E browser tests passing via `test-e2e.mjs`.

---

## Phase 4A: Advanced Search & Discovery Engine (COMPLETED)
- [x] Fast multi-field tokenized search across all 3,938 tools in memory.
- [x] Accessible autocomplete suggestions dropdown (ARIA combobox, keyboard navigation).
- [x] Active filter chips with individual removal and master "Clear All" action.
- [x] Client-side URL query state synchronization (`?q=...&category=...&pricing=...`).
- [x] XSS-safe text highlighting via range-based segmentation.
- [x] Full-dataset search beyond initial 12 cards.
- [x] 55 / 55 automated E2E browser tests passing.

---

## Phase 4A.1: Search Relevance Refinement & Deterministic Ranking Engine (COMPLETED)
- [x] Robust normalization pipeline (`normalizeText`, `normalizeAlphaNum`).
- [x] Curated domain-specific synonym map (`editor` $\leftrightarrow$ `editing`, `image` $\leftrightarrow$ `photo`, `video` $\leftrightarrow$ `videos`, `code` $\leftrightarrow$ `coding`, etc.).
- [x] Canonical category intent mapping (+4,000 points intent boost).
- [x] Generic token handling via Inverse Document Frequency (IDF) term weighting ($IDF = 0.2$ for generic `ai`, `tool`, `app`, `software` vs $\approx 3.0$ for specific keywords).
- [x] Exact and synonym phrase matching across all 6 metadata fields (+15,000 down to +4,000).
- [x] Name contradiction penalty (-15,000 points) to demote miscategorized/irrelevant tools (e.g. "AI Images Editor" outranked by genuine video editors for "AI video editor").
- [x] Token coverage bonus scoring (+5,000 points for 100% token coverage).
- [x] Deterministic 4-level tie-breaking: `_score` $\rightarrow$ `rating` $\rightarrow$ `reviewCount` $\rightarrow$ A-Z.
- [x] Sub-5ms search execution (4.593 ms avg latency across 3,938 tools in automated 100-iteration benchmarks).
- [x] Expanded E2E test suite: 73 / 73 tests passing with 0 console errors and 0 validation errors.

---

## Phase 4B: Tool Comparison System (COMPLETED)
- [x] Client-side comparison state engine (`localStorage` under `aivault_compare`).
- [x] 2 to 4 tool limit enforced with duplicate prevention and user toast alert on 5th tool attempt.
- [x] Compare triggers across all surfaces: Tool cards (`☐ Compare` / `☑ Compare`), Quick View modal (`[Add to Compare]`), Detail hero actions (`#detail-compare-btn`), and Category cards.
- [x] Floating compare bar dock appearing whenever $\ge 1$ tool is selected, showing tool pills with remove `×`, selection count `(X/4)`, `[Compare Now]` (active at $\ge 2$), and `[Clear All]`.
- [x] Dedicated comparison page (`/compare/`) featuring side-by-side matrix table with attribute rows: Category, Pricing, Rating & Evaluations, Description, Key Features, Best Suited For, and Official Website.
- [x] Factual objective comparison with subtle difference highlighting (`.diff-highlight` and `.diff-badge`) and zero subjective bias or ranking words.
- [x] Direct tool removal (`×`) and "Clear Comparison" with full-catalog dynamic replacement suggestions.
- [x] Accessible empty comparison state with direct CTA back to the directory.
- [x] Fully responsive layout: table horizontally scrollable on mobile (390px, 768px) with zero overall page horizontal overflow (`scrollWidth <= clientWidth`).
- [x] Seamless dark mode theme integration and responsive mobile drawer synchronization.
- [x] 97 / 97 automated E2E browser tests passing via `test-e2e.mjs` with 0 console errors and 0 validation errors.

---

## Phase 4C: Collections / My Library (COMPLETED)
- [x] Client-side collections state engine (`localStorage` under `aivault_collections`).
- [x] Strict limits: Maximum 20 collections and maximum 100 tools per collection with toast alerts.
- [x] Collection picker modal (`#col-modal`) across Homepage cards, Quick View modal, Tool Detail pages, and Category Hubs.
- [x] Inline collection creation and real-time tool counts in picker dialog.
- [x] Dedicated Collections utility page (`/collections/`) with dual-view router: All Collections Hub and Single Collection Detail.
- [x] Semantic modal dialog (`#col-dialog-modal`) for collection creation, renaming, and deletion confirmation with keyboard focus management.
- [x] Direct tool removal (`.btn-remove-from-col`) from collection detail view.
- [x] Empty states for both library hub (0 collections) and individual collections (0 tools) with direct browse CTAs.
- [x] Stale ID defense (filtering deleted/missing tool IDs safely) and malformed storage recovery.
- [x] XSS-safe collection naming using `textContent` and `escapeHtml()`.
- [x] Mobile drawer synchronization with live collections counter badge (`#sidebar-collections-count`).
- [x] Expanded E2E test suite: 126 / 126 tests passing with 0 console errors and 0 validation errors.

---

## Phase 5: Production Readiness & Static Deployment Audit (COMPLETED)
- [x] Full static deployment architecture validation (100% frontend-only, zero backend/database/API dependency).
- [x] Centralized `SITE_URL` configuration via `AIVAULT_SITE_URL` environment variable.
- [x] Static 404 page (`404.html`) matching AIVault branding with search/browse links and dark theme integration.
- [x] Static path audit: Verified 3,938 tool directories, 14 category directories, and all nested asset paths (`style.css`, `favicon.svg`, `ai-tools.js`).
- [x] Internal link audit: 585 internal links verified with zero broken links.
- [x] XML Sitemap audit: Exactly 3,953 crawlable URLs verified.
- [x] Robots.txt audit: `User-agent: *`, `Allow: /`, and `Sitemap:` verified.
- [x] Security smoke audit: Zero leaked API keys or credentials, safe external links (`noopener noreferrer`), and XSS neutralization.
- [x] Viewport smoke tests at 1440px and 390px across 6 core page types with zero horizontal overflow.
- [x] Production deployment documentation created in [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) and [`README.md`](../README.md).
- [x] 126 / 126 automated E2E browser tests passing via `test-e2e.mjs`.

---

## Phase 6: Discovery Guides & Enhanced Workflows (FUTURE)
- [ ] Curated thematic workflow guides.
- [ ] Offline capability via Service Worker (PWA installable app shell).
- [ ] Tool submission form with client-side JSON export.
- [ ] Advanced filter presets.

