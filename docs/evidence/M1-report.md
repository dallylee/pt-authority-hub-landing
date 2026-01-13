# M1: D1 Schema + Lead Ingestion - Evidence Report

## Status: CODE COMPLETE (D1 database creation required for testing)

## Changes Made

### Files Created
| File | Purpose |
|------|---------|
| `migrations/0001_initial_schema.sql` | D1 schema (workspaces, pt_users, leads, uploads, auth tables) |
| `functions/api/leads/ingest.ts` | Lead ingestion endpoint with scoring and bottleneck inference |

### Files Modified
| File | Change |
|------|--------|
| `src/components/QuizWizard.astro` | Updated to call `/api/leads/ingest`, store `leadToken` |

---

## Scoring Logic Implemented

### Triage Score (0-100)
- **Urgency**: 0-25 points based on `start_timing`
- **Budget**: 3-25 points based on `monthly_investment`
- **Time commitment**: 2-10 points based on `time_commitment_weekly`
- **Training days**: 3-6 points based on `training_days_current`
- **Coaching fit**: 6-10 points
- **Location fit**: 0-5 points (DISQUALIFIED if IN_PERSON_LONDON + not London)
- **Upload intent**: 0-6 points

### Triage Segments
- **DISQUALIFIED**: Location/coaching mismatch
- **HOT**:score ≥70, not JUST_RESEARCHING, good budget
- **WARM**: Score 40-69
- **NURTURE**: Otherwise

### Bottleneck Inference
1. **INJURY_CONSTRAINTS** (HIGH confidence) if injury detected
2. Points system based on `biggest_blocker`:
   - RESULTS_NOT_HAPPENING → TRAINING +5
   - CONFLICTING_ADVICE → TRAINING +5
   - CAN'T_STAY_CONSISTENT → CONSISTENCY +5
   - TIME_CONSTRAINTS → CONSISTENCY +3, TRAINING +2
   - NUTRITION_CONSISTENCY → NUTRITION +6
   - LOW_ENERGY_RECOVERY_STRESS → RECOVERY +6
3. Context modifiers (training days, goal)
4. Confidence: HIGH (diff ≥3), MEDIUM (diff=2), LOW (else)
5. Upload intent bumps LOW→MEDIUM

---

## Git Status

```
Branch: feat/pt-console-v1
Commit: restore/M1-d1-ingestion
Build: ✅ PASS (0 errors)
```

---

## Required D1 Setup

> [!IMPORTANT]
> Before M1 can be fully tested, create D1 database:

```bash
# 1. Create database
npx wrangler d1 create pt-authority-hub-db

# 2. Note the database_id from output

# 3. Add to wrangler.toml:
[[d1_databases]]
binding = "DB"
database_name = "pt-authority-hub-db"
database_id = "324ee536-b279-4798-95d3-b8b24940a1d5"

# 4. Run migration
npx wrangler d1 execute pt-authority-hub-db --local --file=migrations/0001_initial_schema.sql

# 5. Seed workspace (manual SQL or add seed script)
```

---

## Email Behavior

✅ **PRESERVED**: Existing quiz email notification still sends via Resend
- Subject: "New Lead: {name} -{goal}"
- Includes triage info (segment, score, bottleneck)
- Includes lead_id for correlation

---

## Next: M2 Auth + PT Console
