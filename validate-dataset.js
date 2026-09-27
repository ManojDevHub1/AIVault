#!/usr/bin/env node
/**
 * AIVault dataset validator
 * Zero dependencies — pure Node.js. Run with: node validate-dataset.js [path-to-json]
 *
 * Checks every record against the AIVault schema (see docs/DATA-STRUCTURE.md):
 *   - unique id
 *   - unique product URL (domain-level identity)
 *   - valid name
 *   - canonical category (one of the 14 approved values)
 *   - valid pricing (Free | Freemium | Paid)
 *   - rating in [0, 5]
 *   - reviewCount >= 0
 *   - non-empty description
 *   - tags / features / bestFor are non-empty arrays
 *   - url is a valid https:// URL
 *
 * Exits with a non-zero status code if any record fails validation.
 */

const fs = require('fs');
const path = require('path');

const CANONICAL_CATEGORIES = [
  "AI Chat", "Image Generation", "Video", "Writing", "Coding", "Audio",
  "Business", "Research", "Education", "Productivity", "AI Agents",
  "Marketing", "Voice", "Design"
];

const VALID_PRICING = ["Free", "Freemium", "Paid"];
const SHARED_HOSTS = new Set(['github.com', 'huggingface.co', 'gitlab.com', 'google.com', 'microsoft.com']);

function normalizeDomain(url) {
  try {
    const u = new URL(url);
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    if (SHARED_HOSTS.has(host)) {
      return host + u.pathname.toLowerCase().replace(/\/+$/, '');
    }
    return host;
  } catch (e) {
    return null;
  }
}

function validate(records) {
  const errors = [];
  const idsSeen = new Set();
  const domainsSeen = new Map();

  if (!Array.isArray(records)) {
    return ["Top-level JSON is not an array."];
  }

  records.forEach((r, i) => {
    const where = `[#${i}] ${r && r.name ? r.name : '(unnamed)'}`;

    if (!r.id || typeof r.id !== 'string') {
      errors.push(`${where}: missing or invalid id`);
    } else if (idsSeen.has(r.id)) {
      errors.push(`${where}: duplicate id "${r.id}"`);
    } else {
      idsSeen.add(r.id);
    }

    if (!r.name || typeof r.name !== 'string' || !r.name.trim()) {
      errors.push(`${where}: missing or invalid name`);
    }

    if (!CANONICAL_CATEGORIES.includes(r.category)) {
      errors.push(`${where}: invalid category "${r.category}"`);
    }

    if (!VALID_PRICING.includes(r.pricing)) {
      errors.push(`${where}: invalid pricing "${r.pricing}"`);
    }

    if (typeof r.rating !== 'number' || r.rating < 0 || r.rating > 5) {
      errors.push(`${where}: invalid rating "${r.rating}"`);
    }

    if (typeof r.reviewCount !== 'number' || r.reviewCount < 0) {
      errors.push(`${where}: invalid reviewCount "${r.reviewCount}"`);
    }

    if (!r.description || typeof r.description !== 'string' || r.description.length < 5) {
      errors.push(`${where}: missing or too-short description`);
    }

    for (const field of ['tags', 'features', 'bestFor']) {
      if (!Array.isArray(r[field]) || r[field].length === 0) {
        errors.push(`${where}: ${field} must be a non-empty array`);
      }
    }

    if (typeof r.url !== 'string' || !r.url.startsWith('https://')) {
      errors.push(`${where}: url must be a valid https:// URL`);
    } else {
      const domain = normalizeDomain(r.url);
      if (!domain) {
        errors.push(`${where}: could not parse url "${r.url}"`);
      } else if (domainsSeen.has(domain)) {
        errors.push(`${where}: duplicate product domain "${domain}" (also used by ${domainsSeen.get(domain)})`);
      } else {
        domainsSeen.set(domain, r.name);
      }
    }

    if (typeof r.featured !== 'boolean') errors.push(`${where}: featured must be boolean`);
    if (typeof r.trending !== 'boolean') errors.push(`${where}: trending must be boolean`);
    if (!r.dateAdded || !/^\d{4}-\d{2}-\d{2}$/.test(r.dateAdded)) {
      errors.push(`${where}: dateAdded must be YYYY-MM-DD`);
    }
  });

  return errors;
}

function loadRecords(file) {
  const content = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.js')) {
    const vm = require('vm');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(content, sandbox);
    return sandbox.window.AI_TOOLS_DATA || sandbox.AI_TOOLS_DATA;
  }
  return JSON.parse(content);
}

function main() {
  const file = process.argv[2] || (fs.existsSync('data/ai-tools.js') ? 'data/ai-tools.js' : path.join(__dirname, 'data/ai-tools-dataset.json'));
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  const records = loadRecords(file);
  const errors = validate(records);

  const catCounts = {};
  for (const c of CANONICAL_CATEGORIES) catCounts[c] = 0;
  for (const r of records) {
    if (catCounts[r.category] !== undefined) catCounts[r.category]++;
  }

  console.log(`Loaded ${records.length} records from ${file}`);
  console.log(`Validation errors: ${errors.length}`);
  if (errors.length) {
    errors.slice(0, 50).forEach(e => console.log('  ✗ ' + e));
    if (errors.length > 50) console.log(`  ...and ${errors.length - 50} more`);
  }
  console.log('\nCategory counts:');
  for (const c of CANONICAL_CATEGORIES) {
    console.log(`  ${c.padEnd(20)} ${catCounts[c]}`);
  }

  process.exit(errors.length ? 1 : 0);
}

main();
