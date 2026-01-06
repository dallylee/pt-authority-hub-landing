# Task List: Authority Hub Landing Page

## Overview
Granular, atomic tasks organized by milestone. Mark `[/]` for in-progress, `[x]` for completed.

---

## M1: Planning Anchor ✅ COMPLETED
- [x] Initialize Git repository
- [x] Create SPEC.md at repo root
- [x] Create AGENTS.md at repo root
- [x] Commit with message "M1 planning: initial SPEC and AGENTS"
- [x] Tag as `restore/m1-planning`
- [x] Push to origin

---

## M1b: Planning Artefacts ✅ COMPLETED
- [x] Create ImplementationPlan.md at repo root
- [x] Create TaskList.md (this file) at repo root
- [x] Verify both files match SPEC.md (no scope drift)
- [x] Stage only ImplementationPlan.md and TaskList.md
- [x] Commit with message "M1b planning: add implementation plan and task list"
- [x] Tag as `restore/m1b-planning-artefacts`
- [x] Push branch and tags to origin
- [x] Run verification commands:
  - [x] `git status` → working tree clean
  - [x] `git log -1 --oneline` → correct message
  - [x] `git tag --list "restore/*"` → both M1 and M1b tags present
- [x] ⛔ **STOP: Await user approval before M2**

---

## M2: Scaffold (Astro + Tailwind + Section Skeleton)

### Setup
- [ ] Scaffold Astro project with TypeScript template
- [ ] Install Tailwind CSS integration
- [ ] Configure `astro.config.mjs` for static output
- [ ] Configure Tailwind for mobile-first responsive design
- [ ] Set up `tsconfig.json` with strict mode

### Public Assets
- [ ] Create `/public/spots.json` with placeholder data:
  ```json
  {
    "spotsRemaining": 3,
    "lastUpdated": "2026-01-06"
  }
  ```
- [ ] Create `/public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  ```

### Components (Placeholder Content)
- [ ] Create `src/components/Hero.astro` (headline, subhead, CTA button)
- [ ] Create `src/components/TrustLogos.astro` (placeholder logo grid)
- [ ] Create `src/components/MechanismIcons.astro` (placeholder icon row)
- [ ] Create `src/components/PainValueBridge.astro` (placeholder section)
- [ ] Create `src/components/QuizEmbed.astro` (empty iframe placeholder)
- [ ] Create `src/components/SyncMyStats.astro` (section skeleton)
- [ ] Create `src/components/Reviews.astro` (placeholder widget area)
- [ ] Create `src/components/SpotsRemaining.astro` (reads from `/public/spots.json`)
- [ ] Create `src/components/FAQ.astro` (placeholder accordion/list)
- [ ] Create `src/components/Footer.astro` (copyright, links placeholder)

### Homepage Assembly
- [ ] Create `src/pages/index.astro`
- [ ] Import all section components
- [ ] Arrange in order per SPEC.md section map
- [ ] Add semantic HTML structure (header, main, sections, footer)
- [ ] Add section IDs for potential anchor links

### Verification
- [ ] Run `npm install` → success, `node_modules` created
- [ ] Run `npm run dev` → server starts on `http://localhost:4321`
- [ ] Browser check: homepage loads without console errors
- [ ] Browser check: all section headings visible (even if placeholder)
- [ ] Browser check: SpotsRemaining displays "3 spots remaining"
- [ ] Browser check: verify JSON data is dynamically loaded (not hardcoded)
- [ ] Run `npm run build` → success, `dist/` folder created
- [ ] Check `dist/robots.txt` exists and is valid
- [ ] Browser walkthrough:
  - [ ] Load homepage
  - [ ] Scroll to Hero
  - [ ] Scroll to Trust Logos
  - [ ] Scroll to Mechanism Icons
  - [ ] Scroll to Pain/Value Bridge
  - [ ] Scroll to Quiz Embed (placeholder)
  - [ ] Scroll to Sync My Stats
  - [ ] Scroll to Reviews
  - [ ] Scroll to Spots Remaining
  - [ ] Scroll to FAQ
  - [ ] Scroll to Footer

### Git
- [ ] Stage all changes
- [ ] Commit with message "M2 scaffold: Astro + Tailwind + section skeleton"
- [ ] Tag as `restore/m2-scaffold`
- [ ] Push branch and tags to origin
- [ ] Verify `git status` → clean working tree

---

## M3: Forms Wiring (Tally Embeds + Copy Blocks)

### Quiz Embed
- [ ] Update `QuizEmbed.astro` with Tally iframe
- [ ] Use placeholder URL: `https://tally.so/placeholder-quiz` (PT will replace)
- [ ] Add fallback message if iframe fails to load
- [ ] Test iframe renders in browser

### Sync My Stats Section
- [ ] Update `SyncMyStats.astro` with Tally upload iframe
- [ ] Use placeholder URL: `https://tally.so/placeholder-upload` (PT will replace)
- [ ] Add 24-hour promise copy:
  > "Upload your last 30 days of performance data (Apple Watch, Oura, etc.) and receive a personalized Performance Audit within 24 hours."
- [ ] Add consent checkbox UI with copy:
  > "I consent to sharing my health data for audit purposes. Data will be used only for the audit and deleted within 30 days."
- [ ] Add non-medical disclaimer:
  > "This is not medical advice. Consult a healthcare professional before starting any fitness program."
- [ ] Style consent checkbox and disclaimer (subtle, readable)

### Copy Updates
- [ ] Add placeholder copy to Pain/Value Bridge section
- [ ] Add placeholder FAQ items (min 3 questions)
- [ ] Update Hero CTA button text to "Get Your Free Audit"

### Optional: spots.json Update
- [ ] Update `spots.json` if testing dynamic updates (change `spotsRemaining` to 2)

### Verification
- [ ] Run `npm run dev`
- [ ] Browser check: Quiz embed placeholder visible
- [ ] Browser check: Upload embed placeholder visible
- [ ] Browser check: 24h promise copy present
- [ ] Browser check: Consent checkbox language visible
- [ ] Browser check: Non-medical disclaimer visible
- [ ] Run `npm run build` → success
- [ ] Browser walkthrough:
  - [ ] Scroll to Quiz → iframe placeholder shows
  - [ ] Scroll to Sync My Stats → upload iframe shows
  - [ ] Verify consent checkbox present
  - [ ] Verify disclaimer present

### Git
- [ ] Stage all changes
- [ ] Commit with message "M3 forms: Tally embeds + consent copy + disclaimer"
- [ ] Tag as `restore/m3-forms`
- [ ] Push branch and tags to origin

---

## M4: Deploy (Cloudflare Pages)

### Cloudflare Pages Setup
- [ ] Log in to Cloudflare dashboard
- [ ] Navigate to Pages
- [ ] Click "Create a project" → Connect to GitHub
- [ ] Select `pt-authority-hub-landing` repo
- [ ] Configure build settings:
  - [ ] Framework preset: Astro
  - [ ] Build command: `npm run build`
  - [ ] Build output directory: `dist`
- [ ] Trigger initial deployment

### Deployment Verification
- [ ] Wait for deployment to complete
- [ ] Copy deployed URL (e.g., `https://pt-authority-hub-landing.pages.dev`)
- [ ] Open URL in desktop browser:
  - [ ] Homepage loads (200 OK)
  - [ ] All sections render
  - [ ] SpotsRemaining displays correctly
  - [ ] Quiz/upload placeholders visible
  - [ ] No broken images or 404 errors in console
- [ ] Open URL on mobile device or emulator:
  - [ ] Homepage loads
  - [ ] Layout is responsive (no horizontal scroll)
  - [ ] Text is readable, buttons are tappable
  - [ ] SpotsRemaining visible

### SEO Basics
- [ ] Visit `https://pt-authority-hub-landing.pages.dev/robots.txt` → valid
- [ ] Check page source for `<title>` tag
- [ ] Check page source for `<meta name="description">` tag
- [ ] Verify no `<meta name="robots" content="noindex">` blocking indexing

### Git
- [ ] Add deployment URL to README.md (if README exists) or document it
- [ ] Commit any config changes (e.g., Cloudflare badge)
- [ ] Tag as `restore/m4-deploy`
- [ ] Push branch and tags to origin

---

## M5: Polish (Performance, Accessibility, SEO, Reviews Widget)

### Reviews Widget Lazy-Load
- [ ] Update `Reviews.astro` to use intersection observer or Astro's lazy loading
- [ ] Add placeholder skeleton while widget loads
- [ ] Test on mobile: widget does not block initial page render
- [ ] Verify widget loads after user scrolls into view

### Accessibility
- [ ] Ensure single `<h1>` on homepage (Hero headline)
- [ ] Use proper heading hierarchy (`<h2>` for sections, `<h3>` for subsections)
- [ ] Add ARIA labels to CTA buttons (e.g., `aria-label="Get your free performance audit"`)
- [ ] Verify all interactive elements are keyboard-accessible (Tab, Enter)
- [ ] Test color contrast with WCAG AA checker (text vs background)
- [ ] Add `alt` text to all placeholder images (if any)
- [ ] Ensure form labels are properly associated (if consent checkbox is functional)

### Performance
- [ ] Defer non-critical JavaScript (if any custom scripts added)
- [ ] Optimize placeholder images (use WebP, appropriate sizes)
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Minimize third-party scripts (only Tally embeds)
- [ ] Run Lighthouse mobile audit:
  - [ ] Performance: 85+ target
  - [ ] Identify Critical Request Chain issues
  - [ ] Identify render-blocking resources

### SEO
- [ ] Add comprehensive `<meta name="description">` (150-160 chars)
- [ ] Add Open Graph meta tags:
  - [ ] `og:title`
  - [ ] `og:description`
  - [ ] `og:image` (placeholder or logo)
  - [ ] `og:url`
- [ ] Add Twitter Card meta tags
- [ ] Generate `sitemap.xml` (Astro can auto-generate)
- [ ] Verify canonical URL is set
- [ ] Check page title is unique and descriptive

### Mobile Responsiveness Final Pass
- [ ] Test on iPhone (Safari, Chrome)
- [ ] Test on Android (Chrome)
- [ ] Verify no layout shift (CLS score)
- [ ] Verify touch targets are min 48×48px
- [ ] Smooth scrolling, no janky animations

### Lighthouse Audit
- [ ] Run Lighthouse CLI on deployed URL (mobile preset):
  ```bash
  lighthouse https://pt-authority-hub-landing.pages.dev --preset=mobile --quiet
  ```
- [ ] Lighthouse Accessibility: 90+ target
- [ ] Lighthouse Performance: 85+ target
- [ ] Lighthouse SEO: 90+ target
- [ ] Address critical issues flagged (if any)

### Browser Walkthrough (Final)
- [ ] Load homepage on mobile device
- [ ] Scroll through all sections
- [ ] Tap CTA button (should focus, even if placeholder)
- [ ] Verify consent checkbox tappable
- [ ] Verify Quiz embed loads (or shows placeholder)
- [ ] Verify Upload embed loads (or shows placeholder)
- [ ] Verify Reviews widget lazy-loads
- [ ] No console errors or warnings

### Git
- [ ] Stage all polish changes
- [ ] Commit with message "M5 polish: performance, accessibility, SEO, lazy-load reviews"
- [ ] Tag as `restore/m5-polish`
- [ ] Push branch and tags to origin

### Final Deployment Verification
- [ ] Trigger Cloudflare Pages rebuild (or auto-deploy on push)
- [ ] Verify deployed URL reflects latest changes
- [ ] Run final Lighthouse audit on production URL
- [ ] Document results (screenshot or report)

---

## Post-M5: Handoff Checklist (Out of Scope for v0 Implementation)
- [ ] PT configures real Tally URLs
- [ ] PT updates `spots.json` with real spot count
- [ ] PT integrates real Reviews widget (Trustpilot/Google)
- [ ] Legal review of consent language (if needed)
- [ ] Custom domain setup (if applicable)
- [ ] Analytics integration (Google Analytics, Plausible, etc.)
- [ ] A/B testing plan for CTA copy

---

## Rollback Commands Reference

| Milestone | Rollback Command |
|-----------|------------------|
| M1b | `git reset --hard restore/m1-planning && git tag -d restore/m1b-planning-artefacts` |
| M2 | `git reset --hard restore/m1b-planning-artefacts && git clean -fd` |
| M3 | `git reset --hard restore/m2-scaffold` |
| M4 | `git reset --hard restore/m3-forms` (+ revert Cloudflare deploy) |
| M5 | `git reset --hard restore/m4-deploy` |

---

**Current Milestone:** M1b (Planning Artefacts)  
**Next Milestone After Approval:** M2 (Scaffold)
