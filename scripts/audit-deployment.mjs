/**
 * AIVault Phase 5 — Static Deployment & Path Integrity Audit
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('==================================================');
console.log('AIVAULT PHASE 5 — STATIC DEPLOYMENT AUDIT');
console.log('==================================================\n');

let errors = 0;
let warnings = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    errors++;
  }
}

// 1. Core Files
const coreFiles = [
  'index.html',
  '404.html',
  'style.css',
  'script.js',
  'data/ai-tools.js',
  'compare/index.html',
  'compare/compare.js',
  'collections/index.html',
  'collections/collections.js',
  'sitemap.xml',
  'robots.txt',
  'assets/logo/favicon.svg'
];

console.log('1. Auditing Core Files:');
for (const rel of coreFiles) {
  const full = path.join(ROOT_DIR, rel);
  assert(fs.existsSync(full) && fs.statSync(full).isFile(), `Core file exists: ${rel}`);
}

// 2. Directory Counts
console.log('\n2. Auditing Static Directory Counts:');
const toolsDir = path.join(ROOT_DIR, 'tools');
const toolDirs = fs.existsSync(toolsDir) ? fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory()) : [];
assert(toolDirs.length === 3938, `Exactly 3,938 tool directories exist (Found: ${toolDirs.length})`);

const catDir = path.join(ROOT_DIR, 'category');
const catDirs = fs.existsSync(catDir) ? fs.readdirSync(catDir).filter(f => fs.statSync(path.join(catDir, f)).isDirectory()) : [];
assert(catDirs.length === 14, `Exactly 14 category directories exist (Found: ${catDirs.length})`);

// 3. Sitemap & Robots
console.log('\n3. Auditing Sitemap & Robots:');
const sitemapContent = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8');
const sitemapUrls = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];
assert(sitemapUrls.length === 3953, `sitemap.xml has exactly 3,953 URLs (Found: ${sitemapUrls.length})`);

const robotsContent = fs.readFileSync(path.join(ROOT_DIR, 'robots.txt'), 'utf8');
assert(robotsContent.includes('Allow: /'), 'robots.txt allows crawling (Allow: /)');
assert(robotsContent.includes('sitemap.xml'), 'robots.txt references sitemap.xml');

// 4. Asset Path & Internal Link Resolution
console.log('\n4. Auditing Asset Paths & Internal Links on Representative Pages:');
const samplePages = [
  'index.html',
  '404.html',
  'compare/index.html',
  'collections/index.html',
  'category/coding/index.html',
  'category/ai-chat/index.html',
  'tools/chatgpt/index.html',
  'tools/cursor/index.html',
  'tools/midjourney/index.html'
];

let checkedAssets = 0;
let checkedLinks = 0;

for (const pageRel of samplePages) {
  const pagePath = path.join(ROOT_DIR, pageRel);
  if (!fs.existsSync(pagePath)) {
    assert(false, `Page ${pageRel} exists for audit`);
    continue;
  }
  const pageDir = path.dirname(pagePath);
  const html = fs.readFileSync(pagePath, 'utf8');

  // Check CSS links
  const cssMatches = html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/gi);
  for (const match of cssMatches) {
    const assetRel = match[1];
    const resolved = path.resolve(pageDir, assetRel);
    assert(fs.existsSync(resolved), `[${pageRel}] CSS resolved: ${assetRel} -> ${path.relative(ROOT_DIR, resolved)}`);
    checkedAssets++;
  }

  // Check Favicon links
  const favMatches = html.matchAll(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/gi);
  for (const match of favMatches) {
    const assetRel = match[1];
    const resolved = path.resolve(pageDir, assetRel);
    assert(fs.existsSync(resolved), `[${pageRel}] Favicon resolved: ${assetRel} -> ${path.relative(ROOT_DIR, resolved)}`);
    checkedAssets++;
  }

  // Check Script tags
  const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
  for (const match of scriptMatches) {
    const assetRel = match[1];
    if (assetRel.startsWith('http')) continue;
    const resolved = path.resolve(pageDir, assetRel);
    assert(fs.existsSync(resolved), `[${pageRel}] Script resolved: ${assetRel} -> ${path.relative(ROOT_DIR, resolved)}`);
    checkedAssets++;
  }

  // Check internal href links (sample)
  const hrefMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
  for (const match of hrefMatches) {
    let href = match[1].split('#')[0].split('?')[0];
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href === '#') continue;
    
    let resolved = path.resolve(pageDir, href);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      resolved = path.join(resolved, 'index.html');
    }
    const exists = fs.existsSync(resolved);
    if (!exists) {
      assert(false, `[${pageRel}] Broken internal link: ${match[1]} -> ${path.relative(ROOT_DIR, resolved)}`);
    } else {
      checkedLinks++;
    }
  }
}
console.log(`Verified ${checkedAssets} asset paths and ${checkedLinks} internal links across sample pages.`);

// 5. Representative File Sizes
console.log('\n5. Representative Production File Sizes:');
const sizeFiles = [
  'index.html',
  '404.html',
  'style.css',
  'script.js',
  'data/ai-tools.js',
  'compare/index.html',
  'collections/index.html',
  'category/coding/index.html',
  'tools/chatgpt/index.html'
];
for (const f of sizeFiles) {
  const p = path.join(ROOT_DIR, f);
  if (fs.existsSync(p)) {
    const stats = fs.statSync(p);
    const kb = (stats.size / 1024).toFixed(1);
    console.log(`  - ${f.padEnd(30)} ${kb.padStart(8)} KB`);
  }
}

console.log('\n==================================================');
if (errors === 0) {
  console.log('AUDIT COMPLETE: ALL CHECKS PASSED (0 ERRORS)');
} else {
  console.error(`AUDIT COMPLETE: ${errors} ERRORS FOUND`);
}
console.log('==================================================\n');

process.exit(errors === 0 ? 0 : 1);
