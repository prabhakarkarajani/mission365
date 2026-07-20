# ADR-001: Milestones remain embedded on Goal, not a separate collection

**Status:** Accepted — 2026-07-21

## Context

Phase 10's original database design listed `milestones` as a separate
top-level collection, related to `goals` by `goalId`. During Sprint 1's
Architecture Audit, direct inspection of `backend/src/models/Goal.ts`
showed milestones already implemented as an embedded Mongoose
subdocument array (`milestoneSchema` inside `goalSchema`), with working
subdocument `_id` access already in production use via
`goal.service.ts`'s `toggleMilestone`. This is a real, already-working
pattern, not a hypothetical one being chosen from scratch.

## Decision

Extend the existing embedded-subdocument pattern — adding `order` and
`targetDate` fields to the embedded milestone schema — rather than
introduce a new top-level `Milestone` collection.

## Why

- Milestones are never queried independently of their parent Goal
  anywhere in the locked product design. Journey always shows a Goal's
  full Path at once; there is no cross-Goal Milestone list anywhere in
  the IA. No query pattern benefits from a separate collection.
- A separate collection would require a `goalId` foreign key, an extra
  round-trip or `$lookup` for every Path view, and would duplicate the
  `userId` ownership scoping that today is free — embedded documents
  inherit their parent Goal's authorization scope automatically.
- The existing pattern already works and is exercised in production
  code (`toggleMilestone`). Introducing a new collection here is added
  complexity with no functional benefit — the opposite of the
  Engineering Constitution's "only refactor when it significantly
  simplifies the architecture."

## Alternatives considered

A separate top-level `Milestone` collection with a `goalId` reference
(the original Phase 10 §5 sketch).

**Rejected because:** no real query pattern needs it. It is strictly
more complexity — an extra collection, extra joins, duplicated auth
scoping — for zero benefit given how Milestones are always accessed
through their owning Goal in the locked design.

## Consequences

- No independent top-level routes for Milestones (e.g. no
  `GET /milestones/:id` outside a Goal context) — intentional, matches
  the locked design where Milestones are never a standalone destination.
- A future "all upcoming milestones across every goal" view, if ever
  designed, would require a MongoDB aggregation `$unwind` across Goals
  rather than a simple collection query. Named here as the real cost of
  this choice, not hidden.

## Revisit at

Feature-driven, not scale-driven: if a genuine cross-Goal Milestone
query pattern gets locked into the product design later. Separately, a
single Goal's milestone count growing large enough to threaten
MongoDB's document-size or update-contention limits is a theoretical,
very-large-scale trigger, not a near-term one — no realistic MVP/Beta/V1
usage approaches it.

## Migration strategy if revisited

Additive, not destructive:
1. Write a script that reads each Goal's embedded `milestones` array and
   inserts corresponding documents into a new `Milestone` collection
   with `goalId` back-references.
2. Cut API reads over to the new collection behind the existing
   `goal.service.ts` interface, so callers don't need to change.
3. Run a dual-read comparison period to verify correctness.
4. Remove the embedded array only after that verification passes.
