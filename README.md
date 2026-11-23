# Code Intelligence

Standalone **Code Intelligence (CINT)** product export.

This repository is the CINT app — not Replica builder chrome, not FOC.

## Layout

- `frontend/` — published UI (HTML / CSS / JS)
- `backend/` — CINT API route sources (`/api/projects/:id/cint/*`)
- `json/` — product manifests and sealed project snapshots
- `src/lib/cint`, `src/core/codeIntelligence` — product runtime owners

Pack: `CINT-PACK-1.0`
