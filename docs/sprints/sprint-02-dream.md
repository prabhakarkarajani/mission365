# Sprint 2 — Dream, End-to-End

**Status:** In progress — opened 2026-07-21

## Scope

Per user direction: implement `Dream` — the top of the locked
Dream → Goal → Path → Milestone → Reminder hierarchy — completely,
before touching Goal creation, Path, Milestones, or Reminder. Small,
independently deployable slice.

**In scope:**

- Backend: `Dream` model, service, controller, routes, mounted at
  `/api/v1/dreams` (`backend/src/models/Dream.ts`,
  `backend/src/services/dream.service.ts`,
  `backend/src/controllers/dream.controller.ts`,
  `backend/src/routes/dream.routes.ts`), full Jest coverage
  (`Dream.test.ts`, `dream.service.test.ts`). `createDream` emits a
  `dream.created` event on the Sprint 1 event bus — no listener
  subscribes yet; this is the bus's first real usage, wired for future
  engines (Learning/Memory) rather than any current behavior.
- Frontend: `src/features/dreams/{types,services,hooks}` (the "new
  convention" layout already used by `missions`/`roadmaps`, not the
  older `domain/application/infrastructure/presentation` layout `goals`
  still uses) — CRUD hooks over `/dreams` via the existing `api` client
  and TanStack Query, mirroring `goals`' hook shape.
- Screens: `app/dreams/index.tsx` (list, active/archived tabs),
  `app/dreams/new.tsx` (create), `app/dreams/[dreamId].tsx`
  (view/edit/archive/delete) — reachable via a new "Journey" section on
  the existing Settings screen (`app/settings/index.tsx`). This is a
  deliberately minimal entry point, not a nav change: the Today/Journey/
  You tab-bar cutover is locked for Sprint 8, and touching Goals' UI to
  surface Dream↔Goal linkage is explicitly the *next* sprint, not this
  one.

**Explicitly out of scope (next sprints, not started here):**

- Any Goal-creation UI change to pick/create a `Dream` (Goal already has
  a backend `dreamId` field from Sprint 1 prep, but nothing writes to it
  yet).
- Path (Goal's milestone sequence UI), standalone Milestone work, and
  Reminder — per the user's explicit ordering.

## Why a Dream has no `targetValue`/`deadline`/progress fields

Those are Goal-level, task-oriented concepts. A Dream is identity-level
("who you're becoming"), which is why the model is deliberately thin:
`title`, `description`, `icon`, `color`, `status` (`active`/`archived`
— no `completed`, since a Dream isn't a checklist item).

## Verification

Backend: `npm run typecheck`, `npm run lint`, `npm test` green. Frontend:
`npm run typecheck`, `npm run lint` green. Manually exercised: create,
list (active/archived), edit, archive/restore, delete a Dream from the
Settings → Journey → Dreams entry point.
