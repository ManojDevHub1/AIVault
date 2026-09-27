import fs from 'node:fs';
import vm from 'node:vm';

// 1. Load existing curated tools (176 tools)
const existingCode = fs.readFileSync('data/ai-tools.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(existingCode, sandbox);
const existingTools = sandbox.window.AI_TOOLS_DATA;

// 2. Load incoming batch (3,893 tools)
const incomingBatch = JSON.parse(fs.readFileSync('data/ai-tools-dataset.json', 'utf8'));

console.log('Existing tools count:', existingTools.length);
console.log('Incoming batch count:', incomingBatch.length);

const CANONICAL_CATEGORIES = [
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

const CATEGORY_COLORS = {
  'AI Chat': '#10A37F',
  'Image Generation': '#3B82F6',
  'Video': '#EC4899',
  'Writing': '#15C39A',
  'Coding': '#000000',
  'Audio': '#059669',
  'Business': '#0284C7',
  'Research': '#0D9488',
  'Education': '#14BF96',
  'Productivity': '#475569',
  'AI Agents': '#EA580C',
  'Marketing': '#F59E0B',
  'Voice': '#8B5CF6',
  'Design': '#00C4CC'
};

const CATEGORY_ICONS = {
  'AI Chat': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  'Image Generation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  'Video': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  'Writing': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  'Coding': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  'Audio': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  'Business': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  'Research': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  'Education': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  'Productivity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  'AI Agents': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><path d="M8 15h8"/></svg>',
  'Marketing': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  'Voice': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>',
  'Design': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>'
};

function normalizeName(n) {
  return (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const SHARED_HOSTS = new Set(['github.com', 'huggingface.co', 'gitlab.com', 'google.com', 'microsoft.com']);

function normalizeDomain(u) {
  try {
    const url = new URL(u);
    let host = url.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    if (SHARED_HOSTS.has(host)) {
      return host + url.pathname.toLowerCase().replace(/\/+$/, '');
    }
    return host;
  } catch (e) {
    return (u || '').toLowerCase();
  }
}

// Build index of existing tools
const existingIdMap = new Map();
const existingNameMap = new Map();
const existingDomainMap = new Map();

existingTools.forEach(t => {
  existingIdMap.set(t.id.toLowerCase(), t);
  existingNameMap.set(normalizeName(t.name), t);
  existingDomainMap.set(normalizeDomain(t.url), t);
});

// Deduplicate incoming batch against existing tools
const conflictsWithExisting = [];
const incomingUnique = [];

incomingBatch.forEach(item => {
  const normId = item.id.toLowerCase();
  const normName = normalizeName(item.name);
  const normDomain = normalizeDomain(item.url);

  let match = null;
  let reason = '';
  if (existingIdMap.has(normId)) {
    match = existingIdMap.get(normId);
    reason = 'ID match: ' + item.id;
  } else if (existingNameMap.has(normName)) {
    match = existingNameMap.get(normName);
    reason = 'Name match: ' + item.name + ' ~ ' + match.name;
  } else if (existingDomainMap.has(normDomain)) {
    match = existingDomainMap.get(normDomain);
    reason = 'Domain match: ' + normDomain;
  }

  if (match) {
    conflictsWithExisting.push({ incoming: item, existing: match, reason });
  } else {
    incomingUnique.push(item);
  }
});

console.log('Duplicates with existing (retaining existing):', conflictsWithExisting.length);
console.log('Incoming candidate tools:', incomingUnique.length);

// Now handle internal deduplication within incomingUnique
const droppedInternal = [];
const deduplicatedIncoming = [];
const seenIds = new Set(existingTools.map(t => t.id.toLowerCase()));
const seenNames = new Set(existingTools.map(t => normalizeName(t.name)));
const seenDomains = new Set(existingTools.map(t => normalizeDomain(t.url)));

incomingUnique.forEach(item => {
  // Specific known duplicate resolutions
  if (item.id === 'airbrush-2') {
    droppedInternal.push({ id: item.id, name: item.name, reason: 'Duplicate of airbrush with affiliate link' });
    return;
  }
  if (item.id === 'decor-ai') {
    droppedInternal.push({ id: item.id, name: item.name, reason: 'Duplicate domain of decorai' });
    return;
  }
  if (item.id === 'jungle-ai') {
    droppedInternal.push({ id: item.id, name: item.name, reason: 'Duplicate domain of jungleai' });
    return;
  }
  if (item.id === 'ai-meal-planner-2') {
    item.name = 'Casa de Sante AI Meal Planner';
  }

  const normId = item.id.toLowerCase();
  const normName = normalizeName(item.name);
  const normDomain = normalizeDomain(item.url);

  if (seenIds.has(normId)) {
    droppedInternal.push({ id: item.id, name: item.name, reason: 'Collision on ID ' + normId });
    return;
  }
  if (seenNames.has(normName)) {
    droppedInternal.push({ id: item.id, name: item.name, reason: 'Collision on Name ' + normName });
    return;
  }
  if (seenDomains.has(normDomain)) {
    droppedInternal.push({ id: item.id, name: item.name, reason: 'Collision on Domain ' + normDomain });
    return;
  }

  seenIds.add(normId);
  seenNames.add(normName);
  seenDomains.add(normDomain);
  deduplicatedIncoming.push(item);
});

console.log('Internal dropped records:', droppedInternal.length);
console.log('Final new tools to merge:', deduplicatedIncoming.length);

function createTagline(tool) {
  if (tool.tagline && tool.tagline.trim()) return tool.tagline.trim();
  if (tool.features && tool.features.length >= 2) {
    const combined = `${tool.features[0]} & ${tool.features[1]}`;
    if (combined.length <= 65) return combined;
  }
  const firstSentence = (tool.description || '').split('.')[0];
  if (firstSentence.length >= 10 && firstSentence.length <= 65) {
    return firstSentence;
  }
  return tool.category;
}

// Normalize incoming tools to full schema
const normalizedIncoming = deduplicatedIncoming.map(tool => {
  return {
    id: tool.id,
    name: tool.name,
    tagline: createTagline(tool),
    category: tool.category,
    pricing: tool.pricing,
    rating: typeof tool.rating === 'number' ? tool.rating : 0,
    reviewCount: typeof tool.reviewCount === 'number' ? tool.reviewCount : 0,
    description: tool.description,
    tags: Array.isArray(tool.tags) ? tool.tags : [],
    features: Array.isArray(tool.features) ? tool.features : [],
    bestFor: Array.isArray(tool.bestFor) ? tool.bestFor : [],
    url: tool.url,
    featured: Boolean(tool.featured),
    trending: Boolean(tool.trending),
    dateAdded: tool.dateAdded || '2026-09-26',
    accentColor: CATEGORY_COLORS[tool.category] || '#2563EB',
    iconSvg: CATEGORY_ICONS[tool.category] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
  };
});

// Final merged dataset
const finalMergedDataset = [...existingTools, ...normalizedIncoming];
console.log('TOTAL MERGED TOOLS:', finalMergedDataset.length);

// Category Breakdown
const categoryCounts = {};
CANONICAL_CATEGORIES.forEach(c => {
  if (c !== 'All Categories') {
    categoryCounts[c] = finalMergedDataset.filter(t => t.category === c).length;
  }
});
console.log('\nFinal Category Breakdown:');
console.table(categoryCounts);

// Generate final data/ai-tools.js
const jsContent = `/**
 * AIVault — Static AI Tools Dataset
 * 
 * Total Tools: ${finalMergedDataset.length}
 * Canonical Categories: 14
 * Strict Schema:
 * {
 *   id: string (unique slug),
 *   name: string,
 *   tagline: string,
 *   category: string (from canonical AI_CATEGORIES),
 *   pricing: "Free" | "Freemium" | "Paid",
 *   rating: number (0.0 - 5.0),
 *   reviewCount: number,
 *   description: string,
 *   tags: string[],
 *   features: string[],
 *   bestFor: string[],
 *   url: string (valid URL with https://),
 *   featured: boolean,
 *   trending: boolean,
 *   dateAdded: string ("YYYY-MM-DD"),
 *   accentColor: string (hex color for brand accents),
 *   iconSvg: string (SVG vector markup)
 * }
 */

const AI_CATEGORIES = ${JSON.stringify(CANONICAL_CATEGORIES, null, 2)};

const AI_TOOLS_DATA = ${JSON.stringify(finalMergedDataset, null, 2)};

// Export to window for vanilla JS architecture without bundler
if (typeof window !== "undefined") {
  window.AI_TOOLS_DATA = AI_TOOLS_DATA;
  window.AI_CATEGORIES = AI_CATEGORIES;
}
`;

fs.writeFileSync('data/ai-tools.js', jsContent, 'utf8');
console.log('Wrote data/ai-tools.js successfully!');
