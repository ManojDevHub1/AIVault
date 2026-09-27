# AIVault — Tool Comparison System Architecture (Phase 4B)

## 1. Executive Summary

Phase 4B introduces a **100% frontend-only, client-side Tool Comparison System** to the AIVault directory. Users can select between **2 and 4 AI tools** across the homepage, Quick View modal, static tool detail pages, and category hubs, and compare them side-by-side on a dedicated comparison page (`compare/index.html`).

---

## 2. Architectural Principles & Constraints

1. **100% Frontend-Only**:
   - Zero external APIs, AI inference APIs, server-side backends, or databases.
   - Built purely with Vanilla Web Standards: semantic HTML5, modern CSS3, and Vanilla JavaScript (ES2022).
   - Zero external UI frameworks (No React, Vue, Angular, TypeScript, Tailwind, or Bootstrap).

2. **Dataset Immutability**:
   - The production dataset in `data/ai-tools.js` remains strictly untouched (3,938 tools, 0 validation errors).
   - Stale or invalid tool IDs stored in client state are gracefully ignored.

3. **Factual Neutrality**:
   - Comparison data is strictly factual and objective.
   - **Zero subjective rankings, winner badges, or marketing hype** (No "Best Tool", "Winner", "#1 Choice", or "Superior").
   - Missing attributes gracefully fall back to neutral labels such as `"Not listed"` or `"Not rated"`.

---

## 3. State Management & Persistence

The comparison state is stored in browser `localStorage` under the key `aivault_compare`.

### Storage Format
```json
["chatgpt", "cursor", "midjourney"]
```
- Stored as an array of unique tool string IDs.
- Capped at **4 items**.
- Stale IDs not found in `toolMap` are automatically filtered out during state initialization.

### Limits & Error Prevention
- **Minimum for Comparison**: 2 tools.
- **Maximum for Comparison**: 4 tools.
- **Attempting to Add a 5th Tool**: The addition is blocked, state remains at 4 items, and a clear user toast notification is triggered:
  > *"Maximum 4 tools can be compared at once. Remove one to add another."*
- **Duplicate Prevention**: Toggling an already-selected tool removes it from comparison.

---

## 4. UI Touchpoints & Controls

### 4.1 Tool Cards (Homepage & Category Hubs)
- Each card header includes a `.btn-card-compare` toggle button next to the favorite button.
- Displays a visual checkbox indicator (`☐ Compare` / `☑ Compare`).
- When active, applies `.active` class styling and checks the box.
- Uses `e.stopPropagation()` and `e.preventDefault()` to ensure clicking the compare button does not navigate or trigger the Quick View modal.

### 4.2 Quick View Modal
- The modal footer includes `#modal-compare-btn`.
- Synchronizes in real time with the active tool's comparison status.
- Text switches dynamically between `"Add to Compare"` and `"Remove from Compare"`.

### 4.3 Static Tool Detail Pages (`tools/<id>/`)
- The hero actions section contains `#detail-compare-btn`.
- Allows direct addition or removal from the comparison list while reviewing in-depth specs.

### 4.4 Floating Compare Bar (`#compare-bar`)
- Fixed floating dock pinned to the bottom of the viewport when $\ge 1$ tool is selected.
- Automatically hides when the comparison list is empty.
- Displays:
  1. Live counter badge: `(1/4)`, `(2/4)`, `(3/4)`, `(4/4)`.
  2. Individual tool pills with tool name and a remove button (`×`).
  3. **"Compare Now"** CTA button linking to `compare/`. Disabled/dimmed when only 1 tool is selected.
  4. **"Clear All"** button (`#btn-compare-clear`) that clears all selected tools in a single click.

---

## 5. Dedicated Comparison Page (`compare/index.html`)

### 5.1 Route & SEO Architecture
- Static page route: `compare/index.html`.
- Title: `<title>Compare AI Tools | AIVault</title>`.
- Canonical URL: `https://YOUR-DOMAIN.com/compare/`.
- Open Graph and Twitter Card metadata configured for social sharing.

### 5.2 Dynamic View States
1. **Empty State (`< 2` tools)**:
   - Renders `#compare-empty-state` container.
   - Message: *"Select at least 2 AI tools to compare."*
   - CTA button: *"Browse AI Tools"* linking back to `#all-tools-section`.
2. **Comparison Matrix (`2–4` tools)**:
   - Renders `#compare-content` table view.
   - Table wrapper with horizontal scrolling (`overflow-x: auto`) for responsive viewports.
   - Clear comparison and Add More Tools action buttons.

### 5.3 Compared Factual Dimensions
| Row Attribute | Data Field | Display Format |
| :--- | :--- | :--- |
| **Category** | `tool.category` | Category badge pill with diff highlight |
| **Pricing Model** | `tool.pricing` | Pricing badge (`Free`, `Freemium`, `Paid`) with diff highlight |
| **Rating & Reviews** | `tool.rating`, `tool.reviewCount` | Star rating + formatted review count (e.g. `★ 4.8 (1,250 reviews)`) |
| **Overview** | `tool.description` | Full factual tool summary |
| **Key Features** | `tool.features` | Bulleted list of capabilities with checkmark icons |
| **Best Suited For** | `tool.bestFor` | Primary audience and target workflows |
| **Official Website** | `tool.url` | Safe external link (`target="_blank" rel="noopener noreferrer"`) |

### 5.4 Difference Highlighting
- When values differ across compared tools for a given row (e.g. Category, Pricing, Rating), the row receives a `.diff-highlight` accent class and a subtle neutral `diff` badge.
- Fully compatible with light and dark color schemes via CSS design tokens.

---

## 6. Mobile Responsiveness & Viewport Integrity

- Tested and verified across desktop (1440px), tablet (1024px, 768px), and mobile (390px).
- On mobile viewports:
  - The comparison table wrapper supports smooth touch scrolling (`overflow-x: auto; -webkit-overflow-scrolling: touch`).
  - Overall page width strictly satisfies `scrollWidth <= clientWidth` with **zero horizontal page overflow**.
  - Compare bar pills collapse cleanly on small screens, retaining the count badge, Compare Now button, and Clear All action.

---

## 7. Verification & Automated Test Suite

The E2E test suite in `test-e2e.mjs` was expanded from **73 to 97 passing tests** with 0 errors.

### Comparison Tests Breakdown (Tests 74–97):
- **Test 74**: Compare list initialization & bar hidden when empty.
- **Test 75**: Adding first tool via card compare button & localStorage sync.
- **Test 76**: Event propagation stopped (card compare click does not open modal).
- **Test 77**: Floating compare bar appears with count `(1/4)`.
- **Test 78**: Tool pill rendered with name and remove button.
- **Test 79**: Compare Now button indicates minimum 2 tools required (disabled when count = 1).
- **Test 80**: Adding second tool & updating count to `(2/4)`.
- **Test 81**: Compare Now button enabled and links to `compare/`.
- **Test 82**: Adding third tool & updating count to `(3/4)`.
- **Test 83**: Adding fourth tool & updating count to `(4/4)`.
- **Test 84**: Maximum 4-tool limit enforcement (5th tool blocked with toast message).
- **Test 85**: Removing tool via compare bar pill (count decrements to 3/4 & card unchecks).
- **Test 86**: Removing tool via card button toggle (count decrements to 2/4).
- **Test 87**: Quick View modal compare toggle button updates state and text.
- **Test 88**: Clear All button empties comparison list and hides compare bar.
- **Test 89**: Static comparison page (`/compare/`) loads with SEO metadata & canonical tag.
- **Test 90**: Comparison page displays empty state when fewer than 2 tools selected.
- **Test 91**: Comparison page renders side-by-side table for 2 tools.
- **Test 92**: Comparison table displays all factual attributes without missing fields.
- **Test 93**: Neutrality enforced (0 subjective claims or winner badges detected).
- **Test 94**: Outbound link safety on compare page (`target="_blank"` & `rel="noopener noreferrer"`).
- **Test 95**: Difference highlighting accents varying fields.
- **Test 96**: Mobile responsive layout (390px) allows table scroll with zero page overflow.
- **Test 97**: Zero console errors logged across entire test suite.
