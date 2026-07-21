# ADR-003: Habit-to-Goal/Milestone linkage

**Status:** Accepted — 2026-07-21

## Context

The Product Constitution locks a Dream → Goal → Milestone → Mission
hierarchy where every mission is traceable to a goal ("Traceable
Purpose," one of the seven locked pillars) and where the future
Prioritization Engine weighs Goal Importance and Milestone target dates
(see `docs/sprints/sprint-05` analysis). None of that can honestly exist
yet: `Habit` (the only real Mission source — ADR-002) has no relationship
to `Goal` at all. Building a scoring engine before this relationship
exists would mean either fabricating data or shipping permanently-inert
"factors" whose explanation text could never truthfully appear — both
rejected during Sprint 5's Impact Report.

This ADR defines the minimum relationship needed to make that data real,
and nothing else.

## Decision

`Habit` gains two additive, nullable fields:

```ts
goalId: { type: ObjectId, ref: 'Goal', default: null, index: true }
milestoneId: { type: ObjectId, default: null }  // addresses a subdocument
                                                  // inside Goal.milestones,
                                                  // not a top-level ref
```

Validated on write via the same pattern already proven for `Goal.dreamId`
(Sprint 3): `goal.service.findOwnedGoal` (now exported) confirms
ownership; `goal.milestones.id(milestoneId)` (the exact lookup
`toggleMilestone` already uses) confirms a supplied `milestoneId`
actually belongs to that goal. `milestoneId` without `goalId` is
rejected. Effective state is computed from the merge of partial update
input with the habit's existing values, so updating only one of the two
fields never accidentally invalidates the other.

An internal `LinkState` enum (`UNLINKED | GOAL | MILESTONE`), derived —
never persisted — from `(goalId, milestoneId)`, ships as a small pure
utility (`backend/src/domain/habitLink.ts`) for the Prioritization Engine
to switch on later. Not exposed via any API response this sprint.

Goal picker only, on habit create/edit — selecting one of the user's
active goals. No milestone picker. `milestoneId` stays reachable only
through the API, not through any UI, until the Path experience ships.

## Ownership diagram

```
Dream (collection)
  ↑ dreamId (nullable ref)
Goal (collection)
  └─ milestones[] (embedded subdocuments, own _id — ADR-001)
       ↑ milestoneId (nullable, addresses a subdocument, not a ref)
  ↑ goalId (nullable ref)
Habit (collection — the only real Mission source, ADR-002)
  → Mission (client-side projection, additive fields only — ADR-002)
```

Every level is single-parent. A Habit points at most at one Goal and,
within it, at most one Milestone. Nothing points down (a Goal doesn't
enumerate its Habits) — traversal is always Habit → Goal → Dream,
matching how "trace this mission's why" is actually asked.

## Alternatives considered

**Many-to-many** (`Habit.links: [{goalId, milestoneId}]`, or a separate
join collection). Rejected for MVP — see the dedicated cardinality
section below; not a schema limitation being deferred reluctantly, a
deliberate choice.

**Cascade Goal deletion via the Sprint 1 event bus** (`goal.deleted`
event, a Habit-feature listener nulls the reference) instead of a direct
call. Rejected: `eventBus.emit()` is synchronous-dispatch but
fire-and-forget by design — nothing awaits a listener's async DB write,
so a test (or the delete response itself) could observe the Habit
*before* the cascade completes. That's the right tradeoff for "notify
other systems eventually" (which is what the bus is for, and why
`dream.created`/`goal.created` correctly use it with zero listeners so
far), and the wrong one for "this must be true before the delete is
considered done." `deleteGoal` calls `Habit.updateMany(...)` directly,
synchronously, before `deleteOne()`.

## Explainability over Expressiveness

The single-goal, single-milestone constraint is the same principle
applied twice: a scoring engine that can say "this matters because of
Goal X" is more useful and more trustworthy than one that can express
"this matters because of Goals X, Y, and Z, weighted somehow" — the
richer model is not obviously better, because nothing has resolved what
"weighted somehow" means, and an unresolved aggregation policy is worse
for the Confidence-over-Volume pillar than a narrower, fully-resolved
one. Every design choice in this ADR (single link, no milestone UI yet,
no faked factors) optimizes for what can be explained honestly today
over what could theoretically be expressed.

## Habit-to-Goal cardinality — one Goal only for MVP

Real-world habits often do serve multiple goals (a meditation habit
supporting both a stress goal and a focus goal). That's not in dispute.
The reasons a single link is still correct for MVP:

1. **No consumer needs it.** No shipped or approved-future screen (Path,
   Prioritization, Maya) requires multi-goal linkage.
2. **The migration path is additive, not a rewrite.** `goalId: ObjectId |
   null` is a strict subset of a future `links: [{goalId, milestoneId}]`
   array (the same embedding pattern `Goal.milestones` already uses).
   Backfilling every existing habit's single link as `links[0]` is a
   one-time, reversible-in-spirit migration, not a redesign.
3. **It matches the existing precedent at every other level** —
   Goal→Dream is also single-reference. Multi-parent at only one layer
   of an otherwise single-parent chain would be a real inconsistency,
   not a feature.
4. **A workaround exists today**: a user who wants one recurring action
   tracked against two goals can create two Habit entries. Imperfect,
   but available, and not a reason to accept an unresolved aggregation
   policy for the sake of a scoring engine that doesn't exist yet.

If multi-goal is approved later, the schema move is named above; the
Prioritization Engine would additionally need an explicit importance-
aggregation policy at that time — a real decision, not one to pre-guess
now.

## Explicit Non-goals

This ADR does **not** define:
- Habit scheduling (whether "due today" filtering happens at all)
- Habit prioritization / Mission scoring (the engine itself, or its
  factor weights)
- Maya reasoning (how, or whether, Coach ever surfaces this linkage)
- Goal completion behavior beyond the lifecycle table below (no new
  product behavior on completion)

And explicitly:
- **One Goal per Habit for MVP.** No many-to-many.
- **No milestone picker UI.** `milestoneId` is data-model-only until the
  Path experience is built.
- **The additive migration path is preserved** — nothing here forecloses
  the future shapes named above; every decision was checked against "can
  this be extended without a rewrite."

## Goal lifecycle → linked Habit behavior

Only `active | completed | archived` exist on `Goal.status` today;
`paused` is a locked future Path action, not yet real. Of the three real
statuses, only two have any trigger today (`updateGoalProgress` auto-
completes at 100%; `deleteGoal` removes the document). Analyzed here so
the answer exists before `paused` ships, not after.

| Transition | Triggerable today? | Behavior | Why |
|---|---|---|---|
| Completed | Yes (auto) | Continue unchanged | Auto-archiving a habit on goal completion is presumptuous — the habit may be exactly what should continue. This is the Transformation lifecycle state's job (a conversation, not a silent side effect), and Maya/Transformation are explicitly out of scope. |
| Archived | No | Continue unchanged, keep the link | Archive is reversible by design (mirrors Dream's archive/restore, Sprint 2); severing the link would have to be undone on restore for no benefit. |
| Paused (not yet real) | No | **Future:** ask the user, default to Continue if dismissed | The one genuinely ambiguous case — a habit may serve the paused goal exclusively or have independent value. Matches the AI System's own locked rule: consequential, non-obvious side effects require confirmation, not silent execution. Nothing to implement now; documented so the answer is ready. |
| Deleted | Yes | **Sever the link only** (`goalId`/`milestoneId` → null); Habit itself untouched | The only destructive transition. Deleting a Goal must never cascade-delete a Habit the user separately created. |

Only the Deleted row requires code this sprint.

## Consequences

- Every service touching a Habit's `goalId` reuses `findOwnedGoal`
  rather than re-implementing ownership checks — one more instance of
  the pattern this codebase already leans on.
- `getTodayOverview`'s query stays a flat `Habit.find()` this sprint —
  no Goal join yet, since nothing (Today's UI, the engine) reads
  `Goal.importance` through the link this sprint. That join is the
  Prioritization Engine's job, not this one's.
- A dangling-reference class of bug (milestone `_id`s regenerating on a
  full-array `PATCH /goals/:goalId` milestone replacement — real today,
  found during Sprint 5's review) is now more consequential but is
  explicitly not fixed here; named as a live risk, not a surprise.

## Revisit at

Multi-goal linkage: when a real, approved feature needs it (not before).
`paused` status: when Path/Journey actually ships pause — implement
exactly the "ask the user, default Continue" behavior specified above.
Milestone picker UI: when the Path experience is built.

## Migration strategy if revisited (multi-goal)

1. Add `links: [{goalId, milestoneId}]` as a new embedded array field
   (additive; `goalId`/`milestoneId` singular fields untouched initially).
2. Backfill: for every Habit with a non-null `goalId`, write
   `links = [{goalId, milestoneId}]`.
3. Cut reads over to `links` behind the existing `habit.service`
   interface, so callers (including the Prioritization Engine, if it
   exists by then) don't change.
4. Decide and implement the importance-aggregation policy across
   multiple links at that time.
5. Remove the singular fields only after verification.
