/**
 * AIVault — Static Page Generator & SEO Engine (Phase 3B Architecture)
 * 
 * Generates:
 * 1. Static Tool Detail Pages: tools/<tool-id>/index.html (for all 3,938 tools)
 * 2. Static Category Landing Pages: category/<category-slug>/index.html (for 14 categories)
 * 3. XML Sitemap: sitemap.xml (all 3,953 URLs)
 * 4. Robots Specification: robots.txt
 * 
 * Architecture:
 * - 100% frontend-only static HTML output
 * - Factual data from data/ai-tools.js
 * - Reusable Related Tools engine with multi-factor relevance scoring
 * - Valid JSON-LD structured data (SoftwareApplication, BreadcrumbList)
 * - Safe asset pathing (../../) and configurable canonical URLs
 * - Zero external dependencies, pure Node.js
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// =========================================================================
// 1. CONFIGURATION & CONSTANTS
// =========================================================================
/**
 * Canonical Site Base URL Configuration
 * 
 * Replace "https://aivault-staging.vercel.app" with your actual production domain,
 * or configure it via the AIVAULT_SITE_URL environment variable prior to building.
 * Example: AIVAULT_SITE_URL="https://example.com" node scripts/generate-pages.mjs
 */
export const SITE_URL = process.env.AIVAULT_SITE_URL || 'https://aivault-staging.vercel.app';

export const CATEGORY_MAP = {
  'AI Chat': {
    slug: 'ai-chat',
    description: 'Conversational assistants, general reasoning models, and dialog-based AI tools.',
    accent: '#10A37F'
  },
  'Image Generation': {
    slug: 'image-generation',
    description: 'Text-to-image synthesis, creative generative art, and digital asset generation platforms.',
    accent: '#3B82F6'
  },
  'Video': {
    slug: 'video',
    description: 'AI video generation, automated video editing, avatar synthesis, and video creation tools.',
    accent: '#EC4899'
  },
  'Writing': {
    slug: 'writing',
    description: 'AI copywriting, long-form content generation, summarization, and writing assistants.',
    accent: '#15C39A'
  },
  'Coding': {
    slug: 'coding',
    description: 'AI code generation, intelligent autocomplete, code review, and developer workflow tools.',
    accent: '#000000'
  },
  'Audio': {
    slug: 'audio',
    description: 'AI music generation, sound effects creation, audio mastering, and audio production tools.',
    accent: '#059669'
  },
  'Business': {
    slug: 'business',
    description: 'AI automation for enterprise operations, CRM, data analytics, sales, and clinical workflows.',
    accent: '#0284C7'
  },
  'Research': {
    slug: 'research',
    description: 'Academic paper search, citation mapping, literature review, and scientific research tools.',
    accent: '#0D9488'
  },
  'Education': {
    slug: 'education',
    description: 'AI learning companions, intelligent tutoring systems, study aids, and language education.',
    accent: '#14BF96'
  },
  'Productivity': {
    slug: 'productivity',
    description: 'AI task management, workflow automation, note-taking, and personal productivity tools.',
    accent: '#475569'
  },
  'AI Agents': {
    slug: 'ai-agents',
    description: 'Autonomous AI agents, multi-agent frameworks, and workflow automation systems.',
    accent: '#EA580C'
  },
  'Marketing': {
    slug: 'marketing',
    description: 'AI tools for SEO optimization, advertising creative generation, and social media campaigns.',
    accent: '#F59E0B'
  },
  'Voice': {
    slug: 'voice',
    description: 'Text-to-speech synthesis, voice cloning, speech recognition, and multilingual dubbing.',
    accent: '#8B5CF6'
  },
  'Design': {
    slug: 'design',
    description: 'Generative UI/UX design, 3D modeling, graphic design, and creative layout tools.',
    accent: '#00C4CC'
  }
};

// =========================================================================
// 2. DATASET INGESTION & VALIDATION
// =========================================================================
function loadDataset() {
  const dataPath = path.join(ROOT_DIR, 'data', 'ai-tools.js');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Production dataset not found at: ${dataPath}`);
  }

  const code = fs.readFileSync(dataPath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  const tools = sandbox.window.AI_TOOLS_DATA;
  const categories = sandbox.window.AI_CATEGORIES;

  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error('Failed to load tools: AI_TOOLS_DATA is empty or not an array');
  }

  return { tools, categories };
}

// =========================================================================
// 3. CENTRALIZED URL & ESCAPING HELPERS (Step 19)
// =========================================================================
export function getToolUrl(toolOrId, relativeTo = 'root') {
  const id = typeof toolOrId === 'string' ? toolOrId : toolOrId.id;
  if (relativeTo === 'tool' || relativeTo === 'category') {
    return `../../tools/${id}/`;
  }
  return `tools/${id}/`;
}

export function getCategoryUrl(categoryName, relativeTo = 'root') {
  const meta = CATEGORY_MAP[categoryName];
  const slug = meta ? meta.slug : categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (relativeTo === 'tool' || relativeTo === 'category') {
    return `../../category/${slug}/`;
  }
  return `category/${slug}/`;
}

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function cleanText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function getInitials(name) {
  if (!name) return 'AI';
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'AI';
}

function renderToolLogo(tool, size = 32) {
  if (tool.iconSvg && tool.iconSvg.trim().startsWith('<svg')) {
    return tool.iconSvg;
  }
  const initials = getInitials(tool.name);
  const color = tool.accentColor || CATEGORY_MAP[tool.category]?.accent || '#2563EB';
  return `<span class="tool-initials-fallback" style="color:${color};font-weight:700;font-size:${size * 0.42}px;">${initials}</span>`;
}

export const CATEGORY_ICONS = {
  'All Categories': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  'AI Chat': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  'Image Generation': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  'Video': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  'Writing': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  'Coding': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  'Audio': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  'Business': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  'Research': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  'Education': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  'Productivity': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  'AI Agents': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><path d="M8 15h8"/></svg>`,
  'Marketing': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  'Voice': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>`,
  'Design': `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>`
};

export function getCategoryIconSvg(cat) {
  return CATEGORY_ICONS[cat] || CATEGORY_ICONS['All Categories'];
}

export function renderSidebarDrawerHtml({ homeUrl, currentCategory = '', isCategoryPage = false, categoryCounts = {}, totalToolsCount = 3938 }) {
  const categoryItemsHtml = Object.entries(CATEGORY_MAP).map(([catName, meta]) => {
    const isCurrent = catName === currentCategory;
    const catUrl = (isCurrent && isCategoryPage) ? '#' : `../../category/${meta.slug}/`;
    const count = categoryCounts[catName] || 0;
    const icon = getCategoryIconSvg(catName);

    return `
          <li>
            <a href="${catUrl}" class="sidebar-item ${isCurrent ? 'active' : ''}" data-category="${escapeHtml(catName)}">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">${icon}</span>
                <span class="sidebar-label">${escapeHtml(catName)}</span>
              </span>
              <span class="sidebar-count">${count}</span>
            </a>
          </li>`;
  }).join('');

  return `
  <!-- Mobile Drawer Backdrop -->
  <div class="sidebar-backdrop" id="sidebar-backdrop" aria-hidden="true"></div>

  <!-- Mobile Navigation Drawer -->
  <aside class="sidebar" id="sidebar" aria-label="Directory Navigation">
    <div class="sidebar-inner">
      <!-- Mobile Close Header -->
      <div class="sidebar-mobile-header">
        <a href="${homeUrl}" class="brand-logo" aria-label="AIVault Home">
          <div class="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#brand-nav-grad-sidebar)"/>
              <path d="M16 8L24 16L16 24L8 16Z" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
              <defs>
                <linearGradient id="brand-nav-grad-sidebar" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#2563EB"/>
                  <stop offset="1" stop-color="#0284C7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="logo-text">AI<span class="logo-accent">Vault</span></span>
        </a>
        <button type="button" class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close sidebar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Navigation Section -->
      <div class="sidebar-section">
        <h2 class="sidebar-heading">NAVIGATION</h2>
        <ul class="sidebar-nav-list" role="list">
          <li>
            <a href="${homeUrl}" class="sidebar-item">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </span>
                <span class="sidebar-label">Home</span>
              </span>
            </a>
          </li>
          <li>
            <a href="${homeUrl}#all-tools-section" class="sidebar-item">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <span class="sidebar-label">Explore All Tools</span>
              </span>
            </a>
          </li>
          <li>
            <a href="${homeUrl}#trending-section" class="sidebar-item">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                </span>
                <span class="sidebar-label">Trending Tools</span>
              </span>
            </a>
          </li>
          <li>
            <a href="${homeUrl}#featured-section" class="sidebar-item">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </span>
                <span class="sidebar-label">Featured Collections</span>
              </span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Categories Section -->
      <div class="sidebar-section">
        <h2 class="sidebar-heading">CATEGORIES</h2>
        <ul class="sidebar-nav-list" role="list">
          <li>
            <a href="${homeUrl}#all-tools-section" class="sidebar-item">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">${getCategoryIconSvg('All Categories')}</span>
                <span class="sidebar-label">All Categories</span>
              </span>
              <span class="sidebar-count">${totalToolsCount}</span>
            </a>
          </li>
${categoryItemsHtml}
        </ul>
      </div>

      <!-- My Library Section -->
      <div class="sidebar-section">
        <h2 class="sidebar-heading">MY LIBRARY</h2>
        <ul class="sidebar-nav-list" role="list">
          <li>
            <a href="${homeUrl}?view=favorites" class="sidebar-item" id="sidebar-lib-favorites">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </span>
                <span class="sidebar-label">Favorites</span>
              </span>
              <span class="sidebar-count" id="sidebar-fav-count">0</span>
            </a>
          </li>
          <li>
            <a href="${homeUrl}?view=recent" class="sidebar-item" id="sidebar-lib-recent">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                <span class="sidebar-label">Recently Viewed</span>
              </span>
              <span class="sidebar-count" id="sidebar-recent-count">0</span>
            </a>
          </li>
          <li>
            <a href="${homeUrl.replace('index.html', 'compare/')}" class="sidebar-item" id="sidebar-lib-compare">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </span>
                <span class="sidebar-label">Compare Tools</span>
              </span>
              <span class="sidebar-count" id="sidebar-compare-count">0</span>
            </a>
          </li>
          <li>
            <a href="${homeUrl.replace('index.html', 'collections/')}" class="sidebar-item" id="sidebar-lib-collections">
              <span class="sidebar-item-content">
                <span class="sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </span>
                <span class="sidebar-label">Collections</span>
              </span>
              <span class="sidebar-count" id="sidebar-collections-count">0</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Directory Info Card -->
      <div class="sidebar-footer-card">
        <div class="footer-card-badge">AIVault v1.0</div>
        <p class="footer-card-title">Want to see your AI tool listed?</p>
        <p class="footer-card-desc">Suggest a tool for the AIVault directory.</p>
        <span class="btn-submit-tool" style="display:block;text-align:center;text-decoration:none;">
          Coming Soon
        </span>
      </div>
    </div>
  </aside>
  `;
}

// =========================================================================
// 4. RELATED TOOLS ENGINE (Step 8)
// =========================================================================
export function buildRelatedToolsMap(tools) {
  console.log('Computing factual related tools matrix for all', tools.length, 'tools...');
  const t0 = performance.now();

  const byCat = new Map();
  for (const t of tools) {
    if (!byCat.has(t.category)) byCat.set(t.category, []);
    byCat.get(t.category).push(t);
    t._tagSet = new Set((t.tags || []).map(s => s.toLowerCase()));
    t._bestForSet = new Set((t.bestFor || []).map(s => s.toLowerCase()));
  }

  const relatedMap = new Map();

  for (const tool of tools) {
    const candidates = byCat.get(tool.category) || tools;
    const scored = [];

    for (const c of candidates) {
      if (c.id === tool.id) continue; // Never relate a tool to itself

      let score = 10; // Same category baseline
      for (const tag of tool._tagSet) {
        if (c._tagSet.has(tag)) score += 3;
      }
      for (const bf of tool._bestForSet) {
        if (c._bestForSet.has(bf)) score += 2;
      }

      scored.push({ tool: c, score });
    }

    // Sort by relevance score descending, then rating, then reviewCount
    scored.sort((a, b) => b.score - a.score || b.tool.rating - a.tool.rating || (b.tool.reviewCount || 0) - (a.tool.reviewCount || 0));

    let top6 = scored.slice(0, 6).map(s => s.tool);

    // Graceful fallback: If category has fewer than 6, borrow top rated from other categories
    if (top6.length < 6) {
      for (const other of tools) {
        if (top6.length >= 6) break;
        if (other.id !== tool.id && !top6.some(t => t.id === other.id)) {
          top6.push(other);
        }
      }
    }

    relatedMap.set(tool.id, top6);
  }

  const t1 = performance.now();
  console.log(`Related tools matrix computed in ${(t1 - t0).toFixed(1)} ms.`);
  return relatedMap;
}

// =========================================================================
// 5. TOOL DETAIL PAGE GENERATOR (Steps 3-7, 9, 14-16, 20-27)
// =========================================================================
export function generateToolPageHtml(tool, relatedTools, categoryCounts = {}, totalToolsCount = 3938) {
  const catMeta = CATEGORY_MAP[tool.category] || { slug: 'other', description: '', accent: '#2563EB' };
  const catSlug = catMeta.slug;
  const catUrl = `../../category/${catSlug}/`;
  const canonicalUrl = `${SITE_URL}/tools/${tool.id}/`;
  const homeUrl = '../../index.html';

  const cleanDesc = escapeHtml(cleanText(tool.description));
  const cleanTagline = escapeHtml(tool.tagline || tool.category);
  const cleanName = escapeHtml(tool.name);
  const cleanCategory = escapeHtml(tool.category);
  const pricingClass = (tool.pricing || 'freemium').toLowerCase();

  // Ratings rendering: Only show rating if > 0
  const hasRating = typeof tool.rating === 'number' && tool.rating > 0;
  const ratingText = hasRating ? tool.rating.toFixed(1) : 'Unrated';
  const reviewsText = hasRating ? `(${tool.reviewCount.toLocaleString()} reviews)` : 'Directory Listing';

  // Breadcrumbs JSON-LD
  const breadcrumbLd = {
    '@type': 'ListItem',
    'position': 1,
    'name': 'Home',
    'item': `${SITE_URL}/`
  };
  const categoryLd = {
    '@type': 'ListItem',
    'position': 2,
    'name': tool.category,
    'item': `${SITE_URL}/category/${catSlug}/`
  };
  const toolLd = {
    '@type': 'ListItem',
    'position': 3,
    'name': tool.name,
    'item': canonicalUrl
  };

  // SoftwareApplication JSON-LD
  const appLd = {
    '@type': 'SoftwareApplication',
    'name': tool.name,
    'applicationCategory': tool.category,
    'description': cleanText(tool.description),
    'url': tool.url
  };

  if (hasRating && tool.reviewCount > 0) {
    appLd.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': tool.rating,
      'reviewCount': tool.reviewCount,
      'bestRating': 5,
      'worstRating': 1
    };
  }

  if (tool.pricing === 'Free') {
    appLd.offers = {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    };
  }

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [breadcrumbLd, categoryLd, toolLd]
      },
      appLd
    ]
  };

  // Features rendering
  const featuresHtml = Array.isArray(tool.features) && tool.features.length > 0
    ? `
      <div class="detail-section-card">
        <h2 class="detail-section-heading">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Key Features
        </h2>
        <ul class="detail-features-grid">
          ${tool.features.map(f => `
            <li class="detail-feature-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>${escapeHtml(f)}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `
    : '';

  // Best For rendering
  const bestForHtml = Array.isArray(tool.bestFor) && tool.bestFor.length > 0
    ? `
      <div class="detail-section-card">
        <div class="detail-best-for-box">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          <div>
            <div class="detail-best-for-title">Best Suited For</div>
            <div class="detail-best-for-desc">${escapeHtml(tool.bestFor.join(', '))}</div>
          </div>
        </div>
      </div>
    `
    : '';

  // Tags rendering
  const tagsHtml = Array.isArray(tool.tags) && tool.tags.length > 0
    ? `
      <div class="detail-section-card">
        <h2 class="detail-section-heading">Tags &amp; Topics</h2>
        <div class="card-meta-row" style="margin-bottom:0;">
          ${tool.tags.map(t => `<span class="tag-pill" style="font-size:0.8rem;padding:4px 10px;">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `
    : '';

  // Related Tools Cards rendering
  const relatedCardsHtml = relatedTools && relatedTools.length > 0
    ? relatedTools.map(rel => {
        const relPricingClass = (rel.pricing || 'freemium').toLowerCase();
        const relRatingText = typeof rel.rating === 'number' && rel.rating > 0 ? rel.rating.toFixed(1) : '—';
        const relReviewText = typeof rel.rating === 'number' && rel.rating > 0 ? `(${rel.reviewCount.toLocaleString()})` : '';
        const relUrl = `../../tools/${rel.id}/`;

        return `
          <article class="tool-card" data-tool-id="${escapeHtml(rel.id)}">
            <div class="card-top">
              <div class="card-icon-box" style="color: ${rel.accentColor || 'var(--color-primary)'}">
                ${renderToolLogo(rel, 24)}
              </div>
              <div class="card-top-actions">
                <button type="button" class="btn-card-compare" data-tool-id="${escapeHtml(rel.id)}" aria-label="Compare ${escapeHtml(rel.name)}" title="Compare ${escapeHtml(rel.name)}">
                  <span class="compare-checkbox-glyph" aria-hidden="true">☐</span>
                  <span>Compare</span>
                </button>
                <button type="button" class="btn-card-col" data-tool-id="${escapeHtml(rel.id)}" aria-label="Add ${escapeHtml(rel.name)} to collection" title="Save to collection">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                <button type="button" class="btn-fav" data-tool-id="${escapeHtml(rel.id)}" aria-label="Save ${escapeHtml(rel.name)} to favorites">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title">${escapeHtml(rel.name)}</h3>
              <div class="card-tagline">${escapeHtml(rel.tagline || rel.category)}</div>
              <p class="card-description">${escapeHtml(rel.description)}</p>
              <div class="card-meta-row">
                <span class="badge-category">${escapeHtml(rel.category)}</span>
                <span class="badge-pricing ${relPricingClass}">${escapeHtml(rel.pricing)}</span>
              </div>
            </div>
            <div class="card-bottom">
              <div class="card-metrics">
                <div class="card-rating">
                  <span class="star-icon" aria-hidden="true">★</span>
                  <span>${relRatingText}</span>
                  <span class="review-count">${relReviewText}</span>
                </div>
              </div>
              <a href="${relUrl}" class="btn-card-details">
                <span>View Details</span>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            </div>
          </article>
        `;
      }).join('')
    : '<p class="detail-section-text">No directly related tools found in this category.</p>';

  // Format domain safely
  let domainHost = 'Official Website';
  try {
    const parsed = new URL(tool.url);
    domainHost = parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    domainHost = 'Official Website';
  }

  const catSuffix = cleanCategory.toLowerCase().includes('ai') ? 'Tool' : 'AI Tool';
  const pageTitle = `${cleanName} — ${cleanCategory} ${catSuffix} | AIVault`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${cleanDesc}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph / Social Metadata -->
  <meta property="og:title" content="${cleanName} — ${cleanCategory} AI Tool | AIVault">
  <meta property="og:description" content="${cleanDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="AIVault">
  <meta property="og:image" content="${SITE_URL}/assets/images/preview-desktop.png">
  
  <!-- Twitter Card Metadata -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${cleanName} — ${cleanCategory} AI Tool">
  <meta name="twitter:description" content="${cleanDesc}">
  <meta name="twitter:image" content="${SITE_URL}/assets/images/preview-desktop.png">
  
  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
${JSON.stringify(jsonLdGraph, null, 2)}
  </script>
  
  <link rel="icon" type="image/svg+xml" href="../../assets/logo/favicon.svg">
  <link rel="stylesheet" href="../../style.css">
</head>
<body class="detail-layout-body">
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Top Navigation Bar -->
  <header class="navbar" id="navbar">
    <div class="navbar-container">
      <div class="nav-left">
        <button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle navigation drawer" aria-expanded="false" aria-controls="sidebar">
          <svg class="icon-menu" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <a href="${homeUrl}" class="brand-logo" aria-label="AIVault Home">
          <div class="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#brand-nav-grad)"/>
              <path d="M16 8L24 16L16 24L8 16Z" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
              <defs>
                <linearGradient id="brand-nav-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#2563EB"/>
                  <stop offset="1" stop-color="#0284C7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="logo-text">AI<span class="logo-accent">Vault</span></span>
          <span class="logo-pill">DIRECTORY</span>
        </a>
      </div>

      <nav class="nav-center" aria-label="Primary Navigation">
        <ul class="nav-links">
          <li><a href="${homeUrl}#all-tools-section" class="nav-link">Explore</a></li>
          <li><a href="${catUrl}" class="nav-link">${cleanCategory}</a></li>
          <li><a href="${homeUrl}#trending-section" class="nav-link">Trending</a></li>
          <li><a href="${homeUrl}#featured-section" class="nav-link">Featured</a></li>
        </ul>
      </nav>

      <div class="nav-right">
        <!-- Favorites Shortcut -->
        <a href="${homeUrl}?view=favorites" class="nav-action-btn favorites-nav-btn" id="nav-favorites-btn" aria-label="View Favorites" title="View Favorites">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="badge-count" id="nav-fav-count">0</span>
        </a>

        <!-- Theme Toggle -->
        <button type="button" class="nav-action-btn theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle theme" title="Toggle theme">
          <svg class="sun-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg class="moon-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </div>
  </header>

  ${renderSidebarDrawerHtml({ homeUrl, currentCategory: tool.category, categoryCounts, totalToolsCount })}

  <!-- Main Content Container -->
  <main class="detail-main-wrapper" id="main-content">
    
    <!-- Breadcrumb -->
    <nav class="detail-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="${homeUrl}">Home</a></li>
        <li><span class="breadcrumb-sep">/</span><a href="${catUrl}">${cleanCategory}</a></li>
        <li><span class="breadcrumb-sep">/</span><span class="breadcrumb-current" aria-current="page">${cleanName}</span></li>
      </ol>
    </nav>

    <!-- Tool Identity Hero Card -->
    <section class="detail-hero-card">
      <div class="detail-hero-top">
        <div class="detail-hero-identity">
          <div class="detail-hero-logo" style="color:${tool.accentColor || 'var(--color-primary)'};" aria-hidden="true">
            ${renderToolLogo(tool, 36)}
          </div>
          <div class="detail-hero-headings">
            <h1 class="detail-hero-title">${cleanName}</h1>
            <div class="detail-hero-tagline">${cleanTagline}</div>
            <div class="detail-hero-badges">
              <a href="${catUrl}" class="badge-category">${cleanCategory}</a>
              <span class="badge-pricing ${pricingClass}">${escapeHtml(tool.pricing)}</span>
              ${hasRating ? `
                <div class="detail-hero-rating">
                  <span class="star-icon" aria-hidden="true">★</span>
                  <span>${ratingText}</span>
                  <span class="review-count">${reviewsText}</span>
                </div>
              ` : `
                <span class="badge-category" style="background:var(--bg-surface);color:var(--text-muted);">Listed Tool</span>
              `}
            </div>
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="detail-hero-actions">
          <a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-detail-visit">
            <span>Visit Official Website</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <button type="button" class="btn-detail-compare" id="detail-compare-btn" data-tool-id="${escapeHtml(tool.id)}" aria-label="Add to comparison">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span id="detail-compare-text">Add to Compare</span>
          </button>
          <button type="button" class="btn-detail-col" id="detail-col-btn" data-tool-id="${escapeHtml(tool.id)}" aria-label="Add to collection">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span id="detail-col-text">Add to Collection</span>
          </button>
          <button type="button" class="btn-detail-fav" id="detail-fav-btn" data-tool-id="${escapeHtml(tool.id)}" aria-label="Add to favorites">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span id="detail-fav-text">Save to Favorites</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 2-Column Details Layout -->
    <div class="detail-grid-layout">
      
      <!-- Left Column: Content Details -->
      <div class="detail-content-column">
        <!-- About Section -->
        <section class="detail-section-card">
          <h2 class="detail-section-heading">About ${cleanName}</h2>
          <p class="detail-section-text">${cleanDesc}</p>
        </section>

        ${featuresHtml}
        ${bestForHtml}
        ${tagsHtml}
      </div>

      <!-- Right Column: Quick Facts & Verification -->
      <aside class="detail-sidebar-column">
        <div class="detail-section-card">
          <h2 class="detail-section-heading">Tool Overview</h2>
          <div class="quick-facts-list">
            <div class="quick-fact-row">
              <span class="quick-fact-label">Primary Category</span>
              <a href="${catUrl}" class="quick-fact-value" style="color:var(--color-primary);">${cleanCategory}</a>
            </div>
            <div class="quick-fact-row">
              <span class="quick-fact-label">Pricing Model</span>
              <span class="badge-pricing ${pricingClass}">${escapeHtml(tool.pricing)}</span>
            </div>
            ${hasRating ? `
              <div class="quick-fact-row">
                <span class="quick-fact-label">Rating</span>
                <span class="quick-fact-value">★ ${ratingText}</span>
              </div>
              <div class="quick-fact-row">
                <span class="quick-fact-label">Evaluations</span>
                <span class="quick-fact-value">${tool.reviewCount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="quick-fact-row">
              <span class="quick-fact-label">Official Domain</span>
              <span class="quick-fact-value" style="word-break:break-all;">${escapeHtml(domainHost)}</span>
            </div>
            <div class="quick-fact-row">
              <span class="quick-fact-label">Catalog Date</span>
              <span class="quick-fact-value">${escapeHtml(tool.dateAdded || '2026-09-26')}</span>
            </div>
            <div class="quick-fact-row">
              <span class="quick-fact-label">Directory Status</span>
              <span class="quick-fact-value" style="color:var(--badge-free-text);">Active Listing</span>
            </div>
          </div>
        </div>
      </aside>

    </div>

    <!-- Related Tools Section (Step 8 & 9) -->
    <section class="related-tools-section">
      <div class="related-section-header">
        <h2 class="related-section-title">Related ${cleanCategory} AI Tools</h2>
        <p class="related-section-subtitle">Similar software products for your workflows based on category and shared use cases.</p>
      </div>
      <div class="related-tools-grid">
        ${relatedCardsHtml}
      </div>
    </section>

    <!-- Bottom Navigation Links -->
    <nav class="detail-nav-footer" aria-label="Directory Navigation">
      <a href="${catUrl}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Back to ${cleanCategory} Directory</span>
      </a>
      <a href="${homeUrl}#all-tools-section">
        <span>Browse All 3,938 AI Tools</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </a>
    </nav>

  </main>

  <!-- Global Footer -->
  <footer class="app-footer" id="app-footer">
    <div class="footer-container">
      <div class="footer-brand">
        <a href="${homeUrl}" class="brand-logo">
          <span class="logo-text">AI<span class="logo-accent">Vault</span></span>
        </a>
        <p class="footer-tagline">Discover, compare, and organize AI tools for every workflow.</p>
      </div>
      <div class="footer-links-group">
        <span class="footer-links-title">Directory</span>
        <ul class="footer-links">
          <li><a href="../../index.html#all-tools-section">All AI Tools</a></li>
          <li><a href="../../category/coding/">Categories</a></li>
          <li><a href="../../index.html#featured-section">Featured</a></li>
          <li><a href="../../index.html#trending-section">Trending</a></li>
        </ul>
      </div>
      <div class="footer-links-group">
        <span class="footer-links-title">Library</span>
        <ul class="footer-links">
          <li><a href="../../index.html?view=favorites">Favorites</a></li>
          <li><a href="../../index.html?view=recent">Recently Viewed</a></li>
          <li><a href="../../compare/">Compare Tools</a></li>
          <li><a href="../../collections/">My Collections</a></li>
        </ul>
      </div>
      <div class="footer-links-group">
        <span class="footer-links-title">Platform</span>
        <ul class="footer-links">
          <li><a href="../../sitemap.xml" target="_blank" rel="noopener noreferrer">Sitemap</a></li>
          <li><a href="../../robots.txt" target="_blank" rel="noopener noreferrer">Robots.txt</a></li>
          <li><a href="../../index.html#all-tools-section">Data &amp; Methodology</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 AIVault. Built by MANOJ KUSHWAHA.</p>
      <p class="footer-disclaimer">3,938 AI Tools · 14 Categories</p>
    </div>
  </footer>

  <!-- Collection Picker Modal (Phase 4C) -->
  <div class="col-modal-backdrop" id="col-modal-backdrop" aria-hidden="true" hidden></div>
  <div class="col-modal" id="col-modal" role="dialog" aria-modal="true" aria-labelledby="col-modal-title" hidden>
    <div class="col-modal-header">
      <h3 class="col-modal-title" id="col-modal-title">Save to Collection</h3>
      <button type="button" class="col-modal-close" id="col-modal-close-btn" aria-label="Close dialog">✕</button>
    </div>
    <div class="col-modal-body">
      <div class="col-picker-list" id="col-picker-list" role="group" aria-label="Collections list"></div>
      <div class="col-create-inline" id="col-create-inline">
        <input type="text" class="col-create-input" id="col-create-input" placeholder="New collection name..." maxlength="50" aria-label="New collection name">
        <button type="button" class="btn-col-create" id="btn-col-create-submit">+ Create</button>
      </div>
    </div>
    <div class="col-modal-footer">
      <button type="button" class="btn-col-done" id="col-modal-done-btn">Done</button>
    </div>
  </div>

  <!-- Toast Container -->
  <div class="toast-container" id="toast-container" aria-live="assertive" aria-atomic="true"></div>

  <!-- Interactive Detail Script (Theme, Favorites, Recently Viewed, Mobile Drawer) -->
  <script>
    (function() {
      "use strict";
      const TOOL_ID = ${JSON.stringify(tool.id)};

      // Mobile Drawer Controller
      const mobileMenuBtn = document.getElementById("mobile-menu-btn");
      const sidebar = document.getElementById("sidebar");
      const sidebarBackdrop = document.getElementById("sidebar-backdrop");
      const sidebarCloseBtn = document.getElementById("sidebar-close-btn");

      function openMobileSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.add("active");
        if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      }

      function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
        if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }

      if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileSidebar);
      if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
      if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileSidebar);
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
          const colModal = document.getElementById("col-modal");
          if (colModal && !colModal.hidden) {
            closeColPicker();
            return;
          }
          if (sidebar && sidebar.classList.contains("open")) {
            closeMobileSidebar();
          }
        }
      });

      function updateDrawerCounts() {
        try {
          const favs = JSON.parse(localStorage.getItem("aivault_favorites") || "[]");
          const favCountEl = document.getElementById("sidebar-fav-count");
          if (favCountEl) favCountEl.textContent = Array.isArray(favs) ? favs.length : 0;
        } catch (e) {}

        try {
          const recents = JSON.parse(localStorage.getItem("aivault_recently_viewed") || "[]");
          const recentCountEl = document.getElementById("sidebar-recent-count");
          if (recentCountEl) recentCountEl.textContent = Array.isArray(recents) ? recents.length : 0;
        } catch (e) {}

        try {
          const comp = JSON.parse(localStorage.getItem("aivault_compare") || "[]");
          const compCountEl = document.getElementById("sidebar-compare-count");
          if (compCountEl) compCountEl.textContent = Array.isArray(comp) ? comp.length : 0;
        } catch (e) {}

        try {
          const cols = JSON.parse(localStorage.getItem("aivault_collections") || "[]");
          const colCountEl = document.getElementById("sidebar-collections-count");
          if (colCountEl) colCountEl.textContent = Array.isArray(cols) ? cols.length : 0;
        } catch (e) {}
      }

      // 1. Theme Management (Sync with localStorage)
      const savedTheme = localStorage.getItem("aivault_theme") || "light";
      document.documentElement.setAttribute("data-theme", savedTheme);

      const themeBtn = document.getElementById("theme-toggle-btn");
      if (themeBtn) {
        themeBtn.addEventListener("click", function() {
          const current = document.documentElement.getAttribute("data-theme") || "light";
          const next = current === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", next);
          localStorage.setItem("aivault_theme", next);
        });
      }

      // 2. Favorites Management (Sync with localStorage)
      function getFavorites() {
        try {
          return new Set(JSON.parse(localStorage.getItem("aivault_favorites") || "[]"));
        } catch (e) {
          return new Set();
        }
      }

      function saveFavorites(set) {
        localStorage.setItem("aivault_favorites", JSON.stringify(Array.from(set)));
        updateFavBadges();
        updateDrawerCounts();
      }

      function updateFavBadges() {
        const favs = getFavorites();
        const navFavCount = document.getElementById("nav-fav-count");
        if (navFavCount) navFavCount.textContent = favs.size;

        const favBtn = document.getElementById("detail-fav-btn");
        const favText = document.getElementById("detail-fav-text");
        if (favBtn && favText) {
          const isFav = favs.has(TOOL_ID);
          favBtn.classList.toggle("active", isFav);
          favText.textContent = isFav ? "Saved to Favorites" : "Save to Favorites";
        }

        // Also update any related tool favorite buttons
        document.querySelectorAll(".btn-fav").forEach(btn => {
          const tid = btn.getAttribute("data-tool-id");
          if (tid) btn.classList.toggle("active", favs.has(tid));
        });
      }

      function toggleFav(id) {
        const favs = getFavorites();
        if (favs.has(id)) {
          favs.delete(id);
          showToast("Removed from favorites");
        } else {
          favs.add(id);
          showToast("Added to favorites");
        }
        saveFavorites(favs);
      }

      const favBtn = document.getElementById("detail-fav-btn");
      if (favBtn) {
        favBtn.addEventListener("click", function() {
          toggleFav(TOOL_ID);
        });
      }

      // Related cards favorite delegation
      document.addEventListener("click", function(e) {
        const btn = e.target.closest(".btn-fav");
        if (btn) {
          const tid = btn.getAttribute("data-tool-id");
          if (tid) toggleFav(tid);
        }
      });

      // 3. Compare Management (Sync with localStorage)
      function getCompare() {
        try {
          const arr = JSON.parse(localStorage.getItem("aivault_compare") || "[]");
          return Array.isArray(arr) ? arr : [];
        } catch (e) {
          return [];
        }
      }

      function updateCompareButtons() {
        const compareList = getCompare();
        const compareBtn = document.getElementById("detail-compare-btn");
        const compareText = document.getElementById("detail-compare-text");
        if (compareBtn && compareText) {
          const isComp = compareList.includes(TOOL_ID);
          compareBtn.classList.toggle("active", isComp);
          compareText.textContent = isComp ? "Remove from Compare" : "Add to Compare";
        }

        document.querySelectorAll(".btn-card-compare").forEach(btn => {
          const tid = btn.getAttribute("data-tool-id");
          if (!tid) return;
          const isComp = compareList.includes(tid);
          btn.classList.toggle("active", isComp);
          const glyph = btn.querySelector(".compare-checkbox-glyph");
          if (glyph) glyph.textContent = isComp ? "☑" : "☐";
        });

        const compareCountEl = document.getElementById("sidebar-compare-count");
        if (compareCountEl) compareCountEl.textContent = compareList.length;
      }

      function toggleCompare(id) {
        let compareList = getCompare();
        const idx = compareList.indexOf(id);
        if (idx !== -1) {
          compareList.splice(idx, 1);
          localStorage.setItem("aivault_compare", JSON.stringify(compareList));
          showToast("Removed from comparison");
        } else {
          if (compareList.length >= 4) {
            showToast("Maximum 4 tools can be compared at once. Remove one to add another.");
            return;
          }
          compareList.push(id);
          localStorage.setItem("aivault_compare", JSON.stringify(compareList));
          showToast("Added to comparison");
        }
        updateCompareButtons();
      }

      const compBtn = document.getElementById("detail-compare-btn");
      if (compBtn) {
        compBtn.addEventListener("click", function() {
          toggleCompare(TOOL_ID);
        });
      }

      document.addEventListener("click", function(e) {
        const cBtn = e.target.closest(".btn-card-compare");
        if (cBtn) {
          e.preventDefault();
          e.stopPropagation();
          const tid = cBtn.getAttribute("data-tool-id");
          if (tid) toggleCompare(tid);
        }
      });

      // 4. Recently Viewed Recording (Step 22)
      try {
        let recents = JSON.parse(localStorage.getItem("aivault_recently_viewed") || "[]");
        if (!Array.isArray(recents)) recents = [];
        recents = recents.filter(id => id !== TOOL_ID);
        recents.unshift(TOOL_ID);
        if (recents.length > 20) recents = recents.slice(0, 20);
        localStorage.setItem("aivault_recently_viewed", JSON.stringify(recents));
      } catch (e) {
        // Defensive ignore
      }

      // 4b. Collections Management (Phase 4C)
      let activePickerToolId = null;

      function getCollections() {
        try {
          const arr = JSON.parse(localStorage.getItem("aivault_collections") || "[]");
          return Array.isArray(arr) ? arr : [];
        } catch (e) {
          return [];
        }
      }

      function saveCollections(cols) {
        localStorage.setItem("aivault_collections", JSON.stringify(cols));
        updateDrawerCounts();
      }

      function openColPicker(tid) {
        activePickerToolId = tid;
        renderColPickerList(tid);
        const modal = document.getElementById("col-modal");
        const backdrop = document.getElementById("col-modal-backdrop");
        if (modal && backdrop) {
          modal.hidden = false;
          backdrop.hidden = false;
          const input = document.getElementById("col-create-input");
          if (input) input.value = "";
        }
      }

      function closeColPicker() {
        const modal = document.getElementById("col-modal");
        const backdrop = document.getElementById("col-modal-backdrop");
        if (modal && backdrop) {
          modal.hidden = true;
          backdrop.hidden = true;
        }
        activePickerToolId = null;
      }

      function renderColPickerList(tid) {
        const listEl = document.getElementById("col-picker-list");
        if (!listEl) return;
        listEl.innerHTML = "";
        const cols = getCollections();

        if (cols.length === 0) {
          listEl.innerHTML = '<div class="col-picker-empty">No collections yet. Enter a name below to create one.</div>';
          return;
        }

        cols.forEach(col => {
          const item = document.createElement("label");
          item.className = "col-picker-item";

          const labelSpan = document.createElement("span");
          labelSpan.className = "col-picker-label";

          const chk = document.createElement("input");
          chk.type = "checkbox";
          chk.className = "col-picker-checkbox";
          chk.checked = Array.isArray(col.toolIds) && col.toolIds.includes(tid);

          const nameText = document.createTextNode(col.name);
          labelSpan.appendChild(chk);
          labelSpan.appendChild(nameText);

          const countSpan = document.createElement("span");
          countSpan.className = "col-picker-count";
          countSpan.textContent = "(" + (Array.isArray(col.toolIds) ? col.toolIds.length : 0) + ")";

          item.appendChild(labelSpan);
          item.appendChild(countSpan);

          chk.addEventListener("change", function() {
            const currentCols = getCollections();
            const target = currentCols.find(c => c.id === col.id);
            if (!target) return;
            if (!Array.isArray(target.toolIds)) target.toolIds = [];

            const idx = target.toolIds.indexOf(tid);
            if (idx !== -1) {
              target.toolIds.splice(idx, 1);
              saveCollections(currentCols);
              showToast("Removed from " + target.name);
            } else {
              if (target.toolIds.length >= 100) {
                showToast("Maximum 100 tools per collection reached.");
                chk.checked = false;
                return;
              }
              target.toolIds.push(tid);
              saveCollections(currentCols);
              showToast("Added to " + target.name);
            }
            countSpan.textContent = "(" + target.toolIds.length + ")";
          });

          listEl.appendChild(item);
        });
      }

      function createColFromPicker(name) {
        if (!name || !name.trim()) {
          showToast("Collection name cannot be empty");
          return;
        }
        const clean = name.trim();
        const cols = getCollections();
        if (cols.length >= 20) {
          showToast("Maximum 20 collections reached. Remove one to create another.");
          return;
        }
        if (cols.some(c => c.name.toLowerCase() === clean.toLowerCase())) {
          showToast("A collection with this name already exists");
          return;
        }
        let baseId = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!baseId) baseId = "col-" + Date.now();
        let uniqueId = baseId;
        let counter = 2;
        while (cols.some(c => c.id === uniqueId)) {
          uniqueId = baseId + "-" + (counter++);
        }
        const toolIds = activePickerToolId ? [activePickerToolId] : [];
        cols.push({ id: uniqueId, name: clean, toolIds });
        saveCollections(cols);
        showToast('Created collection "' + clean + '"');
        if (activePickerToolId) {
          renderColPickerList(activePickerToolId);
        }
      }

      // Wire detail collection button
      const detailColBtn = document.getElementById("detail-col-btn");
      if (detailColBtn) {
        detailColBtn.addEventListener("click", function() {
          openColPicker(TOOL_ID);
        });
      }

      // Wire picker controls
      const colCloseBtn = document.getElementById("col-modal-close-btn");
      if (colCloseBtn) colCloseBtn.addEventListener("click", closeColPicker);
      const colDoneBtn = document.getElementById("col-modal-done-btn");
      if (colDoneBtn) colDoneBtn.addEventListener("click", closeColPicker);
      const colBackdrop = document.getElementById("col-modal-backdrop");
      if (colBackdrop) colBackdrop.addEventListener("click", closeColPicker);
      const colCreateSubmit = document.getElementById("btn-col-create-submit");
      const colCreateInput = document.getElementById("col-create-input");
      if (colCreateSubmit && colCreateInput) {
        colCreateSubmit.addEventListener("click", function() {
          createColFromPicker(colCreateInput.value);
          colCreateInput.value = "";
        });
        colCreateInput.addEventListener("keydown", function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            createColFromPicker(colCreateInput.value);
            colCreateInput.value = "";
          }
        });
      }

      // Related cards collection button delegation
      document.addEventListener("click", function(e) {
        const colBtn = e.target.closest(".btn-card-col");
        if (colBtn) {
          e.preventDefault();
          e.stopPropagation();
          const tid = colBtn.getAttribute("data-tool-id");
          if (tid) openColPicker(tid);
        }
      });

      // 5. Simple Toast
      function showToast(msg) {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 2600);
      }

      updateFavBadges();
      updateCompareButtons();
      updateDrawerCounts();
    })();
  </script>
</body>
</html>`;
}

// =========================================================================
// 6. CATEGORY LANDING PAGE GENERATOR (Steps 12 & 13)
// =========================================================================
export function generateCategoryPageHtml(categoryName, categoryTools, allCategories, categoryCounts = {}, totalToolsCount = 3938) {
  const catMeta = CATEGORY_MAP[categoryName] || { slug: 'other', description: '', accent: '#2563EB' };
  const catSlug = catMeta.slug;
  const canonicalUrl = `${SITE_URL}/category/${catSlug}/`;
  const homeUrl = '../../index.html';
  const cleanCategory = escapeHtml(categoryName);
  const cleanCatDesc = escapeHtml(catMeta.description);
  const count = categoryTools.length;

  const breadcrumbLd = {
    '@type': 'ListItem',
    'position': 1,
    'name': 'Home',
    'item': `${SITE_URL}/`
  };
  const categoryLd = {
    '@type': 'ListItem',
    'position': 2,
    'name': categoryName,
    'item': canonicalUrl
  };

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [breadcrumbLd, categoryLd]
      }
    ]
  };

  // Other categories pills navigation
  const otherCatsPillsHtml = Object.entries(CATEGORY_MAP).map(([name, meta]) => {
    const isCurrent = name === categoryName;
    const url = isCurrent ? '#' : `../../category/${meta.slug}/`;
    return `<a href="${url}" class="category-nav-pill ${isCurrent ? 'active' : ''}">${escapeHtml(name)}</a>`;
  }).join('');

  // Tools grid cards (all tools in category linking directly to ../../tools/<id>/)
  const cardsHtml = categoryTools.map(tool => {
    const pricingClass = (tool.pricing || 'freemium').toLowerCase();
    const hasRating = typeof tool.rating === 'number' && tool.rating > 0;
    const ratingText = hasRating ? tool.rating.toFixed(1) : '—';
    const reviewText = hasRating ? `(${tool.reviewCount.toLocaleString()})` : '';
    const toolUrl = `../../tools/${tool.id}/`;

    return `
      <article class="tool-card" data-tool-id="${escapeHtml(tool.id)}">
        <div class="card-top">
          <div class="card-icon-box" style="color: ${tool.accentColor || 'var(--color-primary)'}">
            ${renderToolLogo(tool, 26)}
          </div>
          <div class="card-top-actions">
            <button type="button" class="btn-card-compare" data-tool-id="${escapeHtml(tool.id)}" aria-label="Compare ${escapeHtml(tool.name)}" title="Compare ${escapeHtml(tool.name)}">
              <span class="compare-checkbox-glyph" aria-hidden="true">☐</span>
              <span>Compare</span>
            </button>
            <button type="button" class="btn-card-col" data-tool-id="${escapeHtml(tool.id)}" aria-label="Add ${escapeHtml(tool.name)} to collection" title="Save to collection">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button type="button" class="btn-fav" data-tool-id="${escapeHtml(tool.id)}" aria-label="Save ${escapeHtml(tool.name)} to favorites">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(tool.name)}</h3>
          <div class="card-tagline">${escapeHtml(tool.tagline || tool.category)}</div>
          <p class="card-description">${escapeHtml(tool.description)}</p>
          <div class="card-meta-row">
            <span class="badge-pricing ${pricingClass}">${escapeHtml(tool.pricing)}</span>
            ${(tool.tags || []).slice(0, 2).map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
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
          <a href="${toolUrl}" class="btn-card-details">
            <span>View Details</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </article>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanCategory} AI Tools (${count} Tools) | AIVault Directory</title>
  <meta name="description" content="Explore ${count} tools in the ${cleanCategory} directory. Discover software, compare pricing, and evaluate solutions for your tasks.">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:title" content="${cleanCategory} AI Tools (${count} Tools) | AIVault">
  <meta property="og:description" content="Discover ${count} ${cleanCategory} AI tools in the AIVault directory.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${SITE_URL}/assets/images/preview-desktop.png">
  
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${cleanCategory} AI Tools | AIVault">
  <meta name="twitter:description" content="Discover ${count} ${cleanCategory} AI tools in the AIVault directory.">
  <meta name="twitter:image" content="${SITE_URL}/assets/images/preview-desktop.png">

  <!-- JSON-LD -->
  <script type="application/ld+json">
${JSON.stringify(jsonLdGraph, null, 2)}
  </script>

  <link rel="icon" type="image/svg+xml" href="../../assets/logo/favicon.svg">
  <link rel="stylesheet" href="../../style.css">
</head>
<body class="detail-layout-body">
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Navbar -->
  <header class="navbar" id="navbar">
    <div class="navbar-container">
      <div class="nav-left">
        <button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle navigation drawer" aria-expanded="false" aria-controls="sidebar">
          <svg class="icon-menu" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <a href="${homeUrl}" class="brand-logo" aria-label="AIVault Home">
          <div class="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#brand-nav-grad)"/>
              <path d="M16 8L24 16L16 24L8 16Z" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
              <defs>
                <linearGradient id="brand-nav-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#2563EB"/>
                  <stop offset="1" stop-color="#0284C7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="logo-text">AI<span class="logo-accent">Vault</span></span>
          <span class="logo-pill">DIRECTORY</span>
        </a>
      </div>

      <nav class="nav-center" aria-label="Primary Navigation">
        <ul class="nav-links">
          <li><a href="${homeUrl}#all-tools-section" class="nav-link">Explore</a></li>
          <li><a href="${homeUrl}#categories" class="nav-link active">Categories</a></li>
          <li><a href="${homeUrl}#trending-section" class="nav-link">Trending</a></li>
          <li><a href="${homeUrl}#featured-section" class="nav-link">Featured</a></li>
        </ul>
      </nav>

      <div class="nav-right">
        <a href="${homeUrl}?view=favorites" class="nav-action-btn favorites-nav-btn" aria-label="View Favorites">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="badge-count" id="nav-fav-count">0</span>
        </a>

        <button type="button" class="nav-action-btn theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle theme">
          <svg class="sun-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg class="moon-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </div>
  </header>

  ${renderSidebarDrawerHtml({ homeUrl, currentCategory: categoryName, isCategoryPage: true, categoryCounts, totalToolsCount })}

  <!-- Category Main -->
  <main class="detail-main-wrapper" id="main-content">
    <nav class="detail-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="${homeUrl}">Home</a></li>
        <li><span class="breadcrumb-sep">/</span><span class="breadcrumb-current" aria-current="page">${cleanCategory}</span></li>
      </ol>
    </nav>

    <section class="category-hero-section">
      <h1 class="category-hero-title">${cleanCategory} AI Tools</h1>
      <p class="category-hero-desc">${cleanCatDesc}</p>
      <div class="category-meta-bar">
        <span class="category-count-pill">${count} Listed Tools</span>
        <a href="${homeUrl}#all-tools-section" style="font-size:0.88rem;color:var(--color-primary);text-decoration:none;font-weight:600;">Browse All Categories →</a>
      </div>
    </section>

    <!-- Category Switcher Nav Pills -->
    <nav class="category-nav-pills" aria-label="Other categories">
      ${otherCatsPillsHtml}
    </nav>

    <!-- Category Tools Grid -->
    <section class="category-tools-grid">
      ${cardsHtml}
    </section>

    <!-- Bottom Navigation Footer -->
    <nav class="detail-nav-footer" style="margin-top:50px;">
      <a href="${homeUrl}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Back to AIVault Home</span>
      </a>
      <a href="${homeUrl}#all-tools-section">
        <span>Browse All 3,938 AI Tools</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </a>
    </nav>
  </main>

  <!-- Global Footer -->
  <footer class="app-footer" id="app-footer">
    <div class="footer-container">
      <div class="footer-brand">
        <a href="${homeUrl}" class="brand-logo">
          <span class="logo-text">AI<span class="logo-accent">Vault</span></span>
        </a>
        <p class="footer-tagline">Discover, compare, and organize AI tools for every workflow.</p>
      </div>
      <div class="footer-links-group">
        <span class="footer-links-title">Directory</span>
        <ul class="footer-links">
          <li><a href="../../index.html#all-tools-section">All AI Tools</a></li>
          <li><a href="../../category/coding/">Categories</a></li>
          <li><a href="../../index.html#featured-section">Featured</a></li>
          <li><a href="../../index.html#trending-section">Trending</a></li>
        </ul>
      </div>
      <div class="footer-links-group">
        <span class="footer-links-title">Library</span>
        <ul class="footer-links">
          <li><a href="../../index.html?view=favorites">Favorites</a></li>
          <li><a href="../../index.html?view=recent">Recently Viewed</a></li>
          <li><a href="../../compare/">Compare Tools</a></li>
          <li><a href="../../collections/">My Collections</a></li>
        </ul>
      </div>
      <div class="footer-links-group">
        <span class="footer-links-title">Platform</span>
        <ul class="footer-links">
          <li><a href="../../sitemap.xml" target="_blank" rel="noopener noreferrer">Sitemap</a></li>
          <li><a href="../../robots.txt" target="_blank" rel="noopener noreferrer">Robots.txt</a></li>
          <li><a href="../../index.html#all-tools-section">Data &amp; Methodology</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 AIVault. Built by MANOJ KUSHWAHA.</p>
      <p class="footer-disclaimer">3,938 AI Tools · 14 Categories</p>
    </div>
  </footer>

  <!-- Collection Picker Modal (Phase 4C) -->
  <div class="col-modal-backdrop" id="col-modal-backdrop" aria-hidden="true" hidden></div>
  <div class="col-modal" id="col-modal" role="dialog" aria-modal="true" aria-labelledby="col-modal-title" hidden>
    <div class="col-modal-header">
      <h3 class="col-modal-title" id="col-modal-title">Save to Collection</h3>
      <button type="button" class="col-modal-close" id="col-modal-close-btn" aria-label="Close dialog">✕</button>
    </div>
    <div class="col-modal-body">
      <div class="col-picker-list" id="col-picker-list" role="group" aria-label="Collections list"></div>
      <div class="col-create-inline" id="col-create-inline">
        <input type="text" class="col-create-input" id="col-create-input" placeholder="New collection name..." maxlength="50" aria-label="New collection name">
        <button type="button" class="btn-col-create" id="btn-col-create-submit">+ Create</button>
      </div>
    </div>
    <div class="col-modal-footer">
      <button type="button" class="btn-col-done" id="col-modal-done-btn">Done</button>
    </div>
  </div>

  <!-- Toast Container -->
  <div class="toast-container" id="toast-container" aria-live="assertive" aria-atomic="true"></div>

  <!-- Interactive Category Script (Theme, Favorites, Compare, Mobile Drawer) -->
  <script>
    (function() {
      "use strict";

      // Mobile Drawer Controller
      const mobileMenuBtn = document.getElementById("mobile-menu-btn");
      const sidebar = document.getElementById("sidebar");
      const sidebarBackdrop = document.getElementById("sidebar-backdrop");
      const sidebarCloseBtn = document.getElementById("sidebar-close-btn");

      function openMobileSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.add("active");
        if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      }

      function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
        if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }

      if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileSidebar);
      if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
      if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileSidebar);
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
          const colModal = document.getElementById("col-modal");
          if (colModal && !colModal.hidden) {
            closeColPicker();
            return;
          }
          if (sidebar && sidebar.classList.contains("open")) {
            closeMobileSidebar();
          }
        }
      });

      function updateDrawerCounts() {
        try {
          const favs = JSON.parse(localStorage.getItem("aivault_favorites") || "[]");
          const favCountEl = document.getElementById("sidebar-fav-count");
          if (favCountEl) favCountEl.textContent = Array.isArray(favs) ? favs.length : 0;
        } catch (e) {}

        try {
          const recents = JSON.parse(localStorage.getItem("aivault_recently_viewed") || "[]");
          const recentCountEl = document.getElementById("sidebar-recent-count");
          if (recentCountEl) recentCountEl.textContent = Array.isArray(recents) ? recents.length : 0;
        } catch (e) {}

        try {
          const comp = JSON.parse(localStorage.getItem("aivault_compare") || "[]");
          const compCountEl = document.getElementById("sidebar-compare-count");
          if (compCountEl) compCountEl.textContent = Array.isArray(comp) ? comp.length : 0;
        } catch (e) {}

        try {
          const cols = JSON.parse(localStorage.getItem("aivault_collections") || "[]");
          const colCountEl = document.getElementById("sidebar-collections-count");
          if (colCountEl) colCountEl.textContent = Array.isArray(cols) ? cols.length : 0;
        } catch (e) {}
      }

      // Theme
      const savedTheme = localStorage.getItem("aivault_theme") || "light";
      document.documentElement.setAttribute("data-theme", savedTheme);

      const themeBtn = document.getElementById("theme-toggle-btn");
      if (themeBtn) {
        themeBtn.addEventListener("click", function() {
          const current = document.documentElement.getAttribute("data-theme") || "light";
          const next = current === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", next);
          localStorage.setItem("aivault_theme", next);
        });
      }

      // Favorites
      function getFavs() {
        try { return new Set(JSON.parse(localStorage.getItem("aivault_favorites") || "[]")); } catch (e) { return new Set(); }
      }
      function syncFavs() {
        const favs = getFavs();
        const badge = document.getElementById("nav-fav-count");
        if (badge) badge.textContent = favs.size;
        updateDrawerCounts();
        document.querySelectorAll(".btn-fav").forEach(b => {
          const tid = b.getAttribute("data-tool-id");
          if (tid) b.classList.toggle("active", favs.has(tid));
        });
      }
      document.addEventListener("click", function(e) {
        const btn = e.target.closest(".btn-fav");
        if (btn) {
          const tid = btn.getAttribute("data-tool-id");
          if (!tid) return;
          const favs = getFavs();
          if (favs.has(tid)) favs.delete(tid);
          else favs.add(tid);
          localStorage.setItem("aivault_favorites", JSON.stringify(Array.from(favs)));
          syncFavs();
        }
      });

      // Compare Management
      function getCompare() {
        try {
          const arr = JSON.parse(localStorage.getItem("aivault_compare") || "[]");
          return Array.isArray(arr) ? arr : [];
        } catch (e) {
          return [];
        }
      }

      function syncCompare() {
        const compareList = getCompare();
        document.querySelectorAll(".btn-card-compare").forEach(btn => {
          const tid = btn.getAttribute("data-tool-id");
          if (!tid) return;
          const isComp = compareList.includes(tid);
          btn.classList.toggle("active", isComp);
          const glyph = btn.querySelector(".compare-checkbox-glyph");
          if (glyph) glyph.textContent = isComp ? "☑" : "☐";
        });
        updateDrawerCounts();
      }

      function toggleCompare(id) {
        let compareList = getCompare();
        const idx = compareList.indexOf(id);
        if (idx !== -1) {
          compareList.splice(idx, 1);
          localStorage.setItem("aivault_compare", JSON.stringify(compareList));
          showToast("Removed from comparison");
        } else {
          if (compareList.length >= 4) {
            showToast("Maximum 4 tools can be compared at once. Remove one to add another.");
            return;
          }
          compareList.push(id);
          localStorage.setItem("aivault_compare", JSON.stringify(compareList));
          showToast("Added to comparison");
        }
        syncCompare();
      }

      document.addEventListener("click", function(e) {
        const cBtn = e.target.closest(".btn-card-compare");
        if (cBtn) {
          e.preventDefault();
          e.stopPropagation();
          const tid = cBtn.getAttribute("data-tool-id");
          if (tid) toggleCompare(tid);
        }
      });

      // 4. Collections Management (Phase 4C)
      let activePickerToolId = null;

      function getCollections() {
        try {
          const arr = JSON.parse(localStorage.getItem("aivault_collections") || "[]");
          return Array.isArray(arr) ? arr : [];
        } catch (e) {
          return [];
        }
      }

      function saveCollections(cols) {
        localStorage.setItem("aivault_collections", JSON.stringify(cols));
        updateDrawerCounts();
      }

      function openColPicker(tid) {
        activePickerToolId = tid;
        renderColPickerList(tid);
        const modal = document.getElementById("col-modal");
        const backdrop = document.getElementById("col-modal-backdrop");
        if (modal && backdrop) {
          modal.hidden = false;
          backdrop.hidden = false;
          const input = document.getElementById("col-create-input");
          if (input) input.value = "";
        }
      }

      function closeColPicker() {
        const modal = document.getElementById("col-modal");
        const backdrop = document.getElementById("col-modal-backdrop");
        if (modal && backdrop) {
          modal.hidden = true;
          backdrop.hidden = true;
        }
        activePickerToolId = null;
      }

      function renderColPickerList(tid) {
        const listEl = document.getElementById("col-picker-list");
        if (!listEl) return;
        listEl.innerHTML = "";
        const cols = getCollections();

        if (cols.length === 0) {
          listEl.innerHTML = '<div class="col-picker-empty">No collections yet. Enter a name below to create one.</div>';
          return;
        }

        cols.forEach(col => {
          const item = document.createElement("label");
          item.className = "col-picker-item";

          const labelSpan = document.createElement("span");
          labelSpan.className = "col-picker-label";

          const chk = document.createElement("input");
          chk.type = "checkbox";
          chk.className = "col-picker-checkbox";
          chk.checked = Array.isArray(col.toolIds) && col.toolIds.includes(tid);

          const nameText = document.createTextNode(col.name);
          labelSpan.appendChild(chk);
          labelSpan.appendChild(nameText);

          const countSpan = document.createElement("span");
          countSpan.className = "col-picker-count";
          countSpan.textContent = "(" + (Array.isArray(col.toolIds) ? col.toolIds.length : 0) + ")";

          item.appendChild(labelSpan);
          item.appendChild(countSpan);

          chk.addEventListener("change", function() {
            const currentCols = getCollections();
            const target = currentCols.find(c => c.id === col.id);
            if (!target) return;
            if (!Array.isArray(target.toolIds)) target.toolIds = [];

            const idx = target.toolIds.indexOf(tid);
            if (idx !== -1) {
              target.toolIds.splice(idx, 1);
              saveCollections(currentCols);
              showToast("Removed from " + target.name);
            } else {
              if (target.toolIds.length >= 100) {
                showToast("Maximum 100 tools per collection reached.");
                chk.checked = false;
                return;
              }
              target.toolIds.push(tid);
              saveCollections(currentCols);
              showToast("Added to " + target.name);
            }
            countSpan.textContent = "(" + target.toolIds.length + ")";
          });

          listEl.appendChild(item);
        });
      }

      function createColFromPicker(name) {
        if (!name || !name.trim()) {
          showToast("Collection name cannot be empty");
          return;
        }
        const clean = name.trim();
        const cols = getCollections();
        if (cols.length >= 20) {
          showToast("Maximum 20 collections reached. Remove one to create another.");
          return;
        }
        if (cols.some(c => c.name.toLowerCase() === clean.toLowerCase())) {
          showToast("A collection with this name already exists");
          return;
        }
        let baseId = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!baseId) baseId = "col-" + Date.now();
        let uniqueId = baseId;
        let counter = 2;
        while (cols.some(c => c.id === uniqueId)) {
          uniqueId = baseId + "-" + (counter++);
        }
        const toolIds = activePickerToolId ? [activePickerToolId] : [];
        cols.push({ id: uniqueId, name: clean, toolIds });
        saveCollections(cols);
        showToast('Created collection "' + clean + '"');
        if (activePickerToolId) {
          renderColPickerList(activePickerToolId);
        }
      }

      // Wire picker controls
      const colCloseBtn = document.getElementById("col-modal-close-btn");
      if (colCloseBtn) colCloseBtn.addEventListener("click", closeColPicker);
      const colDoneBtn = document.getElementById("col-modal-done-btn");
      if (colDoneBtn) colDoneBtn.addEventListener("click", closeColPicker);
      const colBackdrop = document.getElementById("col-modal-backdrop");
      if (colBackdrop) colBackdrop.addEventListener("click", closeColPicker);
      const colCreateSubmit = document.getElementById("btn-col-create-submit");
      const colCreateInput = document.getElementById("col-create-input");
      if (colCreateSubmit && colCreateInput) {
        colCreateSubmit.addEventListener("click", function() {
          createColFromPicker(colCreateInput.value);
          colCreateInput.value = "";
        });
        colCreateInput.addEventListener("keydown", function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            createColFromPicker(colCreateInput.value);
            colCreateInput.value = "";
          }
        });
      }

      // Card collection button delegation
      document.addEventListener("click", function(e) {
        const colBtn = e.target.closest(".btn-card-col");
        if (colBtn) {
          e.preventDefault();
          e.stopPropagation();
          const tid = colBtn.getAttribute("data-tool-id");
          if (tid) openColPicker(tid);
        }
      });

      function showToast(msg) {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 2600);
      }

      syncFavs();
      syncCompare();
      updateDrawerCounts();
    })();
  </script>
</body>
</html>`;
}

// =========================================================================
// 7. SITEMAP GENERATOR (Step 17)
// =========================================================================
export function generateSitemapXml(tools, categories) {
  const urls = [];

  // 1. Homepage
  urls.push(`
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  // 2. Category pages
  for (const cat of categories) {
    if (cat === 'All Categories') continue;
    const meta = CATEGORY_MAP[cat];
    const slug = meta ? meta.slug : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    urls.push(`
  <url>
    <loc>${SITE_URL}/category/${slug}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // 3. Tool detail pages
  for (const tool of tools) {
    urls.push(`
  <url>
    <loc>${SITE_URL}/tools/${tool.id}/</loc>
    <lastmod>${tool.dateAdded || '2026-09-26'}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>
`;
}

// =========================================================================
// 8. ROBOTS.TXT GENERATOR (Step 18)
// =========================================================================
export function generateRobotsTxt() {
  return `# AIVault Static Directory robots.txt
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// =========================================================================
// 9. MASTER BUILD EXECUTION (Step 28 & 29)
// =========================================================================
export async function runBuild() {
  const startTime = performance.now();
  console.log('==================================================');
  console.log('AIVAULT PHASE 3B — STATIC SITE & SEO GENERATOR');
  console.log('==================================================');

  // Step 1: Load and validate dataset
  console.log('Loading production dataset from data/ai-tools.js...');
  const { tools, categories } = loadDataset();
  console.log(`Loaded ${tools.length} tools across ${categories.length - 1} categories.`);

  // Step 2: Build related tools matrix
  const relatedMap = buildRelatedToolsMap(tools);

  // Step 2b: Precompute Category Counts
  const categoryCounts = {};
  for (const catName of Object.keys(CATEGORY_MAP)) {
    categoryCounts[catName] = 0;
  }
  for (const t of tools) {
    if (categoryCounts[t.category] !== undefined) {
      categoryCounts[t.category]++;
    } else {
      categoryCounts[t.category] = 1;
    }
  }

  // Step 3: Generate Tool Pages
  console.log(`Generating ${tools.length} static tool detail pages...`);
  const toolsBaseDir = path.join(ROOT_DIR, 'tools');
  if (!fs.existsSync(toolsBaseDir)) {
    fs.mkdirSync(toolsBaseDir, { recursive: true });
  }

  let toolPagesWritten = 0;
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const toolDir = path.join(toolsBaseDir, tool.id);
    if (!fs.existsSync(toolDir)) {
      fs.mkdirSync(toolDir, { recursive: true });
    }
    const html = generateToolPageHtml(tool, relatedMap.get(tool.id) || [], categoryCounts, tools.length);
    fs.writeFileSync(path.join(toolDir, 'index.html'), html, 'utf8');
    toolPagesWritten++;
  }
  console.log(`Successfully generated ${toolPagesWritten} tool pages in /tools/<id>/index.html`);

  // Step 4: Generate Category Pages
  console.log('Generating 14 static category landing pages...');
  const catBaseDir = path.join(ROOT_DIR, 'category');
  if (!fs.existsSync(catBaseDir)) {
    fs.mkdirSync(catBaseDir, { recursive: true });
  }

  const byCat = new Map();
  for (const t of tools) {
    if (!byCat.has(t.category)) byCat.set(t.category, []);
    byCat.get(t.category).push(t);
  }

  let catPagesWritten = 0;
  for (const [catName, meta] of Object.entries(CATEGORY_MAP)) {
    const catDir = path.join(catBaseDir, meta.slug);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }
    const catTools = byCat.get(catName) || [];
    const html = generateCategoryPageHtml(catName, catTools, categories, categoryCounts, tools.length);
    fs.writeFileSync(path.join(catDir, 'index.html'), html, 'utf8');
    catPagesWritten++;
  }
  console.log(`Successfully generated ${catPagesWritten} category pages in /category/<slug>/index.html`);

  // Step 5: Generate Sitemap
  console.log('Generating sitemap.xml...');
  const sitemapXml = generateSitemapXml(tools, categories);
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  const sitemapUrlCount = 1 + catPagesWritten + toolPagesWritten;
  console.log(`Generated sitemap.xml with ${sitemapUrlCount} URLs.`);

  // Step 6: Generate Robots.txt
  console.log('Generating robots.txt...');
  const robotsTxt = generateRobotsTxt();
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsTxt, 'utf8');
  console.log('Generated robots.txt.');

  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log('==================================================');
  console.log(`STATIC GENERATION COMPLETE in ${totalTime}s`);
  console.log(`- Dataset tools listed: ${tools.length}`);
  console.log(`- Tool detail pages: ${toolPagesWritten}`);
  console.log(`- Category landing pages: ${catPagesWritten}`);
  console.log(`- Sitemap URLs: ${sitemapUrlCount}`);
  console.log(`- Robots.txt: Active with sitemap reference`);
  console.log('==================================================');

  return {
    toolsCount: tools.length,
    toolPagesWritten,
    catPagesWritten,
    sitemapUrlCount,
    totalTime
  };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('generate-pages.mjs')) {
  runBuild().catch(err => {
    console.error('Build failed with error:', err);
    process.exit(1);
  });
}
