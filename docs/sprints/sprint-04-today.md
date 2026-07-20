# Sprint 4 — Today Foundation

**Status:** Implemented — 2026-07-21, split across two PRs
(`sprint-4-today-backend`, `sprint-4-today-frontend`), architecture
decision recorded in [ADR-002](../adr/0002-mission-projection-over-habit.md)

## Objective

A user can open Today, see today's missions, complete a mission, mark
"Not Today", and see today's progress.

## Decision: Option B (approved before coding)

Today consumes a minimal `Mission` projection (`id`, `title`,
`missionType`, `source`, `completedToday`, `skippedToday`) over Habit,
not Habit data directly — full reasoning in ADR-002. Chosen over
building directly on Habit because that would have deferred a real
migration cost onto a future sprint rather than avoiding it, and would
have contradicted the already-locked Product Constitution naming Mission
as the primary entity Today executes against.

## What shipped

**Backend**: `HabitLog.skipped` (additive field), `setHabitSkip`,
`POST /habits/:habitId/skip`, `getTodayOverview` widened to report both
flags. Fixed a real bug the new tests caught: `setHabitCompletion`
didn't clear a stale `skipped` flag when completing a previously-skipped
habit (and vice versa) — `completed`/`skipped` are now enforced
mutually exclusive in both directions.

**Frontend**: `app/today/index.tsx`, reachable via Settings → Daily →
Today (no tab bar change). Built entirely on the Mission projection:
`useMissions()` (repurposed — see below) supplies the list,
`useMissionActions()` delegates complete/skip back to Habit's mutations
via `mission.source`. A skipped mission shows muted with an Undo action
rather than vanishing. Progress is a plain completed/total count.

## Real complications this sprint surfaced

- **`habitToMission()`/`useMissions()`/`Mission` had one live consumer**
  (`useCoachChat.ts`, not just dead scaffolding as initially assumed)
  that read the old `.type`/`.priority` fields. Resolved per ADR-002:
  `useMissions()` repurposed in place (it had zero consumers of the
  *hook* itself), and `useCoachChat.ts` updated with a genuinely
  behavior-neutral fix — `priority` was already a hardcoded `'MEDIUM'`
  constant, never real prioritization, so it now lives as that same
  constant at the one remaining call site instead of disappearing.
- **`completed`/`skipped` mutual exclusivity was a real gap**, not a
  hypothetical — `setHabitCompletion`'s existing completed:true path
  didn't clear `skipped`, meaning completing a previously-skipped
  mission would have left both flags true simultaneously. Caught by
  the new backend tests, not assumed away.
- **The offline SQLite pilot only covers Habits**, and only completion,
  not skip. "Not Today" is API-only on every platform (see
  `habit.local.ts`'s updated comment) — a deliberate, documented
  boundary, not a silent gap.

## What was deliberately not built (classified, not built)

- **Extending the Mission projection to a second real source** (e.g.
  `ONE_TIME` tasks) — no second source exists yet to justify it.
  **Future Sprint.**
- **Offline/SQLite support for "Not Today"** — real work (schema
  migration, sync queue entity type), not needed for the app to be
  usable today since native-online and web both work. **Product
  Backlog.**
- **Swipe gestures for Not Today** — a button achieves the same
  functional outcome with far less risk; the locked Interaction
  Principles' gesture vocabulary can be layered on later without
  changing the underlying action. **Future Sprint** (UI polish pass).
- **AI, Prioritization, Recovery, Weekly/Monthly Review, Notifications**
  — explicitly out of scope per the sprint brief.

## Demo checklist

1. Create a habit (if none exist) from Habits or Today's empty state.
2. Open Settings → Daily → Today — confirm it lists today's missions
   with a progress bar/count at top.
3. Tap a mission's checkbox — confirm it shows complete (strikethrough,
   muted) and the progress count updates.
4. Tap "Not today" on a pending mission — confirm it goes muted with a
   "Not today" label and an Undo action, and does **not** count as
   completed in the progress number.
5. Tap Undo — confirm it returns to a normal pending row.
6. Complete a mission that was previously marked "Not today" (via its
   checkbox after Undo, or directly) — confirm no stale "Not today"
   state lingers.
7. Backend: `POST /habits/:id/skip` then `POST /habits/:id/completion`
   with `completed:true` — confirm the log's `skipped` flag clears.

## Test evidence

Backend: `npm run typecheck` / `npm run lint` / `npm test` — 6 suites,
48 tests, all passing (7 new). Frontend: `npm run typecheck` / `npm run
lint` clean (2 pre-existing unrelated warnings). `npx expo export -p
web` rendered all 43 routes, including the new `/today`, without error.
Not verified: live interactive click-through against a running backend
(no Mongo instance in this environment).

## Retrospective

- **Went well:** the "if it disappeared tomorrow" test kept the screen
  genuinely small — no add-mission entry point on Today itself (Habits/
  Home already cover it), no swipe gestures, no ranking.
- **The architecture check-in before coding paid for itself
  immediately** — Option B surfaced the `useCoachChat.ts` dependency
  and the completed/skipped mutual-exclusivity bug, neither of which
  would have been found by an Option A ("just use Habit") build, since
  neither is visible from Today's own code.
- **Watch for next sprint:** Today and Home now both render "today's
  missions" independently (Home via `useHomeBrief`/`TodayMission`
  directly, Today via the Mission projection) — duplicate but not
  contradictory, since Home is explicitly the pre-redesign screen
  Sprint 8's nav cutover will retire. Worth confirming Sprint 8 removes
  Home rather than trying to reconcile the two paths mid-flight.
