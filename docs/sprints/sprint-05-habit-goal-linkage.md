# Sprint 5 — Habit-to-Goal/Milestone Linkage

**Status:** Implemented — 2026-07-21, split across two PRs
(`sprint-5-habit-goal-linkage-backend`, `sprint-5-habit-goal-linkage-frontend`),
architecture recorded in
[ADR-003](../adr/0003-habit-goal-milestone-linkage.md)

## Why this sprint exists

Originally kicked off as "Sprint 5 — Prioritization Engine v1." The
repository analysis and Impact Report found the honest v1 factor list
was blocked: Goal Importance and Target Date require a Habit↔Goal
relationship that didn't exist, and building the engine anyway would
mean either fabricating data or shipping permanently-inert factors.
Approved pivot: solve the missing domain relationship first, defer the
engine itself. This sprint is that relationship only.

## What shipped

**Backend**: `Habit.goalId`/`milestoneId` (additive, nullable),
validated via `goal.service.findOwnedGoal` (now exported) plus a
milestone-membership check — `milestoneId` without `goalId` is
rejected, and an update validates the *effective* merged state so
changing only one field never invalidates the other. `deleteGoal`
severs (not cascades) any linked habits' references, directly and
synchronously — not via the event bus (a deliberate choice, see
ADR-003's alternatives). `LinkState` (`UNLINKED`/`GOAL`/`MILESTONE`),
derived, never persisted, ships as a tested standalone utility for the
Prioritization Engine to use later.

**Frontend**: a "Goal (optional)" chip picker on habit create/edit,
identical pattern to the existing Category picker. Mission projection
(ADR-002) gains `goalId`/`milestoneId`, additive, flowing through
`habitToMission()` — not consumed by any UI yet.

**Explicitly not built** (per your refined scope): milestone picker UI,
Goal Detail's linked-habits list, Journey updates, Prioritization,
Maya integration.

## Real findings from this sprint

- **Milestone `_id`s can regenerate.** `PATCH /goals/:goalId` accepts a
  full `milestones` array replacement with no `_id` field in its input
  schema — every milestone gets a fresh subdocument `_id`. Pre-existing,
  harmless until something referenced a milestone `_id` externally.
  Named in ADR-003 as a live, un-fixed risk, not fixed this sprint
  (would require redesigning milestone updates — separate scope).
- **Goal lifecycle → linked-habit behavior needed real analysis, not a
  default.** Of `active|completed|archived` (`paused` isn't real yet),
  only Delete needed code. Completed and Archived need none — full
  reasoning is in ADR-003's lifecycle table, not just asserted.
- **One-Goal-per-Habit was a deliberate choice, not a limitation** —
  documented in ADR-003 with the real tension (habits legitimately can
  serve multiple goals) named directly, not glossed over.

## Demo checklist

1. Create a Goal (if none exist).
2. Create a new Habit — confirm a "Goal (optional)" chip list appears
   with the goal's title, plus "None".
3. Select the goal, save — reopen the habit's edit screen, confirm the
   same goal shows selected.
4. Change the habit's goal to "None", save — confirm it persists as
   unlinked.
5. Backend: link a habit to a goal, then delete that goal — confirm
   (via `GET /habits`) the habit's `goalId`/`milestoneId` are now `null`,
   and the habit itself still exists.
6. Backend: attempt to link a habit to a goal owned by another user, or
   a nonexistent goal — confirm `404`, not a silent link.

## Test evidence

Backend: `npm run typecheck` / `npm run lint` / `npm test` — 7 suites,
64 tests, all passing (16 new). Frontend: `npm run typecheck` / `npm run
lint` clean (2 pre-existing unrelated warnings). `npx expo export -p
web` rendered all 43 routes, including the modified `/habits/new` and
`/habits/[habitId]`, without error.

## Retrospective

- **Went well:** reusing `findOwnedDream`'s exact validation shape for
  `findOwnedGoal` meant the entire ownership/membership validation layer
  was a known pattern, not a new design — low risk, fast to get right.
- **The lifecycle question mattered more than it looked.** Answering
  "what happens to linked habits on Complete/Archive/Delete" up front
  turned what could have been an implicit, undocumented assumption into
  three lines in a table with real reasoning behind each — and revealed
  only one of the four transitions needed any code at all.
- **Classified, not built:** milestone picker UI, Goal Detail's linked-
  habits list, and the future "ask the user" Paused-goal behavior are
  all **Future Sprint** (blocked on Path/Journey shipping, or on
  `paused` becoming a real status) — not silently skipped, named with
  their unblock condition in ADR-003.
- **Unblocked, concretely:** the Prioritization Engine can now use
  `Goal.importance` immediately, and `Milestone.targetDate` once
  milestone linkage has a UI — exactly the two factors Sprint 5's
  original Impact Report flagged as blocked. That sprint can resume
  next with real data behind it.
