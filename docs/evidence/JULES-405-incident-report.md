Root cause: POST /api/leads/ingest was returning 405 because the route was not handled by the Astro worker and was likely hitting static asset rules or missing from routing configuration, while existing Pages Functions were either not deploying correctly or being shadowed.
Fix summary: Migrated the ingestion logic from Pages Functions to a native Astro API route (src/pages/api/leads/ingest.ts), ensured public/_routes.json explicitly includes /api/* to route traffic to the Astro worker.
Files changed:
- Created public/_routes.json
- Created src/pages/api/leads/ingest.ts
- Deleted functions/api/leads/ingest.ts
Build verification: npm run build succeeded. dist/_routes.json contains correct routing rules.
Note: Full end-to-end verification requires deployment to the production environment.
