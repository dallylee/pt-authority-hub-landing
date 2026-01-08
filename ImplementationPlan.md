# Implementation Plan: Authority Hub Landing Page

## Goal

Build a mobile-first landing page that converts social traffic into qualified leads for a premium personal training offer. The page includes a multi-step intake quiz and optional health data upload ("Sync My Stats"), with qualified leads receiving a free 30-day Performance Audit within 24 hours.

This plan delivers the scaffolded landing page incrementally through gated milestones with explicit PASS/FAIL criteria and restore points.

---

## User Review Required

> [!WARNING]
> **Hard Stop Gate After M1b**
> 
> Do NOT proceed to M2 (scaffold) until this plan and TaskList.md have been explicitly approved by the user. Any attempt to scaffold the Astro project before approval will violate the constraint and require rollback to `restore/m1b-planning-artefacts`.

> [!IMPORTANT]
> **Deployment Target**
> 
> The production deployment will use **Cloudflare Pages** (free tier, git-based deployment). This choice is to avoid vendor lock-in while maintaining simplicity. Alternative: Netlify or Vercel can be substituted if Cloudflare is not suitable.

> [!IMPORTANT]
> **Third-Party Form Provider**
> 
> Quiz and upload forms will be handled by **Tally** (embedded iframes). The PT will configure the Tally forms separately; placeholders will be used until real URLs are provided.

---

## Technology Stack (Minimum Viable)

### Core Framework
- **Astro 5.x** (static site generator, excellent for SEO and performance)
- **Tailwind CSS 4.x** (utility-first, mobile-first)
- **TypeScript** (type safety for config and data handling)

### Rationale
- Astro: zero-JS by default, optimal for a content-focused landing page
- Tailwind: rapid iteration, minimal custom CSS
- Static output: no server required, deploy anywhere

### Quiz/Upload Forms
- **Tally** embeds (iframe integration)
- Data submission handled entirely by Tally
- No custom backend required in v0

### Reviews Widget
- Placeholder section in M2-M3
- Integration planned for M5 (lazy-load for performance)
- Options: Trustpilot widget, Google Reviews embed, or custom carousel

### Deploy Target
- **Cloudflare Pages** (primary)
- Alternatives: Netlify, Vercel (if requested)

---

## Milestones with PASS/FAIL Gates

### M1: Planning Anchor (COMPLETED)
**Tag:** `restore/m1-planning`

**Actions:**
1. Initialized Git repository
2. Created SPEC.md and AGENTS.md at repo root
3. Committed and tagged

**Verification:**
```bash
git tag --list "restore/*"
# Expected: restore/m1-planning
```

**Status:** ✅ PASSED (pre-existing)

---

### M1b: Planning Artefacts (THIS MILESTONE)
**Tag:** `restore/m1b-planning-artefacts`

**Actions:**
1. Create ImplementationPlan.md (this file) at repo root
2. Create TaskList.md at repo root
3. Commit only these two files
4. Tag and push

**Expected Outputs:**
- `ImplementationPlan.md` (this file)
- `TaskList.md` (granular checklist)

**Verification Commands:**
```bash
git status
# Expected: working tree clean

git log -1 --oneline
# Expected: "M1b planning: add implementation plan and task list"

git tag --list "restore/*"
# Expected: restore/m1-planning, restore/m1b-planning-artefacts

git show restore/m1b-planning-artefacts --stat
# Expected: only ImplementationPlan.md and TaskList.md changed/added
```

**PASS Criteria:**
- [ ] Both files exist at repo root
- [ ] Files match SPEC.md scope (no drift)
- [ ] Tag `restore/m1b-planning-artefacts` points to latest commit
- [ ] Tags pushed to origin

**FAIL Criteria:**
- Files modified: SPEC.md, AGENTS.md
- Astro scaffold created prematurely
- Dependencies installed
- Scope drift detected

**Rollback:**
```bash
git reset --hard restore/m1-planning
git tag -d restore/m1b-planning-artefacts
git push origin :refs/tags/restore/m1b-planning-artefacts
```

**Hard Gate:** ⛔ **STOP HERE. Await user approval before proceeding to M2.**

---

### M2: Scaffold (Astro + Tailwind + Section Skeleton)
**Tag:** `restore/m2-scaffold`

**Actions:**
1. Scaffold Astro project with TypeScript and Tailwind
2. Create semantic section components matching SPEC.md section map
3. Create `/public/spots.json` with placeholder data
4. Create `/public/robots.txt` (allow all for now)
5. Verify build passes

**Expected Outputs:**
- Astro project structure with `src/`, `public/`
- `src/pages/index.astro` (homepage)
- Section components (placeholder content):
  - `src/components/Hero.astro`
  - `src/components/TrustLogos.astro`
  - `src/components/MechanismIcons.astro`
  - `src/components/PainValueBridge.astro`
  - `src/components/QuizEmbed.astro`
  - `src/components/SyncMyStats.astro`
  - `src/components/Reviews.astro`
  - `src/components/SpotsRemaining.astro`
  - `src/components/FAQ.astro`
  - `src/components/Footer.astro`
- `/public/spots.json`:
  ```json
  {
    "spotsRemaining": 3,
    "lastUpdated": "2026-01-06"
  }
  ```
- `/public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  ```

**Verification Commands:**
```bash
node --version
npm --version

npm install
# Expected: success, node_modules created

npm run dev
# Expected: dev server starts, no console errors

# In browser: http://localhost:4321
# Expected: homepage loads, all section headings visible

npm run build
# Expected: dist/ folder created, no warnings/errors

git status
# Expected: changes staged
```

**Browser Walkthrough (Required):**
1. Load homepage at `http://localhost:4321`
2. Verify all section labels present (even if placeholder content)
3. Verify SpotsRemaining component reads from `/public/spots.json` and displays "3 spots remaining"
4. Verify no missing-asset console errors

**PASS Criteria:**
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds without errors
- [ ] All sections listed in SPEC.md section map are present
- [ ] SpotsRemaining dynamically reads from `/public/spots.json`
- [ ] `robots.txt` is syntactically valid
- [ ] Browser walkthrough shows all sections

**FAIL Criteria:**
- Build fails
- Console errors on page load
- Missing sections
- SpotsRemaining hardcoded instead of reading JSON
- Non-semantic HTML structure

**Rollback:**
```bash
git reset --hard restore/m1b-planning-artefacts
git clean -fd
```

---

### M3: Forms Wiring (Tally Embeds + Copy Blocks)
**Tag:** `restore/m3-forms`

**Actions:**
1. Update `QuizEmbed.astro` with Tally iframe placeholder
2. Update `SyncMyStats.astro` with:
   - Tally upload iframe placeholder
   - 24-hour audit delivery promise copy
   - Consent checkbox language: "I consent to sharing my health data for audit purposes. Data will be used only for the audit and deleted within 30 days."
   - Non-medical disclaimer: "This is not medical advice. Consult a healthcare professional before starting any fitness program."
3. Add copy to Pain/Value Bridge section (placeholder acceptable)
4. Update `spots.json` if needed for testing

**Expected Outputs:**
- `QuizEmbed.astro` contains Tally iframe (placeholder URL)
- `SyncMyStats.astro` contains:
  - Upload iframe placeholder
  - Promise copy
  - Consent checkbox UI (non-functional OK for now)
  - Non-medical disclaimer
- Updated copy in Pain/Value Bridge

**Verification Commands:**
```bash
npm run dev
# Browser check: quiz iframe placeholder visible
# Browser check: Sync My Stats copy present with consent language and disclaimer

npm run build
# Expected: success
```

**Browser Walkthrough (Required):**
1. Scroll to Quiz section → Tally embed placeholder visible
2. Scroll to Sync My Stats section → upload placeholder visible, copy present
3. Verify consent checkbox and disclaimer visible

**PASS Criteria:**
- [ ] Quiz embed placeholder present
- [ ] Upload embed placeholder present
- [ ] Consent checkbox language matches SPEC.md
- [ ] Non-medical disclaimer present
- [ ] 24h promise copy visible
- [ ] Build succeeds

**FAIL Criteria:**
- Missing consent language
- Missing disclaimer
- Embed sections broken or missing

**Rollback:**
```bash
git reset --hard restore/m2-scaffold
```

---

### M4: Deploy (Cloudflare Pages)
**Tag:** `restore/m4-deploy`

**Actions:**
1. Connect GitHub repo to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Trigger initial deployment
4. Verify deployed URL works on mobile and desktop

**Expected Outputs:**
- Deployed URL (e.g., `https://pt-authority-hub-landing.pages.dev`)
- Homepage accessible
- All sections render correctly
- No broken assets or CORS issues

**Verification Commands:**
```bash
# Manual verification in browser and mobile device/emulator
curl -I https://pt-authority-hub-landing.pages.dev
# Expected: 200 OK

# SEO spot checks
curl https://pt-authority-hub-landing.pages.dev/robots.txt
# Expected: User-agent: * Allow: /
```

**Manual Verification Checklist:**
- [ ] Homepage loads on desktop browser
- [ ] Homepage loads on mobile (responsive layout intact)
- [ ] SpotsRemaining displays correctly
- [ ] Quiz/upload placeholders visible
- [ ] robots.txt accessible and valid
- [ ] Meta tags present (title, description)

**PASS Criteria:**
- [ ] Deployed URL returns 200 OK
- [ ] Mobile responsive layout works
- [ ] All sections render without broken assets
- [ ] robots.txt valid
- [ ] Basic SEO meta tags present

**FAIL Criteria:**
- 404 or deployment failure
- Broken mobile layout
- Missing assets (images, styles)
- robots.txt 404 or malformed

**Rollback:**
- Revert Cloudflare Pages deployment to previous production build
- Locally: `git reset --hard restore/m3-forms`

---

### M5: Polish (Performance, Accessibility, SEO, Reviews Widget)
**Tag:** `restore/m5-polish`

**Actions:**
1. Add lazy-loading to Reviews widget placeholder
2. Run Lighthouse audit (mobile) and address critical issues:
   - Accessibility: semantic HTML, ARIA labels, keyboard navigation
   - Performance: image optimization, defer non-critical JS
   - SEO: meta descriptions, Open Graph tags, sitemap.xml
3. Add proper heading hierarchy (single h1, h2-h6 structure)
4. Verify color contrast meets WCAG AA
5. Add loading spinner or skeleton for embedded forms
6. Final mobile responsiveness pass

**Expected Outputs:**
- Lighthouse mobile score improvements:
  - Accessibility: 90+
  - Performance: 85+
  - SEO: 90+
- Reviews widget lazy-loads (intersection observer or Astro's built-in lazy)
- sitemap.xml generated

**Verification Commands:**
```bash
npm run build
# Expected: success, no warnings

# Run Lighthouse CLI (if installed)
lighthouse https://pt-authority-hub-landing.pages.dev --preset=desktop --quiet
lighthouse https://pt-authority-hub-landing.pages.dev --preset=mobile --quiet
```

**Manual Verification Checklist:**
- [ ] Lighthouse mobile: Accessibility 90+
- [ ] Lighthouse mobile: Performance 85+
- [ ] Lighthouse mobile: SEO 90+
- [ ] Reviews widget lazy-loads (does not block initial render)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Color contrast passes WCAG AA
- [ ] Mobile scroll smooth, no layout shift

**PASS Criteria:**
- [ ] Lighthouse scores meet targets
- [ ] Lazy-load implemented for heavy widgets
- [ ] No accessibility violations (semantic HTML, ARIA, keyboard nav)
- [ ] Proper heading hierarchy
- [ ] sitemap.xml present

**FAIL Criteria:**
- Accessibility score below 85
- Missing meta tags or sitemap
- Reviews widget blocks page render
- Keyboard navigation broken

**Rollback:**
```bash
git reset --hard restore/m4-deploy
```

---

## Risks and Mitigations

### Risk: Reviews Widget Hurts Mobile Performance
**Impact:** High (Core Web Vitals, bounce rate)

**Mitigation:**
- Lazy-load widget below fold (intersection observer)
- Use lightweight widget or static fallback
- Test on real mobile devices, not just emulators

### Risk: Consent and Upload Messaging Insufficient
**Impact:** Medium (Legal, user trust)

**Mitigation:**
- SPEC.md explicitly defines consent checkbox language and disclaimer
- Legal review recommended before production launch (out of scope for v0)
- Clear 30-day deletion promise

### Risk: Scope Creep into Portal Features
**Impact:** High (Timeline, complexity)

**Mitigation:**
- SPEC.md Out of Scope section is explicit: no auth, no portal, no booking, no payments
- All milestone acceptance criteria reference SPEC.md as single source of truth
- Any new feature requests must update SPEC.md first

### Risk: Tally Form Configuration Delays
**Impact:** Low (Unblocks with placeholders)

**Mitigation:**
- M3 uses placeholder URLs
- PT configures Tally separately
- Final URL swap is a trivial commit

---

| M6 | Production Configuration & Wiring | [OD4eKp, pbyXyJ] env config, build & deploy | ✅ |
| M7A | Curated Testimonials Section | src/data/testimonials.json, Testimonials.astro | ✅ |
| M8 | Conversion Plumbing | BookingCTA.astro, What happens next copy | ✅ |
| M9 | Privacy Analytics (Plausible) | AnalyticsPlausible.astro, Event instrumentation | ✅ |

## Milestone 6: Production Configuration & Wiring ✅ COMPLETED

This milestone involved transitioning from placeholder form IDs to production-ready Tally form IDs and updating the project documentation to accurately reflect the progress made (Milestones 2 through 5 are now complete).

#### [NEW] [.env](file:///c:/PROJECTS/pt-authority-hub-landing/.env) [COMPLETED]
#### [MODIFY] [TaskList.md](file:///c:/PROJECTS/pt-authority-hub-landing/TaskList.md) [COMPLETED]

---

## Milestone 7A: Curated Testimonials Section ✅ COMPLETED
**Scope:** Add a static, performant testimonials section without third-party scripts.
- [x] Create `src/data/testimonials.json` with initial placeholder data.
- [x] Implement `src/components/Testimonials.astro` with mobile-first design.
- [x] Add configurable Google Reviews link support in `.env.example`.
- [x] Verify build, deploy, and live content on `https://pt-authority-hub-landing.pages.dev`.

---

## Milestone M8: Conversion Plumbing ✅ COMPLETED
**Scope:** Add booking CTA (link-only) and clarity copy to improve user conversion.
- [x] Created `BookingCTA.astro` for optional external booking links (no scripts).
- [x] Added "What happens next?" block to homepage (clarity on audit delivery).
- [x] Enhanced thank you page with "Next steps" and booking CTA.
- [x] Verify build, deploy, and live content on both `/` and `/thanks/`.

---

## Verification Summary by Milestone

| Milestone | Key Verification | Status |
|-----------|------------------|--------|
| M1 | SPEC.md + AGENTS.md exist, tag present | ✅ |
| M1b | Both planning files exist, tag exists | ✅ |
| M2 | Build passes, all sections present | ✅ |
| M3 | Embeds visible, consent/disclaimer present | ✅ |
| M4 | Deployed URL works on mobile | ✅ |
| M5 | Lighthouse scores pass, lazy-load works | ✅ |
| M6 | Tally forms load with correct IDs | ✅ |
| M7A | Testimonials render statically on live site | ✅ |
| M8 | Booking CTA and clarity copy live | ✅ |
| M9 | Plausible script and event classes live | ✅ |

---

## Restore Tag Reference

| Tag | Description |
|-----|-------------|
| `restore/m1-planning` | Initial SPEC.md + AGENTS.md anchor |
| `restore/m1b-planning-artefacts` | This plan + TaskList.md |
| `restore/m2-scaffold` | Astro + Tailwind + section skeleton |
| `restore/m3-forms` | Tally embeds + consent copy |
| `restore/m4-deploy` | Cloudflare Pages deployment |
| `restore/m5-polish` | Performance + accessibility + SEO |
| `restore/m6-live-forms` | Production Tally IDs and config |
| `restore/m7-reviews` | Curated Testimonials completion |
| `restore/m8-conversion` | Conversion Plumbing completion |
| `restore/m9-analytics` | Privacy Analytics completion |

---

> [!CAUTION]
> **Do NOT proceed to M2 until this plan is approved.**
> 
> Premature scaffolding will require rollback to `restore/m1-planning` and loss of work.
