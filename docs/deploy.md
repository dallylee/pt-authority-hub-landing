# Deploy Guide - PT Authority Hub Landing

## Prerequisites

- Node.js v20+
- npm v10+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare Pages access to `pt-authority-hub-landing` project

## Environment

- **Project**: pt-authority-hub-landing
- **Production URL**: https://pt-authority-hub-landing.pages.dev
- **D1 Database**: pt-authority-hub-db (ID: 324ee536-b279-4798-95d3-b8b24940a1d5)
- **R2 Bucket**: pt-authority-hub-audit-uploads
- **KV Namespace**: SESSION (ID: b793cdaf51734b0e9268328a86e54264)

## Secrets (Set via CLI)

```powershell
npx wrangler pages secret put RESEND_API_KEY --project-name pt-authority-hub-landing
npx wrangler pages secret put DOWNLOAD_TOKEN_SECRET --project-name pt-authority-hub-landing
```

## Build and Deploy

### Quick Deploy (Windows PowerShell)

```powershell
# Navigate to project
cd C:\PROJECTS\pt-authority-hub-landing

# Install dependencies (if changed)
npm ci

# Build
npm run build

# Deploy to production
npx wrangler pages deploy ./dist --project-name pt-authority-hub-landing --branch=main
```

### With Tail Logs (Debugging)

```powershell
# In Terminal 1: Start log tail
npx wrangler pages deployment tail --project-name pt-authority-hub-landing

# In Terminal 2: Deploy
npx wrangler pages deploy ./dist --project-name pt-authority-hub-landing --branch=main
```

## D1 Migrations

When adding new columns, run migrations remotely:

```powershell
# Migrations directory: migrations/

# Example: Apply all pending migrations
npx wrangler d1 execute pt-authority-hub-db --remote --file=migrations/0002_bottleneck_reasons.sql --yes
npx wrangler d1 execute pt-authority-hub-db --remote --file=migrations/0003_analysis_workflow.sql --yes
```

## Verification Checklist

After deployment, verify these routes:

| Route | Expected Behavior |
|-------|------------------|
| `/quiz` | Quiz page loads (not homepage) |
| `/quiz/` | Quiz page loads (trailing slash) |
| `/pt/login` | Login page, not [object Object] |
| `/pt` | Lead inbox with real data |
| `/pt/leads/:id` | Lead detail with bottleneck reasons |
| `/api/leads/ingest` | POST returns `{ ok: true }` |
| `/api/pt/leads` | GET returns leads array |

### Route Test Commands

```powershell
# Test quiz route
$r = Invoke-WebRequest -Uri "https://pt-authority-hub-landing.pages.dev/quiz/" -UseBasicParsing
$r.Content | Select-String -Pattern "Free Performance Audit"

# Test API health
Invoke-RestMethod -Uri "https://pt-authority-hub-landing.pages.dev/api/spots"
```

## Config Files

- **wrangler.toml**: Source of truth for bindings and env vars
- **public/_routes.json**: SSR route patterns (include trailing slashes)
- **astro.config.mjs**: Astro/Cloudflare adapter config
