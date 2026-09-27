# DATA-STRUCTURE.md — Tool & Taxonomy Schema

This specification outlines the data contracts, deduplication rules, schema validation criteria, and import pipelines used across AIVault.

---

## 1. Dataset Architecture & Source Lineage

AIVault maintains a multi-layer data architecture:

1. **Production Static Dataset (`data/ai-tools.js`):**
   - The unified, client-ready static bundle containing all **3,938 catalog tools**.
   - Combines the 176 hand-curated seed tools with 3,762 imported tools from the staged open-dataset batch.
   - Synchronously loaded via `<script src="data/ai-tools.js"></script>` to ensure 100% offline and static hosting compatibility without CORS or `fetch()` restrictions.

2. **Staged Open-Dataset Batch (`data/ai-tools-dataset.json`):**
   - Authoritative source archive containing 3,893 real-world records extracted from `tioraicom/ai-tools-dataset` and `LichAmnesia/awesome-ai-tools-dataset`.
   - Screened against dead links and synthetic/hallucinated entries.

3. **Classification & Provenance Metadata (`data/ai-tools-import-metadata.json`):**
   - Tracks classification confidence levels (`categoryConfidence` and `pricingConfidence`) across all imported records.
   - See [DATA-SOURCES.md](file:///e:/AI-Project/AI-Vault/docs/DATA-SOURCES.md) for full licensing and attribution details.

4. **Exclusion Audit Trail (`data/excluded-records-log.json`):**
   - Audits all 75 discarded candidates (dead links, missing names, descriptions < 5 characters, or duplicate affiliate URLs).

5. **Historical Research Archive (`data/ai-tools-master-2000plus.json`):**
   - Historical seed research archive (150 tools) compiled during initial Phase 3 development.

---

## 2. Tool Object Schema (`data/ai-tools.js`)

Each tool in the directory adheres to the strict schema:

```javascript
{
  /**
   * Unique identifier (slug format, lowercase, hyphenated)
   * @type {string}
   * @example "chatgpt"
   */
  id: "chatgpt",

  /**
   * Official brand name of the AI tool
   * @type {string}
   * @example "ChatGPT"
   */
  name: "ChatGPT",

  /**
   * Short one-line summary / tagline
   * @type {string}
   * @example "Conversational reasoning & multimodal intelligence"
   */
  tagline: "Conversational reasoning & multimodal intelligence",

  /**
   * Primary category assignment matching one of the 14 AI_CATEGORIES
   * @type {string}
   * @example "AI Chat"
   */
  category: "AI Chat",

  /**
   * Pricing classification: 'Free' | 'Freemium' | 'Paid'
   * @type {string}
   * @example "Freemium"
   */
  pricing: "Freemium",

  /**
   * Average review score from 0.0 to 5.0
   * @type {number}
   * @example 4.8
   */
  rating: 4.8,

  /**
   * Number of user evaluations/ratings (>= 0)
   * @type {number}
   * @example 9420
   */
  reviewCount: 9420,

  /**
   * Comprehensive tool description (1-3 sentences)
   * @type {string}
   */
  description: "Industry-leading conversational AI model capable of advanced reasoning, coding, writing assistance, and multimodal document synthesis.",

  /**
   * Keyword tags used for badges and faceted search indexing
   * @type {string[]}
   */
  tags: ["Conversational", "GPT-4o", "Productivity", "Writing"],

  /**
   * List of 3-5 core feature bullet points displayed in modal
   * @type {string[]}
   */
  features: [
    "Natural language understanding and text generation",
    "Advanced code analysis, execution, and debugging",
    "Real-time web browsing and live information synthesis",
    "Custom GPT creation and public GPT store access",
    "Multimodal document, chart, and photo analysis"
  ],

  /**
   * Explanatory target user badges or optimal audience
   * @type {string[]}
   * @example ["Knowledge workers", "Software engineers", "Students"]
   */
  bestFor: ["Knowledge workers", "Software engineers", "Students", "General researchers"],

  /**
   * External official website destination URL (starts with https:// or http://)
   * @type {string}
   * @example "https://chatgpt.com"
   */
  url: "https://chatgpt.com",

  /**
   * Indicates whether the tool is curated in the Featured section
   * @type {boolean}
   */
  featured: true,

  /**
   * Indicates whether the tool is highlighted in the Trending section
   * @type {boolean}
   */
  trending: true,

  /**
   * ISO Date string when the tool was cataloged (YYYY-MM-DD)
   * @type {string}
   * @example "2023-01-15"
   */
  dateAdded: "2023-01-15",

  /**
   * Hex color accent for card icon background or branding
   * @type {string}
   * @example "#10A37F"
   */
  accentColor: "#10A37F",

  /**
   * Vector SVG markup for the tool icon
   * @type {string}
   */
  iconSvg: "<svg ...></svg>"
}
```

---

## 3. Canonical Category Taxonomy (`AI_CATEGORIES`)

AIVault uses a standardized 14-category taxonomy:

```javascript
const AI_CATEGORIES = [
  "All Categories",
  "AI Chat",
  "Image Generation",
  "Video",
  "Writing",
  "Coding",
  "Audio",
  "Business",
  "Research",
  "Education",
  "Productivity",
  "AI Agents",
  "Marketing",
  "Voice",
  "Design"
];
```

### Current Category Distribution (3,938 Tools)

| Category | Tool Count | Percentage | Primary Subdomains |
|---|---|---|---|
| Business | 1,331 | 33.8% | Operations, analytics, CRM, finance, HR, legal, sales |
| Productivity | 335 | 8.5% | Task management, scheduling, note-taking, browser extensions |
| Image Generation | 327 | 8.3% | Text-to-image, photo editing, restoration, generative artwork |
| AI Agents | 302 | 7.7% | Autonomous execution, multi-agent frameworks, web automation |
| Writing | 235 | 6.0% | Copywriting, storytelling, grammar correction, summarization |
| Marketing | 232 | 5.9% | SEO, ad generation, social media management, email campaigns |
| Video | 231 | 5.9% | Text-to-video, avatar synthesis, editing, subtitling |
| Coding | 211 | 5.4% | Code generation, code review, documentation, CLI tools |
| Design | 194 | 4.9% | UI/UX generation, 3D modeling, graphic design, layout tools |
| Audio | 132 | 3.4% | Music generation, sound effects, audio mastering, podcasts |
| Research | 128 | 3.3% | Academic search, paper summarization, citation mapping |
| Education | 113 | 2.9% | Tutoring, language learning, study guides, flashcards |
| Voice | 101 | 2.6% | Text-to-speech, voice cloning, speech recognition, dubbing |
| AI Chat | 66 | 1.7% | Foundational LLMs, conversational assistants, character AI |
| **Total** | **3,938** | **100.0%** | Sum of categories matches total catalog count exactly |

---

## 4. Deduplication Logic & Conflict Resolution

When merging thousands of records, the deduplication engine applies strict rules to prevent duplicate entries while preserving distinct offerings:

1. **Identifier Matching:** Exact lowercase comparison of `tool.id`.
2. **Normalized Name Matching:** Alphanumeric-only lowercase string comparison (e.g. `"Perplexity AI"` matches `"Perplexity"`).
3. **URL Domain & Path Matching:**
   - Dedicated root domains are matched by normalized hostname (e.g. `perplexity.ai`, `runwayml.com`).
   - Shared host platforms (`github.com`, `huggingface.co`, `google.com`, `microsoft.com`) require domain + path matching to avoid false positives (e.g. `github.com/suno-ai/bark` is Voice, while `github.com/features/copilot` is Coding).
4. **Collision Resolution:**
   - When a collision occurs between an incoming record and an existing record, the system **preserves the higher-quality record**.
   - Priority is given to verified non-zero ratings, verified review counts, custom vector SVG logos, and curated taglines.
   - In Phase 3A, 126 collisions with existing curated records were reconciled by retaining the rich existing records, and 5 internal batch duplicates were filtered out.

---

## 5. Dataset Validation (`validate-dataset.js`)

Every tool must pass the automated validator before being committed to production:

```powershell
node validate-dataset.js
```

| Field | Validation Rule | Severity |
|---|---|---|
| `id` | Non-empty string, must be unique across all entries | Error |
| `name` | Non-empty string, must be unique across all entries | Error |
| `category` | Must strictly match one of the 14 approved `AI_CATEGORIES` | Error |
| `pricing` | Must be strictly `"Free"`, `"Freemium"`, or `"Paid"` | Error |
| `rating` | Number between 0.0 and 5.0 | Error |
| `reviewCount` | Number >= 0 | Error |
| `description` | Non-empty string | Error |
| `tags` | Array of strings (at least 1 tag) | Warning |
| `features` | Array of strings (at least 1 feature) | Warning |
| `bestFor` | Array of strings (at least 1 target group) | Warning |
| `url` | Valid URL string starting with `https://` or `http://` | Error |

---

## 6. Search Pre-Computation Architecture

To support instantaneous search across 3,900+ items without DOM traversals:

- During startup in `script.js`'s `initDataset()`, a pre-computed search document string `_searchDoc` is attached to each tool object:
  ```javascript
  _searchDoc = [
    tool.name,
    tool.tagline || "",
    tool.category || "",
    tool.description || "",
    tagsArr.join(" "),
    featuresArr.join(" "),
    bestForArr.join(" ")
  ].join(" ").toLowerCase();
  ```
- Search queries are tokenized on whitespace. Every token must appear in `_searchDoc` for a match (`tokens.every(token => tool._searchDoc.includes(token))`).
- Search operates on the complete memory array `state.allTools` rather than the rendered DOM nodes, ensuring tools located beyond the first chunk (e.g. ranked #100+, #1,000+, or #3,900+) are found immediately.
- Benchmark: 0.20 ms cold query, < 0.10 ms warm keystroke.

---

## 7. How to Import Future Datasets

To safely import additional AI tool records in future phases:

1. **Prepare Source JSON:** Save incoming records in a staging JSON file.
2. **Execute Validation & Normalization:**
   - Map categories to the canonical 14 categories.
   - Validate pricing values (`Free`, `Freemium`, `Paid`).
   - Ensure `bestFor`, `features`, and `tags` are string arrays.
3. **Execute Deduplication:**
   - Run the deduplication script (`merge-v3.mjs`).
   - Inspect logged collision pairs to confirm true identity matches.
4. **Run Validator, Static Page Generator & E2E Test Suite:**
   ```powershell
   node validate-dataset.js
   node scripts/generate-pages.mjs
   node test-e2e.mjs
   ```
   Confirm zero validation errors and all 35 E2E assertions pass before releasing changes.

---

## 8. Static Page Compilation Protocol

For production releases:
- Run `node scripts/generate-pages.mjs` to synchronize all static directory pages with `data/ai-tools.js`.
- The generator emits:
  - 3,938 static tool pages (`tools/<id>/index.html`)
  - 14 static category hubs (`category/<slug>/index.html`)
  - An XML sitemap (`sitemap.xml`) with 3,953 URLs
  - A crawler permissions file (`robots.txt`)
- See [docs/SEO-ARCHITECTURE.md](file:///e:/AI-Project/AI-Vault/docs/SEO-ARCHITECTURE.md) for full schema.org mapping and canonical URL configuration.

