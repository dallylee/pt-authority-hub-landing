# SPEC: Authority Hub Landing Page (Module A)

## Objective
Build a mobile-first landing page that converts social traffic into qualified leads for a premium personal training offer, with an optional “Sync My Stats” upload that promises a free 30-day Performance Audit delivered within 24 hours.

Source spec: “Personal Trainer Landing Page Specs.docx”.

## In Scope (v0 planning + scaffold)
- Single-page landing site with section skeletons matching the spec.
- Multi-step intake quiz embedded via a third-party form tool (Tally), placeholder URL until configured.
- Optional “Sync My Stats” upload handled by the same form tool (manual PT audit initially).
- Reviews/social proof section placeholder with integration TODO.
- “Live Spots Remaining” displayed from a local JSON file.
- robots.txt present and valid.
- Baseline responsive layout, semantic HTML, accessible structure.

## Out of Scope (explicit non-goals for v0)
- No authentication.
- No PT portal shell.
- No booking system.
- No payments.
- No AI-generated audit automation.
- No complex animations or design polish (added later).

## Primary User Flow
1. User lands on page (mobile-first).
2. User sees positioning + CTA.
3. User completes qualifying quiz (embedded).
4. Optional: user uploads last 30-day summary (Apple Watch/Oura/etc).
5. User submits, sees confirmation.
6. PT receives submission and delivers audit manually within 24 hours.

## Content/Section Map (placeholders acceptable in v0)
- Hero: headline, subhead, primary CTA
- Trust: logos row (placeholder)
- Mechanism icons row (placeholder)
- Pain & Value Bridge section (placeholder)
- Quiz embed section (Tally embed TODO)
- Sync My Stats section: includes 24h promise, consent checkbox language, non-medical disclaimer
- Reviews/social proof feed section (widget TODO, plan to lazy-load)
- Live Spots Remaining ticker (reads from /public/spots.json)
- FAQ section
- Footer

## Data Handling (v0)
- Uploads are stored/handled by the form provider.
- Copy must state: used only for the audit, deleted within 30 days.
- Consent checkbox required when upload is provided.
- Non-medical disclaimer included.

## Acceptance Criteria (v0 PASS)
- Repo contains SPEC.md and AGENTS.md at root.
- `npm install` succeeds (once scaffold exists).
- `npm run dev` starts and homepage renders without console errors (once scaffold exists).
- `npm run build` succeeds (once scaffold exists).
- Homepage contains all sections listed in Content/Section Map (as labelled blocks, once scaffold exists).
- Spots remaining renders from `/public/spots.json` (once scaffold exists).
- `public/robots.txt` exists and is syntactically valid (once scaffold exists).

## Milestones and Restore Tags
- M1: Planning anchor created (SPEC.md + AGENTS.md) -> tag restore/m1-planning
- M2: Repo scaffold + Astro + Tailwind + section skeleton -> tag restore/m2-scaffold
- M3: Embed quiz/upload provider + minimal tracking placeholders -> tag restore/m3-forms
- M4: Deploy to Cloudflare Pages + sanity checks -> tag restore/m4-deploy
