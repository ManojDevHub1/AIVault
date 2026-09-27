/**
 * AIVault — Collections / My Library System (Phase 4C Architecture)
 * 100% Frontend-only, Vanilla JavaScript
 */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    FAVORITES: "aivault_favorites",
    RECENTLY_VIEWED: "aivault_recently_viewed",
    COMPARE: "aivault_compare",
    COLLECTIONS: "aivault_collections",
    THEME: "aivault_theme"
  };

  const MAX_COLLECTIONS = 20;
  const MAX_TOOLS_PER_COLLECTION = 100;

  // Initialize tool dataset lookup
  const toolsData = (typeof window !== "undefined" && Array.isArray(window.AI_TOOLS_DATA)) ? window.AI_TOOLS_DATA : [];
  const toolMap = new Map();
  toolsData.forEach(t => {
    if (t && t.id) toolMap.set(t.id, t);
  });

  // State
  let collections = [];
  let currentCollectionId = null;

  // DOM Elements
  const DOM = {
    hubView: document.getElementById("collections-hub-view"),
    detailView: document.getElementById("collection-detail-view"),
    breadcrumb: document.getElementById("collections-breadcrumb"),
    hubEmptyState: document.getElementById("hub-empty-state"),
    collectionsGrid: document.getElementById("collections-grid"),
    btnCreateColHub: document.getElementById("btn-create-col-hub"),
    btnCreateColEmpty: document.getElementById("btn-create-col-empty"),
    
    // Detail View Elements
    colDetailBackLink: document.getElementById("col-detail-back-link"),
    colDetailTitleText: document.getElementById("col-detail-title-text"),
    colDetailCountBadge: document.getElementById("col-detail-count-badge"),
    btnColDetailRename: document.getElementById("btn-col-detail-rename"),
    btnColDetailDelete: document.getElementById("btn-col-detail-delete"),
    detailEmptyState: document.getElementById("detail-empty-state"),
    collectionToolsGrid: document.getElementById("collection-tools-grid"),

    // Dialog Elements
    dialogBackdrop: document.getElementById("col-dialog-backdrop"),
    dialogModal: document.getElementById("col-dialog-modal"),
    dialogTitle: document.getElementById("col-dialog-title"),
    dialogDesc: document.getElementById("col-dialog-desc"),
    dialogInput: document.getElementById("col-dialog-input"),
    btnDialogCancel: document.getElementById("btn-dialog-cancel"),
    btnDialogConfirm: document.getElementById("btn-dialog-confirm"),

    // Shell
    toastContainer: document.getElementById("toast-container"),
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    sidebar: document.getElementById("sidebar"),
    sidebarBackdrop: document.getElementById("sidebar-backdrop"),
    sidebarCloseBtn: document.getElementById("sidebar-close-btn"),
    navFavCount: document.getElementById("nav-fav-count"),
    sidebarFavCount: document.getElementById("sidebar-fav-count"),
    sidebarRecentCount: document.getElementById("sidebar-recent-count"),
    sidebarCompareCount: document.getElementById("sidebar-compare-count"),
    sidebarCollectionsCount: document.getElementById("sidebar-collections-count")
  };

  // 1. Theme Management
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    document.documentElement.setAttribute("data-theme", saved);
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const next = current === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem(STORAGE_KEYS.THEME, next);
        showToast(`Switched to ${next} theme`);
      });
    }
  }

  // 2. Mobile Drawer Navigation
  function initDrawer() {
    function openSidebar() {
      if (DOM.sidebar) DOM.sidebar.classList.add("open");
      if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.classList.add("active");
      if (DOM.mobileMenuBtn) DOM.mobileMenuBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
      if (DOM.sidebar) DOM.sidebar.classList.remove("open");
      if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.classList.remove("active");
      if (DOM.mobileMenuBtn) DOM.mobileMenuBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    if (DOM.mobileMenuBtn) DOM.mobileMenuBtn.addEventListener("click", openSidebar);
    if (DOM.sidebarCloseBtn) DOM.sidebarCloseBtn.addEventListener("click", closeSidebar);
    if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (DOM.dialogModal && !DOM.dialogModal.hidden) {
          closeDialog();
        } else if (DOM.sidebar && DOM.sidebar.classList.contains("open")) {
          closeSidebar();
        }
      }
    });
  }

  function updateSidebarBadges() {
    try {
      const favs = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || "[]");
      const count = Array.isArray(favs) ? favs.length : 0;
      if (DOM.navFavCount) DOM.navFavCount.textContent = count;
      if (DOM.sidebarFavCount) DOM.sidebarFavCount.textContent = count;
    } catch (e) {}

    try {
      const recents = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED) || "[]");
      if (DOM.sidebarRecentCount) DOM.sidebarRecentCount.textContent = Array.isArray(recents) ? recents.length : 0;
    } catch (e) {}

    try {
      const compare = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPARE) || "[]");
      if (DOM.sidebarCompareCount) DOM.sidebarCompareCount.textContent = Array.isArray(compare) ? compare.length : 0;
    } catch (e) {}

    if (DOM.sidebarCollectionsCount) {
      DOM.sidebarCollectionsCount.textContent = collections.length;
    }
  }

  // 3. Toast Notifications
  function showToast(msg) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = msg;
    DOM.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2800);
  }

  // 4. Data Layer & Storage Safety
  function loadCollections() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seenIds = new Set();
          const validCols = [];

          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const id = typeof item.id === "string" ? item.id.trim() : "";
            const name = typeof item.name === "string" ? item.name.trim() : "";
            if (!id || !name) continue;

            if (seenIds.has(id)) continue;
            seenIds.add(id);

            // Keep tool IDs that exist in toolMap without duplicates (stale ID defense)
            const toolIds = [];
            if (Array.isArray(item.toolIds)) {
              const seenToolIds = new Set();
              for (const tid of item.toolIds) {
                if (typeof tid === "string" && !seenToolIds.has(tid)) {
                  if (toolMap.has(tid)) {
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
          collections = validCols;
        } else {
          collections = [];
        }
      } else {
        collections = [];
      }
    } catch (e) {
      console.warn("Could not read collections from localStorage:", e);
      collections = [];
    }
    updateSidebarBadges();
  }

  function saveCollections() {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    } catch (e) {
      console.warn("Could not save collections to localStorage:", e);
    }
    updateSidebarBadges();
  }

  function createCollection(name) {
    if (typeof name !== "string" || !name.trim()) {
      showToast("Collection name cannot be empty");
      return null;
    }
    const cleanName = name.trim();

    if (collections.length >= MAX_COLLECTIONS) {
      showToast("Maximum 20 collections reached. Remove one to create another.");
      return null;
    }

    const lower = cleanName.toLowerCase();
    if (collections.some(c => c.name.toLowerCase() === lower)) {
      showToast("A collection with this name already exists");
      return null;
    }

    let baseId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!baseId) baseId = "collection-" + Date.now();
    let uniqueId = baseId;
    let counter = 2;
    while (collections.some(c => c.id === uniqueId)) {
      uniqueId = `${baseId}-${counter++}`;
    }

    const newCol = {
      id: uniqueId,
      name: cleanName,
      toolIds: []
    };

    collections.push(newCol);
    saveCollections();
    showToast(`Created collection "${cleanName}"`);
    return newCol;
  }

  function renameCollection(id, newName) {
    const col = collections.find(c => c.id === id);
    if (!col) return false;

    if (typeof newName !== "string" || !newName.trim()) {
      showToast("Collection name cannot be empty");
      return false;
    }
    const cleanName = newName.trim();
    const lower = cleanName.toLowerCase();

    if (collections.some(c => c.id !== id && c.name.toLowerCase() === lower)) {
      showToast("A collection with this name already exists");
      return false;
    }

    col.name = cleanName;
    saveCollections();
    showToast(`Renamed collection to "${cleanName}"`);
    return true;
  }

  function deleteCollection(id) {
    const idx = collections.findIndex(c => c.id === id);
    if (idx === -1) return false;

    const removed = collections.splice(idx, 1)[0];
    saveCollections();
    showToast(`Deleted collection "${removed.name}"`);
    return true;
  }

  function removeToolFromCollection(colId, toolId) {
    const col = collections.find(c => c.id === colId);
    if (!col) return false;

    col.toolIds = col.toolIds.filter(id => id !== toolId);
    saveCollections();
    showToast(`Removed from "${col.name}"`);
    return true;
  }

  // 5. Generic Dialog Handler
  let activeDialogCallback = null;

  function showDialog({ title, desc, showInput = false, inputValue = "", confirmText = "Confirm", isDanger = false, onConfirm }) {
    if (!DOM.dialogModal || !DOM.dialogBackdrop) return;

    DOM.dialogTitle.textContent = title;
    DOM.dialogDesc.textContent = desc;

    if (showInput) {
      DOM.dialogInput.hidden = false;
      DOM.dialogInput.value = inputValue;
    } else {
      DOM.dialogInput.hidden = true;
      DOM.dialogInput.value = "";
    }

    DOM.btnDialogConfirm.textContent = confirmText;
    DOM.btnDialogConfirm.className = `btn-dialog-confirm ${isDanger ? 'danger' : ''}`;

    activeDialogCallback = onConfirm;

    DOM.dialogBackdrop.hidden = false;
    DOM.dialogModal.hidden = false;

    if (showInput) {
      DOM.dialogInput.focus();
      DOM.dialogInput.select();
    } else {
      DOM.btnDialogConfirm.focus();
    }
  }

  function closeDialog() {
    if (DOM.dialogModal && DOM.dialogBackdrop) {
      DOM.dialogModal.hidden = true;
      DOM.dialogBackdrop.hidden = true;
    }
    activeDialogCallback = null;
  }

  if (DOM.btnDialogCancel) {
    DOM.btnDialogCancel.addEventListener("click", closeDialog);
  }
  if (DOM.dialogBackdrop) {
    DOM.dialogBackdrop.addEventListener("click", closeDialog);
  }
  if (DOM.btnDialogConfirm) {
    DOM.btnDialogConfirm.addEventListener("click", () => {
      if (typeof activeDialogCallback === "function") {
        const val = DOM.dialogInput.value;
        const res = activeDialogCallback(val);
        if (res !== false) {
          closeDialog();
        }
      } else {
        closeDialog();
      }
    });
  }
  if (DOM.dialogInput) {
    DOM.dialogInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        DOM.btnDialogConfirm.click();
      }
    });
  }

  // 6. View Rendering
  function renderView() {
    const params = new URLSearchParams(window.location.search);
    const colParam = params.get("collection");

    if (colParam) {
      const col = collections.find(c => c.id === colParam);
      if (col) {
        currentCollectionId = colParam;
        renderDetailView(col);
        return;
      } else {
        // If collection not found in localStorage, clean URL and show hub
        showToast("Collection not found");
        window.history.replaceState({}, "", "./");
      }
    }

    currentCollectionId = null;
    renderHubView();
  }

  function renderHubView() {
    DOM.hubView.hidden = false;
    DOM.detailView.hidden = true;

    // Update Breadcrumb
    if (DOM.breadcrumb) {
      DOM.breadcrumb.innerHTML = `
        <li><a href="../index.html">Home</a></li>
        <li><span class="breadcrumb-sep">/</span><span class="breadcrumb-current" aria-current="page">Collections</span></li>
      `;
    }

    document.title = "My Collections | AIVault";

    if (collections.length === 0) {
      DOM.hubEmptyState.hidden = false;
      DOM.collectionsGrid.innerHTML = "";
      return;
    }

    DOM.hubEmptyState.hidden = true;
    DOM.collectionsGrid.innerHTML = "";

    collections.forEach(col => {
      const card = document.createElement("article");
      card.className = "col-card";
      card.setAttribute("data-col-id", col.id);

      // Card Header
      const topDiv = document.createElement("div");
      topDiv.className = "col-card-top";

      const titleInfo = document.createElement("div");
      const titleEl = document.createElement("h2");
      titleEl.className = "col-card-title";
      titleEl.textContent = col.name; // XSS-safe

      const countEl = document.createElement("span");
      countEl.className = "col-card-count";
      countEl.textContent = `${col.toolIds.length} tool${col.toolIds.length === 1 ? '' : 's'}`;

      titleInfo.appendChild(titleEl);
      titleInfo.appendChild(countEl);
      topDiv.appendChild(titleInfo);

      // Tool previews (up to 3 tools)
      const previewDiv = document.createElement("div");
      previewDiv.className = "col-card-preview";

      const validPreviewTools = col.toolIds
        .map(tid => toolMap.get(tid))
        .filter(Boolean)
        .slice(0, 3);

      if (validPreviewTools.length > 0) {
        validPreviewTools.forEach(tool => {
          const tag = document.createElement("span");
          tag.className = "col-preview-tag";
          tag.textContent = tool.name;
          previewDiv.appendChild(tag);
        });
      } else {
        const emptyNote = document.createElement("span");
        emptyNote.className = "col-card-count";
        emptyNote.textContent = "No tools added yet";
        previewDiv.appendChild(emptyNote);
      }

      // Actions
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "col-card-actions";

      const openLink = document.createElement("a");
      openLink.className = "btn-open-col";
      openLink.href = `?collection=${encodeURIComponent(col.id)}`;
      openLink.innerHTML = `
        <span>Open</span>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      `;
      openLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", openLink.href);
        renderView();
      });

      const secActions = document.createElement("div");
      secActions.className = "col-card-secondary-actions";

      const btnRename = document.createElement("button");
      btnRename.type = "button";
      btnRename.className = "btn-col-rename";
      btnRename.textContent = "Rename";
      btnRename.setAttribute("aria-label", `Rename ${col.name}`);
      btnRename.addEventListener("click", () => {
        showDialog({
          title: "Rename Collection",
          desc: "Enter a new name for this collection.",
          showInput: true,
          inputValue: col.name,
          confirmText: "Save",
          onConfirm: (newName) => {
            const ok = renameCollection(col.id, newName);
            if (ok) renderHubView();
            return ok;
          }
        });
      });

      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn-col-delete";
      btnDelete.textContent = "Delete";
      btnDelete.setAttribute("aria-label", `Delete ${col.name}`);
      btnDelete.addEventListener("click", () => {
        showDialog({
          title: "Delete Collection",
          desc: `Are you sure you want to delete "${col.name}"? The tools inside will not be deleted.`,
          showInput: false,
          confirmText: "Delete",
          isDanger: true,
          onConfirm: () => {
            deleteCollection(col.id);
            renderHubView();
          }
        });
      });

      secActions.appendChild(btnRename);
      secActions.appendChild(btnDelete);

      actionsDiv.appendChild(openLink);
      actionsDiv.appendChild(secActions);

      card.appendChild(topDiv);
      card.appendChild(previewDiv);
      card.appendChild(actionsDiv);

      DOM.collectionsGrid.appendChild(card);
    });
  }

  function renderDetailView(col) {
    DOM.hubView.hidden = true;
    DOM.detailView.hidden = false;

    // Update document title and breadcrumb
    document.title = `${col.name} — Collection | AIVault`;

    if (DOM.breadcrumb) {
      DOM.breadcrumb.innerHTML = `
        <li><a href="../index.html">Home</a></li>
        <li><span class="breadcrumb-sep">/</span><a href="./" id="crumb-all-cols">Collections</a></li>
        <li><span class="breadcrumb-sep">/</span><span class="breadcrumb-current" aria-current="page">${escapeHtml(col.name)}</span></li>
      `;
      const crumbLink = document.getElementById("crumb-all-cols");
      if (crumbLink) {
        crumbLink.addEventListener("click", (e) => {
          e.preventDefault();
          window.history.pushState({}, "", "./");
          renderView();
        });
      }
    }

    if (DOM.colDetailTitleText) {
      DOM.colDetailTitleText.textContent = col.name; // XSS-safe
    }
    if (DOM.colDetailCountBadge) {
      DOM.colDetailCountBadge.textContent = `(${col.toolIds.length} tool${col.toolIds.length === 1 ? '' : 's'})`;
    }

    // Back link
    if (DOM.colDetailBackLink) {
      DOM.colDetailBackLink.onclick = (e) => {
        e.preventDefault();
        window.history.pushState({}, "", "./");
        renderView();
      };
    }

    // Detail Rename Action
    if (DOM.btnColDetailRename) {
      DOM.btnColDetailRename.onclick = () => {
        showDialog({
          title: "Rename Collection",
          desc: "Enter a new name for this collection.",
          showInput: true,
          inputValue: col.name,
          confirmText: "Save",
          onConfirm: (newName) => {
            const ok = renameCollection(col.id, newName);
            if (ok) renderDetailView(col);
            return ok;
          }
        });
      };
    }

    // Detail Delete Action
    if (DOM.btnColDetailDelete) {
      DOM.btnColDetailDelete.onclick = () => {
        showDialog({
          title: "Delete Collection",
          desc: `Are you sure you want to delete "${col.name}"? The tools inside will not be deleted.`,
          showInput: false,
          confirmText: "Delete",
          isDanger: true,
          onConfirm: () => {
            deleteCollection(col.id);
            window.history.pushState({}, "", "./");
            renderView();
          }
        });
      };
    }

    // Resolve tools from toolMap (Stale ID defense: ignore if tool missing)
    const validTools = col.toolIds
      .map(id => toolMap.get(id))
      .filter(Boolean);

    if (validTools.length === 0) {
      DOM.detailEmptyState.hidden = false;
      DOM.collectionToolsGrid.innerHTML = "";
      return;
    }

    DOM.detailEmptyState.hidden = true;
    DOM.collectionToolsGrid.innerHTML = "";

    const fragment = document.createDocumentFragment();

    validTools.forEach(tool => {
      const card = document.createElement("article");
      card.className = "tool-card";
      card.setAttribute("data-tool-id", tool.id);

      const pricingClass = (tool.pricing || "freemium").toLowerCase();
      const ratingText = typeof tool.rating === "number" && tool.rating > 0 ? tool.rating.toFixed(1) : "—";
      const reviewText = typeof tool.rating === "number" && tool.rating > 0 ? `(${tool.reviewCount.toLocaleString()})` : "";

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon-box" style="color: ${tool.accentColor || 'var(--color-primary)'}">
            ${tool.iconSvg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'}
          </div>
          <div class="card-top-actions">
            <button type="button" class="btn-remove-from-col" data-tool-id="${escapeHtml(tool.id)}" aria-label="Remove ${escapeHtml(tool.name)} from ${escapeHtml(col.name)}" title="Remove from collection">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">${escapeHtml(tool.name)}</h3>
          </div>
          <div class="card-tagline">${escapeHtml(tool.tagline || tool.category)}</div>
          <p class="card-description">${escapeHtml(tool.description)}</p>

          <div class="card-meta-row">
            <span class="badge-category">${escapeHtml(tool.category)}</span>
            <span class="badge-pricing ${pricingClass}">${escapeHtml(tool.pricing)}</span>
          </div>
        </div>

        <div class="card-bottom">
          <div class="card-metrics">
            <div class="card-rating">
              <span class="star-icon" aria-hidden="true">★</span>
              <span>${ratingText}</span>
              <span class="review-count">${reviewText}</span>
            </div>
          </div>

          <div class="card-actions-row">
            <a href="../tools/${escapeHtml(tool.id)}/" class="btn-card-details">
              <span>Details</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-view-tool" style="text-decoration:none;">
              <span>Visit</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      `;

      // Wire remove button
      const removeBtn = card.querySelector(".btn-remove-from-col");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          removeToolFromCollection(col.id, tool.id);
          renderDetailView(col);
        });
      }

      fragment.appendChild(card);
    });

    DOM.collectionToolsGrid.appendChild(fragment);
  }

  function promptCreateCollection() {
    showDialog({
      title: "Create Collection",
      desc: "Enter a name for your new collection (e.g. My Coding Tools, Video Generation).",
      showInput: true,
      inputValue: "",
      confirmText: "Create",
      onConfirm: (name) => {
        const newCol = createCollection(name);
        if (newCol) {
          window.history.pushState({}, "", `?collection=${encodeURIComponent(newCol.id)}`);
          renderView();
          return true;
        }
        return false;
      }
    });
  }

  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 7. Initialization
  function init() {
    loadCollections();
    initTheme();
    initDrawer();
    updateSidebarBadges();

    if (DOM.btnCreateColHub) {
      DOM.btnCreateColHub.addEventListener("click", promptCreateCollection);
    }
    if (DOM.btnCreateColEmpty) {
      DOM.btnCreateColEmpty.addEventListener("click", promptCreateCollection);
    }

    window.addEventListener("popstate", renderView);

    renderView();

    // Expose for E2E testing
    if (typeof window !== "undefined") {
      window.AIVaultCollections = {
        load: loadCollections,
        save: saveCollections,
        create: createCollection,
        rename: renameCollection,
        delete: deleteCollection,
        removeTool: removeToolFromCollection,
        getCollections: () => collections
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
