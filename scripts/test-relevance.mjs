import fs from 'node:fs';
import path from 'node:path';

const dataPath = path.join(process.cwd(), 'data', 'ai-tools.js');
const code = fs.readFileSync(dataPath, 'utf-8');
const window = {};
new Function('window', code)(window);
const rawTools = window.AI_TOOLS_DATA || [];
const categories = window.AI_CATEGORIES || [];

console.log(`Loaded ${rawTools.length} tools`);

// 1. Normalization
function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAlphaNum(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// 2. Synonyms map
const SYNONYM_MAP = {
  'editor': ['editing'],
  'editing': ['editor'],
  'image': ['images', 'photo', 'photos'],
  'images': ['image', 'photo', 'photos'],
  'photo': ['image', 'images'],
  'photos': ['image', 'images'],
  'video': ['videos'],
  'videos': ['video'],
  'voice': ['speech', 'vocal'],
  'speech': ['voice'],
  'code': ['coding', 'programming', 'developer'],
  'coding': ['code', 'programming', 'developer'],
  'research': ['academic', 'paper', 'scholar'],
  'academic': ['research', 'paper', 'scholar'],
  'maker': ['generator', 'creator', 'builder'],
  'generator': ['generation', 'maker'],
  'generation': ['generator', 'generating'],
  'music': ['audio', 'sound', 'soundtrack'],
  'audio': ['music', 'sound'],
  'agent': ['agents', 'autonomous'],
  'agents': ['agent', 'autonomous'],
  'writing': ['writer', 'copywriting', 'content']
};

function getTermVariants(term) {
  const norm = normalizeText(term);
  const variants = new Set([norm]);
  if (SYNONYM_MAP[norm]) {
    SYNONYM_MAP[norm].forEach(s => variants.add(s));
  }
  return Array.from(variants);
}

// 3. Category Intent Keywords
const CATEGORY_INTENT_MAP = {
  'video': 'Video',
  'videos': 'Video',
  'code': 'Coding',
  'coding': 'Coding',
  'image': 'Image Generation',
  'images': 'Image Generation',
  'chat': 'AI Chat',
  'voice': 'Voice',
  'audio': 'Audio',
  'music': 'Audio',
  'writing': 'Writing',
  'write': 'Writing',
  'research': 'Research',
  'academic': 'Research',
  'agent': 'AI Agents',
  'agents': 'AI Agents',
  'marketing': 'Marketing',
  'design': 'Design',
  'productivity': 'Productivity',
  'education': 'Education',
  'business': 'Business'
};

const GENERIC_TOKENS = new Set([
  'ai', 'tool', 'tools', 'app', 'apps', 'platform', 'platforms', 'software', 'solution', 'solutions', 'web', 'online'
]);

// Build inverted document frequency index
const docFreq = new Map();
const N = rawTools.length;

const indexedTools = rawTools.map(tool => {
  const bestForArr = Array.isArray(tool.bestFor) ? tool.bestFor : (typeof tool.bestFor === 'string' ? [tool.bestFor] : []);
  const tagsArr = Array.isArray(tool.tags) ? tool.tags : [];
  const featuresArr = Array.isArray(tool.features) ? tool.features : [];

  const normName = normalizeText(tool.name);
  const alphaNumName = normalizeAlphaNum(tool.name);
  const normTagline = normalizeText(tool.tagline || '');
  const normCategory = normalizeText(tool.category || '');
  const normDesc = normalizeText(tool.description || '');
  const normTags = tagsArr.map(t => normalizeText(t));
  const normFeatures = featuresArr.map(f => normalizeText(f));
  const normBestFor = bestForArr.map(b => normalizeText(b));

  const allTokens = new Set([
    ...normName.split(' '),
    ...normTagline.split(' '),
    ...normCategory.split(' '),
    ...normDesc.split(' '),
    ...normTags.flatMap(t => t.split(' ')),
    ...normFeatures.flatMap(f => f.split(' ')),
    ...normBestFor.flatMap(b => b.split(' '))
  ]);

  allTokens.forEach(tok => {
    if (tok) docFreq.set(tok, (docFreq.get(tok) || 0) + 1);
  });

  return {
    ...tool,
    bestFor: bestForArr,
    tags: tagsArr,
    features: featuresArr,
    _normName: normName,
    _alphaNumName: alphaNumName,
    _normTagline: normTagline,
    _normCategory: normCategory,
    _normDesc: normDesc,
    _normTags: normTags,
    _normFeatures: normFeatures,
    _normBestFor: normBestFor,
    _searchDoc: [
      normName,
      normTagline,
      normCategory,
      normDesc,
      normTags.join(' '),
      normFeatures.join(' '),
      normBestFor.join(' ')
    ].join(' ')
  };
});

function getTokenIDF(token) {
  if (GENERIC_TOKENS.has(token)) return 0.2;
  const df = docFreq.get(token) || 1;
  return Math.log(1 + N / (1 + df));
}

// Centralized Relevance Calculation
function calculateToolRelevance(tool, rawQuery, tokens) {
  const normQuery = normalizeText(rawQuery);
  const alphaNumQuery = normalizeAlphaNum(rawQuery);
  let score = 0;

  // 1. Exact Full Tool Name Matches (highest priority)
  if (tool._normName === normQuery) {
    score += 50000;
  } else if (tool._alphaNumName === alphaNumQuery) {
    score += 45000;
  } else if (tool._normName.startsWith(normQuery)) {
    score += 25000;
  } else if (tool._normName.includes(normQuery)) {
    score += 15000;
  }

  // 2. Phrase Matching across fields
  if (tokens.length >= 2) {
    // If the full normalized query appears as a phrase
    if (tool._normName.includes(normQuery)) {
      score += 12000;
    }
    if (tool._normTagline.includes(normQuery)) {
      score += 6000;
    }
    if (tool._normTags.some(t => t.includes(normQuery))) {
      score += 5000;
    }
    if (tool._normBestFor.some(b => b.includes(normQuery))) {
      score += 4000;
    }
    if (tool._normFeatures.some(f => f.includes(normQuery))) {
      score += 3000;
    }
    if (tool._normDesc.includes(normQuery)) {
      score += 2000;
    }

    // Also check non-generic sub-phrases and their synonym variants (e.g. "video editor" & "video editing")
    const nonGenericTokens = tokens.filter(t => !GENERIC_TOKENS.has(t));
    if (nonGenericTokens.length >= 2) {
      const phraseVariants = [];
      const v0 = getTermVariants(nonGenericTokens[0]);
      const v1 = getTermVariants(nonGenericTokens[1]);
      for (const a of v0) {
        for (const b of v1) {
          phraseVariants.push(`${a} ${b}`);
        }
      }

      for (const p of phraseVariants) {
        if (tool._normName.includes(p)) {
          score += 15000;
        }
        if (tool._normTagline.includes(p)) {
          score += 8000;
        }
        if (tool._normTags.some(t => t === p || t.includes(p))) {
          score += 7000;
        }
        if (tool._normBestFor.some(b => b.includes(p))) {
          score += 6000;
        }
        if (tool._normFeatures.some(f => f.includes(p))) {
          score += 5000;
        }
        if (tool._normDesc.includes(p)) {
          score += 4000;
        }
      }
    }
  }

  // 3. Category Intent Boost
  tokens.forEach(tok => {
    const intendedCategory = CATEGORY_INTENT_MAP[tok];
    if (intendedCategory && tool.category === intendedCategory) {
      score += 4000;
    }
  });

  // 3b. Name Contradiction Penalty
  // If query is about video and not image/photo, but tool name contains image/photo:
  if (tokens.includes('video') && !tokens.includes('image') && !tokens.includes('photo') && !tokens.includes('images')) {
    if (tool._normName.includes('image') || tool._normName.includes('images') || tool._normName.includes('photo') || tool._normName.includes('photos')) {
      score -= 15000;
    }
  }

  // 4. Token-level weighted scoring with IDF and synonyms
  let matchedTokenCount = 0;

  tokens.forEach(tok => {
    const variants = getTermVariants(tok);
    const idf = getTokenIDF(tok);
    let tokMatched = false;

    // Check each field with field weights
    for (const v of variants) {
      let fieldScore = 0;

      // Exact name token
      const nameWords = tool._normName.split(' ');
      if (nameWords.includes(v)) {
        fieldScore = Math.max(fieldScore, 2000);
      } else if (tool._normName.startsWith(v)) {
        fieldScore = Math.max(fieldScore, 1200);
      } else if (tool._normName.includes(v)) {
        fieldScore = Math.max(fieldScore, 800);
      }

      // Tagline
      if (tool._normTagline.includes(v)) {
        fieldScore = Math.max(fieldScore, 500);
      }

      // Category
      if (tool._normCategory.includes(v)) {
        fieldScore = Math.max(fieldScore, 1000);
      }

      // Tags
      if (tool._normTags.some(t => t === v)) {
        fieldScore = Math.max(fieldScore, 900);
      } else if (tool._normTags.some(t => t.includes(v))) {
        fieldScore = Math.max(fieldScore, 600);
      }

      // BestFor
      if (tool._normBestFor.some(b => b.includes(v))) {
        fieldScore = Math.max(fieldScore, 400);
      }

      // Features
      if (tool._normFeatures.some(f => f.includes(v))) {
        fieldScore = Math.max(fieldScore, 300);
      }

      // Description
      if (tool._normDesc.includes(v)) {
        fieldScore = Math.max(fieldScore, 150);
      }

      if (fieldScore > 0) {
        score += fieldScore * idf;
        tokMatched = true;
        break;
      }
    }

    if (tokMatched) {
      matchedTokenCount++;
    }
  });

  // 5. Token Coverage Bonus
  const coverageRatio = matchedTokenCount / tokens.length;
  if (tokens.length > 1) {
    if (coverageRatio === 1) {
      score += 5000; // All tokens covered
    } else {
      score += coverageRatio * 2000;
    }
  }

  return Math.round(score);
}

function runSearch(query) {
  const normQuery = normalizeText(query);
  const tokens = normQuery.split(' ').filter(Boolean);

  let list = indexedTools.filter(tool => {
    return tokens.every(tok => {
      const variants = getTermVariants(tok);
      return variants.some(v => tool._searchDoc.includes(v));
    });
  });

  list.forEach(tool => {
    tool._score = calculateToolRelevance(tool, query, tokens);
  });

  list.sort((a, b) => (b._score - a._score) || (b.rating - a.rating) || ((b.reviewCount || 0) - (a.reviewCount || 0)) || a.name.localeCompare(b.name));
  return list;
}

// Test the 15 required queries
const testQueries = [
  'ChatGPT',
  'coding assistant',
  'AI video editor',
  'image generator',
  'voice cloning',
  'academic research',
  'AI writing',
  'marketing automation',
  'presentation maker',
  'music generation',
  'AI agents',
  'photo editor',
  'code',
  'video',
  'research'
];

console.log('\n--- TOP 10 RESULTS FOR "AI video editor" ---');
const videoRes = runSearch('AI video editor');
videoRes.slice(0, 10).forEach((item, idx) => {
  console.log(`${idx + 1}. ${item.name.padEnd(25)} | Cat: ${item.category.padEnd(12)} | Score: ${item._score}`);
  console.log(`   Desc: ${item.description.slice(0, 80)}`);
  console.log(`   Tagline: ${item.tagline}`);
});
