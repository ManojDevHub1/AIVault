/**
 * AIVault — Tool Comparison System (Phase 4B Architecture)
 * 100% Frontend-only, Vanilla JavaScript
 */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    FAVORITES: "aivault_favorites",
    RECENTLY_VIEWED: "aivault_recently_viewed",
    COMPARE: "aivault_compare",
    THEME: "aivault_theme"
  };

  const MAX_COMPARE_TOOLS = 4;

  // Initialize tool dataset lookup
  const toolsData = (typeof window !== "undefined" && Array.isArray(window.AI_TOOLS_DATA)) ? window.AI_TOOLS_DATA : [];
  const toolMap = new Map();
  toolsData.forEach(t => {
    if (t && t.id) toolMap.set(t.id, t);
  });

  // DOM Elements
  const DOM = {
    emptyState: document.getElementById("compare-empty-state"),
    compareContent: document.getElementById("compare-content"),
    countText: document.getElementById("compare-count-text"),
    btnAddMore: document.getElementById("btn-add-more"),
    btnClearAll: document.getElementById("btn-clear-all-page"),
    thead: document.getElementById("compare-thead"),
    tbody: document.getElementById("compare-tbody"),
    toastContainer: document.getElementById("toast-container"),
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    sidebar: document.getElementById("sidebar"),
    sidebarBackdrop: document.getElementById("sidebar-backdrop"),
    sidebarCloseBtn: document.getElementById("sidebar-close-btn"),
    navFavCount: document.getElementById("nav-fav-count"),
    sidebarFavCount: document.getElementById("sidebar-fav-count"),
    sidebarRecentCount: document.getElementById("sidebar-recent-count"),
    sidebarCompareCount: document.getElementById("sidebar-compare-count")
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
      if (e.key === "Escape" && DOM.sidebar && DOM.sidebar.classList.contains("open")) {
        closeSidebar();
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
  }

  // 3. Toast Notifications
  function showToast(message) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2400);
  }

  // 4. Comparison State Reader & Writer
  function getCompareIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPARE);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Filter out stale IDs and keep unique items
      const valid = [];
      const seen = new Set();
      parsed.forEach(id => {
        if (typeof id === "string" && toolMap.has(id) && !seen.has(id)) {
          seen.add(id);
          valid.push(id);
        }
      });
      return valid.slice(0, MAX_COMPARE_TOOLS);
    } catch (e) {
      console.warn("Could not read compare state:", e);
      return [];
    }
  }

  function saveCompareIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(ids));
    } catch (e) {
      console.warn("Could not write compare state:", e);
    }
  }

  function removeCompareTool(toolId) {
    const current = getCompareIds();
    const tool = toolMap.get(toolId);
    const toolName = tool ? tool.name : "Tool";
    const next = current.filter(id => id !== toolId);
    saveCompareIds(next);
    showToast(`Removed ${toolName} from comparison`);
    render();
  }

  function clearAllCompare() {
    saveCompareIds([]);
    showToast("Comparison cleared");
    render();
  }

  // 5. Utility HTML Escape
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 6. Safe URL formatter
  function getSafeUrl(url) {
    if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
      return escapeHtml(url);
    }
    return "#";
  }

  // 7. Comparison Table Renderer
  function render() {
    const ids = getCompareIds();
    const tools = ids.map(id => toolMap.get(id)).filter(Boolean);

    if (DOM.sidebarCompareCount) {
      DOM.sidebarCompareCount.textContent = tools.length;
    }

    if (tools.length < 2) {
      // Empty state
      if (DOM.emptyState) DOM.emptyState.hidden = false;
      if (DOM.compareContent) DOM.compareContent.hidden = true;
      return;
    }

    // Has 2 to 4 tools
    if (DOM.emptyState) DOM.emptyState.hidden = true;
    if (DOM.compareContent) DOM.compareContent.hidden = false;

    if (DOM.countText) {
      DOM.countText.textContent = `Comparing ${tools.length} AI Tools`;
    }

    if (DOM.btnAddMore) {
      DOM.btnAddMore.style.display = tools.length >= MAX_COMPARE_TOOLS ? "none" : "";
    }

    // Build Table Header
    let theadHtml = `
      <tr>
        <th scope="col" class="col-feature">Feature</th>
    `;

    tools.forEach(tool => {
      const safeUrl = getSafeUrl(tool.url);
      theadHtml += `
        <th scope="col" class="compare-header-cell">
          <div class="compare-tool-card-header">
            <div class="compare-header-top">
              <div class="compare-header-logo" style="color:${tool.accentColor || 'var(--color-primary)'};" aria-hidden="true">
                ${tool.iconSvg || '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>'}
              </div>
              <button type="button" class="btn-compare-remove-tool" data-tool-id="${escapeHtml(tool.id)}" aria-label="Remove ${escapeHtml(tool.name)} from comparison" title="Remove ${escapeHtml(tool.name)}">×</button>
            </div>
            <a href="../tools/${escapeHtml(tool.id)}/" class="compare-tool-title">${escapeHtml(tool.name)}</a>
            <div class="compare-tool-tagline">${escapeHtml(tool.tagline || tool.category)}</div>
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="compare-link-visit">
              <span>Visit Website</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </th>
      `;
    });
    theadHtml += `</tr>`;
    DOM.thead.innerHTML = theadHtml;

    // Check Differences across tools for subtle diff highlighting
    const catDiff = new Set(tools.map(t => t.category)).size > 1;
    const priceDiff = new Set(tools.map(t => t.pricing)).size > 1;
    const ratingDiff = new Set(tools.map(t => t.rating.toFixed(1))).size > 1;

    let tbodyHtml = "";

    // Row 1: Category
    tbodyHtml += `
      <tr class="${catDiff ? 'diff-highlight' : ''}">
        <th scope="row" class="col-feature">Category${catDiff ? ' <span class="diff-badge" title="Values differ">diff</span>' : ''}</th>
        ${tools.map(t => `<td><span class="badge-category">${escapeHtml(t.category)}</span></td>`).join("")}
      </tr>
    `;

    // Row 2: Pricing Model
    tbodyHtml += `
      <tr class="${priceDiff ? 'diff-highlight' : ''}">
        <th scope="row" class="col-feature">Pricing${priceDiff ? ' <span class="diff-badge" title="Values differ">diff</span>' : ''}</th>
        ${tools.map(t => {
          const pricingClass = (t.pricing || "freemium").toLowerCase();
          return `<td><span class="badge-pricing ${pricingClass}">${escapeHtml(t.pricing || "Freemium")}</span></td>`;
        }).join("")}
      </tr>
    `;

    // Row 3: Rating & Evaluations
    tbodyHtml += `
      <tr class="${ratingDiff ? 'diff-highlight' : ''}">
        <th scope="row" class="col-feature">Rating${ratingDiff ? ' <span class="diff-badge" title="Values differ">diff</span>' : ''}</th>
        ${tools.map(t => {
          if (typeof t.rating === "number" && t.rating > 0) {
            return `<td><span class="star-icon" aria-hidden="true">★</span> <strong>${t.rating.toFixed(1)}</strong> <span class="review-count">(${t.reviewCount.toLocaleString()} reviews)</span></td>`;
          }
          return `<td><span style="color:var(--text-muted);">Not rated</span></td>`;
        }).join("")}
      </tr>
    `;

    // Row 4: Short Description / Overview
    tbodyHtml += `
      <tr>
        <th scope="row" class="col-feature">Overview</th>
        ${tools.map(t => `<td><p style="margin:0;line-height:1.5;color:var(--text-secondary);">${escapeHtml(t.description || "Not listed")}</p></td>`).join("")}
      </tr>
    `;

    // Row 5: Key Features
    tbodyHtml += `
      <tr>
        <th scope="row" class="col-feature">Key Features</th>
        ${tools.map(t => {
          if (Array.isArray(t.features) && t.features.length > 0) {
            const listItems = t.features.map(f => `
              <li>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${escapeHtml(f)}</span>
              </li>
            `).join("");
            return `<td><ul class="compare-features-list">${listItems}</ul></td>`;
          }
          return `<td><span style="color:var(--text-muted);">Not listed</span></td>`;
        }).join("")}
      </tr>
    `;

    // Row 6: Best Suited For
    tbodyHtml += `
      <tr>
        <th scope="row" class="col-feature">Best Suited For</th>
        ${tools.map(t => {
          if (Array.isArray(t.bestFor) && t.bestFor.length > 0) {
            return `<td><span style="font-weight:500;color:var(--text-primary);">${escapeHtml(t.bestFor.join(", "))}</span></td>`;
          }
          return `<td><span style="color:var(--text-muted);">Technology professionals & creators</span></td>`;
        }).join("")}
      </tr>
    `;

    // Row 7: Official Website
    tbodyHtml += `
      <tr>
        <th scope="row" class="col-feature">Official Website</th>
        ${tools.map(t => {
          const safeUrl = getSafeUrl(t.url);
          return `
            <td>
              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="compare-link-visit">
                <span>Visit Website ↗</span>
              </a>
            </td>
          `;
        }).join("")}
      </tr>
    `;

    DOM.tbody.innerHTML = tbodyHtml;

    // Attach individual remove button listeners
    DOM.thead.querySelectorAll(".btn-compare-remove-tool").forEach(btn => {
      btn.addEventListener("click", () => {
        const tid = btn.getAttribute("data-tool-id");
        if (tid) removeCompareTool(tid);
      });
    });
  }

  // 8. Event Listeners Setup
  function initListeners() {
    if (DOM.btnClearAll) {
      DOM.btnClearAll.addEventListener("click", clearAllCompare);
    }
  }

  // 9. Startup
  function init() {
    initTheme();
    initDrawer();
    initListeners();
    updateSidebarBadges();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
