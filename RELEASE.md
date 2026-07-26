# Mission365 — RC1 Release Notes

## Version

`1.0.0-rc.1`

(`package.json`/`backend/package.json` both remain at `1.0.0` — this repo has
no version-bump convention yet; `1.0.0-rc.1` is this release package's own
identifier, not a field written back into either `package.json`.)

## Release date

2026-07-26

## Status

**Frozen.** No further feature work is in scope for this release. This
package documents exactly what sits on `sprint-6-decision-engine` as of the
date above — see [Breaking changes](#breaking-changes-if-any) for the one
fact every reader needs before acting on this document: **this branch is not
yet committed or merged to `main`.**

## Summary

RC1 delivers the full Dream → Goal → Mission product loop end-to-end: a user
can register, capture a Dream, convert it into a Goal, link a Habit
("Mission") to that Goal, execute against it from Today (including a
deterministic, explainable "Recommended First Mission"), and talk to the
mock AI Coach ("Maya"). It closes with a stabilization pass: a full RC1
verification (every backend endpoint reachability-checked, the complete user
journey driven through a real browser, zero console/network errors found),
followed by a fix pass for every issue that verification turned up at P1/P2
severity, re-verified with the same method. No P0s were ever found in this
release.

## New features

User-visible, by sprint (full detail in [CHANGELOG.md](CHANGELOG.md) and
`docs/sprints/`):

- **Dream** — capture, list (active/archived), edit, archive, delete (Sprint 2).
- **Dream → Goal conversion** — turn a Dream into a Goal in one flow, with a
  progress summary of goals under each Dream (Sprint 3).
- **Today** — a dedicated daily execution screen: see today's missions,
  complete one, mark one "Not Today" (with Undo), track progress as a
  count/bar (Sprint 4).
- **Habit ↔ Goal/Milestone linkage** — pick a Goal when creating or editing a
  Habit ("Mission") (Sprint 5).
- **Decision Engine v1** — Today recommends exactly one mission to start
  first and explains why ("Why this first?"), scored deterministically from
  real signals: category priority, streak, reminder timing, linked-goal
  presence, and goal urgency (deadline proximity weighted by importance and
  pace) — no AI involved (Sprint 6/7).
- **AI Coach ("Maya")** — quick-action prompts (Plan My Day, Review Goals,
  Generate Roadmap, Weekly Review, Motivate Me, Reschedule Mission) against a
  mock provider grounded in the user's real goals/missions data.
- **Home quick actions** — one-tap access to Today, Ask AI, New Goal, New
  Mission, Dreams, Calendar, and Insights, added in this release's
  stabilization pass (see Fixed bugs).

## Fixed bugs

**RC1 verification pass (this release), ordered by the severity they were
filed at:**

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | P1 | Maya's suggested-prompt chips rendered as ~220px vertical ovals instead of compact pills, at every viewport width | `app/(tabs)/coach.tsx` — `flex-none` on the chip `ScrollView`, `items-center` on its content container, countering React Native Web's default `flexGrow: 1` on `ScrollView` content wrappers |
| 2 | P1 | Today and Dreams — two of the app's most central screens — were reachable only by digging into Settings | Added both to Home's existing `QUICK_ACTIONS` strip (`app/(tabs)/home.tsx`) — no new tab, no nav-architecture change |
| 3 | P2 | Dreams screen had no back button (every other pushed screen has one) | Swapped its custom header for the existing `ModalHeader` component (`app/dreams/index.tsx`), the same one `journal/index.tsx` already uses |
| 4 | P2 | A brand-new goal with 0% progress and no deadline immediately showed a red "0% pace · Foundation" danger badge | Added `GoalPacing.hasSignal` (`src/features/goals/domain/goalPacing.ts`); both consumers (`app/(tabs)/goals.tsx`, `app/goals/[goalId].tsx`) now show a neutral "Just getting started" instead of a false danger signal |
| 5 | P2 | Achievement-unlocked toast overlapped the Today header's title and progress summary | Increased the toast's global vertical offset (`src/features/gamification/presentation/AchievementToast.tsx`) to clear a standard header + the Today progress row |

**Carried in from the Sprint 6 post-kickoff regression audit** (already on
this branch before the RC1 verification pass; listed here because they're
part of what RC1 ships):

- Chat bubble text overflowing off-screen on web (Coach screen) —
  RN-Web's `flexShrink: 0` default on `View`.
- "Generate Roadmap" quick action falling back to a generic greeting instead
  of a real reply — missing keyword branch in the mock AI provider.
- Dark Mode preference (and the Daily Reminder notification schedule)
  reverting/never applying on reload — neither was reconciled from the
  persisted user preference at boot.
- Query errors silently rendered as false "empty" states on 10 screens —
  `isLoading` checked without `isError`, masking real failures as "you have
  nothing yet."

**RC1 hardening** (also already on this branch):

- **B1** — production boot now refuses to start with a placeholder-looking
  JWT secret, matching access/refresh secrets, or `CORS_ORIGIN: '*'` in
  `NODE_ENV=production` (`backend/src/config/env.ts`).
- **B2** — real HTTP integration tests for the full auth lifecycle
  (register → login → protected route → refresh → protected again), CORS
  header verification, and negative cases (`backend/src/routes/auth.http.test.ts`).
- **B3** — a CI guard (`scripts/check-query-error-handling.js`) that fails
  the build if a new screen reads `isLoading` without `isError`, preventing
  a regression of the query-error fix above.

Full reproduction steps and root causes for the five RC1-verification items
are in the conversation history that produced this release; a condensed
version is above and in [CHANGELOG.md](CHANGELOG.md).

## Known limitations

Not fixed in this release, deliberately — either out of RC1's scope, or
carried forward with a named reason:

- **Achievement toast** no longer covers the Today header, but can still
  transiently pass over the first mission row in the list below it on short
  lists — the toast is a single global component with no per-screen
  awareness; fully avoiding all content would require screen-aware
  positioning, out of scope for this fix.
- **`app.json`'s `expo.extra.apiUrl` is a static, build-time value**, not
  environment-driven (no `app.config.js` exists). Changing the backend URL
  requires a code commit + rebuild, not a dashboard env var change.
- **No cookie-based session handling** — auth is fully stateless/header-based
  (`Authorization: Bearer <token>`), so no SameSite/Secure/HttpOnly hardening
  applies or is needed.
- **`Milestone` subdocument `_id`s regenerate** on every `PATCH /goals/:goalId`
  that replaces the `milestones` array (no `_id` in the input schema) —
  harmless today, would break anything that stored a milestone `_id`
  externally (documented in ADR-003, not fixed).
- **One Goal per Habit** is a deliberate v1 constraint, not a bug — habits
  can legitimately serve multiple goals in principle; no one has asked for
  that yet (ADR-003).
- **`Goal.importance`/`Goal.deadline` feed the Decision Engine's
  `GOAL_URGENCY` reason**, but `Milestone.targetDate` still does not — no UI
  exists yet to set a milestone-level date.
- **No React Native component/E2E test automation** — see
  [TESTING.md](TESTING.md) for the full gap and how this release's manual
  verification substituted for it.
- **No staging environment** — production Render/Vercel are the only
  deployed targets; see [DEPLOYMENT.md](DEPLOYMENT.md).
- Two pre-existing, non-blocking noise items: an `[expo-notifications]` web
  console warning (documented SDK limitation) and a `props.pointerEvents is
  deprecated` React Native Web warning.

## Breaking changes (if any)

**None in application behavior.** Every schema change across Sprints 1–6 was
additive (`Goal.dreamId`, `Goal.importance`, `HabitLog.skipped`,
`Habit.goalId`/`milestoneId`) — no field was removed or repurposed, no
migration is required for existing data.

**One release-process fact that functions like a breaking change if
ignored:** this branch (`sprint-6-decision-engine`) is **not committed or
merged into `main`** as of this release package. Render and Vercel both
auto-deploy from `main` (per `docs/releases/RC1-deployment-checklist.md`).
Nothing in this release reaches production until that merge happens —
follow [DEPLOYMENT.md](DEPLOYMENT.md)'s deployment order, which starts with
that step.

## Rollback procedure

Full step-by-step is in [DEPLOYMENT.md](DEPLOYMENT.md#rollback-steps).
Summary: this release introduced no database schema or migration changes, so
rollback is a pure code revert — Vercel: promote the previous deployment
back to production (instant, no rebuild). Render: redeploy the last known-
good commit from the Deploys tab. Roll back frontend first if both need it,
since the previous frontend build's baked-in `apiUrl` still points at the
same backend host.
