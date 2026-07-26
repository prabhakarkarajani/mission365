# Changelog

All notable changes to Mission365, by sprint. Format is loosely
[Keep a Changelog](https://keepachangelog.com/); dates are when each sprint
closed, per `docs/sprints/`. This project has no version-tag history yet —
see [RELEASE.md](RELEASE.md) for the current `1.0.0-rc.1` package.

## RC1 Stabilization — 2026-07-26

Verification and fix pass across the full app, following the Sprint 6 close.
No new features.

### User-visible improvements

- Today and Dreams are now reachable in one tap from Home's Quick Actions,
  instead of only through Settings.
- Maya's suggested-prompt chips render as proper compact pills at every
  screen width instead of broken vertical ovals.
- The Dreams screen has a back button, consistent with every other screen.
- A brand-new goal with no progress and no deadline shows a neutral "Just
  getting started" instead of a misleading red "behind" indicator.
- The achievement-unlocked toast no longer covers the Today screen's title
  and progress summary.

### Developer improvements

- Full RC1 verification methodology established: every backend endpoint
  checked directly, the complete user journey driven through a real
  browser (Playwright) at three viewports (375px/430px/1440px) with
  console/network/HTTP-error capture, `typecheck`/`lint`/`test`/
  `expo export -p web` run as a gate after every fix.
- `GoalPacing` gained a `hasSignal` field (`src/features/goals/domain/goalPacing.ts`)
  so any future consumer can distinguish "no real pacing data yet" from
  "genuinely behind," instead of every caller re-deriving that check.

## Sprint 6 — Decision Engine v1 — 2026-07-21

### User-visible improvements

- Today shows a "Recommended First Mission" card with a "Why this first?"
  disclosure explaining the recommendation in plain sentences (priority
  tier, streak, reminder timing, linked goal, goal urgency) — deterministic,
  no AI.
- Goal urgency (deadline proximity, weighted by importance and whether
  progress is behind pace) now factors into that recommendation once a goal
  has a real deadline and importance set.
- **Regression fixes found during this sprint's post-kickoff audit,**
  shipped in the same pass:
  - Coach chat bubble text no longer overflows off-screen on web.
  - "Generate Roadmap" now replies with the user's real current goal and
    progress instead of a generic greeting.
  - Dark Mode and the Daily Reminder notification schedule now survive
    reload — both are reconciled from the persisted preference at boot,
    not only applied when the Settings toggle itself is touched.
  - 10 screens (Goals, Habits, Achievements, Dreams, Journal, Today,
    Analytics, Weekly Review, Trackers, Calendar, Home) that were silently
    showing a false "empty" state on a failed request now show a retriable
    error state instead.

### Developer improvements

- New feature module `src/features/decision-engine/` (`domain/types.ts`,
  `domain/decisionEngine.ts`, `presentation/reasonCopy.ts`) — pure,
  deterministic, unit-tested (14 cases at introduction).
- Frontend test runner introduced for the first time: root `jest.config.js`
  + `tsconfig.jest.json` (`ts-jest`, scoped to pure domain logic), CI's
  frontend job gained a `test` step.
- CI guard `scripts/check-query-error-handling.js` added to prevent the
  isLoading-without-isError regression from recurring; wired into
  `.github/workflows/ci.yml` ahead of `npm ci` so it fails fast.
- `Mission` projection extended with `priority`, `reminderTime`,
  `currentStreak` (additive), making `Mission.priority` real for the first
  time instead of a hardcoded placeholder.

## Sprint 5 — Habit-to-Goal/Milestone Linkage — 2026-07-21

_(ADR-003)_

### User-visible improvements

- A "Goal (optional)" picker on Habit create/edit, matching the existing
  Category picker's UX.

### Developer improvements

- `Habit.goalId`/`milestoneId` (additive, nullable), validated against real
  ownership and milestone membership.
- Deleting a Goal severs (not cascades) any linked habits' references,
  synchronously.
- `LinkState` (`UNLINKED`/`GOAL`/`MILESTONE`) utility, derived and tested
  standalone, for the Decision Engine (Sprint 6) to consume.

## Sprint 4 — Today Foundation — 2026-07-21

_(ADR-002)_

### User-visible improvements

- **Today** screen: see today's missions, complete one, mark one "Not
  Today" (with Undo), track a completed/total progress count.

### Developer improvements

- `HabitLog.skipped` (additive field), `POST /habits/:habitId/skip`.
- Fixed a real bug the new tests caught: completing a previously-skipped
  habit didn't clear the stale `skipped` flag (and vice versa) —
  `completed`/`skipped` are now enforced mutually exclusive.
- `Mission` established as a client-side projection over `Habit`, not a new
  collection (ADR-002) — `useMissions()`/`habitToMission()` repurposed in
  place.

## Sprint 3 — Dream → Goal Conversion — 2026-07-21

### User-visible improvements

- Convert a Dream into a Goal in one flow, pre-linked, with a one-line
  context banner; lands back on Dream Detail.
- Dream Detail shows a progress summary of the goals linked to it.

### Developer improvements

- `dreamId` ownership validated server-side on both `createGoal` and
  `updateGoal`.
- `goal.created` event gains a `source` field (`'manual'` |
  `'dream_conversion'`).

## Sprint 2 — Dream, End-to-End — 2026-07-21

### User-visible improvements

- **Dream** — create, list (active/archived), edit, archive, delete.
  Reachable via Settings → Journey.

### Developer improvements

- `Dream` model/service/controller/routes, mounted at `/api/v1/dreams`,
  full Jest coverage.
- `createDream` emits a `dream.created` event on the Sprint 1 event bus
  (first real usage; no listener subscribes yet).
- Frontend `src/features/dreams/` established on the newer
  `{types,services,hooks}` module convention.

## Sprint 1 — Engineering Foundation — 2026-07-21

No user-facing features — pure foundation, per the sprint's explicit scope.

### Developer improvements

- Test infrastructure: Jest + `ts-jest` + `mongodb-memory-server`.
- `Goal.dreamId`, `Goal.importance`, and embedded milestone `order`/
  `targetDate` fields added in preparation for later sprints (ADR-001).
- Lightweight internal event bus (`backend/src/lib/eventBus.ts`), zero
  listeners wired up yet.
- CI pipeline (`.github/workflows/ci.yml`) established: backend
  (`typecheck` → `lint` → `test`), frontend (`typecheck` → `lint`).
- Fixed the root `tsconfig.json` silently type-checking `backend/`, and a
  clean-checkout CI failure caused by `.expo/`'s gitignored typed-routes
  file.
- "Migration Impact" checklist added to the PR template for any Mongoose
  schema change.

## Pre-Sprint-1 history

Commits prior to `c3c31e5` (Sprint 1's start) cover the app's earlier
iteration: initial project setup, native iOS build fixes, offline
SQLite/local-cache support for habits, the AI provider adapter layer and
original Mission domain scaffold, PWA/web support, the visual design system,
and the AI-guided goal onboarding funnel. These predate the sprint-numbered
process this changelog otherwise follows and are not re-itemized here — see
`git log` for the full list.
