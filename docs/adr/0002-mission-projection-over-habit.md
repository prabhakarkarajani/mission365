# ADR-002: Mission is a client-side projection over Habit, not a collection

**Status:** Accepted — 2026-07-21

## Context

The Product Constitution locks `Mission` as the primary entity Today must
be built on ("Today owns all Mission-level execution"), with `Habit` as
one `MissionType` among future others (see
`docs/sprints/sprint-01-foundation.md` §ADR-001 context and the domain
architecture decisions it references). The actual implementation only
has Habits — there is no second Mission source, no Mission persistence,
and the existing `src/features/missions/` scaffold
(`Mission` type, `habitToMission()` mapper, `useMissions()` hook) had
zero live consumers of its hook and only one live consumer of its mapper
function (`useCoachChat.ts`, reading `.type`/`.priority`).

Sprint 4 (Today Foundation) needs to decide: build the Today screen
directly against Habit-shaped data (`TodayMission` from
`habits/domain/types.ts`), or build it against a Mission projection.

## Decision

Today consumes `Mission` objects, assembled by a thin, stateless mapping
layer over Habit — not a new persisted collection. Minimal shape:

```ts
interface Mission {
  id: string;           // == the backing source's id, today == habitId
  title: string;
  missionType: MissionType;  // 'HABIT' today; existing union already
                              // anticipates ONE_TIME/PROJECT/AI_SUGGESTED
  source: string;       // the backing entity's id in its origin system
  completedToday: boolean;
  skippedToday: boolean;
}
```

No `priority`, `status`, `reminderTime`, or `recurrence` fields — the
prior scaffold had these, but nothing reads them except the one
`useCoachChat.ts` `.priority` reference (see Consequences). No AI
fields, no persistence, no prioritization/ranking logic.

`useMissions()` (previously unused — see Context) is repurposed to be
this projection: it now sources from `useTodayMissions()` (habits) via
an updated `habitToMission(todayMission)` mapper, instead of `useHabits()`
via the old `habitToMission(habit)`. All mutations (complete, skip)
delegate straight through to the existing Habit services via a new
`useMissionActions()` hook that switches on `mission.missionType` — today
that switch has exactly one branch (`'HABIT'`).

## Why

- **Constitution alignment over expediency.** Building Today directly on
  `Habit` would be faster this sprint but means Today itself becomes the
  thing that must be migrated the moment a second Mission source exists
  — exactly the "rename/replace a working thing" pattern already
  rejected project-wide (see the incremental-refactor preference this
  codebase follows: extend via adapters, don't retrofit consumers).
- **Small, not speculative.** The shape is intentionally narrower than
  the original `missions/` scaffold, not broader — every field listed is
  read by something today (Today's list, or mutation delegation). No
  field was added "for later."
- **Zero new persistence.** `Mission` has no id space of its own to
  reconcile with a future real collection; `id` is always the backing
  source's id. This keeps the "projection, not a database collection"
  property literally true, not just a docstring claim.

## Alternatives considered

**A. Build Today directly on `TodayMission`/Habit**, migrate to Mission
later when a second source exists. Rejected: defers a real migration
cost onto a future sprint instead of avoiding it, and contradicts the
already-locked Constitution naming for what Today executes against.

**A second, Today-specific type** (e.g. `TodayMissionProjection`),
leaving the original `Mission`/`habitToMission` untouched for
`useCoachChat.ts`/`roadmap.types.ts`. Rejected: produces two
differently-shaped "Mission" concepts in the same codebase, which is
worse for Constitution alignment (one canonical Mission projection is
the point) and only saves one small, low-risk call-site fix.

## Consequences

- **`useCoachChat.ts` needed a small fix**, not a redesign: it read
  `mission.type` and `mission.priority` from the old `habitToMission()`.
  `priority` was always a hardcoded `'MEDIUM'` constant inside the old
  mapper (never real prioritization) — it now lives as that same
  hardcoded constant directly at the one call site that still needs it
  to satisfy `CoachContext`'s existing shape
  (`src/ai/core/interfaces/AIProvider.ts`, untouched). Net behavior for
  Coach: identical. `mission.type` becomes `mission.missionType`.
- `roadmap.types.ts` is unaffected — it only imports the `MissionType`/
  `MissionPriority` union types, not the `Mission` interface shape, and
  those unions are unchanged.
- Today's "Not Today" action needs new Habit-level backend support
  (`HabitLog.skipped`) regardless of this decision — that work is
  identical whether Today reads Habit or Mission shapes, so it's
  unaffected by this ADR and covered separately in the Sprint 4 backend
  PR.
- A second Mission source (e.g. a `ONE_TIME` task type) later means:
  add a new mapper function feeding the same `Mission` shape, add a
  branch to `useMissionActions()`, done — no change to
  `app/today/index.tsx`.

## Revisit at

When a second real Mission source is added (the concrete trigger the
Constitution's own roadmap names), OR if `Mission` ever needs an
identity independent of its backing source (e.g. a Mission persisted
before its source exists) — at that point "id == source id" stops
holding and Mission likely needs real persistence, which is a new ADR,
not an extension of this one.
