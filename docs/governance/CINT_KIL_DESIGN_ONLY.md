# CINT Knowledge Intelligence Layer (KIL) — Phase E

**Status:** Phase E **complete** for K1→K6 in locked order (`CINT-KIL-1.0`).  
**Compose owner:** `src/core/codeIntelligence/codeIntelligenceKilBundle.ts`

## Purpose

Make every intelligence object addressable, catalogued, classifiable, and retrievable — without agent swarms or self-expanding registries.

## Object taxonomy

| Kind | ID prefix | Example |
|------|-----------|---------|
| Finding | `FND-` / `F-` | `F-DEAD-PUBLIC-SERVICE-WORKER-JS` |
| Evidence | `EVD-` / `E-` | `E-F-DEAD-…-1` |
| Remediation | `REM-` / `R-` | `R-F-BROKEN-VITE-CONFIGS-TS` |
| Analysis run | `RUN-` / `A-` | `A-mwoy53ge` |
| Dependency | `DEP-` | `DEP-radix-hover-card` |
| Artifact | `ART-` | export / PR / snapshot |
| Knowledge note | `KNW-` | curated explanation (read-only) |

## Naming rules

1. IDs are stable across re-analyze when content fingerprint matches; otherwise new ID + lifecycle link.
2. Human-readable titles never replace IDs in APIs or citations.
3. Prefixes are reserved; engines may not invent new prefixes without registry governance review.

## Lifecycle definitions (object status — Phase C)

- **Active** — current, queryable default  
- **NeedsReview** — trust Low or conflicting evidence  
- **Deprecated** — superseded; keep for history  
- **Archived** — retained, excluded from default search  

Provenance: **Engine** | **Human** | **Assistant-Proposed**  
Trust: **High** | **Medium** | **Low** (report field — never `honestLabel`)

## Phase E build order (locked)

```
K1 Identity ✅ → K2 Registry ✅ → K3 Classification ✅ → K5 Retrieval ✅ → K4 Relationships ✅ → K6 Knowledge UI ✅
```

Retrieval before Relationships is intentional.

### K1 Identity

- Owner: `codeIntelligenceObjectIdentity.ts` (`CINT-OID-1.0`)
- Prefixes: `F` / `E` / `R` / `A` / `DEP` / `ART` / `KNW` (+ aliases `FND`/`EVD`/`REM`/`RUN`)

### K2 Registry

- Owner: `codeIntelligenceObjectRegistry.ts` (`CINT-OR-1.0`)
- Catalog-only index; no auto-expansion

### K3 Classification

- Owner: `codeIntelligenceObjectClassification.ts` (`CINT-OC-1.0`)
- Deterministic rules only — **no LLM authority**

### K5 Retrieval

- Owner: `codeIntelligenceObjectRetrieval.ts` (`CINT-ORET-1.0`)
- Filter by id / kind / class / text / status / trust; Archived excluded by default

### K4 Relationships

- Owner: `codeIntelligenceObjectRelationships.ts` (`CINT-OREL-1.0`)
- Edges derived from sealed refs — not a graph DB

### K6 Knowledge UI

- Read-only panel on **Documentation** (`data-cint-kil`) — browse/search/inspect
- Runtime: `CINT-EE-1.54` paints from Analyze `result.kil`
- No edit/generate Knowledge Centre

## Still forbidden (Phase G / later)

- Agent swarms / auto-registry expansion  
- LLM as classification authority  
- Graph DB  
- Knowledge Centre edit/generate  
- Innovation / compression / self-evolving registries
