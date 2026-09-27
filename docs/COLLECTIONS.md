# AIVault — Collections / My Library System Architecture (Phase 4C)

## 1. Executive Summary

Phase 4C introduces a **100% frontend-only, client-side Collections and My Library System** to the AIVault directory. Users can curate, save, and organize AI tools into custom workflow collections (e.g., "Engineering Stack", "Content Creation", "Productivity Favorites") without signing up, authenticating, or communicating with any server.

Collections can be managed from any surface:
1. **Homepage tool cards** via the `.btn-card-col` action.
2. **Quick View modal** via `#modal-col-btn`.
3. **Static Tool Detail pages** (`/tools/<id>/`) via `#detail-col-btn` and related tool cards.
4. **Static Category landing pages** (`/category/<slug>/`) via card collection buttons.
5. **Dedicated Collections Hub and Detail page** (`/collections/index.html`) supporting collection creation, renaming, deletion, and tool management.

---

## 2. Architectural Principles & Constraints

1. **100% Frontend-Only**:
   - Zero external APIs, AI inference APIs, user accounts, authentication services, backends, or databases.
   - Built purely with Vanilla Web Standards: semantic HTML5, modern CSS3, and Vanilla JavaScript (ES2022).
   - Zero external UI frameworks (No React, Vue, Angular, TypeScript, Tailwind, or Bootstrap).

2. **Dataset Immutability**:
   - The production dataset in `data/ai-tools.js` remains strictly untouched (3,938 tools, 0 validation errors).
   - Deleting a custom collection or removing tools from a collection NEVER modifies or removes tools from the core catalog.

3. **State Independence**:
   - Collections state (`aivault_collections`) is completely decoupled from Favorites (`aivault_favorites`), Recently Viewed (`aivault_recently_viewed`), and Comparison (`aivault_compare`).
   - Mutations in one system have zero side effects on other library subsystems.

4. **Stale ID Defense & Resilience**:
   - If an obsolete or deleted tool ID exists in stored collections, it is safely ignored during lookup against `toolMap`.
   - If `localStorage` data is corrupted or non-JSON, the application falls back safely to an empty array without runtime exceptions.

5. **Security & XSS Neutralization**:
   - User-provided collection names are rendered strictly via `textContent` or escaped using `escapeHtml()`.
   - Script tags, SVG injection, and inline event handlers (e.g. `<script>alert(1)</script>`, `<img src=x onerror=...>`) are completely neutralized.

---

## 3. Data Schema & Limits

### 3.1 LocalStorage Schema
Stored in `localStorage` under the key:
```javascript
const STORAGE_KEYS = {
  COLLECTIONS: "aivault_collections"
};
```

JSON Structure:
```json
[
  {
    "id": "engineering-stack",
    "name": "Engineering Stack",
    "toolIds": [
      "cursor",
      "github-copilot",
      "chatgpt"
    ]
  },
  {
    "id": "design-tools",
    "name": "Design Tools",
    "toolIds": [
      "midjourney",
      "canva-magic-studio"
    ]
  }
]
```

### 3.2 Enforcement Limits
- **Maximum Collections**: 20 collections per user.
  - Attempting to create a 21st collection is blocked with a clear toast notification:
    > *"Maximum 20 collections reached. Remove one to create another."*
- **Maximum Tools per Collection**: 100 tools per collection.
  - Attempting to add a 101st tool is blocked with a clear toast notification:
    > *"Maximum 100 tools per collection reached."*
- **No Silent Data Loss**: Existing user data is never truncated or overwritten silently.
- **Name Validation**:
  - Empty or whitespace-only names are rejected: *"Collection name cannot be empty"*.
  - Duplicate collection names (case-insensitive) are rejected: *"A collection with this name already exists"*.
  - Collection IDs are slugified deterministically with collision avoidance (e.g. `col-1`, `col-2`).

---

## 4. UI Touchpoints & User Experience

### 4.1 Header & Sidebar Navigation
- **Primary Navbar**: Contains a direct link to `collections/` with active state indicator.
- **Mobile Sidebar Drawer**: Features `MY LIBRARY` -> `Collections` (`#sidebar-lib-collections`) with a live badge showing the total number of user collections (`#sidebar-collections-count`).

### 4.2 Collection Picker Modal (`#col-modal`)
- Available across Homepage, Tool Detail pages, and Category landing pages.
- Allows quick assignment of a tool to one or multiple collections via checkboxes.
- Shows live tool counts per collection.
- Features an inline input field allowing users to create a new collection on the fly and immediately add the active tool to it.
- Accessible via keyboard:
  - `Escape` closes the picker.
  - `Enter` submits new collection creation.

### 4.3 Dedicated Collections Page (`/collections/`)
Features a client-side dual-view architecture driven by URL query parameters:
- **Hub View (`/collections/`)**:
  - Displays all user collections in a responsive CSS grid (`#collections-grid`).
  - Each collection card shows:
    - Collection title and tool count.
    - Tool preview pills (up to 3 real member tools).
    - Quick actions: "Open" link, "Rename" button, and "Delete" button.
  - Empty state when 0 collections exist: "No collections yet" with a primary "+ Create Collection" CTA.
- **Detail View (`/collections/?collection=<id>`)**:
  - Displays tools within a specific collection in the standard responsive tools grid.
  - Each tool card features a `.btn-remove-from-col` action to remove the tool directly from the collection.
  - Includes collection header with title, tool count, "Add More Tools" link, "Rename" action, and "Delete" action.
  - Empty state when collection has 0 tools: "This collection is empty" with a "Browse AI Tools" CTA linking to the directory.
- **Semantic Confirmation Dialog (`#col-dialog-modal`)**:
  - Unified modal for Create, Rename, and Delete confirmations.
  - Traps focus and handles keyboard submission (`Enter`) and dismissal (`Escape`).

---

## 5. Verification & Test Suite

The Collections system is covered by automated E2E tests (Tests 98–126 in `test-e2e.mjs`):
1. **Test 98**: Navbar link navigation to `collections/`.
2. **Test 99**: Mobile drawer link and counter badge presence.
3. **Test 100**: Initial state clean initialization (0 collections, 0 badge).
4. **Test 101**: Card collection button propagation prevention (`e.stopPropagation()`).
5. **Test 102**: Picker empty state rendering.
6. **Test 103**: Empty and whitespace name rejection with user toast.
7. **Test 104**: Valid collection creation and persistence to `aivault_collections`.
8. **Test 105**: Case-insensitive duplicate name rejection.
9. **Test 106**: Add tool to collection via picker checkbox.
10. **Test 107**: Tool toggle and duplicate prevention.
11. **Test 108**: Multi-collection tool membership.
12. **Test 109**: Quick View modal collection button.
13. **Test 110**: Detail page hero collection button.
14. **Test 111**: Category page cards collection button.
15. **Test 112**: 20-collection maximum limit enforcement.
16. **Test 113**: 100-tool maximum limit enforcement.
17. **Test 114**: State independence across favorites, recents, compare, and collections.
18. **Test 115**: Stale ID defense pruning missing catalog IDs.
19. **Test 116**: Corrupted storage recovery handling malformed JSON.
20. **Test 117**: Collections page SEO metadata, title, and canonical tags.
21. **Test 118**: Hub view rendering collection cards.
22. **Test 119**: Hub view rendering tool preview tags.
23. **Test 120**: Rename collection dialog and state synchronization.
24. **Test 121**: Single collection detail view (`?collection=<id>`).
25. **Test 122**: Remove tool from collection detail view.
26. **Test 123**: Empty collection state display with browse link.
27. **Test 124**: Delete collection dialog with catalog protection.
28. **Test 125**: Security and XSS neutralization.
29. **Test 126**: Mobile responsive layout (390px, 0 overflow), Dark theme active, 0 console errors.
