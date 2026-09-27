# SEO-ARCHITECTURE.md — AIVault Static SEO & Directory Architecture

This document outlines the technical architecture, URL design, static page generation, structured data protocols, and search engine optimization strategy for AIVault.

---

## 1. Architectural Philosophy: 100% Static & Crawlable

Modern search engine web crawlers (Googlebot, Bingbot, etc.) achieve maximum indexing throughput, zero hydration overhead, and instant Time-to-First-Byte (TTFB) when served pure, pre-rendered semantic HTML.

AIVault intentionally avoids Client-Side Routing (SPA-only routing) or runtime server-side generation (SSR) for tool details. Instead, a deterministic build-time static page generator compiles the entire catalog of **3,938 AI tools** into independent, crawlable directory endpoints:

```
tools/
├── chatgpt/
│   └── index.html
├── claude/
│   └── index.html
├── midjourney/
│   └── index.html
└── ...

category/
├── ai-chat/
│   └── index.html
├── coding/
│   └── index.html
├── video/
│   └── index.html
└── ...
```

---

## 2. Canonical URL Structure & Taxonomy

### Tool Detail Pages
- **Pattern:** `/tools/<tool-id>/`
- **Slug Strategy:** Uses the existing stable unique identifier (`tool.id`) from `data/ai-tools.js`.
- **Example:** `https://aivault-staging.vercel.app/tools/github-copilot/`

### Category Landing Pages
- **Pattern:** `/category/<category-slug>/`
- **Canonical Slugs (14 categories):**
  - AI Chat: `/category/ai-chat/`
  - Image Generation: `/category/image-generation/`
  - Video: `/category/video/`
  - Writing: `/category/writing/`
  - Coding: `/category/coding/`
  - Audio: `/category/audio/`
  - Business: `/category/business/`
  - Research: `/category/research/`
  - Education: `/category/education/`
  - Productivity: `/category/productivity/`
  - AI Agents: `/category/ai-agents/`
  - Marketing: `/category/marketing/`
  - Voice: `/category/voice/`
  - Design: `/category/design/`

### Configurable Canonical Domain (`SITE_URL`)
All canonical URLs, Open Graph tags, Twitter metadata, and structured data reference a single centralized site base URL:

```javascript
export const SITE_URL = process.env.AIVAULT_SITE_URL || 'https://aivault-staging.vercel.app';
```

Site administrators can configure this variable before deployment or in continuous integration without modifying source code.

---

## 3. Related Tools Relevance Engine

Each tool detail page features a **Related AI Tools** section presenting up to 6 highly relevant alternatives. To ensure authenticity without fabricating data or introducing random variance, AIVault uses a deterministic multi-factor relevance algorithm:

### Relevance Scoring Formula
$$\text{Score} = \text{Category Match (10)} + 3 \times |\text{Shared Tags}| + 2 \times |\text{Shared BestFor}| + 1 \times |\text{Feature Overlaps}|$$

1. **Same-Category Filtering:** Candidates are drawn primarily from the same canonical category.
2. **Tag Intersection:** Every shared tag between the active tool and the candidate yields +3 points.
3. **Audience Match:** Every shared `bestFor` term yields +2 points.
4. **Self-Exclusion Rule:** The active tool is strictly excluded from its own related list (`candidate.id !== tool.id`).
5. **Deterministic Tie-Breaking:** In the event of equal relevance scores, tools are sorted by verified rating descending, review count descending, and tool name ascending.
6. **Graceful Empty State Defense:** If a category has fewer than 6 items, top-rated tools sharing overlapping tags from adjacent categories are selected.

---

## 4. Metadata & Social Graph Protocol

Every static page contains unique, contextual metadata generated directly from the underlying tool or category record:

### Title Tag Strategy
- **Tools:** `<title>${tool.name} — ${tool.category} AI Tool | AIVault</title>`
- **Categories:** `<title>${category} AI Tools (${count} Tools) | AIVault Directory</title>`
- Ensures distinct title tags across all 3,938 tool pages.

### Meta Description Strategy
- Extracted directly from `tool.description` or category summary.
- Sanitized to single-line plain text with whitespace normalization.

### Open Graph & Twitter Cards
- Standard `og:title`, `og:description`, `og:type` ("website"), `og:url`, and `og:site_name`.
- `twitter:card` set to `summary` for clean link previews on social platforms.

---

## 5. Schema.org Structured Data (JSON-LD)

To help search engines understand the software and directory hierarchy, every page embeds valid JSON-LD structured data in the document `<head>`:

### BreadcrumbList
Represents the structural position of the page in the hierarchy:
1. `Home` $\rightarrow$ `${SITE_URL}/`
2. `Category` $\rightarrow$ `${SITE_URL}/category/<category-slug>/`
3. `Tool Name` $\rightarrow$ `${SITE_URL}/tools/<tool-id>/`

### SoftwareApplication
Only includes factual attributes present in the dataset:
- `name`: Official tool name
- `applicationCategory`: Canonical category name
- `description`: Verifiable factual summary
- `url`: Official outbound destination
- `aggregateRating`: **Strictly omitted** if rating is 0 or unverified, preventing deceptive markup. When rating > 0, includes `ratingValue`, `reviewCount`, `bestRating: 5`, and `worstRating: 1`.
- `offers`: When `pricing === "Free"`, specifies `price: "0"`, `priceCurrency: "USD"`.

---

## 6. XML Sitemap & Robots.txt

### `sitemap.xml`
- Auto-generated during build.
- Contains exactly **3,953 crawlable URLs**:
  - `1` Homepage (`priority: 1.0`, `changefreq: daily`)
  - `14` Category landing pages (`priority: 0.8`, `changefreq: weekly`)
  - `3,938` Tool detail pages (`priority: 0.6`, `changefreq: monthly`)
- Adheres strictly to the standard Sitemaps XML protocol (`http://www.sitemaps.org/schemas/sitemap/0.9`).

### `robots.txt`
- Located at the website root (`/robots.txt`).
- Permits crawling across all search engine agents (`Allow: /`).
- References the canonical sitemap location (`Sitemap: https://aivault-staging.vercel.app/sitemap.xml`).

---

## 7. Static Page Generator Script

The entire directory generation pipeline is executed by:

```powershell
node scripts/generate-pages.mjs
```

### Build Pipeline Stages
1. **Dataset Validation:** Verifies schema integrity across `data/ai-tools.js`.
2. **Matrix Pre-Computation:** Calculates related tool scores for all 3,938 tools in ~300 ms.
3. **Tool Page Compilation:** Writes 3,938 `tools/<id>/index.html` files.
4. **Category Page Compilation:** Writes 14 `category/<slug>/index.html` files.
5. **Sitemap Generation:** Outputs `sitemap.xml`.
6. **Robots Generation:** Outputs `robots.txt`.
7. **Performance Benchmark:** Entire generation executes in **< 2.5 seconds** on standard local hardware.

---

## 8. Client-Side State Synchronization on Static Pages

Static pages maintain complete interactive parity with the homepage without requiring external frameworks:
- **Theme Persistence:** Inline initialization script immediately reads `localStorage.getItem("aivault_theme")` and applies the theme to `<html data-theme="...">`, avoiding layout shift or flashing.
- **Favorites Persistence:** Live favorites heart toggles and navbar count badges read and write to the existing `aivault_favorites` key in `localStorage`.
- **Recently Viewed Tracking:** Visiting a static tool detail page automatically adds the tool ID to `aivault_recently_viewed` in `localStorage` (capped at 20 entries with defensive filtering).
