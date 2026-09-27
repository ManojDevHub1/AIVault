# AIVault — Discover the Right AI

> A premium, frontend-only AI tools directory designed to discover, evaluate, and choose the right AI tools for every task and workflow.

---

## Project Purpose

**AIVault** is a modern SaaS-style AI discovery platform built for massive scalability and static SEO performance. Powered by a master dataset of **3,938 AI tools** across 14 canonical categories, the platform delivers instantaneous discovery without requiring backend infrastructure, external dependencies, or complex UI frameworks.

Every AI tool and category has a dedicated, crawlable static HTML page with JSON-LD structured data, metadata, and factual related-tool recommendations.

---

## Technology Stack

The project adheres strictly to zero-dependency vanilla web standards:

- **Markup:** HTML5 (semantic, accessible, WCAG-conscious structure)
- **Styling:** CSS3 (Custom properties, CSS Grid, Flexbox, responsive clamp typography, light/dark themes)
- **Scripting:** Vanilla JavaScript (ES6+, modular architecture, event delegation, zero external libraries)
- **Storage:** Web Storage API (`localStorage` for client-side favorites, recently viewed history, and theme settings)
- **Static Generation:** Node.js build-time generation script (`scripts/generate-pages.mjs`) generating static HTML, XML, and TXT files.
- **Zero External Frameworks / Zero External Dependencies:** No React, Next.js, TypeScript, Tailwind, Bootstrap, jQuery, or third-party APIs.
- **Zero Data Fabrication:** Cataloged real-world products with official URLs, rejecting synthetic/hallucinated entries.

---

## Folder Structure

```
AIVault/
│
├── index.html                        # Main HTML5 entry point & semantic application shell
├── 404.html                          # Lightweight static 404 error page matching AIVault branding
├── style.css                         # Clean SaaS design system, light/dark tokens, responsive layout
├── script.js                         # Application logic, state management, search index & chunk rendering
├── validate-dataset.js               # CLI validator checking all schema rules across 3,938 tools
├── test-e2e.mjs                      # 126-point automated E2E browser test suite (CDP via Microsoft Edge)
├── sitemap.xml                       # Static XML sitemap containing all 3,953 crawlable URLs
├── robots.txt                        # Search crawler access specification pointing to sitemap
│
├── compare/                          # Dedicated Side-by-Side Tool Comparison Page
│   ├── index.html                    # Static Comparison Page Shell & Semantic Matrix Table
│   └── compare.js                    # Client-side comparison matrix controller & diff engine
│
├── collections/                      # Dedicated Custom Collections / My Library Page
│   ├── index.html                    # Dual-view Hub & Single Collection Detail Page Shell
│   └── collections.js                # Collections controller, dialog manager & router
│
├── scripts/
│   ├── generate-pages.mjs            # Static site generator for tool pages, categories, and sitemap
│   ├── benchmark-search.mjs          # Search engine performance & relevance benchmark script
│   ├── audit-deployment.mjs          # Static deployment path & internal link integrity auditor
│   └── smoke-test-viewports.mjs      # Viewport smoke tester (1440px & 390px across 6 page types)
│
├── tools/                            # 3,938 Static Tool Detail Pages
│   ├── chatgpt/index.html
│   ├── claude/index.html
│   ├── midjourney/index.html
│   └── ...
│
├── category/                         # 14 Static Category Hub Pages
│   ├── ai-chat/index.html
│   ├── coding/index.html
│   ├── video/index.html
│   └── ...
│
├── data/
│   ├── ai-tools.js                   # Unified production dataset (3,938 tools) & category taxonomy
│   ├── ai-tools-dataset.json         # Raw staged open-dataset batch (3,893 records)
│   ├── ai-tools-import-metadata.json # Confidence tier tracking for category & pricing classifications
│   ├── excluded-records-log.json     # Audit trail of rejected records (dead endpoints, <5 char descriptions)
│   └── ai-tools-master-2000plus.json # Historical researched master archive (150 tools)
│
├── assets/
│   ├── logo/
│   │   ├── logo.svg                  # AIVault brand logo mark & wordmark
│   │   └── favicon.svg               # Browser tab favicon
│   ├── icons/                        # Scalable SVG UI icons
│   └── images/                       # Screenshots & preview assets (desktop, mobile, dark mode)
│
├── README.md                         # Project overview & developer guide
│
└── docs/
    ├── PROJECT.md                    # Project architecture, philosophy & design principles
    ├── FEATURES.md                   # Documented Phase 1-4C features & interaction specifications
    ├── DEPLOYMENT.md                 # Production deployment guide, hosting setup & verification checklist
    ├── COLLECTIONS.md                # Client-side Collections / My Library architecture & specs
    ├── COMPARE-SYSTEM.md             # Client-side comparison architecture, diff engine & UX specs
    ├── SEARCH-DISCOVERY.md           # Search relevance scoring, synonym map & IDF benchmarks
    ├── DATA-STRUCTURE.md             # Schema definition, deduplication logic & import guide
    ├── DATA-SOURCES.md               # Provenance, licensing (CC BY 4.0, GPL-3.0) & confidence tiers
    ├── SEO-ARCHITECTURE.md           # Static SEO, JSON-LD, related tools engine & canonical design
    ├── UI-GUIDELINES.md              # Design system, color tokens, typography & spacing rules
    └── ROADMAP.md                    # Multi-phase rollout roadmap from Phase 1 to Phase 5
```

---

## Current Features (Phase 4C Architecture)

1. **Static Tool Detail Pages (3,938 Pages):**
   - Each tool features a dedicated, crawlable static URL (`/tools/<tool-id>/`).
   - Breadcrumbs (`Home > Category > Tool Name`).
   - Factual header with fallback initial monogram or SVG icon, tool name, category badge, pricing badge, and rating.
   - Outbound link with strict security attributes (`target="_blank" rel="noopener noreferrer"`).
   - "Save to Favorites" with live `localStorage` persistence.
   - Deep content sections: Detailed Description, Key Features checklist, Best Suited For advisory banner, Tags & Topics.
   - Quick Facts sidebar: Primary Category, Pricing Model, Rating & Reviews, Official Domain, Catalog Date.

2. **Factual Related Tools Engine:**
   - Pre-computes 6 related tools per product based on factual dataset attributes:
     - Same Category (+10 pts)
     - Shared Tags (+3 pts per tag)
     - Shared Audience BestFor (+2 pts per term)
     - Shared Feature Overlaps (+1 pt per token)
   - Self-exclusion enforced: A tool never appears in its own related list.
   - Deterministic tie-breaking by rating and review count.
   - Direct internal links to related tool detail pages (`../../tools/<id>/`).

3. **Static Category Hub Pages (14 Categories):**
   - Dedicated landing page for all 14 categories (`/category/<slug>/`).
   - Category title, count badge (e.g. `211 Listed Tools`), and factual introduction.
   - Horizontal category switcher pills linking across all 14 hubs.
   - Responsive card grid linking directly to individual static tool detail pages.

4. **Static SEO Architecture:**
   - **Canonical URLs:** Unique canonical `<link>` tags with configurable `SITE_URL` base (default: `https://aivault-staging.vercel.app`).
   - **Contextual Metadata:** Natural `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:description`, `og:url`), and Twitter Cards (`summary`).
   - **JSON-LD Structured Data:** Valid `BreadcrumbList` and `SoftwareApplication` markup. Omits fabricated aggregate ratings when rating is 0.
   - **XML Sitemap:** Auto-generated `sitemap.xml` containing all **3,953 URLs** (1 home + 14 categories + 3,938 tools).
   - **Robots.txt:** Standard crawlable `robots.txt` referencing `sitemap.xml`.

5. **Homepage & Modal Navigation Integration:**
   - Tool cards on the homepage feature dual actions:
     - `Quick View`: Opens the reusable in-page modal dialog.
     - `Details →`: Navigates directly to the static tool detail page (`/tools/<id>/`).
   - Modal footer features an explicit `View Full Details →` button linking to the tool page.

6. **Client-Side State Synchronization:**
   - Theme toggle (Light/Dark mode) persists across homepage, category pages, and all tool detail pages via `localStorage`.
   - Favorites state stays synchronized across cards, detail pages, and the navbar counter.
   - Visiting any static tool page automatically records the tool into `aivault_recently_viewed` (capped at 20 entries).

7. **Full-Dataset In-Memory Search Engine (0.20 ms):**
   - Multi-field tokenized search querying across `name`, `category`, `description`, `tags`, `features`, and `bestFor`.
   - Pre-computed lowercase search document index (`_searchDoc`) across all 3,938 tools.

8. **Client-Side Tool Comparison System (2 to 4 Tools):**
   - Side-by-side comparison matrix across Category, Pricing, Rating & Evaluations, Description, Key Features, Best Suited For, and Official Website.
   - Strict 2-4 tool selection limit with duplicate prevention and toast notifications on attempt to add a 5th tool.
   - Floating sticky comparison bar dock with tool pills, count indicator `(X/4)`, remove actions, and direct link to `/compare/`.
   - Compare controls unified across Homepage cards, Quick View modal, static Detail pages, and Category landing pages.
   - Objective, factual comparison with subtle attribute diff highlighting (`.diff-highlight`) and zero subjective rankings or winner badges.
   - Dedicated comparison page (`/compare/`) with accessible empty state and responsive table wrapper scrolling smoothly on mobile viewports.

9. **Collections / My Library System (Custom Workflow Lists):**
   - 100% frontend-only custom collection curation backed by `localStorage` (`aivault_collections`).
   - Strict limit of 20 collections and 100 tools per collection with toast alerts.
   - Collection picker modal (`#col-modal`) across Homepage cards, Quick View modal, Tool Detail pages, and Category Hubs with inline creation.
   - Dedicated `/collections/` utility page with dual-view architecture: All Collections Hub and Single Collection Detail (`?collection=<id>`).
   - Semantic confirmation dialog (`#col-dialog-modal`) for collection creation, renaming, and deletion with keyboard focus management.
   - Stale ID defense, malformed storage recovery, and strict XSS sanitization.

---

## Dataset Breakdown (3,938 Tools)

| Category | Tool Count | Static Category Hub |
|---|---|---|
| Business | 1,331 | `/category/business/` |
| Productivity | 335 | `/category/productivity/` |
| Image Generation | 327 | `/category/image-generation/` |
| AI Agents | 302 | `/category/ai-agents/` |
| Writing | 235 | `/category/writing/` |
| Marketing | 232 | `/category/marketing/` |
| Video | 231 | `/category/video/` |
| Coding | 211 | `/category/coding/` |
| Design | 194 | `/category/design/` |
| Audio | 132 | `/category/audio/` |
| Research | 128 | `/category/research/` |
| Education | 113 | `/category/education/` |
| Voice | 101 | `/category/voice/` |
| AI Chat | 66 | `/category/ai-chat/` |
| **Total** | **3,938** | **All 14 Static Hubs Generated** |

---

## Static Site Regeneration

To regenerate all static tool pages, category pages, sitemap, and robots.txt in one command:

```powershell
node scripts/generate-pages.mjs
```

**Build Output:**
- 3,938 tool detail pages generated in `tools/<id>/index.html`
- 14 category landing pages generated in `category/<slug>/index.html`
- `sitemap.xml` generated with 3,953 URLs
- `robots.txt` generated
- Execution time: **~1.5 - 2.5 seconds**

---

## How to Run Locally

Because AIVault uses pure vanilla web standards, it requires no installation, build step, or server runtime.

### Option 1: Direct File Opening
Double-click `index.html` or open it directly in any modern web browser.

### Option 2: Local HTTP Server (Recommended for Testing Nested Pages)
Run a lightweight local static server:

```powershell
# Using Python 3
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then navigate to `http://localhost:8000` in your browser.

---

## Automated Verification & Testing

### 1. Dataset Integrity Validation
```powershell
node validate-dataset.js
```
**Result:** 3,938 records checked, 0 errors, 0 warnings.

### 2. End-to-End Browser Testing
A complete 126-point automated end-to-end browser test suite is included in `test-e2e.mjs`:

```powershell
node test-e2e.mjs
```

**Verification Results:** 126 / 126 tests passing with zero runtime errors, zero exceptions, zero console errors, and zero horizontal layout overflow across 4 viewports (390px, 768px, 1024px, 1440px).

### 3. Search Relevance & Latency Benchmark
A deterministic search latency and ranking accuracy benchmark is provided in `scripts/benchmark-search.mjs`:

```powershell
node scripts/benchmark-search.mjs
```

**Benchmark Results:** Average latency of **3.184 ms** across 100 iterations of 15 diverse search queries over the complete 3,938-tool catalog (passing the $\le 5\text{ ms}$ requirement).

### 4. Static Deployment & Path Integrity Audit
An automated static deployment and path resolution auditor is provided in `scripts/audit-deployment.mjs`:

```powershell
node scripts/audit-deployment.mjs
```

**Audit Results:** Verified all 3,938 tool directories, 14 category directories, 3,953 sitemap URLs, robots.txt, 404 page, 24 asset paths, and 585 internal links with 0 errors.

---

## Static Production Deployment

Because AIVault is 100% frontend-only, deploying to production requires only 5 simple steps:

1. **Configure `SITE_URL`**:
   Set the production domain via the `AIVAULT_SITE_URL` environment variable:
   ```powershell
   $env:AIVAULT_SITE_URL="https://yourdomain.com"
   ```
2. **Run Static Generator**:
   ```powershell
   node scripts/generate-pages.mjs
   ```
   This generates all 3,938 tool detail pages, 14 category landing pages, `sitemap.xml`, and `robots.txt` with your production domain.
3. **Validate Dataset Integrity**:
   ```powershell
   node validate-dataset.js
   ```
4. **Run End-to-End Tests**:
   ```powershell
   node test-e2e.mjs
   ```
5. **Deploy the Static Output**:
   Upload the repository directory directly to any static web host, CDN, or cloud storage (e.g., Cloudflare Pages, GitHub Pages, Netlify, Vercel Static, AWS S3 + CloudFront, Nginx, Apache). No runtime server or database configuration is required.
   
   See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full server configuration, MIME types, and caching recommendations.

---

## Current Status & Next Steps

- **Current Status:** **Phase 5 Complete** — Production Readiness & Static Deployment Audit (126/126 tests passing, 3,938 tools verified, 404 page active, 0 broken paths).
- **Deployment Readiness:** **100% Ready for Static Deployment**.
