# Sprint 1 — Engineering Foundation

**Status:** Closed — 2026-07-21

## Scope

Per the Build Mode 8-sprint MVP plan, Sprint 1 is foundation work only — no
user-facing product features. Delivered:

1. **Test infrastructure** — Jest + `ts-jest` + `mongodb-memory-server`
   (`backend/jest.config.js`, `backend/src/test/mongoMemory.ts`,
   `backend/src/test/setupEnv.ts`), the one non-negotiable prerequisite
   flagged in Phase 10's technical architecture. First specs:
   `backend/src/models/Goal.test.ts`, `backend/src/services/goal.service.test.ts`.
2. **Goal model prep for Dream/Milestone linkage** — `Goal.dreamId`,
   `Goal.importance` (feeds the Prioritization Engine's two-layer Impact
   Score), and embedded milestone `order`/`targetDate` fields. See
   [ADR-001](../adr/0001-goal-milestones-embedded.md) for why milestones
   stay embedded rather than becoming a top-level collection.
3. **Lightweight internal event bus** (`backend/src/lib/eventBus.ts`) — an
   in-process, typed-payload pub/sub wrapper over Node's `EventEmitter`,
   with full unit coverage (`backend/src/lib/eventBus.test.ts`). Deliberately
   not backed by Redis/BullMQ, consistent with the Redis/BullMQ-timing ADR
   (deferred past MVP). Ships with zero listeners wired up — it's
   infrastructure for future engines (e.g. Learning, Memory) to subscribe
   to domain events without coupling them to the services that emit them,
   not a feature in itself.
4. **CI pipeline** (`.github/workflows/ci.yml`) — two jobs on push/PR to
   `main`: backend (`typecheck` → `lint` → `test`) and frontend
   (`typecheck` → `lint`). No native/EAS build step — this is a fast
   static-correctness gate, not a release pipeline. Fixed a latent bug
   found while wiring this up: the root `tsconfig.json` had no `exclude`,
   so frontend `tsc` was silently type-checking `backend/` (including
   Jest globals it has no types for) — added `exclude: ["node_modules",
   "backend", "dist", "ios"]` and a root `typecheck` script. Also fixed
   (discovered during Sprint 2, folded back in here since it's the same
   file): `.expo/` is gitignored, so a fresh checkout has no generated
   Expo Router typed-routes declaration — `tsc` failed on every
   `router.push()` on a clean CI runner. The frontend job now boots
   `expo start --web` briefly to let Metro write
   `.expo/types/router.d.ts`, polls for it, then kills the dev server
   before running `typecheck`/`lint`.
5. **Migration Impact checklist** added to `.github/pull_request_template.md`
   (section 5) — every PR touching a Mongoose schema must now state
   whether the change is additive, whether existing documents stay valid,
   and whether rollback is safe.

## Deferred to later sprints

`Dream`, standalone `Milestone` collection (explicitly rejected, see
ADR-001), `Reminder`, `CapabilityLadderSettings` models were listed in the
original Sprint 1 scope but not built here — the user re-scoped this
session to close Sprint 1 on pure engineering foundation and open Sprint 2
with `Dream` alone, end-to-end, before any other model. See
[sprint-02-dream.md](./sprint-02-dream.md).

## Verification

`backend`: `npm run typecheck`, `npm run lint`, `npm test` all green
(3 suites / 21 tests passing). `frontend` (root): `npm run typecheck`,
`npm run lint` (`expo lint`) both green.
