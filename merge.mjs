import fs from 'node:fs';
import vm from 'node:vm';

const masterData = JSON.parse(fs.readFileSync('data/ai-tools-master-2000plus.json', 'utf8'));

const existingCode = fs.readFileSync('data/ai-tools.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(existingCode, sandbox);
const existingData = sandbox.window.AI_TOOLS_DATA;
const existingCategories = sandbox.window.AI_CATEGORIES;

console.log('Existing count:', existingData.length);
console.log('Master count:', masterData.length);

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

// Map of duplicates between master and existing (20 records)
const matchedMasterIds = new Set([
  'openai-chatgpt',
  'anthropic-claude',
  'google-gemini',
  'perplexity-ai',
  'mistral-le-chat',
  'midjourney',
  'runway',
  'synthesia',
  'jasper',
  'quillbot',
  'grammarly',
  'github-copilot',
  'cursor',
  'codeium',
  'elevenlabs',
  'notion-ai',
  'elicit',
  'consensus',
  'taskade',
  'otter-ai'
]);

const newToolsFromMaster = masterData.filter(m => !matchedMasterIds.has(m.id));

console.log('Duplicates identified & excluded:', matchedMasterIds.size);
console.log('New tools to import:', newToolsFromMaster.length);

function createTagline(tool) {
  if (tool.tagline) return tool.tagline;
  // Create a clean tagline from description or features
  if (tool.features && tool.features.length >= 2) {
    return `${tool.features[0]} & ${tool.features[1]}`.slice(0, 60);
  }
  const firstSentence = (tool.description || '').split('.')[0];
  if (firstSentence.length > 10 && firstSentence.length <= 65) {
    return firstSentence;
  }
  return tool.category;
}

// Normalize the new tools
const normalizedNewTools = newToolsFromMaster.map(tool => {
  const norm = {
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
  return norm;
});

// Full merged dataset: start with existing, append normalized new tools
const mergedDataset = [...existingData, ...normalizedNewTools];

console.log('Final merged dataset length:', mergedDataset.length);

// Validation
const seenIds = new Set();
const seenUrls = new Set();
const seenNames = new Set();
const errors = [];

mergedDataset.forEach((tool, idx) => {
  if (!tool.id) errors.push(`[${idx}] Missing ID`);
  if (seenIds.has(tool.id)) errors.push(`[${idx}] Duplicate ID: ${tool.id}`);
  seenIds.add(tool.id);

  if (!tool.name) errors.push(`[${idx}] Missing Name`);
  const normName = tool.name.toLowerCase().trim();
  if (seenNames.has(normName)) errors.push(`[${idx}] Duplicate Name: ${tool.name}`);
  seenNames.add(normName);

  if (!tool.url || !tool.url.startsWith('http')) errors.push(`[${idx}] Invalid URL: ${tool.url}`);
  const normUrl = tool.url.toLowerCase().replace(/\/+$/, '');
  if (seenUrls.has(normUrl)) errors.push(`[${idx}] Duplicate URL: ${tool.url}`);
  seenUrls.add(normUrl);

  if (!existingCategories.includes(tool.category) || tool.category === 'All Categories') {
    errors.push(`[${idx}] Invalid Category: ${tool.category}`);
  }

  if (!['Free', 'Freemium', 'Paid'].includes(tool.pricing)) {
    errors.push(`[${idx}] Invalid Pricing: ${tool.pricing}`);
  }

  if (typeof tool.rating !== 'number' || tool.rating < 0 || tool.rating > 5) {
    errors.push(`[${idx}] Invalid Rating: ${tool.rating}`);
  }

  if (typeof tool.reviewCount !== 'number' || tool.reviewCount < 0) {
    errors.push(`[${idx}] Invalid ReviewCount: ${tool.reviewCount}`);
  }

  if (!Array.isArray(tool.tags)) errors.push(`[${idx}] tags is not an array`);
  if (!Array.isArray(tool.features)) errors.push(`[${idx}] features is not an array`);
  if (!Array.isArray(tool.bestFor)) errors.push(`[${idx}] bestFor is not an array`);
});

console.log('Merged validation errors count:', errors.length);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
  process.exit(1);
}

// Category breakdown
const categoryCounts = {};
existingCategories.forEach(cat => {
  if (cat !== 'All Categories') {
    categoryCounts[cat] = mergedDataset.filter(t => t.category === cat).length;
  }
});
console.log('Category Counts:', categoryCounts);

// Generate final JS file content
const jsContent = `/**
 * AIVault — Static AI Tools Dataset (Phase 3A Master Dataset Import)
 * 
 * Total Tools: ${mergedDataset.length}
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

const AI_TOOLS_DATA = ${JSON.stringify(mergedDataset, null, 2)};

// Export to window for vanilla JS architecture without bundler
if (typeof window !== "undefined") {
  window.AI_TOOLS_DATA = AI_TOOLS_DATA;
  window.AI_CATEGORIES = AI_CATEGORIES;
}
`;

fs.writeFileSync('data/ai-tools.js', jsContent, 'utf8');
console.log('Successfully wrote data/ai-tools.js with ' + mergedDataset.length + ' tools!');
