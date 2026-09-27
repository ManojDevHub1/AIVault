# PROJECT.md — AIVault Architecture & Philosophy

## 1. Project Overview

**AIVault — Discover the Right AI** is a client-side AI tools directory platform engineered with a clean, professional SaaS aesthetic. The core architectural achievement is delivering a responsive, instantaneous discovery experience across **3,938 AI tools** entirely in the browser without external runtime dependencies, databases, or server backends, accompanied by a complete static SEO architecture with 3,938 crawlable tool pages, 14 category landing pages, XML sitemap, and JSON-LD structured data.

## 2. Core Architectural Principles

- **Zero External Dependencies:** Built solely on native HTML5, CSS3, and modern Vanilla JavaScript (ES6+). No npm build chains, CSS frameworks, or UI runtimes.
- **Zero Data Fabrication:** Cataloged real-world products with official URLs, rejecting synthetic/hallucinated entries.
- **Static SEO & Pre-rendered Crawlability:** Every tool has a dedicated, static HTML page (`/tools/<tool-id>/`) with JSON-LD structured data (`SoftwareApplication`, `BreadcrumbList`).
- **Data-Driven Dynamic Rendering:** The interface is decoupled from static HTML markup. All tools, categories, and tags are computed from structured JavaScript data.
- **Predictable State Flow:** State is managed via a centralized plain JavaScript state object, driving deterministic UI re-renders for filters, search results, modal views, and library views.
- **Client-Side Persistence:** User preferences (Favorites, Recently Viewed history, Theme choice) are saved directly in browser `localStorage`.
- **Progressive Scalability:** Architectural abstractions handle 3,900+ items using DOM fragments, search index pre-computation (`_searchDoc`), and progressive chunk rendering (`CHUNK_SIZE = 12`).

## 3. Technology Constraints & Decisions

| Layer | Choice | Rationale |
|---|---|---|
| **Markup** | Semantic HTML5 | High accessibility, screen reader compatibility, native landmarks |
| **Styling** | Vanilla CSS3 | Custom properties for light/dark theming, zero build step, zero runtime overhead |
| **Logic** | Vanilla JavaScript | Modular functional design, direct DOM updates via DocumentFragment |
| **Storage** | LocalStorage API | Fast, synchronous client-side caching of user favorites and settings |
| **Icons** | Inline SVG & Monogram Fallbacks | Scalable, razor-sharp on high-DPI displays, zero HTTP requests, 100% offline |
| **Data Engine** | Plain Global Script | Synchronous loading via `<script src="data/ai-tools.js"></script>`, 100% offline and CORS-free |
| **Static SEO Engine** | Build-time Node Script | Generates 3,938 static HTML pages, 14 category landing pages, sitemap.xml, and robots.txt in < 2.5s |

## 4. Current Milestone

**Phase 3B Complete:** Delivered the full static tool detail experience (`/tools/<id>/`), factual related-tools engine (6 related tools, strict self-exclusion), 14 static category landing pages (`/category/<slug>/`), `sitemap.xml` with 3,953 URLs, `robots.txt`, and complete client-side state synchronization (favorites, recently viewed, and dark mode). 35 / 35 automated E2E browser tests passing.
