/**
 * AIVault Phase 4A.1 Search & Discovery Engine Benchmark (Optimized)
 */

import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT_DIR = process.cwd();
const dataPath = path.join(ROOT_DIR, 'data', 'ai-tools.js');

if (!fs.existsSync(dataPath)) {
  console.error('ai-tools.js not found at', dataPath);
  process.exit(1);
}

// Read raw file and evaluate into sandbox
const dataCode = fs.readFileSync(dataPath, 'utf-8');
const window = {};
const loadFunc = new Function('window', dataCode);
loadFunc(window);

const rawTools = window.AI_TOOLS_DATA || [];
const categories = window.AI_CATEGORIES || [];

console.log(`[Benchmark] Loaded ${rawTools.length} tools and ${categories.length} categories.`);

// 1. Normalization Helpers
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

// 2. Curated Term Synonyms Map
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

// 3. Category Intent Mapping
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

// Build index
const tagCounts = new Map();
const docFreq = new Map();
const N = rawTools.length;
const t0Index = performance.now();

const indexedTools = rawTools.map(tool => {
  const bestForArr = Array.isArray(tool.bestFor) ? tool.bestFor : (typeof tool.bestFor === 'string' ? [tool.bestFor] : []);
  const tagsArr = Array.isArray(tool.tags) ? tool.tags : [];
  const featuresArr = Array.isArray(tool.features) ? tool.features : [];

  tagsArr.forEach(t => {
    const cleanTag = (typeof t === 'string' ? t.trim() : '');
    if (cleanTag) {
      tagCounts.set(cleanTag, (tagCounts.get(cleanTag) || 0) + 1);
    }
  });

  const lowerName = (tool.name || '').toLowerCase();
  const lowerCategory = (tool.category || '').toLowerCase();
  const lowerDesc = (tool.description || '').toLowerCase();
  const lowerTagline = (tool.tagline || '').toLowerCase();
  const lowerTags = tagsArr.map(t => (typeof t === 'string' ? t.toLowerCase() : ''));
  const lowerFeatures = featuresArr.map(f => (typeof f === 'string' ? f.toLowerCase() : ''));
  const lowerBestFor = bestForArr.map(b => (typeof b === 'string' ? b.toLowerCase() : ''));

  const normName = normalizeText(tool.name);
  const alphaNumName = normalizeAlphaNum(tool.name);
  const normTagline = normalizeText(tool.tagline || '');
  const normCategory = normalizeText(tool.category || '');
  const normDesc = normalizeText(tool.description || '');
  const normTags = tagsArr.map(t => normalizeText(t));
  const normFeatures = featuresArr.map(f => normalizeText(f));
  const normBestFor = bestForArr.map(b => normalizeText(b));

  const normNameWords = normName.split(' ');
  const allTokens = new Set([
    ...normNameWords,
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

  const searchDoc = [
    normName,
    normTagline,
    normCategory,
    normDesc,
    normTags.join(' '),
    normFeatures.join(' '),
    normBestFor.join(' ')
  ].join(' ');

  return {
    ...tool,
    bestFor: bestForArr,
    tags: tagsArr,
    features: featuresArr,
    reviewCount: typeof tool.reviewCount === 'number' ? tool.reviewCount : 100,
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
});

const t1Index = performance.now();
const indexTime = (t1Index - t0Index).toFixed(2);
console.log(`[Benchmark] Index pre-computation took ${indexTime} ms across ${indexedTools.length} tools.`);

function getTokenIDF(token) {
  if (GENERIC_TOKENS.has(token)) return 0.2;
  const df = docFreq.get(token) || 1;
  return Math.log(1 + N / (1 + df));
}

// Pre-computed query structure
function prepareQueryContext(rawQuery) {
  const normQuery = normalizeText(rawQuery);
  const alphaNumQuery = normalizeAlphaNum(rawQuery);
  const tokens = normQuery.split(' ').filter(Boolean);

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

  const hasVideo = tokens.includes('video');
  const hasImageOrPhoto = tokens.includes('image') || tokens.includes('photo') || tokens.includes('images');
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

// Scoring algorithm
function calculateToolRelevance(tool, queryCtx) {
  const { normQuery, alphaNumQuery, tokens, tokenData, phraseVariants, checkVideoContradiction } = queryCtx;
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

    if (phraseVariants.length > 0) {
      for (const p of phraseVariants) {
        if (!tool._searchDoc.includes(p)) continue;
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
  tokenData.forEach(td => {
    if (td.intendedCategory && tool.category === td.intendedCategory) {
      score += 4000;
    }
  });

  // 3b. Name Contradiction Penalty
  if (checkVideoContradiction) {
    if (tool._normName.includes('image') || tool._normName.includes('images') || tool._normName.includes('photo') || tool._normName.includes('photos')) {
      score -= 15000;
    }
  }

  // 4. Token-level weighted scoring with IDF and synonyms
  let matchedTokenCount = 0;

  for (const td of tokenData) {
    let tokMatched = false;

    for (const v of td.variants) {
      let fieldScore = 0;

      if (tool._normNameWords.includes(v)) {
        fieldScore = 2000;
      } else if (tool._normName.startsWith(v)) {
        fieldScore = 1200;
      } else if (tool._normName.includes(v)) {
        fieldScore = 800;
      }

      if (tool._normTagline.includes(v)) {
        fieldScore = Math.max(fieldScore, 500);
      }

      if (tool._normCategory.includes(v)) {
        fieldScore = Math.max(fieldScore, 1000);
      }

      if (tool._normTags.some(t => t === v)) {
        fieldScore = Math.max(fieldScore, 900);
      } else if (tool._normTags.some(t => t.includes(v))) {
        fieldScore = Math.max(fieldScore, 600);
      }

      if (tool._normBestFor.some(b => b.includes(v))) {
        fieldScore = Math.max(fieldScore, 400);
      }

      if (tool._normFeatures.some(f => f.includes(v))) {
        fieldScore = Math.max(fieldScore, 300);
      }

      if (tool._normDesc.includes(v)) {
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
      score += 5000;
    } else {
      score += coverageRatio * 2000;
    }
  }

  return Math.round(score);
}

function runSearch(query) {
  const queryCtx = prepareQueryContext(query);
  const { tokens, tokenData } = queryCtx;

  let list = indexedTools.filter(tool => {
    return tokenData.every(td => {
      return td.variants.some(v => tool._searchDoc.includes(v));
    });
  });

  list.forEach(tool => {
    tool._score = calculateToolRelevance(tool, queryCtx);
  });

  list.sort((a, b) => (b._score - a._score) || (b.rating - a.rating) || ((b.reviewCount || 0) - (a.reviewCount || 0)) || a.name.localeCompare(b.name));
  return list;
}

// 15 Required queries to benchmark
const queries = [
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

console.log('\n==================================================');
console.log('SEARCH BENCHMARK EXECUTION (100 ITERATIONS EACH)');
console.log('==================================================\n');

const results = [];

for (const query of queries) {
  // Warmup
  for (let i = 0; i < 10; i++) {
    runSearch(query);
  }

  const iterations = 100;
  const start = performance.now();
  let searchResult = null;
  for (let i = 0; i < iterations; i++) {
    searchResult = runSearch(query);
  }
  const end = performance.now();
  const avgLatency = (end - start) / iterations;

  const topTool = searchResult.length > 0 ? `${searchResult[0].name} (Score: ${searchResult[0]._score}, Cat: ${searchResult[0].category})` : 'None';
  const top5 = searchResult.slice(0, 5).map(t => `${t.name} (${t._score})`).join(', ');

  results.push({
    query,
    count: searchResult.length,
    topTool,
    top5,
    latencyMs: avgLatency.toFixed(3)
  });

  console.log(`Query: "${query.padEnd(22)}" | Matches: ${String(searchResult.length).padStart(4)} | Avg Latency: ${avgLatency.toFixed(3).padStart(6)} ms`);
  console.log(`   Top 5: ${top5}\n`);
}

console.log('==================================================');
console.log('BENCHMARK SUMMARY');
console.log('==================================================');
const overallAvg = (results.reduce((acc, r) => acc + parseFloat(r.latencyMs), 0) / results.length).toFixed(3);
console.log(`Overall Average Latency: ${overallAvg} ms across ${indexedTools.length} tools`);
console.log(`Sub-5ms requirement met: ${parseFloat(overallAvg) < 5 ? 'YES' : 'NO'}`);
console.log('==================================================\n');

if (parseFloat(overallAvg) >= 5) {
  console.error('[FAIL] Latency exceeded 5ms threshold');
  process.exit(1);
}
