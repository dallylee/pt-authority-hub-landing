# AGENTS: Authority Hub Landing Page

## Operating Rules
- SPEC.md is the single source of truth. Any change in behaviour or scope must update SPEC.md first.
- Work in milestones. No milestone advances without PASS evidence.
- After each milestone PASS: commit, tag restore/<milestone>, push tags.

## Tooling
- Use Node + npm (no yarn/pnpm unless SPEC changes).
- Keep dependencies minimal.
- Avoid vendor lock-in where it does not add immediate value.

## Verification
- Always capture outputs for:
  - git status
  - git log -1
- Once scaffold exists, always capture:
  - node --version
  - npm --version
  - npm run build
- UI work verification must include a browser walkthrough that shows:
  - homepage loads
  - scroll to each section
  - quiz/embed placeholder visible

## Safety
- No destructive commands.
- Do not add secrets to git.
- Prefer environment variables for configuration later.
