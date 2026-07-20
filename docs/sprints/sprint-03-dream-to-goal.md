# Sprint 3 — Dream → Goal Conversion

**Status:** Implemented — 2026-07-21, split across two PRs
(`sprint-3-goal-conversion-backend`, `sprint-3-goal-conversion-frontend`)

## Objective

Let a user convert a Dream into their first Goal, effortlessly. User flow:
Dream → Convert to Goal → Goal Created → Return to Dream Detail.

## Decisions (approved before implementation)

- Reuse `POST /goals` rather than a new conversion endpoint; validate
  `dreamId` ownership server-side.
- Return to Dream Detail after creation (no Journey screen this sprint).
- Add a lightweight Dream progress summary (goals linked to a Dream,
  each with a slim progress bar) — client-side filtered, no new endpoint.
- `goal.created` now carries a `source` field (`'manual'` |
  `'dream_conversion'`).
- Milestone creation stays manual — no AI, no Path generation, no
  Reminder work.

## What shipped

**Backend** (`sprint-3-goal-conversion-backend`): exported
`dream.service`'s `findOwnedDream`; `goal.service.createGoal` and
`updateGoal` now call it whenever a `dreamId` is supplied, rejecting
goals linked to a Dream the user doesn't own; `createGoal` emits
`goal.created` with the `source` field. No new endpoints, no schema
changes — `Goal.dreamId` already existed from Sprint 1.

**Frontend** (`sprint-3-goal-conversion-frontend`): `app/goals/new.tsx`
accepts an optional `dreamId` route param and shows a one-line context
banner — same form, same validation, same manual-milestone UX, just
pre-linked; `router.back()` on success returns to Dream Detail
unchanged. Dream Detail gets a "Convert to Goal" CTA (hidden once
archived) and the progress summary section.

## What was deliberately not built (and why)

Applied the standing test — "if this feature disappeared tomorrow, what
user value would be lost?" — to everything considered:

- **Journey screen** — explicitly excluded; Dream Detail already answers
  "did my conversion work" without it. Classified **Future Sprint**
  (Sprint 8 nav cutover).
- **Restricting conversion to one Goal per Dream** — considered, not
  built: the domain model is Dream → many Goals, and no one asked for a
  cap. Classified **Product Backlog**, not current-sprint value.
- **Editing a Goal's linked Dream after creation** — not requested, no
  UI gap identified that blocks the primary flow. Classified **Product
  Backlog**.
- **AI, Prioritization, Reminder, Recovery, Weekly/Monthly Review** —
  explicitly out of scope per the sprint brief.

## Demo checklist

1. Open Settings → Journey → Dreams, create a Dream.
2. Open the Dream, tap **Convert to Goal** — confirm the "Converting
   your dream..." banner shows the right title and the form is the
   familiar Goal form (title, target/unit, manual milestones).
3. Submit — confirm it lands back on Dream Detail (not a generic close),
   and the new Goal now appears under "Goals under this Dream" with a
   0% progress bar.
4. Update the Goal's progress from `/goals/[goalId]` — return to Dream
   Detail, confirm the progress bar reflects it.
5. Archive the Dream — confirm the "Convert to Goal" button disappears.
6. Backend: attempt `POST /goals` with a `dreamId` belonging to another
   user (e.g. via curl/Postman with a valid token) — confirm `404`, not
   a silently-created cross-owned Goal.

## Test evidence

Backend: `npm run typecheck` / `npm run lint` / `npm test` — 5 suites,
41 tests, all passing (7 new: 2 ownership-rejection on create, 1
ownership-rejection on update, 1 null-clear allowed, 2 event-source
assertions, existing dreamId/importance tests updated to use a real
owned Dream instead of a fabricated ObjectId, since that fabricated-id
behavior is exactly what the new validation now correctly rejects).
Frontend: `npm run typecheck` / `npm run lint` clean (root `tsconfig`
excludes `backend/`; CI regenerates Expo Router's gitignored typed
routes before typechecking, per Sprint 1). `npx expo export -p web`
statically rendered all 42 routes, including the modified
`/goals/new` and `/dreams/[dreamId]`, without error.

## Retrospective

- **Went well:** `Goal.dreamId` being added in Sprint 1's prep meant
  zero backend schema/endpoint changes this sprint — validation was a
  ~10-line addition reusing `dream.service`'s existing ownership-check
  pattern. Reusing `goals/new.tsx` via a route param avoided a
  duplicate form entirely.
- **Real gap the new validation caught:** the pre-existing
  `goal.service.test.ts` tests were asserting `dreamId` pass-through
  using a fabricated `ObjectId` that was never backed by a real,
  owned Dream — i.e., they were unknowingly testing the exact hole this
  sprint closed. Updating them to use `createDream()` first is a
  correctness fix, not just a test-infra tweak.
- **Watch for next sprint:** "Journey" is currently a placeholder concept
  — Dream Detail is doing double duty as both a CRUD screen and a
  progress-summary view. That's fine at this scale (one Dream, a
  handful of Goals) but is exactly the kind of thing Sprint 8's nav
  cutover should revisit once a real Journey destination exists.
