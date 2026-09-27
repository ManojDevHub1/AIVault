# DATA-SOURCES.md — Provenance, Licensing & Attribution

This document outlines the data sources, licensing compliance, and confidence tiers for all 3,938 AI tools cataloged in AIVault.

---

## 1. Zero-Fabrication Directive

AIVault strictly adheres to the principle of **Zero Synthetic Data / Zero Hallucinated Products**. Every entry in the directory originates from verified open-source intelligence and real-world software releases.

---

## 2. Source Lineage Breakdown

The production catalog of **3,938 tools** is compiled from three authoritative sources:

| Source | Record Count | License | Provenance & Coverage |
|---|---|---|---|
| **AIVault Curated Core** | 176 | Proprietary / CC0 | Hand-curated seed directory with verified community review scores, non-zero star ratings, custom SVG logos, and verified production endpoints. |
| **`tioraicom/ai-tools-dataset`** | 748 | CC BY 4.0 | Individually verified AI tools. Provides verified names, official URLs, verified category taxonomies, confirmed pricing models, and API/open-source flags. Every URL was validated over HTTP before release. |
| **`LichAmnesia/awesome-ai-tools-dataset`** | 3,014 *(after deduplication)* | GPL-3.0 | Broad community AI ecosystem catalog providing tool names, active website destinations, and concise functional summaries. |

---

## 3. Metadata Confidence Tiers (`data/ai-tools-import-metadata.json`)

To preserve absolute intellectual honesty, AIVault tracks the exact confidence level of every imported record in `data/ai-tools-import-metadata.json`.

### Category Classification Confidence (`categoryConfidence`)
1. **`hand-curated` (176 tools):** Hand-reviewed and verified by the core AIVault engineering team.
2. **`mapped-from-source-category` (748 tools):** Directly mapped from `tioraicom`'s verified category taxonomy.
3. **`auto-classified-keyword` (~2,200 tools):** Mapped using high-precision keyword heuristics against verified feature descriptions.
4. **`auto-classified-fallback` (~814 tools):** Where no specific technical keyword was present, the tool was classified into `Business` as a neutral B2B default.

### Pricing Model Confidence (`pricingConfidence`)
1. **`verified` (924 tools):** Explicitly verified against official pricing documentation (free tier, freemium credits, or commercial enterprise licensing).
2. **`inferred` (42 tools):** Description explicitly referenced free tiers or paid licensing models.
3. **`inferred-default` (~2,972 tools):** Defaulted to `Freemium` (the statistically dominant model in AI SaaS) to satisfy strict schema validation without fabricating exact dollar amounts.

---

## 4. Exclusion & Deduplication Log (`data/excluded-records-log.json`)

During dataset normalization, 75 malformed or dead candidates were rejected:
- Missing tool name or official website destination.
- Descriptions shorter than 5 characters.
- Duplicate landing pages or affiliate re-directs (e.g. `airbrush-2`, `decor-ai`).

Full audit records are preserved in `data/excluded-records-log.json`.

---

## 5. Licensing & Attribution Notice

- Portions of this dataset incorporate records from **tioraicom/ai-tools-dataset**, licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
- Portions of this dataset incorporate records from **LichAmnesia/awesome-ai-tools-dataset**, licensed under the [GNU General Public License v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.en.html).
- The AIVault directory engine, layout shell, UI components, and indexing algorithms remain pure frontend-only vanilla web software.
