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

## M2: Scaffold (Astro + Tailwind + Section Skeleton) ✅ COMPLETED
35: 
36: ### Setup
37: - [x] Scaffold Astro project with TypeScript template
38: - [x] Install Tailwind CSS integration
39: - [x] Configure `astro.config.mjs` for static output
40: - [x] Configure Tailwind for mobile-first responsive design
41: - [x] Set up `tsconfig.json` with strict mode
42: 
43: ### Public Assets
44: - [x] Create `/public/spots.json` with placeholder data
45: - [x] Create `/public/robots.txt`
46: 
47: ### Components (Implemented as Skeleton/Full)
48: - [x] Create `src/components/Hero.astro`
49: - [x] Create `src/components/TrustLogos.astro`
50: - [x] Create `src/components/MechanismIcons.astro`
51: - [x] Create `src/components/PainValueBridge.astro`
52: - [x] Create `src/components/QuizEmbed.astro`
53: - [x] Create `src/components/SyncMyStats.astro`
54: - [x] Create `src/components/Reviews.astro`
55: - [x] Create `src/components/SpotsRemaining.astro`
56: - [x] Create `src/components/FAQ.astro`
57: - [x] Create `src/components/Footer.astro`
58: 
59: ### Homepage Assembly
60: - [x] Create `src/pages/index.astro`
61: - [x] Import all section components
62: - [x] Arrange in order per SPEC.md section map
63: - [x] Add semantic HTML structure
64: 
65: ### Verification
66: - [x] Build passes, homepage loads
67: 
68: ### Git
69: - [x] Commit "M2 scaffold: Astro + Tailwind + section skeleton"
70: - [x] Tag `restore/m2-scaffold`
71: 
72: ---
73: 
74: ## M3: Forms Wiring (Tally Embeds + Copy Blocks) ✅ COMPLETED
75: - [x] Update `QuizEmbed.astro` / `TallyEmbed.astro`
76: - [x] Update `SyncMyStats.astro` with 24h promise, consent, disclaimer
77: - [x] Commit "M3 forms: Tally embeds + consent copy + disclaimer"
78: - [x] Tag `restore/m3-forms`
79: 
80: ---
81: 
82: ## M4: Deploy (Cloudflare Pages) ✅ COMPLETED
83: - [x] Configure build settings for Astro
84: - [x] Verify deployment on mobile/desktop
85: - [x] Commit "M4 deploy: Cloudflare Pages setup"
86: - [x] Tag `restore/m4-deploy`
87: 
88: ---
89: 
90: ## M5: Polish (Performance, Accessibility, SEO) ✅ COMPLETED
91: - [x] Baseline accessibility (ARIAs, skip links)
92: - [x] SEO basics (meta tags, descriptions)
93: - [x] Mobile UX pass
94: - [x] Commit "M5 polish: mobile UX, SEO basics, a11y baseline"
95: - [x] Tag `restore/m5-polish`
96: 
97: ---
98: 
99: ## M6: Production Wiring ✅ COMPLETED
100: - [x] Create `.env` from `.env.example`
101: - [x] Populate `PUBLIC_TALLY_QUIZ_FORM_ID` (`OD4eKp`)
102: - [x] Populate `PUBLIC_TALLY_STATS_FORM_ID` (`pbyXyJ`)
103: - [x] Verify build with production IDs
104: - [x] Final manual inspection
105: 
106: ---

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
