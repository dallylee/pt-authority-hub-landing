# M11 Dev Change Brief - Implementation Evidence

**Date:** 2026-01-13
**Status:** Completed
**Branch:** main (merged from agent/m11-dev-change-brief)
**Production URL:** https://pt-authority-hub-landing.pages.dev

## Summary of Changes

1.  **Hero Redesign:**
    - Replaced the right-side "dashboard mock" with the new `CoachIdentity` component.
    - Updated hero copy: "Get a personalised audit and next-step plan within 24 hours (business days)."
    - Tightened microcopy usage.

2.  **CTA Standardization:**
    - Standardized all primary CTAs to "Start Free Audit".
    - Added specific subtext to pricing cards (e.g., "Audit first, then enrol if it’s a fit").

3.  **Copy Clean-up (Compliance):**
    - Removed "Spots Remaining" section and script.
    - Removed incorrect technical claims ("bank-level encryption").
    - Updated disclaimer to "Prices subject to intake review and availability."
    - Standardized "2 minutes" phrasing.
    - Updated testimonials to remove unverified counts (unless fetched via API).

4.  **"What You Get" Section:**
    - Implemented a new section detailing the audit deliverables (Bottleneck, Next Step, Coaching Fit).
    - Included a visual "Sample Audit Summary" component.

5.  **Unified Tally Form:**
    - Replaced the two-form flow (Quiz + separate Stats Upload) with a single Unified Tally Form embedded on `/quiz`.
    - Integrated conditional upload logic support (via `PUBLIC_TALLY_AUDIT_FORM_ID`).
    - Deprecated `/upload` page (redirects to `/quiz`).
    - Removed "Stats/Upload" section from homepage, consolidating the call-to-action to the single audit flow.

6.  **UI & Accessibility:**
    - Enforced minimum 16px body font size.
    - Increased opacity of muted text for better legibility on mobile.
    - Verified neon green usage as accent only.

## Automated QA Results

All checks in `scripts/qa.mjs` PASSED.

- [x] Hero: Dashboard Mock removed
- [x] Hero: Coach Identity present
- [x] CTA: Label Consistency
- [x] Copy: Sync language removed
- [x] Copy: Bank-level encryption removed
- [x] Copy: Clinical review removed
- [x] Copy: Slack monitoring removed
- [x] Copy: Spots remaining section removed

## Deployment Status

- **Build:** `npm run build` completed successfully.
- **Deploy:** `wrangler pages deploy` strictly deployed to `pt-authority-hub-landing`.
- **Live Verification:** Verified core text "Start Free Audit" on production site.

## Next Steps

- **Tally Config:** Ensure the new Tally form (ID: `PUBLIC_TALLY_AUDIT_FORM_ID`) is fully configured with logical jumps for the upload step in the Tally dashboard.
