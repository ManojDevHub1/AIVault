/**
 * AIVault — Discover the Right AI
 * Advanced Directory Engine (Vanilla JavaScript — Phase 2 Architecture)
 * 
 * Engine Responsibilities:
 * - Dataset validation & indexing for 1000+ items
 * - Multi-facet search across name, category, description, tags, features, bestFor
 * - Non-mutating sorting engine (Popular, Rating, A-Z, Newest)
 * - Chunk rendering (Pagination / Load More) via DocumentFragments
 * - Event delegation for high-scale DOM efficiency
 * - Dynamic category counting and active title computation
 * - Client-side URL query state persistence (?category=...&pricing=...&q=...)
 * - Reusable accessible detail modal with sanitized URLs and bestFor arrays
 * - Resilient LocalStorage favorites and recently viewed management
 */

(function () {
  "use strict";

  // Configuration constants
  const CHUNK_SIZE = 12; // Configurable batch size for progressive rendering
  const MAX_RECENT_ITEMS = 20;

  // =========================================================================
  // 1. STATE MANAGEMENT
  // =========================================================================
  const state = {
    allTools: [],
    toolMap: new Map(), // Fast O(1) id -> tool lookup
    categories: (typeof window !== "undefined" && window.AI_CATEGORIES) ? window.AI_CATEGORIES : [],
    tagCounts: new Map(),
    allTags: [],
    
    // Filter & Query States
    searchQuery: "",
    selectedCategory: "All Categories",
    selectedPricing: "all",
    selectedRating: 0,
    selectedSort: "popular",
    currentLibraryView: null, // null | 'favorites' | 'recent'
    
    // Search Suggestions (Phase 4A)
    currentSuggestions: [],
    selectedSuggestionIndex: -1,
    
    // Pagination / Chunking
    visibleLimit: CHUNK_SIZE,
    currentFilteredList: [],
    
    // LocalStorage Caches
    favorites: new Set(),
    recentlyViewed: [], // Array of valid tool IDs
    compareToolIds: [], // Array of valid tool IDs for comparison (max 4)
    collections: [], // Array of collection objects: { id, name, toolIds: [] } (Phase 4C)
    activePickerToolId: null,
    theme: "light",
    activeModalToolId: null
  };

  // LocalStorage keys
  const STORAGE_KEYS = {
    FAVORITES: "aivault_favorites",
    RECENTLY_VIEWED: "aivault_recently_viewed",
    COMPARE: "aivault_compare",
    COLLECTIONS: "aivault_collections",
    THEME: "aivault_theme"
  };

  // =========================================================================
  // 2. DOM ELEMENT REFERENCES (Cached)
  // =========================================================================
  const DOM = {
    // Navbar
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    sidebar: document.getElementById("sidebar"),
    sidebarBackdrop: document.getElementById("sidebar-backdrop"),
    sidebarCloseBtn: document.getElementById("sidebar-close-btn"),
    navSearchBtn: document.getElementById("nav-search-btn"),
    navFavoritesBtn: document.getElementById("nav-favorites-btn"),
    navFavCount: document.getElementById("nav-fav-count"),
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    navLinks: document.querySelectorAll(".nav-link"),
    
    // Sidebar
    categoryList: document.getElementById("category-list"),
    libFavoritesBtn: document.getElementById("lib-favorites-btn"),
    libRecentBtn: document.getElementById("lib-recent-btn"),
    sidebarFavCount: document.getElementById("sidebar-fav-count"),
    sidebarRecentCount: document.getElementById("sidebar-recent-count"),
    btnSubmitTool: document.getElementById("btn-submit-tool"),

    // Search & Filter (Phase 4A Advanced Engine)
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    searchClearBtn: document.getElementById("search-clear-btn"),
    searchSuggestionsDropdown: document.getElementById("search-suggestions-dropdown"),
    searchDiscoveryShortcuts: document.getElementById("search-discovery-shortcuts"),
    pricingPills: document.querySelectorAll(".filter-pill"),
    categorySelect: document.getElementById("category-select"),
    ratingSelect: document.getElementById("rating-select"),
    sortSelect: document.getElementById("sort-select"),
    btnResetFilters: document.getElementById("btn-reset-filters"),
    activeFilterChips: document.getElementById("active-filter-chips"),

    // Sections & Grids
    mainContent: document.getElementById("main-content"),
    featuredSection: document.getElementById("featured-section"),
    featuredGrid: document.getElementById("featured-tools-grid"),
    trendingSection: document.getElementById("trending-section"),
    trendingGrid: document.getElementById("trending-tools-grid"),
    allToolsSection: document.getElementById("all-tools-section"),
    allToolsGrid: document.getElementById("all-tools-grid"),
    allToolsTitleText: document.getElementById("all-tools-title-text"),
    toolsCount: document.getElementById("tools-count"),
    currentViewDesc: document.getElementById("current-view-desc"),
    btnClearSearchAction: document.getElementById("btn-clear-search-action"),
    emptyState: document.getElementById("empty-state"),
    emptyStateTitle: document.getElementById("empty-state-title"),
    emptyStateText: document.getElementById("empty-state-text"),
    btnClearSearchEmpty: document.getElementById("btn-clear-search-empty"),
    btnClearEmptyState: document.getElementById("btn-clear-empty-state"),
    emptyCategoryChips: document.getElementById("empty-category-chips"),
    btnLoadMore: document.getElementById("btn-load-more"),
    loadMoreStatus: document.getElementById("load-more-status"),

    // Modal
    modalBackdrop: document.getElementById("tool-modal-backdrop"),
    modalDialog: document.getElementById("tool-modal"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    modalToolLogo: document.getElementById("modal-tool-logo"),
    modalToolName: document.getElementById("modal-tool-name"),
    modalToolTagline: document.getElementById("modal-tool-tagline"),
    modalToolCategory: document.getElementById("modal-tool-category"),
    modalToolPricing: document.getElementById("modal-tool-pricing"),
    modalToolRating: document.getElementById("modal-tool-rating"),
    modalToolReviews: document.getElementById("modal-tool-reviews"),
    modalToolDesc: document.getElementById("modal-tool-description"),
    modalToolTags: document.getElementById("modal-tool-tags"),
    modalToolFeatures: document.getElementById("modal-tool-features"),
    modalToolBestFor: document.getElementById("modal-tool-best-for"),
    modalFavBtn: document.getElementById("modal-fav-btn"),
    modalFavText: document.getElementById("modal-fav-text"),
    modalVisitBtn: document.getElementById("modal-visit-btn"),
    modalDetailsBtn: document.getElementById("modal-details-btn"),
    modalCompareBtn: document.getElementById("modal-compare-btn"),
    modalCompareText: document.getElementById("modal-compare-text"),

    // Compare Bar (Phase 4B)
    compareBar: document.getElementById("compare-bar"),
    compareBarCount: document.getElementById("compare-bar-count"),
    compareBarPills: document.getElementById("compare-bar-pills"),
    btnCompareNow: document.getElementById("btn-compare-now"),
    btnCompareClear: document.getElementById("btn-compare-clear"),
    sidebarCompareCount: document.getElementById("sidebar-compare-count"),

    // Collections (Phase 4C)
    modalColBtn: document.getElementById("modal-col-btn"),
    sidebarCollectionsCount: document.getElementById("sidebar-collections-count"),
    colModalBackdrop: document.getElementById("col-modal-backdrop"),
    colModal: document.getElementById("col-modal"),
    colModalCloseBtn: document.getElementById("col-modal-close-btn"),
    colPickerList: document.getElementById("col-picker-list"),
    colCreateInput: document.getElementById("col-create-input"),
    btnColCreateSubmit: document.getElementById("btn-col-create-submit"),
    colModalDoneBtn: document.getElementById("col-modal-done-btn"),

    // Toast Container
    toastContainer: document.getElementById("toast-container"),
    footerFavLink: document.getElementById("footer-fav-link")
  };

  // =========================================================================
  // 3. DATA VALIDATION ENGINE
  // =========================================================================
  /**
   * Validates dataset integrity at startup or development time.
   * Detects duplicate IDs, invalid pricing/categories, missing URLs, malformed arrays.
   * Sanitizes rather than crashing so user experience is protected.
   */
  function validateToolDataset(tools, validCategories) {
    const report = {
      isValid: true,
      totalChecked: Array.isArray(tools) ? tools.length : 0,
      errors: [],
      warnings: []
    };

    if (!Array.isArray(tools) || tools.length === 0) {
      report.isValid = false;
      report.errors.push("Dataset is empty or not an array");
      return report;
    }

    const seenIds = new Set();
    const approvedPricing = new Set(["Free", "Freemium", "Paid"]);
    const approvedCats = new Set(validCategories.filter(c => c !== "All Categories"));

    tools.forEach((tool, idx) => {
      const prefix = `Tool #${idx + 1} (${tool.id || "unnamed"}):`;

      // 1. ID check
      if (!tool.id || typeof tool.id !== "string" || !tool.id.trim()) {
        report.errors.push(`${prefix} Missing or empty ID`);
        report.isValid = false;
      } else if (seenIds.has(tool.id)) {
        report.errors.push(`${prefix} Duplicate ID detected "${tool.id}"`);
        report.isValid = false;
      } else {
        seenIds.add(tool.id);
      }

      // 2. Name check
      if (!tool.name || typeof tool.name !== "string" || !tool.name.trim()) {
        report.errors.push(`${prefix} Missing or empty tool name`);
        report.isValid = false;
      }

      // 3. Category check
      if (!tool.category || !approvedCats.has(tool.category)) {
        report.errors.push(`${prefix} Invalid category "${tool.category}". Must be one of approved taxonomy.`);
        report.isValid = false;
      }

      // 4. Pricing check
      if (!tool.pricing || !approvedPricing.has(tool.pricing)) {
        report.errors.push(`${prefix} Invalid pricing "${tool.pricing}". Must be Free, Freemium, or Paid.`);
        report.isValid = false;
      }

      // 5. Rating check
      if (typeof tool.rating !== "number" || isNaN(tool.rating) || tool.rating < 0 || tool.rating > 5) {
        report.errors.push(`${prefix} Invalid rating "${tool.rating}". Must be a number between 0 and 5.`);
        report.isValid = false;
      }

      // 6. Arrays check (tags, features, bestFor)
      if (!Array.isArray(tool.tags)) {
        report.warnings.push(`${prefix} 'tags' should be an array. Received ${typeof tool.tags}`);
      }
      if (!Array.isArray(tool.features)) {
        report.warnings.push(`${prefix} 'features' should be an array. Received ${typeof tool.features}`);
      }
      if (!Array.isArray(tool.bestFor)) {
        report.warnings.push(`${prefix} 'bestFor' should be an array. Received ${typeof tool.bestFor}`);
      }

      // 7. URL check
      if (!tool.url || typeof tool.url !== "string" || (!tool.url.startsWith("http://") && !tool.url.startsWith("https://"))) {
        report.errors.push(`${prefix} Missing or insecure URL "${tool.url}". Must begin with https:// or http://`);
        report.isValid = false;
      }
    });

    if (report.errors.length > 0) {
      console.warn(`[AIVault Dataset Validation] Found ${report.errors.length} errors:`, report.errors);
    }
    if (report.warnings.length > 0) {
      console.info(`[AIVault Dataset Validation] Found ${report.warnings.length} warnings:`, report.warnings);
    }

    return report;
  }

  // =========================================================================
  // 4. DATASET INITIALIZATION & SEARCH INDEX PRE-COMPUTATION
  // =========================================================================
  
  // Normalization Helpers
  function normalizeText(text) {
    if (typeof text !== "string") return "";
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeAlphaNum(text) {
    if (typeof text !== "string") return "";
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // Curated Term Synonyms Map (Domain-specific for AI tools)
  const SYNONYM_MAP = {
    "editor": ["editing"],
    "editing": ["editor"],
    "image": ["images", "photo", "photos"],
    "images": ["image", "photo", "photos"],
    "photo": ["image", "images"],
    "photos": ["image", "images"],
    "video": ["videos"],
    "videos": ["video"],
    "voice": ["speech", "vocal"],
    "speech": ["voice"],
    "code": ["coding", "programming", "developer"],
    "coding": ["code", "programming", "developer"],
    "research": ["academic", "paper", "scholar"],
    "academic": ["research", "paper", "scholar"],
    "maker": ["generator", "creator", "builder"],
    "generator": ["generation", "maker"],
    "generation": ["generator", "generating"],
    "music": ["audio", "sound", "soundtrack"],
    "audio": ["music", "sound"],
    "agent": ["agents", "autonomous"],
    "agents": ["agent", "autonomous"],
    "writing": ["writer", "copywriting", "content"]
  };

  function getTermVariants(term) {
    const norm = normalizeText(term);
    const variants = new Set([norm]);
    if (SYNONYM_MAP[norm]) {
      SYNONYM_MAP[norm].forEach(s => variants.add(s));
    }
    return Array.from(variants);
  }

  // Canonical Category Intent Mapping
  const CATEGORY_INTENT_MAP = {
    "video": "Video",
    "videos": "Video",
    "code": "Coding",
    "coding": "Coding",
    "image": "Image Generation",
    "images": "Image Generation",
    "chat": "AI Chat",
    "voice": "Voice",
    "audio": "Audio",
    "music": "Audio",
    "writing": "Writing",
    "write": "Writing",
    "research": "Research",
    "academic": "Research",
    "agent": "AI Agents",
    "agents": "AI Agents",
    "marketing": "Marketing",
    "design": "Design",
    "productivity": "Productivity",
    "education": "Education",
    "business": "Business"
  };

  // High-frequency generic AI terms penalized in specificity scoring
  const GENERIC_TOKENS = new Set([
    "ai", "tool", "tools", "app", "apps", "platform", "platforms", "software", "solution", "solutions", "web", "online"
  ]);

  // Inverted Document Frequency cache
  const docFreq = new Map();
  let totalIndexedTools = 0;

  function getTokenIDF(token) {
    if (GENERIC_TOKENS.has(token)) return 0.2;
    const df = docFreq.get(token) || 1;
    return Math.log(1 + totalIndexedTools / (1 + df));
  }

  function initDataset() {
    const rawData = (typeof window !== "undefined" && window.AI_TOOLS_DATA) ? window.AI_TOOLS_DATA : [];
    
    // Validate dataset at runtime
    const validation = validateToolDataset(rawData, state.categories);

    // Filter out completely corrupt items that lack an ID or Name
    const sanitized = rawData.filter(t => t && t.id && t.name);

    const tagCounts = new Map();
    docFreq.clear();
    totalIndexedTools = sanitized.length;

    state.allTools = sanitized.map(tool => {
      // Normalize bestFor to an array if provided as a string
      const bestForArr = Array.isArray(tool.bestFor)
        ? tool.bestFor
        : (typeof tool.bestFor === "string" ? [tool.bestFor] : []);

      const tagsArr = Array.isArray(tool.tags) ? tool.tags : [];
      const featuresArr = Array.isArray(tool.features) ? tool.features : [];

      tagsArr.forEach(t => {
        const cleanTag = (typeof t === "string" ? t.trim() : "");
        if (cleanTag) {
          tagCounts.set(cleanTag, (tagCounts.get(cleanTag) || 0) + 1);
        }
      });

      // Pre-compute lowercase and normalized fields for instant deterministic relevance scoring
      const lowerName = (tool.name || "").toLowerCase();
      const lowerCategory = (tool.category || "").toLowerCase();
      const lowerDesc = (tool.description || "").toLowerCase();
      const lowerTagline = (tool.tagline || "").toLowerCase();
      const lowerTags = tagsArr.map(t => (typeof t === "string" ? t.toLowerCase() : ""));
      const lowerFeatures = featuresArr.map(f => (typeof f === "string" ? f.toLowerCase() : ""));
      const lowerBestFor = bestForArr.map(b => (typeof b === "string" ? b.toLowerCase() : ""));

      const normName = normalizeText(tool.name);
      const normNameWords = normName.split(" ");
      const alphaNumName = normalizeAlphaNum(tool.name);
      const normTagline = normalizeText(tool.tagline || "");
      const normCategory = normalizeText(tool.category || "");
      const normDesc = normalizeText(tool.description || "");
      const normTags = tagsArr.map(t => normalizeText(t));
      const normFeatures = featuresArr.map(f => normalizeText(f));
      const normBestFor = bestForArr.map(b => normalizeText(b));

      // Build document tokens for IDF
      const allTokens = new Set([
        ...normNameWords,
        ...normTagline.split(" "),
        ...normCategory.split(" "),
        ...normDesc.split(" "),
        ...normTags.flatMap(t => t.split(" ")),
        ...normFeatures.flatMap(f => f.split(" ")),
        ...normBestFor.flatMap(b => b.split(" "))
      ]);

      allTokens.forEach(tok => {
        if (tok) docFreq.set(tok, (docFreq.get(tok) || 0) + 1);
      });

      const searchDoc = [
        normName,
        normTagline,
        normCategory,
        normDesc,
        normTags.join(" "),
        normFeatures.join(" "),
        normBestFor.join(" ")
      ].join(" ");

      const normalizedTool = {
        ...tool,
        bestFor: bestForArr,
        tags: tagsArr,
        features: featuresArr,
        reviewCount: typeof tool.reviewCount === "number" ? tool.reviewCount : 100,
        _searchDoc: searchDoc,
        _lowerName: lowerName,
        _lowerCategory: lowerCategory,
        _lowerDesc: lowerDesc,
        _lowerTagline: lowerTagline,
        _lowerTags: lowerTags,
        _lowerFeatures: lowerFeatures,
        _lowerBestFor: lowerBestFor,
        _normName: normName,
        _normNameWords: normNameWords,
        _alphaNumName: alphaNumName,
        _normTagline: normTagline,
        _normCategory: normCategory,
        _normDesc: normDesc,
        _normTags: normTags,
        _normFeatures: normFeatures,
        _normBestFor: normBestFor,
        _score: 0
      };

      state.toolMap.set(tool.id, normalizedTool);
      return normalizedTool;
    });

    state.tagCounts = tagCounts;
    state.allTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Expose validation function and search helpers globally for tests and inspectability
    if (typeof window !== "undefined") {
      window.validateToolDataset = validateToolDataset;
      window.AIVaultValidationReport = validation;
      window.calculateToolRelevance = calculateToolRelevance;
      window.getTermVariants = getTermVariants;
      window.normalizeText = normalizeText;
      window.AIVaultCollections = {
        load: loadCollections,
        save: saveCollections,
        create: createCollection,
        rename: renameCollection,
        delete: deleteCollection,
        toggleTool: toggleToolInCollection,
        openPicker: openCollectionPicker,
        closePicker: closeCollectionPicker,
        getCollections: () => state.collections
      };
    }
  }

  // =========================================================================
  // 5. STORAGE & RESILIENCE HELPERS (With Stale ID Defense)
  // =========================================================================
  function loadFavorites() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Defense: Filter out stale IDs that no longer exist in the dataset
          const validIds = parsed.filter(id => state.toolMap.has(id));
          state.favorites = new Set(validIds);
        }
      }
    } catch (e) {
      console.warn("Could not read favorites from localStorage:", e);
      state.favorites = new Set();
    }
    updateFavoritesBadges();
  }

  function saveFavorites() {
    try {
      const arr = Array.from(state.favorites);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(arr));
    } catch (e) {
      console.warn("Could not save favorites to localStorage:", e);
    }
    updateFavoritesBadges();
  }

  function loadRecentlyViewed() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Defense: Filter out stale IDs that no longer exist in the dataset
          state.recentlyViewed = parsed.filter(id => state.toolMap.has(id));
        }
      }
    } catch (e) {
      console.warn("Could not read recently viewed from localStorage:", e);
      state.recentlyViewed = [];
    }
    updateRecentlyViewedBadge();
  }

  function saveRecentlyViewed(toolId) {
    if (!toolId || !state.toolMap.has(toolId)) return;
    // Add to front, remove duplicates, cap at MAX_RECENT_ITEMS
    const filtered = state.recentlyViewed.filter(id => id !== toolId);
    filtered.unshift(toolId);
    state.recentlyViewed = filtered.slice(0, MAX_RECENT_ITEMS);

    try {
      localStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(state.recentlyViewed));
    } catch (e) {
      console.warn("Could not save recently viewed to localStorage:", e);
    }
    updateRecentlyViewedBadge();
  }

  function loadTheme() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      } else {
        setTheme("light");
      }
    } catch (e) {
      setTheme("light");
    }
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      // Ignored
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme} theme`);
  }

  function updateFavoritesBadges() {
    const count = state.favorites.size;
    if (DOM.navFavCount) DOM.navFavCount.textContent = count;
    if (DOM.sidebarFavCount) DOM.sidebarFavCount.textContent = count;
  }

  function updateRecentlyViewedBadge() {
    const count = state.recentlyViewed.length;
    if (DOM.sidebarRecentCount) DOM.sidebarRecentCount.textContent = count;
  }

  // =========================================================================
  // 5b. TOOL COMPARISON STATE & STORAGE ENGINE (Phase 4B Architecture)
  // =========================================================================
  const MAX_COMPARE_TOOLS = 4;

  function loadCompare() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPARE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Defense: Filter out stale/deleted tool IDs and limit to 4
          state.compareToolIds = parsed.filter(id => state.toolMap.has(id)).slice(0, MAX_COMPARE_TOOLS);
        }
      }
    } catch (e) {
      console.warn("Could not read compare list from localStorage:", e);
      state.compareToolIds = [];
    }
    updateCompareUI();
  }

  function saveCompare() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(state.compareToolIds));
    } catch (e) {
      console.warn("Could not save compare list to localStorage:", e);
    }
    updateCompareUI();
  }

  function toggleCompare(toolId) {
    if (!toolId || !state.toolMap.has(toolId)) return false;
    const tool = state.toolMap.get(toolId);
    const toolName = tool ? tool.name : "Tool";

    const idx = state.compareToolIds.indexOf(toolId);
    if (idx !== -1) {
      // Remove from comparison
      state.compareToolIds.splice(idx, 1);
      saveCompare();
      showToast(`Removed ${toolName} from comparison`);
      return false;
    } else {
      // Check limit (Max 4 tools)
      if (state.compareToolIds.length >= MAX_COMPARE_TOOLS) {
        showToast("Maximum 4 tools can be compared at once. Remove one to add another.");
        return false;
      }
      // Add to comparison
      state.compareToolIds.push(toolId);
      saveCompare();
      showToast(`Added ${toolName} to comparison`);
      return true;
    }
  }

  function clearCompare() {
    state.compareToolIds = [];
    saveCompare();
    showToast("Comparison list cleared");
  }

  function updateCompareUI() {
    updateCompareBar();
    updateCardCompareButtons();
    if (state.activeModalToolId) {
      updateModalCompareButton(state.activeModalToolId);
    }
  }

  function updateCompareBar() {
    const count = state.compareToolIds.length;
    if (DOM.sidebarCompareCount) {
      DOM.sidebarCompareCount.textContent = count;
    }

    if (!DOM.compareBar) return;

    if (count === 0) {
      DOM.compareBar.hidden = true;
      return;
    }

    DOM.compareBar.hidden = false;
    if (DOM.compareBarCount) {
      DOM.compareBarCount.textContent = `(${count}/${MAX_COMPARE_TOOLS})`;
    }

    if (DOM.compareBarPills) {
      DOM.compareBarPills.innerHTML = "";
      state.compareToolIds.forEach(id => {
        const tool = state.toolMap.get(id);
        if (!tool) return;
        const pill = document.createElement("span");
        pill.className = "compare-pill";
        pill.innerHTML = `
          <span class="compare-pill-name" title="${escapeHtml(tool.name)}">${escapeHtml(tool.name)}</span>
          <button type="button" class="compare-pill-remove" data-tool-id="${escapeHtml(id)}" aria-label="Remove ${escapeHtml(tool.name)} from comparison" title="Remove ${escapeHtml(tool.name)}">×</button>
        `;
        DOM.compareBarPills.appendChild(pill);
      });
    }

    if (DOM.btnCompareNow) {
      DOM.btnCompareNow.classList.toggle("disabled", count < 2);
      if (count < 2) {
        DOM.btnCompareNow.setAttribute("aria-disabled", "true");
        DOM.btnCompareNow.title = "Select at least 2 tools to compare";
      } else {
        DOM.btnCompareNow.removeAttribute("aria-disabled");
        DOM.btnCompareNow.title = "Compare selected tools";
      }
    }
  }

  function updateCardCompareButtons() {
    document.querySelectorAll(".btn-card-compare").forEach(btn => {
      const toolId = btn.getAttribute("data-tool-id");
      if (!toolId) return;
      const isComp = state.compareToolIds.includes(toolId);
      btn.classList.toggle("active", isComp);
      btn.setAttribute("aria-label", isComp ? "Remove from compare" : "Add to compare");
      btn.setAttribute("title", isComp ? "Remove from compare" : "Add to compare");
      const glyph = btn.querySelector(".compare-checkbox-glyph");
      if (glyph) {
        glyph.textContent = isComp ? "☑" : "☐";
      }
    });
  }

  function updateModalCompareButton(toolId) {
    if (!DOM.modalCompareBtn) return;
    const isComp = state.compareToolIds.includes(toolId);
    DOM.modalCompareBtn.classList.toggle("active", isComp);
    DOM.modalCompareBtn.setAttribute("aria-label", isComp ? "Remove from compare" : "Add to compare");
    DOM.modalCompareBtn.setAttribute("title", isComp ? "Remove from compare" : "Add to compare");
    if (DOM.modalCompareText) {
      DOM.modalCompareText.textContent = isComp ? "Remove from Compare" : "Add to Compare";
    }
  }

  // =========================================================================
  // 5c. COLLECTIONS & MY LIBRARY ENGINE (Phase 4C Architecture)
  // =========================================================================
  const MAX_COLLECTIONS = 20;
  const MAX_TOOLS_PER_COLLECTION = 100;

  function loadCollections() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seenColIds = new Set();
          const validCols = [];

          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const id = typeof item.id === "string" ? item.id.trim() : "";
            const name = typeof item.name === "string" ? item.name.trim() : "";
            if (!id || !name) continue;

            if (seenColIds.has(id)) continue;
            seenColIds.add(id);

            // Filter tools to existing IDs without duplicates (Stale ID defense)
            const toolIds = [];
            if (Array.isArray(item.toolIds)) {
              const seenToolIds = new Set();
              for (const tid of item.toolIds) {
                if (typeof tid === "string" && !seenToolIds.has(tid)) {
                  if (state.toolMap.has(tid)) {
                    seenToolIds.add(tid);
                    toolIds.push(tid);
                  }
                }
              }
            }

            validCols.push({
              id,
              name,
              toolIds: toolIds.slice(0, MAX_TOOLS_PER_COLLECTION)
            });

            if (validCols.length >= MAX_COLLECTIONS) break;
          }
          state.collections = validCols;
        } else {
          state.collections = [];
        }
      } else {
        state.collections = [];
      }
    } catch (e) {
      console.warn("Could not read collections from localStorage:", e);
      state.collections = [];
    }
    updateCollectionsUI();
  }

  function saveCollections() {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(state.collections));
    } catch (e) {
      console.warn("Could not save collections to localStorage:", e);
    }
    updateCollectionsUI();
  }

  function updateCollectionsUI() {
    const count = state.collections.length;
    if (DOM.sidebarCollectionsCount) {
      DOM.sidebarCollectionsCount.textContent = count;
    }
  }

  function createCollection(name, addToolId = null) {
    if (typeof name !== "string" || !name.trim()) {
      showToast("Collection name cannot be empty");
      return null;
    }
    const cleanName = name.trim();

    if (state.collections.length >= MAX_COLLECTIONS) {
      showToast("Maximum 20 collections reached. Remove one to create another.");
      return null;
    }

    const lowerName = cleanName.toLowerCase();
    if (state.collections.some(c => c.name.toLowerCase() === lowerName)) {
      showToast("A collection with this name already exists");
      return null;
    }

    // Slugify ID
    let baseId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!baseId) baseId = "collection-" + Date.now();
    let uniqueId = baseId;
    let counter = 2;
    while (state.collections.some(c => c.id === uniqueId)) {
      uniqueId = `${baseId}-${counter++}`;
    }

    const toolIds = [];
    if (addToolId && state.toolMap.has(addToolId)) {
      toolIds.push(addToolId);
    }

    const newCol = {
      id: uniqueId,
      name: cleanName,
      toolIds
    };

    state.collections.push(newCol);
    saveCollections();
    showToast(`Created collection "${cleanName}"`);
    return newCol;
  }

  function renameCollection(id, newName) {
    const col = state.collections.find(c => c.id === id);
    if (!col) return false;

    if (typeof newName !== "string" || !newName.trim()) {
      showToast("Collection name cannot be empty");
      return false;
    }
    const cleanName = newName.trim();
    const lowerName = cleanName.toLowerCase();

    if (state.collections.some(c => c.id !== id && c.name.toLowerCase() === lowerName)) {
      showToast("A collection with this name already exists");
      return false;
    }

    col.name = cleanName;
    saveCollections();
    showToast(`Renamed collection to "${cleanName}"`);
    return true;
  }

  function deleteCollection(id) {
    const idx = state.collections.findIndex(c => c.id === id);
    if (idx === -1) return false;

    const removed = state.collections.splice(idx, 1)[0];
    saveCollections();
    showToast(`Deleted collection "${removed.name}"`);
    return true;
  }

  function toggleToolInCollection(colId, toolId) {
    const col = state.collections.find(c => c.id === colId);
    if (!col || !toolId || !state.toolMap.has(toolId)) return false;

    const idx = col.toolIds.indexOf(toolId);
    if (idx !== -1) {
      col.toolIds.splice(idx, 1);
      saveCollections();
      showToast(`Removed from "${col.name}"`);
      return false;
    } else {
      if (col.toolIds.length >= MAX_TOOLS_PER_COLLECTION) {
        showToast("Maximum 100 tools per collection reached.");
        return false;
      }
      col.toolIds.push(toolId);
      saveCollections();
      showToast(`Added to "${col.name}"`);
      return true;
    }
  }

  function openCollectionPicker(toolId) {
    if (!toolId || !state.toolMap.has(toolId)) return;
    state.activePickerToolId = toolId;
    renderCollectionPickerList(toolId);

    if (DOM.colModalBackdrop && DOM.colModal) {
      DOM.colModalBackdrop.hidden = false;
      DOM.colModal.hidden = false;
      if (DOM.colCreateInput) {
        DOM.colCreateInput.value = "";
      }
    }
  }

  function closeCollectionPicker() {
    if (DOM.colModalBackdrop && DOM.colModal) {
      DOM.colModalBackdrop.hidden = true;
      DOM.colModal.hidden = true;
    }
    state.activePickerToolId = null;
  }

  function renderCollectionPickerList(toolId) {
    if (!DOM.colPickerList) return;
    DOM.colPickerList.innerHTML = "";

    if (state.collections.length === 0) {
      const emptyNotice = document.createElement("div");
      emptyNotice.className = "col-picker-empty";
      emptyNotice.textContent = "No collections created yet. Enter a name below to create your first collection.";
      DOM.colPickerList.appendChild(emptyNotice);
      return;
    }

    state.collections.forEach(col => {
      const isMember = col.toolIds.includes(toolId);
      const item = document.createElement("label");
      item.className = "col-picker-item";

      const labelSpan = document.createElement("span");
      labelSpan.className = "col-picker-label";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "col-picker-checkbox";
      chk.checked = isMember;
      chk.setAttribute("aria-label", `Include in ${col.name}`);

      const nameText = document.createTextNode(col.name);

      labelSpan.appendChild(chk);
      labelSpan.appendChild(nameText);

      const countSpan = document.createElement("span");
      countSpan.className = "col-picker-count";
      countSpan.textContent = `(${col.toolIds.length})`;

      item.appendChild(labelSpan);
      item.appendChild(countSpan);

      chk.addEventListener("change", () => {
        toggleToolInCollection(col.id, toolId);
        countSpan.textContent = `(${col.toolIds.length})`;
      });

      DOM.colPickerList.appendChild(item);
    });
  }

  // =========================================================================
  // 6. TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2400);
  }

  // =========================================================================
  // 7. CLIENT-SIDE URL QUERY STATE (Optional & Frontend-Only)
  // =========================================================================
  function readUrlParams() {
    if (typeof window === "undefined" || !window.location.search) return;
    try {
      const params = new URLSearchParams(window.location.search);
      
      const q = params.get("q");
      if (q) {
        state.searchQuery = q;
        if (DOM.searchInput) DOM.searchInput.value = q;
        if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = false;
      }

      const cat = params.get("category");
      if (cat && (state.categories.includes(cat) || cat === "All Categories")) {
        state.selectedCategory = cat;
      }

      const pricing = params.get("pricing");
      if (pricing && ["all", "Free", "Freemium", "Paid"].includes(pricing)) {
        state.selectedPricing = pricing;
      }

      const rating = params.get("rating");
      if (rating && !isNaN(parseFloat(rating))) {
        state.selectedRating = parseFloat(rating);
      }

      const sort = params.get("sort");
      if (sort && ["popular", "rating", "az", "newest"].includes(sort)) {
        state.selectedSort = sort;
      }

      const view = params.get("view");
      if (view === "favorites" || view === "recent") {
        state.currentLibraryView = view;
      }
    } catch (e) {
      console.warn("Could not read URL query parameters:", e);
    }
  }

  function updateUrlParams() {
    if (typeof window === "undefined" || !window.history.replaceState) return;
    try {
      const params = new URLSearchParams();
      if (state.searchQuery.trim()) params.set("q", state.searchQuery.trim());
      if (state.selectedCategory && state.selectedCategory !== "All Categories") params.set("category", state.selectedCategory);
      if (state.selectedPricing && state.selectedPricing !== "all") params.set("pricing", state.selectedPricing);
      if (state.selectedRating > 0) params.set("rating", String(state.selectedRating));
      if (state.selectedSort && state.selectedSort !== "popular") params.set("sort", state.selectedSort);
      if (state.currentLibraryView) params.set("view", state.currentLibraryView);

      const qs = params.toString();
      const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    } catch (e) {
      // Ignored
    }
  }

  // =========================================================================
  // 7b. TEXT HIGHLIGHTING & RELEVANCE SCORING ENGINE (Phase 4A)
  // =========================================================================
  /**
   * Safely highlights matching query tokens in a string using text-range segmentation.
   * Completely XSS-safe: non-matched slices and matched slices are escaped with escapeHtml.
   */
  function highlightMatch(text, query) {
    if (!text || typeof text !== "string") return "";
    if (!query || typeof query !== "string") return escapeHtml(text);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return escapeHtml(text);

    const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return escapeHtml(text);

    const lower = text.toLowerCase();
    const intervals = [];

    // Exact phrase match first
    const lowerTrimmed = trimmedQuery.toLowerCase();
    let phraseIdx = 0;
    while ((phraseIdx = lower.indexOf(lowerTrimmed, phraseIdx)) !== -1) {
      intervals.push([phraseIdx, phraseIdx + lowerTrimmed.length]);
      phraseIdx += lowerTrimmed.length;
    }

    // Individual token matches
    tokens.forEach(tok => {
      const lowerTok = tok.toLowerCase();
      let pos = 0;
      while ((pos = lower.indexOf(lowerTok, pos)) !== -1) {
        intervals.push([pos, pos + lowerTok.length]);
        pos += lowerTok.length;
      }
    });

    if (intervals.length === 0) return escapeHtml(text);

    // Sort intervals by start index ascending, end descending
    intervals.sort((a, b) => a[0] - b[0] || b[1] - a[1]);

    // Merge overlapping/adjacent intervals
    const merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const curr = intervals[i];
      const prev = merged[merged.length - 1];
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1]);
      } else {
        merged.push(curr);
      }
    }

    // Build output string safely
    let result = "";
    let lastIdx = 0;
    for (const [start, end] of merged) {
      if (start > lastIdx) {
        result += escapeHtml(text.slice(lastIdx, start));
      }
      result += `<mark class="search-match">${escapeHtml(text.slice(start, end))}</mark>`;
      lastIdx = end;
    }
    if (lastIdx < text.length) {
      result += escapeHtml(text.slice(lastIdx));
    }

    return result;
  }

  // Pre-computed query structure for optimal sub-5ms search execution
  function prepareQueryContext(rawQuery) {
    const normQuery = normalizeText(rawQuery);
    const alphaNumQuery = normalizeAlphaNum(rawQuery);
    const tokens = normQuery.split(" ").filter(Boolean);

    const tokenData = tokens.map(tok => ({
      tok,
      variants: getTermVariants(tok),
      idf: getTokenIDF(tok),
      intendedCategory: CATEGORY_INTENT_MAP[tok] || null
    }));

    const phraseVariants = [];
    if (tokens.length >= 2) {
      const nonGeneric = tokenData.filter(td => !GENERIC_TOKENS.has(td.tok));
      if (nonGeneric.length >= 2) {
        const v0 = nonGeneric[0].variants;
        const v1 = nonGeneric[1].variants;
        for (const a of v0) {
          for (const b of v1) {
            phraseVariants.push(`${a} ${b}`);
          }
        }
      }
    }

    const hasVideo = tokens.includes("video");
    const hasImageOrPhoto = tokens.includes("image") || tokens.includes("photo") || tokens.includes("images");
    const checkVideoContradiction = hasVideo && !hasImageOrPhoto;

    return {
      rawQuery,
      normQuery,
      alphaNumQuery,
      tokens,
      tokenData,
      phraseVariants,
      checkVideoContradiction
    };
  }

  /**
   * Deterministic relevance scoring engine across all tool fields:
   * exact name > name prefix > name substring > category > tag > feature > bestFor > description
   * with IDF generic term weighting, synonym phrase matching, and category intent boosts.
   */
  function calculateToolRelevance(tool, queryOrCtx, maybeTokens) {
    if (!tool) return 0;
    const normName = tool._normName || normalizeText(tool.name || "");
    const alphaNumName = tool._alphaNumName || normalizeAlphaNum(tool.name || "");
    const normTagline = tool._normTagline || normalizeText(tool.tagline || "");
    const normCategory = tool._normCategory || normalizeText(tool.category || "");
    const normDesc = tool._normDesc || normalizeText(tool.description || "");
    const normTags = tool._normTags || (Array.isArray(tool.tags) ? tool.tags.map(t => normalizeText(t)) : []);
    const normFeatures = tool._normFeatures || (Array.isArray(tool.features) ? tool.features.map(f => normalizeText(f)) : []);
    const normBestFor = tool._normBestFor || (Array.isArray(tool.bestFor) ? tool.bestFor.map(b => normalizeText(b)) : []);
    const normNameWords = tool._normNameWords || normName.split(" ");
    const searchDoc = tool._searchDoc || [normName, normTagline, normCategory, normDesc, normTags.join(" "), normFeatures.join(" "), normBestFor.join(" ")].join(" ");

    const queryCtx = (queryOrCtx && typeof queryOrCtx === "object" && queryOrCtx.normQuery)
      ? queryOrCtx
      : prepareQueryContext(typeof queryOrCtx === "string" ? queryOrCtx : "");
    const { normQuery, alphaNumQuery, tokens, tokenData, phraseVariants, checkVideoContradiction } = queryCtx;
    let score = 0;

    // 1. Exact Full Tool Name Matches (highest priority)
    if (normName === normQuery) {
      score += 50000;
    } else if (alphaNumName === alphaNumQuery) {
      score += 45000;
    } else if (normName.startsWith(normQuery)) {
      score += 25000;
    } else if (normName.includes(normQuery)) {
      score += 15000;
    }

    // 2. Phrase Matching across fields
    if (tokens.length >= 2) {
      if (normName.includes(normQuery)) {
        score += 12000;
      }
      if (normTagline.includes(normQuery)) {
        score += 6000;
      }
      if (normTags.some(t => t.includes(normQuery))) {
        score += 5000;
      }
      if (normBestFor.some(b => b.includes(normQuery))) {
        score += 4000;
      }
      if (normFeatures.some(f => f.includes(normQuery))) {
        score += 3000;
      }
      if (normDesc.includes(normQuery)) {
        score += 2000;
      }

      if (phraseVariants.length > 0) {
        for (const p of phraseVariants) {
          if (!searchDoc.includes(p)) continue;
          if (normName.includes(p)) {
            score += 15000;
          }
          if (normTagline.includes(p)) {
            score += 8000;
          }
          if (normTags.some(t => t === p || t.includes(p))) {
            score += 7000;
          }
          if (normBestFor.some(b => b.includes(p))) {
            score += 6000;
          }
          if (normFeatures.some(f => f.includes(p))) {
            score += 5000;
          }
          if (normDesc.includes(p)) {
            score += 4000;
          }
        }
      }
    }

    // 3. Category Intent Boost
    tokenData.forEach(td => {
      if (td.intendedCategory && tool.category === td.intendedCategory) {
        score += 4000;
      }
    });

    // 3b. Name Contradiction Penalty
    if (checkVideoContradiction) {
      if (normName.includes("image") || normName.includes("images") || normName.includes("photo") || normName.includes("photos")) {
        score -= 15000;
      }
    }

    // 4. Token-level weighted scoring with IDF and synonyms
    let matchedTokenCount = 0;

    for (const td of tokenData) {
      let tokMatched = false;

      for (const v of td.variants) {
        let fieldScore = 0;

        if (normNameWords.includes(v)) {
          fieldScore = 2000;
        } else if (normName.startsWith(v)) {
          fieldScore = 1200;
        } else if (normName.includes(v)) {
          fieldScore = 800;
        }

        if (normTagline.includes(v)) {
          fieldScore = Math.max(fieldScore, 500);
        }

        if (normCategory.includes(v)) {
          fieldScore = Math.max(fieldScore, 1000);
        }

        if (normTags.some(t => t === v)) {
          fieldScore = Math.max(fieldScore, 900);
        } else if (normTags.some(t => t.includes(v))) {
          fieldScore = Math.max(fieldScore, 600);
        }

        if (normBestFor.some(b => b.includes(v))) {
          fieldScore = Math.max(fieldScore, 400);
        }

        if (normFeatures.some(f => f.includes(v))) {
          fieldScore = Math.max(fieldScore, 300);
        }

        if (normDesc.includes(v)) {
          fieldScore = Math.max(fieldScore, 150);
        }

        if (fieldScore > 0) {
          score += fieldScore * td.idf;
          tokMatched = true;
          break;
        }
      }

      if (tokMatched) {
        matchedTokenCount++;
      }
    }

    // 5. Token Coverage Bonus
    const coverageRatio = matchedTokenCount / (tokens.length || 1);
    if (tokens.length > 1) {
      if (coverageRatio === 1) {
        score += 5000; // All tokens covered
      } else {
        score += coverageRatio * 2000;
      }
    }

    return Math.round(score);
  }

  // =========================================================================
  // 8. DATA FILTERING & SORTING PIPELINE
  // =========================================================================
  function getCategoryCount(categoryName) {
    if (categoryName === "All Categories") {
      return state.allTools.length;
    }
    return state.allTools.filter(t => t.category === categoryName).length;
  }

  function getFilteredTools() {
    // 1. Start with derived array (NEVER mutate state.allTools)
    let list = [...state.allTools];

    // 2. Library view filters (Favorites or Recently Viewed)
    if (state.currentLibraryView === "favorites") {
      list = list.filter(tool => state.favorites.has(tool.id));
    } else if (state.currentLibraryView === "recent") {
      const orderMap = new Map();
      state.recentlyViewed.forEach((id, idx) => orderMap.set(id, idx));
      list = list.filter(tool => orderMap.has(tool.id));
      list.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));
      return list; // Early return for recently viewed to preserve chronological order
    }

    // 3. Category filter
    if (state.selectedCategory && state.selectedCategory !== "All Categories") {
      list = list.filter(tool => tool.category === state.selectedCategory);
    }

    // 4. Pricing filter
    if (state.selectedPricing && state.selectedPricing !== "all") {
      list = list.filter(tool => tool.pricing.toLowerCase() === state.selectedPricing.toLowerCase());
    }

    // 5. Rating filter
    if (state.selectedRating > 0) {
      list = list.filter(tool => tool.rating >= state.selectedRating);
    }

    // 6. Fast tokenized search filter & deterministic relevance scoring
    const rawQ = state.searchQuery.trim();
    if (rawQ) {
      const queryCtx = prepareQueryContext(rawQ);
      const { tokenData } = queryCtx;
      list = list.filter(tool => {
        // Every token must match somewhere in the precomputed searchDoc (including synonym variants)
        return tokenData.every(td => {
          return td.variants.some(v => tool._searchDoc.includes(v));
        });
      });

      // Compute deterministic relevance scores for matched items
      list.forEach(tool => {
        tool._score = calculateToolRelevance(tool, queryCtx);
      });
    } else {
      list.forEach(tool => {
        tool._score = 0;
      });
    }

    // 7. Non-mutating Sort
    sortTools(list, state.selectedSort, Boolean(rawQ));

    return list;
  }

  function sortTools(toolsList, sortType, isSearching = false) {
    if (isSearching && sortType === "popular") {
      // Relevance score ordering with deterministic tie-breaking:
      // 1. Relevance score descending
      // 2. Rating descending
      // 3. Review count descending
      // 4. Alphabetical by name ascending
      toolsList.sort((a, b) => (b._score - a._score) || (b.rating - a.rating) || ((b.reviewCount || 0) - (a.reviewCount || 0)) || a.name.localeCompare(b.name));
      return;
    }

    switch (sortType) {
      case "rating":
        toolsList.sort((a, b) => b.rating - a.rating || (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case "az":
        toolsList.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        // Sort by dateAdded descending (ISO YYYY-MM-DD string comparison is deterministic)
        toolsList.sort((a, b) => {
          const dateA = a.dateAdded || "";
          const dateB = b.dateAdded || "";
          if (dateB !== dateA) return dateB.localeCompare(dateA);
          return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
        });
        break;
      case "popular":
      default:
        toolsList.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || b.rating - a.rating);
        break;
    }
  }

  // =========================================================================
  // 9. CARD GENERATOR & COMPONENT RENDERING
  // =========================================================================
  function createToolCard(tool) {
    const isFav = state.favorites.has(tool.id);
    const isCompare = state.compareToolIds.includes(tool.id);
    const pricingClass = tool.pricing.toLowerCase();

    const card = document.createElement("article");
    card.className = "tool-card";
    card.setAttribute("data-tool-id", tool.id);
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View details for ${tool.name}`);

    // Card tags slice (up to 3 tags) with safe highlighting
    const tagsHtml = tool.tags
      .slice(0, 3)
      .map(tag => `<span class="tag-pill">${highlightMatch(tag, state.searchQuery)}</span>`)
      .join("");

    const highlightedName = highlightMatch(tool.name, state.searchQuery);
    const highlightedTagline = highlightMatch(tool.tagline || tool.category, state.searchQuery);
    const highlightedDesc = highlightMatch(tool.description, state.searchQuery);

    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon-box" style="color: ${tool.accentColor || 'var(--color-primary)'}">
          ${tool.iconSvg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'}
        </div>
        <div class="card-top-actions">
          <button type="button" class="btn-card-compare ${isCompare ? 'active' : ''}" data-tool-id="${escapeHtml(tool.id)}" aria-label="${isCompare ? 'Remove from compare' : 'Add to compare'}" title="${isCompare ? 'Remove from compare' : 'Add to compare'}">
            <span class="compare-checkbox-glyph" aria-hidden="true">${isCompare ? '☑' : '☐'}</span>
            <span>Compare</span>
          </button>
          <button type="button" class="btn-card-col" data-tool-id="${escapeHtml(tool.id)}" aria-label="Add ${escapeHtml(tool.name)} to collection" title="Save to collection">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button type="button" class="btn-fav ${isFav ? 'active' : ''}" data-tool-id="${escapeHtml(tool.id)}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="card-title-row">
          <h3 class="card-title">${highlightedName}</h3>
        </div>
        <div class="card-tagline">${highlightedTagline}</div>
        <p class="card-description">${highlightedDesc}</p>

        <div class="card-meta-row">
          <span class="badge-category">${escapeHtml(tool.category)}</span>
          ${tagsHtml}
        </div>
      </div>

      <div class="card-bottom">
        <div class="card-metrics">
          <div class="card-rating">
            <span class="star-icon" aria-hidden="true">★</span>
            <span>${tool.rating.toFixed(1)}</span>
            <span class="review-count">(${tool.reviewCount.toLocaleString()})</span>
          </div>
          <span class="badge-pricing ${pricingClass}">${escapeHtml(tool.pricing)}</span>
        </div>

        <div class="card-actions-row">
          <button type="button" class="btn-view-tool" data-tool-id="${escapeHtml(tool.id)}" tabindex="-1">
            <span>Quick View</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <a href="tools/${escapeHtml(tool.id)}/" class="btn-card-details" data-tool-id="${escapeHtml(tool.id)}">
            <span>Details</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </div>
    `;

    return card;
  }

  // =========================================================================
  // 10. CHUNK RENDERING & LOAD MORE (Scalable for 1000+ items)
  // =========================================================================
  function renderTools(resetChunk = true) {
    updateSectionOrder();

    if (resetChunk) {
      state.visibleLimit = CHUNK_SIZE;
      state.currentFilteredList = getFilteredTools();
      DOM.allToolsGrid.innerHTML = "";
    }

    const total = state.currentFilteredList.length;
    const startIndex = resetChunk ? 0 : DOM.allToolsGrid.children.length;
    const endIndex = Math.min(state.visibleLimit, total);

    // Update Dynamic Section Title & Result Count
    updateSectionTitleAndCounts(total);

    if (total === 0) {
      DOM.emptyState.hidden = false;
      DOM.btnLoadMore.style.display = "none";
      DOM.loadMoreStatus.textContent = "No tools available matching current criteria";

      if (DOM.btnClearSearchAction) {
        DOM.btnClearSearchAction.hidden = true;
      }

      if (DOM.emptyStateTitle) {
        if (state.searchQuery.trim()) {
          DOM.emptyStateTitle.textContent = `No AI tools matched "${state.searchQuery.trim()}"`;
        } else {
          DOM.emptyStateTitle.textContent = "No AI tools matched your filters";
        }
      }

      if (DOM.btnClearSearchEmpty) {
        DOM.btnClearSearchEmpty.hidden = !state.searchQuery.trim();
      }

      if (DOM.emptyCategoryChips) {
        DOM.emptyCategoryChips.innerHTML = "";
        const sampleCats = ["AI Chat", "Coding", "Video", "Writing", "AI Agents", "Image Generation"];
        sampleCats.forEach(cat => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "empty-category-chip";
          btn.textContent = cat;
          btn.addEventListener("click", () => {
            resetAllFilters();
            selectCategory(cat);
          });
          DOM.emptyCategoryChips.appendChild(btn);
        });
      }
    } else {
      DOM.emptyState.hidden = true;

      if (DOM.btnClearSearchAction) {
        DOM.btnClearSearchAction.hidden = !state.searchQuery.trim();
      }

      // Slice only the new items and append via DocumentFragment
      const slice = state.currentFilteredList.slice(startIndex, endIndex);
      if (slice.length > 0) {
        const fragment = document.createDocumentFragment();
        slice.forEach(tool => {
          fragment.appendChild(createToolCard(tool));
        });
        DOM.allToolsGrid.appendChild(fragment);
      }

      // Progress & Load More button visibility
      if (endIndex >= total) {
        DOM.btnLoadMore.style.display = "none";
        DOM.loadMoreStatus.textContent = `Showing all ${total} matching tools`;
      } else {
        DOM.btnLoadMore.style.display = "inline-flex";
        DOM.loadMoreStatus.textContent = `Showing ${endIndex} of ${total} tools`;
      }
    }

    renderActiveFilterChips();
    updateUrlParams();
  }

  function handleLoadMore() {
    state.visibleLimit += CHUNK_SIZE;
    renderTools(false); // Progressive append without wiping existing cards!
  }

  // =========================================================================
  // 10b. SECTION ORDERING ENGINE (Search Results Positioning)
  // =========================================================================
  /**
   * Positions the Search Results section (#all-tools-section) immediately
   * below the search/filter area (before Featured and Trending) when an active
   * search query is present. Restores default layout (Featured -> Trending ->
   * All Tools) when the search query is empty or cleared.
   */
  function updateSectionOrder() {
    const main = DOM.mainContent || document.getElementById("main-content");
    const allTools = DOM.allToolsSection || document.getElementById("all-tools-section");
    const featured = DOM.featuredSection || document.getElementById("featured-section");
    const trending = DOM.trendingSection || document.getElementById("trending-section");

    if (!main || !allTools || !featured || !trending) return;

    const hasSearch = Boolean(state.searchQuery && state.searchQuery.trim().length > 0);

    if (hasSearch) {
      // Place Search Results before Featured section
      if (allTools.nextElementSibling !== featured) {
        main.insertBefore(allTools, featured);
      }
    } else {
      // Restore default homepage order: All Tools after Trending section
      if (trending.nextElementSibling !== allTools) {
        if (typeof trending.after === "function") {
          trending.after(allTools);
        } else {
          main.insertBefore(allTools, trending.nextSibling);
        }
      }
    }
  }

  function updateSectionTitleAndCounts(total) {
    let titleText = "All AI Tools";
    const q = state.searchQuery.trim();
    const hasCat = state.selectedCategory && state.selectedCategory !== "All Categories";
    const hasPrice = state.selectedPricing && state.selectedPricing !== "all";

    if (state.currentLibraryView === "favorites") {
      titleText = "My Favorites";
    } else if (state.currentLibraryView === "recent") {
      titleText = "Recently Viewed";
    } else if (q && hasCat && hasPrice) {
      titleText = `${state.selectedPricing} ${state.selectedCategory} tools matching "${q}"`;
    } else if (q && hasCat) {
      titleText = `${state.selectedCategory} tools matching "${q}"`;
    } else if (q && hasPrice) {
      titleText = `${state.selectedPricing} AI tools matching "${q}"`;
    } else if (q) {
      titleText = `Results for "${q}"`;
    } else if (hasCat && hasPrice) {
      titleText = `${state.selectedPricing} ${state.selectedCategory}`;
    } else if (hasCat) {
      titleText = state.selectedCategory;
    } else if (hasPrice) {
      titleText = `${state.selectedPricing} AI Tools`;
    }

    if (DOM.allToolsTitleText) {
      DOM.allToolsTitleText.textContent = titleText;
    }

    if (DOM.toolsCount) {
      DOM.toolsCount.textContent = `· ${total.toLocaleString()} tool${total === 1 ? "" : "s"}`;
    }

    if (DOM.currentViewDesc) {
      if (state.currentLibraryView === "favorites") {
        DOM.currentViewDesc.textContent = "Showing your saved favorite AI tools.";
      } else if (state.currentLibraryView === "recent") {
        DOM.currentViewDesc.textContent = "Showing your recently viewed AI tools.";
      } else if (q) {
        DOM.currentViewDesc.textContent = `Tools matching "${q}" ranked by relevance.`;
      } else if (hasCat) {
        DOM.currentViewDesc.textContent = `Showing listed tools in ${state.selectedCategory}.`;
      } else {
        DOM.currentViewDesc.textContent = "Browse through tools in the AIVault directory.";
      }
    }
  }

  function renderFeaturedTools() {
    if (!DOM.featuredGrid) return;
    DOM.featuredGrid.innerHTML = "";
    const featured = state.allTools.filter(tool => tool.featured).slice(0, 4);
    const fragment = document.createDocumentFragment();
    featured.forEach(tool => {
      fragment.appendChild(createToolCard(tool));
    });
    DOM.featuredGrid.appendChild(fragment);
  }

  function renderTrendingTools() {
    if (!DOM.trendingGrid) return;
    DOM.trendingGrid.innerHTML = "";
    const trending = state.allTools.filter(tool => tool.trending).slice(0, 4);
    const fragment = document.createDocumentFragment();
    trending.forEach(tool => {
      fragment.appendChild(createToolCard(tool));
    });
    DOM.trendingGrid.appendChild(fragment);
  }

  function renderCategoriesSidebar() {
    if (!DOM.categoryList) return;
    DOM.categoryList.innerHTML = "";

    state.categories.forEach(cat => {
      const li = document.createElement("li");
      const count = getCategoryCount(cat);
      const isActive = state.selectedCategory === cat && !state.currentLibraryView;

      li.innerHTML = `
        <button type="button" class="sidebar-item ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat)}">
          <span class="sidebar-item-content">
            <span class="sidebar-icon" aria-hidden="true">
              ${getCategoryIcon(cat)}
            </span>
            <span class="sidebar-label">${escapeHtml(cat)}</span>
          </span>
          <span class="sidebar-count">${count}</span>
        </button>
      `;

      const btn = li.querySelector(".sidebar-item");
      btn.addEventListener("click", () => {
        selectCategory(cat);
        closeMobileSidebar();
      });

      DOM.categoryList.appendChild(li);
    });

    // Populate Category Select Dropdown as well
    if (DOM.categorySelect) {
      DOM.categorySelect.innerHTML = "";
      state.categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        DOM.categorySelect.appendChild(option);
      });
      DOM.categorySelect.value = state.selectedCategory;
    }
  }

  function getCategoryIcon(category) {
    const icons = {
      "All Categories": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      "AI Chat": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      "Image Generation": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
      "Video": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
      "Writing": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
      "Coding": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
      "Audio": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
      "Business": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      "Research": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      "Education": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      "Productivity": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      "AI Agents": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><path d="M8 15h8"/></svg>`,
      "Marketing": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      "Voice": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>`,
      "Design": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>`
    };
    return icons[category] || icons["All Categories"];
  }

  function renderActiveFilterChips() {
    if (!DOM.activeFilterChips) return;
    DOM.activeFilterChips.innerHTML = "";

    const chips = [];

    if (state.currentLibraryView === "favorites") {
      chips.push({ label: "Library: Favorites", clear: () => setLibraryView(null) });
    } else if (state.currentLibraryView === "recent") {
      chips.push({ label: "Library: Recently Viewed", clear: () => setLibraryView(null) });
    }

    if (state.selectedCategory !== "All Categories") {
      chips.push({ label: `Category: ${state.selectedCategory}`, clear: () => selectCategory("All Categories") });
    }

    if (state.selectedPricing !== "all") {
      chips.push({ label: `Pricing: ${state.selectedPricing}`, clear: () => setPricingFilter("all") });
    }

    if (state.selectedRating > 0) {
      chips.push({ label: `Rating: ★ ${state.selectedRating}+`, clear: () => setRatingFilter(0) });
    }

    if (state.searchQuery.trim()) {
      chips.push({ label: `Search: "${state.searchQuery.trim()}"`, clear: () => clearSearch() });
    }

    if (chips.length > 0) {
      DOM.btnResetFilters.hidden = false;
      chips.forEach(chip => {
        const span = document.createElement("span");
        span.className = "filter-chip";
        span.innerHTML = `
          <span>${escapeHtml(chip.label)}</span>
          <button type="button" class="filter-chip-remove" aria-label="Remove filter ${escapeHtml(chip.label)}">✕</button>
        `;
        span.querySelector(".filter-chip-remove").addEventListener("click", chip.clear);
        DOM.activeFilterChips.appendChild(span);
      });

      // Clear All chip button (Phase 4A)
      const clearAllBtn = document.createElement("button");
      clearAllBtn.type = "button";
      clearAllBtn.className = "filter-chip-clear-all";
      clearAllBtn.textContent = "Clear All";
      clearAllBtn.addEventListener("click", resetAllFilters);
      DOM.activeFilterChips.appendChild(clearAllBtn);
    } else {
      DOM.btnResetFilters.hidden = true;
    }
  }

  // =========================================================================
  // 11. USER ACTIONS & FILTER CONTROLS
  // =========================================================================
  function selectCategory(category) {
    state.currentLibraryView = null;
    state.selectedCategory = category;

    // Update sidebar active states
    document.querySelectorAll(".sidebar-item").forEach(item => {
      const catVal = item.getAttribute("data-category");
      if (catVal) {
        item.classList.toggle("active", catVal === category);
      } else {
        item.classList.remove("active");
      }
    });

    if (DOM.categorySelect) {
      DOM.categorySelect.value = category;
    }

    if (category === "All Categories") {
      DOM.currentViewDesc.textContent = "Browse through tools in the AIVault directory.";
    } else {
      DOM.currentViewDesc.textContent = `Showing listed tools in ${category}.`;
    }

    renderTools();
  }

  function setPricingFilter(pricing) {
    state.selectedPricing = pricing;
    DOM.pricingPills.forEach(pill => {
      const val = pill.getAttribute("data-pricing");
      pill.classList.toggle("active", val.toLowerCase() === pricing.toLowerCase());
    });
    renderTools();
  }

  function setRatingFilter(minRating) {
    state.selectedRating = parseFloat(minRating) || 0;
    if (DOM.ratingSelect) {
      DOM.ratingSelect.value = String(minRating);
    }
    renderTools();
  }

  function setSortOption(sortKey) {
    state.selectedSort = sortKey;
    if (DOM.sortSelect) {
      DOM.sortSelect.value = sortKey;
    }
    renderTools();
  }

  function setLibraryView(view) {
    state.currentLibraryView = view;
    // Clear active states on sidebar category list
    document.querySelectorAll(".sidebar-item").forEach(item => item.classList.remove("active"));

    if (view === "favorites") {
      if (DOM.libFavoritesBtn) DOM.libFavoritesBtn.classList.add("active");
      DOM.currentViewDesc.textContent = "Showing your saved favorite AI tools.";
      const target = document.getElementById("all-tools-section");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    } else if (view === "recent") {
      if (DOM.libRecentBtn) DOM.libRecentBtn.classList.add("active");
      DOM.currentViewDesc.textContent = "Showing your recently viewed AI tools.";
      const target = document.getElementById("all-tools-section");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    } else {
      selectCategory("All Categories");
      return;
    }

    closeMobileSidebar();
    renderTools();
  }

  function resetAllFilters() {
    state.searchQuery = "";
    state.selectedCategory = "All Categories";
    state.selectedPricing = "all";
    state.selectedRating = 0;
    state.selectedSort = "popular";
    state.currentLibraryView = null;

    if (DOM.searchInput) DOM.searchInput.value = "";
    if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = true;
    if (DOM.categorySelect) DOM.categorySelect.value = "All Categories";
    if (DOM.ratingSelect) DOM.ratingSelect.value = "0";
    if (DOM.sortSelect) DOM.sortSelect.value = "popular";

    DOM.pricingPills.forEach(p => p.classList.toggle("active", p.getAttribute("data-pricing") === "all"));
    closeSuggestions();
    renderCategoriesSidebar();
    renderTools();
    showToast("Filters reset to default");
  }

  function clearSearch() {
    state.searchQuery = "";
    closeSuggestions();
    if (DOM.searchInput) {
      DOM.searchInput.value = "";
      DOM.searchInput.focus();
    }
    if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = true;
    renderTools();
  }

  // =========================================================================
  // 11b. SEARCH SUGGESTIONS & AUTOCOMPLETE ENGINE (Phase 4A)
  // =========================================================================
  function updateSuggestions(query) {
    if (!DOM.searchSuggestionsDropdown) return;
    const trimmed = (typeof query === "string" ? query.trim().toLowerCase() : "");
    if (!trimmed || trimmed.length < 1) {
      closeSuggestions();
      return;
    }

    const suggestions = [];
    const seenLabels = new Set();

    // 1. Categories match (up to 2)
    state.categories.forEach(cat => {
      if (cat !== "All Categories" && cat.toLowerCase().includes(trimmed)) {
        if (!seenLabels.has(cat.toLowerCase())) {
          seenLabels.add(cat.toLowerCase());
          suggestions.push({
            type: "category",
            label: cat,
            sub: "Category in AIVault",
            category: cat
          });
        }
      }
    });

    // 2. Tag matches (up to 3)
    let tagMatches = 0;
    for (const tag of state.allTags) {
      if (tag.toLowerCase().includes(trimmed) && !seenLabels.has(tag.toLowerCase())) {
        seenLabels.add(tag.toLowerCase());
        const count = state.tagCounts.get(tag) || 0;
        suggestions.push({
          type: "tag",
          label: tag,
          sub: `${count} tool${count === 1 ? "" : "s"} with this tag`,
          tag: tag
        });
        tagMatches++;
        if (tagMatches >= 3) break;
      }
    }

    // 3. Tool name matches (starts-with prioritized, then contains)
    const matchingTools = [];
    for (const tool of state.allTools) {
      if (tool._lowerName.startsWith(trimmed)) {
        matchingTools.push(tool);
      }
    }
    if (matchingTools.length < 6) {
      for (const tool of state.allTools) {
        if (!tool._lowerName.startsWith(trimmed) && tool._lowerName.includes(trimmed)) {
          matchingTools.push(tool);
          if (matchingTools.length >= 8) break;
        }
      }
    }

    for (const tool of matchingTools) {
      if (suggestions.length >= 8) break;
      if (!seenLabels.has(tool.name.toLowerCase())) {
        seenLabels.add(tool.name.toLowerCase());
        suggestions.push({
          type: "tool",
          label: tool.name,
          sub: `${tool.category} · ${tool.pricing} · ★ ${tool.rating.toFixed(1)}`,
          toolId: tool.id,
          tool: tool
        });
      }
    }

    const capped = suggestions.slice(0, 8);
    state.currentSuggestions = capped;
    state.selectedSuggestionIndex = -1;

    if (capped.length === 0) {
      closeSuggestions();
      return;
    }

    renderSuggestionsDropdown();
  }

  function renderSuggestionsDropdown() {
    if (!DOM.searchSuggestionsDropdown) return;
    DOM.searchSuggestionsDropdown.innerHTML = "";

    state.currentSuggestions.forEach((sugg, index) => {
      const item = document.createElement("div");
      item.className = "search-suggestion-item" + (index === state.selectedSuggestionIndex ? " selected" : "");
      item.setAttribute("role", "option");
      item.setAttribute("id", `suggestion-item-${index}`);
      item.setAttribute("aria-selected", index === state.selectedSuggestionIndex ? "true" : "false");
      item.setAttribute("data-index", String(index));

      let iconSvg = "";
      let badgeClass = "";
      let badgeText = "";

      if (sugg.type === "category") {
        iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
        badgeClass = "badge-category";
        badgeText = "Category";
      } else if (sugg.type === "tag") {
        iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
        badgeClass = "badge-tag";
        badgeText = "Tag";
      } else {
        iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
        badgeClass = "badge-tool";
        badgeText = "Tool";
      }

      item.innerHTML = `
        <div class="suggestion-left">
          <span class="suggestion-icon" aria-hidden="true">${iconSvg}</span>
          <div class="suggestion-info">
            <span class="suggestion-title">${highlightMatch(sugg.label, state.searchQuery)}</span>
            <span class="suggestion-sub">${escapeHtml(sugg.sub)}</span>
          </div>
        </div>
        <span class="suggestion-type-badge ${badgeClass}">${badgeText}</span>
      `;

      item.addEventListener("mousedown", (e) => {
        e.preventDefault(); // Prevent searchInput blur before selection executes
        selectSuggestion(index);
      });

      DOM.searchSuggestionsDropdown.appendChild(item);
    });

    DOM.searchSuggestionsDropdown.hidden = false;
    if (DOM.searchInput) {
      DOM.searchInput.setAttribute("aria-expanded", "true");
    }
  }

  function closeSuggestions() {
    if (DOM.searchSuggestionsDropdown) {
      DOM.searchSuggestionsDropdown.hidden = true;
      DOM.searchSuggestionsDropdown.innerHTML = "";
    }
    state.currentSuggestions = [];
    state.selectedSuggestionIndex = -1;
    if (DOM.searchInput) {
      DOM.searchInput.setAttribute("aria-expanded", "false");
      DOM.searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function selectSuggestion(index) {
    const sugg = state.currentSuggestions[index];
    if (!sugg) return;

    if (sugg.type === "category") {
      state.searchQuery = "";
      if (DOM.searchInput) DOM.searchInput.value = "";
      if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = true;
      selectCategory(sugg.category);
    } else if (sugg.type === "tag") {
      state.searchQuery = sugg.tag;
      if (DOM.searchInput) DOM.searchInput.value = sugg.tag;
      if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = false;
      renderTools();
    } else if (sugg.type === "tool") {
      state.searchQuery = sugg.label;
      if (DOM.searchInput) DOM.searchInput.value = sugg.label;
      if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = false;
      renderTools();
    }

    closeSuggestions();
  }

  function handleSearchKeydown(e) {
    if (!DOM.searchSuggestionsDropdown || DOM.searchSuggestionsDropdown.hidden || state.currentSuggestions.length === 0) {
      if (e.key === "Escape") {
        if (state.searchQuery) {
          clearSearch();
        }
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      state.selectedSuggestionIndex = (state.selectedSuggestionIndex + 1) % state.currentSuggestions.length;
      updateSuggestionHighlight();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.selectedSuggestionIndex = (state.selectedSuggestionIndex - 1 + state.currentSuggestions.length) % state.currentSuggestions.length;
      updateSuggestionHighlight();
    } else if (e.key === "Enter") {
      if (state.selectedSuggestionIndex >= 0 && state.selectedSuggestionIndex < state.currentSuggestions.length) {
        e.preventDefault();
        selectSuggestion(state.selectedSuggestionIndex);
      } else {
        closeSuggestions();
        renderTools();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSuggestions();
    }
  }

  function updateSuggestionHighlight() {
    if (!DOM.searchSuggestionsDropdown) return;
    const items = DOM.searchSuggestionsDropdown.querySelectorAll(".search-suggestion-item");
    items.forEach((item, idx) => {
      const isSel = idx === state.selectedSuggestionIndex;
      item.classList.toggle("selected", isSel);
      item.setAttribute("aria-selected", isSel ? "true" : "false");
      if (isSel) {
        DOM.searchInput.setAttribute("aria-activedescendant", `suggestion-item-${idx}`);
        item.scrollIntoView({ block: "nearest" });
      }
    });
    if (state.selectedSuggestionIndex === -1 && DOM.searchInput) {
      DOM.searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function syncUIWithState() {
    if (DOM.searchInput && state.searchQuery) {
      DOM.searchInput.value = state.searchQuery;
      if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = false;
    }
    if (DOM.categorySelect && state.selectedCategory) {
      DOM.categorySelect.value = state.selectedCategory;
    }
    if (DOM.ratingSelect && state.selectedRating > 0) {
      DOM.ratingSelect.value = String(state.selectedRating);
    }
    if (DOM.sortSelect && state.selectedSort) {
      DOM.sortSelect.value = state.selectedSort;
    }
    if (state.selectedPricing && state.selectedPricing !== "all") {
      DOM.pricingPills.forEach(pill => {
        const val = pill.getAttribute("data-pricing");
        pill.classList.toggle("active", val.toLowerCase() === state.selectedPricing.toLowerCase());
      });
    }
  }

  function toggleFavorite(toolId) {
    const tool = state.toolMap.get(toolId);
    const toolName = tool ? tool.name : "Tool";

    if (state.favorites.has(toolId)) {
      state.favorites.delete(toolId);
      showToast(`Removed ${toolName} from favorites`);
    } else {
      state.favorites.add(toolId);
      showToast(`Added ${toolName} to favorites`);
    }

    saveFavorites();

    // Update active modal button state if open
    if (state.activeModalToolId === toolId) {
      updateModalFavButton(toolId);
    }

    // Fast DOM update on existing cards without full re-render
    document.querySelectorAll(`.btn-fav[data-tool-id="${toolId}"]`).forEach(btn => {
      const isFav = state.favorites.has(toolId);
      btn.classList.toggle("active", isFav);
      btn.setAttribute("aria-label", isFav ? "Remove from favorites" : "Add to favorites");
      btn.setAttribute("title", isFav ? "Remove from favorites" : "Add to favorites");
    });

    // If currently on favorites view, re-filter
    if (state.currentLibraryView === "favorites") {
      renderTools();
    }
  }

  // =========================================================================
  // 12. REUSABLE TOOL DETAIL MODAL
  // =========================================================================
  let lastFocusedElement = null;

  function openToolModal(toolId) {
    const tool = state.toolMap.get(toolId);
    if (!tool) return;

    state.activeModalToolId = toolId;
    lastFocusedElement = document.activeElement;

    // Record to recently viewed
    saveRecentlyViewed(toolId);

    // Populate Modal Details
    DOM.modalToolName.textContent = tool.name;
    DOM.modalToolTagline.textContent = tool.tagline || tool.category;
    DOM.modalToolDesc.textContent = tool.description;
    DOM.modalToolCategory.textContent = tool.category;
    
    // Pricing badge
    DOM.modalToolPricing.textContent = tool.pricing;
    DOM.modalToolPricing.className = `badge-pricing ${tool.pricing.toLowerCase()}`;

    // Rating & reviews
    DOM.modalToolRating.textContent = tool.rating.toFixed(1);
    DOM.modalToolReviews.textContent = `(${tool.reviewCount.toLocaleString()} reviews)`;

    // Logo
    DOM.modalToolLogo.innerHTML = tool.iconSvg || '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
    DOM.modalToolLogo.style.color = tool.accentColor || 'var(--color-primary)';

    // Tags
    DOM.modalToolTags.innerHTML = tool.tags
      .map(tag => `<span class="modal-tag">${escapeHtml(tag)}</span>`)
      .join("");

    // Features
    DOM.modalToolFeatures.innerHTML = tool.features
      .map(feat => `
        <li class="modal-feature-item">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>${escapeHtml(feat)}</span>
        </li>
      `)
      .join("");

    // Best For (Array handling)
    if (Array.isArray(tool.bestFor) && tool.bestFor.length > 0) {
      DOM.modalToolBestFor.textContent = tool.bestFor.join(", ");
    } else {
      DOM.modalToolBestFor.textContent = "Technology professionals, developers, and productive creators.";
    }

    // Full Details Link
    if (DOM.modalDetailsBtn) {
      DOM.modalDetailsBtn.href = `tools/${tool.id}/`;
    }

    // Website Link (URL Safety: ensure https/http, target="_blank", rel="noopener noreferrer")
    if (tool.url && (tool.url.startsWith("https://") || tool.url.startsWith("http://"))) {
      DOM.modalVisitBtn.href = tool.url;
    } else {
      DOM.modalVisitBtn.href = "#";
    }
    DOM.modalVisitBtn.setAttribute("target", "_blank");
    DOM.modalVisitBtn.setAttribute("rel", "noopener noreferrer");

    // Favorite Button State
    updateModalFavButton(toolId);

    // Compare Button State
    updateModalCompareButton(toolId);

    // Open backdrop and trap focus
    DOM.modalBackdrop.classList.add("open");
    DOM.modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Prevent page scroll behind modal

    DOM.modalCloseBtn.focus();
  }

  function updateModalFavButton(toolId) {
    const isFav = state.favorites.has(toolId);
    if (DOM.modalFavBtn) {
      DOM.modalFavBtn.classList.toggle("active", isFav);
      DOM.modalFavText.textContent = isFav ? "Saved to Favorites" : "Save to Favorites";
      DOM.modalFavBtn.setAttribute("aria-label", isFav ? "Remove from favorites" : "Add to favorites");
    }
  }

  function closeToolModal() {
    if (!DOM.modalBackdrop.classList.contains("open")) return;

    DOM.modalBackdrop.classList.remove("open");
    DOM.modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    state.activeModalToolId = null;

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  // =========================================================================
  // 13. RESPONSIVE DRAWER & MOBILE NAVIGATION
  // =========================================================================
  function openMobileSidebar() {
    DOM.sidebar.classList.add("open");
    DOM.sidebarBackdrop.classList.add("active");
    DOM.mobileMenuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMobileSidebar() {
    DOM.sidebar.classList.remove("open");
    DOM.sidebarBackdrop.classList.remove("active");
    DOM.mobileMenuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  // =========================================================================
  // 14. EVENT DELEGATION & PERFORMANCE ARCHITECTURE
  // =========================================================================
  /**
   * Attaches event delegation to a container for cards, favorite buttons, & compare toggles.
   * Avoids allocating thousands of individual event listeners.
   */
  function setupGridEventDelegation(gridElement) {
    if (!gridElement) return;

    gridElement.addEventListener("click", (e) => {
      // 1. Check if favorite button clicked
      const favBtn = e.target.closest(".btn-fav");
      if (favBtn) {
        e.stopPropagation();
        const toolId = favBtn.getAttribute("data-tool-id");
        if (toolId) toggleFavorite(toolId);
        return;
      }

      // 1b. Check if compare button clicked
      const compareBtn = e.target.closest(".btn-card-compare");
      if (compareBtn) {
        e.stopPropagation();
        e.preventDefault();
        const toolId = compareBtn.getAttribute("data-tool-id");
        if (toolId) toggleCompare(toolId);
        return;
      }

      // 1c. Check if collection button clicked
      const colBtn = e.target.closest(".btn-card-col");
      if (colBtn) {
        e.stopPropagation();
        e.preventDefault();
        const toolId = colBtn.getAttribute("data-tool-id");
        if (toolId) openCollectionPicker(toolId);
        return;
      }

      // 2. Check if direct details link clicked
      if (e.target.closest(".btn-card-details")) {
        // Allow natural link navigation to static detail page
        return;
      }

      // 3. Check if card or Quick View clicked
      const card = e.target.closest(".tool-card");
      if (card) {
        const toolId = card.getAttribute("data-tool-id");
        if (toolId) openToolModal(toolId);
      }
    });

    gridElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const card = e.target.closest(".tool-card");
        if (card && !e.target.closest(".btn-fav") && !e.target.closest(".btn-card-compare") && !e.target.closest(".btn-card-col")) {
          e.preventDefault();
          const toolId = card.getAttribute("data-tool-id");
          if (toolId) openToolModal(toolId);
        }
      }
    });
  }

  // =========================================================================
  // 15. INITIALIZE ALL EVENT LISTENERS
  // =========================================================================
  function initEventListeners() {
    // Setup high-performance event delegation on all 3 grids
    setupGridEventDelegation(DOM.allToolsGrid);
    setupGridEventDelegation(DOM.featuredGrid);
    setupGridEventDelegation(DOM.trendingGrid);

    // Search input (debounced / responsive filter update with Phase 4A suggestions)
    if (DOM.searchInput) {
      let debounceTimer = null;
      DOM.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        if (DOM.searchClearBtn) {
          DOM.searchClearBtn.hidden = state.searchQuery.length === 0;
        }
        updateSuggestions(state.searchQuery);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderTools();
        }, 80);
      });

      DOM.searchInput.addEventListener("keydown", handleSearchKeydown);

      DOM.searchInput.addEventListener("focus", () => {
        if (DOM.searchInput.value.trim()) {
          updateSuggestions(DOM.searchInput.value);
        }
      });
    }

    if (DOM.searchClearBtn) {
      DOM.searchClearBtn.addEventListener("click", clearSearch);
    }

    // Close suggestions dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (DOM.searchSuggestionsDropdown && !DOM.searchSuggestionsDropdown.hidden) {
        if (!DOM.searchForm || !DOM.searchForm.contains(e.target)) {
          closeSuggestions();
        }
      }
    });

    // Discovery Quick Shortcuts (Phase 4A)
    if (DOM.searchDiscoveryShortcuts) {
      DOM.searchDiscoveryShortcuts.querySelectorAll(".discovery-shortcut-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const shortcut = btn.getAttribute("data-shortcut");
          if (shortcut === "free") {
            setPricingFilter("Free");
          } else if (shortcut === "top-rated") {
            setRatingFilter(4.5);
          } else if (shortcut === "coding") {
            selectCategory("Coding");
          } else if (shortcut === "video") {
            selectCategory("Video");
          } else if (shortcut === "ai-chat") {
            selectCategory("AI Chat");
          } else if (shortcut === "ai-agents") {
            selectCategory("AI Agents");
          }
          const target = document.getElementById("all-tools-section");
          if (target) target.scrollIntoView({ behavior: "smooth" });
        });
      });
    }

    // Pricing pills
    DOM.pricingPills.forEach(pill => {
      pill.addEventListener("click", () => {
        const pricing = pill.getAttribute("data-pricing");
        setPricingFilter(pricing);
      });
    });

    // Category select dropdown (sync with sidebar)
    if (DOM.categorySelect) {
      DOM.categorySelect.addEventListener("change", (e) => {
        selectCategory(e.target.value);
      });
    }

    // Rating select dropdown
    if (DOM.ratingSelect) {
      DOM.ratingSelect.addEventListener("change", (e) => {
        setRatingFilter(e.target.value);
      });
    }

    // Sort select dropdown
    if (DOM.sortSelect) {
      DOM.sortSelect.addEventListener("change", (e) => {
        setSortOption(e.target.value);
      });
    }

    // Reset filters buttons
    if (DOM.btnResetFilters) {
      DOM.btnResetFilters.addEventListener("click", resetAllFilters);
    }
    if (DOM.btnClearEmptyState) {
      DOM.btnClearEmptyState.addEventListener("click", resetAllFilters);
    }
    if (DOM.btnClearSearchEmpty) {
      DOM.btnClearSearchEmpty.addEventListener("click", clearSearch);
    }
    if (DOM.btnClearSearchAction) {
      DOM.btnClearSearchAction.addEventListener("click", clearSearch);
    }

    // Load More Button
    if (DOM.btnLoadMore) {
      DOM.btnLoadMore.addEventListener("click", handleLoadMore);
    }

    // Library buttons (Favorites / Recent)
    if (DOM.libFavoritesBtn) {
      DOM.libFavoritesBtn.addEventListener("click", () => setLibraryView("favorites"));
    }
    if (DOM.libRecentBtn) {
      DOM.libRecentBtn.addEventListener("click", () => setLibraryView("recent"));
    }
    if (DOM.navFavoritesBtn) {
      DOM.navFavoritesBtn.addEventListener("click", () => setLibraryView("favorites"));
    }
    const footerFavLink = document.getElementById("footer-fav-link") || DOM.footerFavLink;
    if (footerFavLink) {
      footerFavLink.addEventListener("click", (e) => {
        e.preventDefault();
        setLibraryView("favorites");
      });
    }
    const footerRecentLink = document.getElementById("footer-recent-link");
    if (footerRecentLink) {
      footerRecentLink.addEventListener("click", (e) => {
        e.preventDefault();
        setLibraryView("recent");
      });
    }

    // Theme toggle
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener("click", toggleTheme);
    }

    // Search shortcut trigger button in navbar
    if (DOM.navSearchBtn) {
      DOM.navSearchBtn.addEventListener("click", () => {
        if (DOM.searchInput) {
          DOM.searchInput.focus();
          DOM.searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    // Modal interactions
    if (DOM.modalCloseBtn) {
      DOM.modalCloseBtn.addEventListener("click", closeToolModal);
    }
    if (DOM.modalBackdrop) {
      DOM.modalBackdrop.addEventListener("click", (e) => {
        if (e.target === DOM.modalBackdrop) {
          closeToolModal();
        }
      });
    }
    if (DOM.modalFavBtn) {
      DOM.modalFavBtn.addEventListener("click", () => {
        if (state.activeModalToolId) {
          toggleFavorite(state.activeModalToolId);
        }
      });
    }
    if (DOM.modalCompareBtn) {
      DOM.modalCompareBtn.addEventListener("click", () => {
        if (state.activeModalToolId) {
          toggleCompare(state.activeModalToolId);
        }
      });
    }
    if (DOM.modalColBtn) {
      DOM.modalColBtn.addEventListener("click", () => {
        if (state.activeModalToolId) {
          openCollectionPicker(state.activeModalToolId);
        }
      });
    }

    // Collection Picker Dialog Interactions (Phase 4C)
    if (DOM.colModalCloseBtn) {
      DOM.colModalCloseBtn.addEventListener("click", closeCollectionPicker);
    }
    if (DOM.colModalDoneBtn) {
      DOM.colModalDoneBtn.addEventListener("click", closeCollectionPicker);
    }
    if (DOM.colModalBackdrop) {
      DOM.colModalBackdrop.addEventListener("click", closeCollectionPicker);
    }
    if (DOM.btnColCreateSubmit) {
      DOM.btnColCreateSubmit.addEventListener("click", () => {
        if (DOM.colCreateInput) {
          const newCol = createCollection(DOM.colCreateInput.value, state.activePickerToolId);
          if (newCol) {
            DOM.colCreateInput.value = "";
            if (state.activePickerToolId) {
              renderCollectionPickerList(state.activePickerToolId);
            }
          }
        }
      });
    }
    if (DOM.colCreateInput) {
      DOM.colCreateInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const newCol = createCollection(DOM.colCreateInput.value, state.activePickerToolId);
          if (newCol) {
            DOM.colCreateInput.value = "";
            if (state.activePickerToolId) {
              renderCollectionPickerList(state.activePickerToolId);
            }
          }
        }
      });
    }

    // Compare bar actions (Clear All & Remove Tool Pill)
    if (DOM.btnCompareClear) {
      DOM.btnCompareClear.addEventListener("click", clearCompare);
    }
    if (DOM.compareBarPills) {
      DOM.compareBarPills.addEventListener("click", (e) => {
        const rm = e.target.closest(".compare-pill-remove");
        if (rm) {
          const tid = rm.getAttribute("data-tool-id");
          if (tid) toggleCompare(tid);
        }
      });
    }

    // Mobile drawer toggles
    if (DOM.mobileMenuBtn) {
      DOM.mobileMenuBtn.addEventListener("click", openMobileSidebar);
    }
    if (DOM.sidebarCloseBtn) {
      DOM.sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
    }
    if (DOM.sidebarBackdrop) {
      DOM.sidebarBackdrop.addEventListener("click", closeMobileSidebar);
    }

    // Submit tool button
    if (DOM.btnSubmitTool) {
      DOM.btnSubmitTool.addEventListener("click", () => {
        showToast("AIVault v1.0\nDiscover, compare, and organize AI tools.");
      });
    }

    // Global Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      // Escape key closes modal, picker, suggestions, or sidebar drawer
      if (e.key === "Escape") {
        if (DOM.colModal && !DOM.colModal.hidden) {
          closeCollectionPicker();
        } else if (DOM.searchSuggestionsDropdown && !DOM.searchSuggestionsDropdown.hidden) {
          closeSuggestions();
        } else if (DOM.modalBackdrop && DOM.modalBackdrop.classList.contains("open")) {
          closeToolModal();
        } else if (DOM.sidebar && DOM.sidebar.classList.contains("open")) {
          closeMobileSidebar();
        }
      }

      // '/' focuses search bar when not typing in another input
      if (e.key === "/" && document.activeElement !== DOM.searchInput) {
        const tagName = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") {
          e.preventDefault();
          if (DOM.searchInput) {
            DOM.searchInput.focus();
            DOM.searchInput.select();
          }
        }
      }
    });

    // Nav active link tracking on click
    DOM.navLinks.forEach(link => {
      link.addEventListener("click", () => {
        DOM.navLinks.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
      });
    });
  }

  // =========================================================================
  // 16. UTILITY FUNCTIONS
  // =========================================================================
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================================================================
  // 17. APPLICATION INITIALIZATION
  // =========================================================================
  function init() {
    initDataset();
    readUrlParams();
    syncUIWithState();
    loadTheme();
    loadFavorites();
    loadRecentlyViewed();
    loadCompare();
    loadCollections();
    renderCategoriesSidebar();
    renderFeaturedTools();
    renderTrendingTools();
    renderTools();
    initEventListeners();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
