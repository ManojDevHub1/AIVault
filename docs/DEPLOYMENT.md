# AIVault — Production Deployment Guide & Checklist

## 1. Static Architecture Overview

AIVault is architected as a **100% frontend-only static website**. It does not require Node.js at runtime, server-side code (PHP, Python, Ruby), databases, or API infrastructure.

- **Production Artifacts**: Pure HTML5, CSS3, Vanilla JavaScript, local static dataset (`data/ai-tools.js`), static XML, TXT, and SVG assets.
- **Client-Side State**: Favorites, recently viewed history, tool comparison list, custom collections, and dark/light theme choices are maintained via browser `localStorage`.
- **Compatible Hosts**: Any static web server, object store, or CDN (e.g., Cloudflare Pages, GitHub Pages, Netlify, Vercel Static, AWS S3 + CloudFront, Nginx, Apache, or generic static web hosting).

---

## 2. Centralized Site URL Configuration

All canonical links, Open Graph tags, XML sitemaps, and robots.txt directives derive from a single centralized base URL:

### Configuration Location
In [`scripts/generate-pages.mjs`](../scripts/generate-pages.mjs):
```javascript
export const SITE_URL = process.env.AIVAULT_SITE_URL || 'https://YOUR-DOMAIN.com';
```

### Setting Production Domain
Before deploying, set the `AIVAULT_SITE_URL` environment variable:

```powershell
# Windows PowerShell
$env:AIVAULT_SITE_URL="https://yourdomain.com"
node scripts/generate-pages.mjs

# Linux / macOS / CI Pipeline
export AIVAULT_SITE_URL="https://yourdomain.com"
node scripts/generate-pages.mjs
```

> [!NOTE]
> If `AIVAULT_SITE_URL` is omitted, the build defaults to the placeholder `https://YOUR-DOMAIN.com`. Always supply your genuine domain for production releases to ensure search crawlers receive correct canonical tags.

---

## 3. Pre-Deployment Verification Commands

Run these four commands in sequence prior to deploying:

```powershell
# Step 1: Validate dataset integrity (Expects 3,938 tools and 0 errors)
node validate-dataset.js

# Step 2: Regenerate static site pages, sitemap, and robots.txt
node scripts/generate-pages.mjs

# Step 3: Run comprehensive static deployment and path audit
node scripts/audit-deployment.mjs

# Step 4: Run full 126-test headless browser regression suite
node test-e2e.mjs
```

---

## 4. Production Asset & Page Checklist

Verify that the following files and directories are present in the web root:

| Component | Path / Directory | Requirement |
|---|---|---|
| **Homepage** | `index.html` | Root entry point with search, categories, and chunked directory |
| **404 Page** | `404.html` | Custom error page with AIVault branding, search/browse links & dark mode |
| **Global Styles** | `style.css` | SaaS design system, CSS custom properties, and responsive layout |
| **Core Script** | `script.js` | Full-dataset search index, filtering, favorites, collections & modal engine |
| **Production Dataset** | `data/ai-tools.js` | Exactly 3,938 tools with canonical taxonomy |
| **Tool Detail Pages** | `tools/<tool-id>/index.html` | Exactly 3,938 static pages with JSON-LD and related tools |
| **Category Hub Pages** | `category/<category-slug>/index.html` | Exactly 14 static landing pages with switcher navigation |
| **Compare Page** | `compare/index.html` & `compare/compare.js` | Side-by-side comparison matrix (2–4 tools) |
| **Collections Page** | `collections/index.html` & `collections/collections.js` | Custom workflow library hub and detail views |
| **XML Sitemap** | `sitemap.xml` | Exactly 3,953 URLs (1 home + 14 categories + 3,938 tools) |
| **Robots Directives** | `robots.txt` | `User-agent: *`, `Allow: /`, and `Sitemap:` reference |
| **Brand Assets** | `assets/logo/favicon.svg` & `assets/logo/logo.svg` | SVG vector brand assets |

---

## 5. Web Server Configuration (Generic Static Hosting)

### 5.1 Clean URLs & Directory Indexing
Configure the static web server to serve `index.html` automatically for directory requests:
- `/tools/chatgpt/` $\rightarrow$ serves `tools/chatgpt/index.html`
- `/category/coding/` $\rightarrow$ serves `category/coding/index.html`
- `/compare/` $\rightarrow$ serves `compare/index.html`
- `/collections/` $\rightarrow$ serves `collections/index.html`

### 5.2 Custom 404 Routing
Ensure the web server serves `404.html` with an HTTP 404 status code when a requested route or tool does not exist.

### 5.3 Recommended MIME Types
Verify the web server sends standard content types:
- `.html` $\rightarrow$ `text/html; charset=utf-8`
- `.css` $\rightarrow$ `text/css; charset=utf-8`
- `.js` / `.mjs` $\rightarrow$ `application/javascript; charset=utf-8`
- `.svg` $\rightarrow$ `image/svg+xml`
- `.xml` $\rightarrow$ `application/xml; charset=utf-8`
- `.txt` $\rightarrow$ `text/plain; charset=utf-8`

### 5.4 Recommended HTTP Caching Headers
- **HTML files** (`index.html`, `404.html`, `tools/*`, `category/*`):
  ```http
  Cache-Control: public, max-age=0, must-revalidate
  ```
- **Static assets** (`style.css`, `script.js`, `assets/*`):
  ```http
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  ```

---

## 6. Post-Deployment Smoke Test Checklist

Once files are uploaded to the production host:

1. [ ] **Homepage (`/`)**: Loads instantaneously; search input accepts input; category counts sum to 3,938.
2. [ ] **Dark Mode**: Clicking the sun/moon toggle switches themes and persists across reloads.
3. [ ] **Search Engine**: Typing `"Cursor"` ranks Cursor #1; filter chips dismiss cleanly.
4. [ ] **Tool Detail Page (`/tools/chatgpt/`)**: Metadata, breadcrumbs, and 6 related tools render without broken images or styling errors.
5. [ ] **Category Page (`/category/coding/`)**: Shows "211 Listed Tools" and cards link to tool pages.
6. [ ] **Comparison (`/compare/`)**: Comparing 2 tools renders factual 7-row side-by-side table.
7. [ ] **Collections (`/collections/`)**: Creating and viewing custom collections functions client-side.
8. [ ] **404 Page (`/404.html` or `/nonexistent-url`)**: Renders custom 404 page with working "Browse 3,938 AI Tools" link.
9. [ ] **Sitemap (`/sitemap.xml`)**: Returns valid XML containing 3,953 URLs with production domain.
10. [ ] **Robots (`/robots.txt`)**: Points to the production sitemap URL.
11. [ ] **Mobile Viewport (390px)**: Slide-out drawer functions smoothly; zero horizontal overflow.
12. [ ] **Console Health**: DevTools console shows zero errors or failed network requests.
