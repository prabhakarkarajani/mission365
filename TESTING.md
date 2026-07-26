# Testing Guide — Mission365 RC1

## Test strategy

Two automated layers, deliberately different in shape, plus manual
verification for everything neither layer can reach:

**Backend (`backend/`)** — `ts-jest`, `testEnvironment: 'node'`. Two kinds of
test coexist in the same suite:
- Pure unit tests against models/services/domain logic
  (`mongodb-memory-server` for anything touching Mongo — no real database
  required to run the suite).
- Real HTTP integration tests (`supertest`, added this release —
  `backend/src/routes/auth.http.test.ts`) that exercise the actual Express
  app instance end-to-end: register → login → protected route → refresh →
  protected again, CORS header verification, and negative cases.

**Frontend (root)** — `ts-jest`, `testEnvironment: 'node'`, intentionally
scoped to `src/**/domain/**/*.test.ts` and `src/ai/providers/**/*.test.ts`
only (see `jest.config.js`'s inline comment). This is pure, deterministic,
React-Native-free logic: the Decision Engine and the mock AI provider. **No
React Native Testing Library, no component rendering, no snapshot/visual
tooling is configured** — this is a real, named gap, not an oversight (see
Remaining known risks).

**Static gates**, run in CI on every push/PR to `main`
(`.github/workflows/ci.yml`):
- Backend: `typecheck` → `lint` → `test`.
- Frontend: a heuristic query-error-handling guard
  (`scripts/check-query-error-handling.js`) → `typecheck` → `lint` → `test`.
- Both `npm run typecheck` and `expo export -p web` (exercised manually this
  release, not yet a CI step for the export) act as a whole-program
  correctness check across every route, since TypeScript and Metro's
  bundler both fail loudly on a broken import or route.

**Manual verification** covers everything the two automated layers
structurally cannot: real rendered layout, cross-screen navigation, browser
console/network behavior, and anything visual. This release's manual pass
used a real headless-Chromium browser (Playwright) driving the actual Expo
web dev server against the actual Express/MongoDB backend — not a mock —
because no in-repo tooling exists for this yet.

## Coverage summary

No coverage-percentage tooling (`--coverage`, Istanbul/nyc, etc.) is
configured in either `jest.config.js` — the numbers below are suite/test
counts, not line coverage.

| Suite | Suites | Tests | What's covered |
|---|---|---|---|
| Backend (`backend/`) | 9 | 91 | Auth (unit + HTTP integration), Dream/Goal/Habit models & services, habit↔goal linkage validation, event bus, env config validation |
| Frontend (root) | 2 | 28 | Decision Engine (`pickFirstMission` — empty state, completed/skipped exclusion, every reason firing and not firing, streak cap, tie-breaks, score-equals-sum invariant), mock AI provider (every chat-producing quick action, roadmap reply with/without an active goal, fallback path) |

**Structurally untested by either suite** (by design, not oversight): every
`app/**/*.tsx` screen component, every `src/features/**/presentation/*.tsx`
component, navigation behavior, and anything requiring a rendered DOM/RN
tree. This is the gap this release's manual QA pass exists to cover.

## Manual QA checklist

This is the checklist actually executed for RC1 (register → ... → re-login),
driven through a real browser at three viewports, with console/network/HTTP
error capture. Re-run this whenever a UI-affecting change lands, until
component/E2E automation exists to replace it.

**Setup**
- [ ] Backend running against a real MongoDB (Docker or otherwise), not
      `mongodb-memory-server` — that's test-only
- [ ] `expo start --web` running, pointed at the local backend
      (`app.json`'s default `http://localhost:4000/api/v1` when
      `extra.apiUrl` isn't overridden)

**API reachability** (can be done with `curl` before touching the UI)
- [ ] Every route under `/api/v1/*` responds (register, login, refresh,
      logout, me, habits incl. `/today`/`/logs`/completion/skip/archive,
      goals incl. progress/milestones, dreams, journal, trackers incl.
      summary, focus, achievements, analytics×4, users)
- [ ] Auth edge cases: no token → `401`; garbage token → `401`; duplicate
      email → `409`; wrong password → `401`; weak password → `400`;
      malformed email → `400`; unknown route → `404`

**Full user journey** (real browser, real clicks — not direct URL jumps,
which skip the router's back-stack and produce false navigation failures)
- [ ] Register → lands past onboarding (skip the tour and the AI goal-builder
      wizard where offered)
- [ ] Create a Dream (via Home → Dreams quick action → "+")
- [ ] Create a Goal (via Goals tab → "+", or via a Dream's "Convert to Goal")
- [ ] Create a Habit/Mission linked to that Goal (via Missions tab → "+")
- [ ] Open Today (via Home → Today quick action) — confirm the "Recommended
      First Mission" card and "Why this first?" disclosure
- [ ] Complete a mission — confirm progress count updates, any achievement
      toast doesn't cover the header
- [ ] Undo, then mark a mission "Not Today" — confirm it goes muted with an
      Undo action and doesn't count toward progress
- [ ] Open Coach (Maya) — confirm suggested-prompt chips are compact pills,
      not stretched ovals
- [ ] Tap "Generate Roadmap" — confirm a real reply referencing the actual
      current goal, not a generic greeting
- [ ] Logout, then log back in with the same credentials — confirm re-auth
      and that previously-created data (Dream/Goal/Habit) is still there

**Cross-cutting checks, every screen visited above**
- [ ] Console: no errors, note any warnings
- [ ] Network: no failed requests, no HTTP ≥400 responses
- [ ] Loading state present for any data fetch
- [ ] Error state (with retry) present, not a false empty state, if a fetch
      is forced to fail
- [ ] No layout breakage at 375px, 430px, and a desktop width (~1440px)
- [ ] Page loads / navigations complete in a couple hundred ms to low
      seconds, not multi-second stalls

**Regression-specific checks** (each ties to a named past bug — see
[CHANGELOG.md](CHANGELOG.md))
- [ ] Long Coach chat replies wrap inside their bubble, don't overflow
      off-screen
- [ ] Dark Mode survives a reload
- [ ] A forced-failed request on the Goals tab shows `ErrorState` + retry,
      not "no goals yet"

## Remaining known risks

- **No React Native component or E2E test automation.** Every screen-level
  bug this release and the prior sprint's regression audit found (layout
  breakage, navigation dead-ends, overlapping toasts, silently-masked query
  errors) was caught by manual/Playwright verification, not by the
  automated suites — none of it is re-checked automatically on the next
  change. This is the single largest testing gap in the project.
- **The query-error CI guard is a heuristic**, not a type-aware check
  (`scripts/check-query-error-handling.js` — flags `isLoading` present
  without `isError` in the same file). It can't catch every variant of the
  masking bug it was written against, only that specific shape.
- **No coverage-percentage tooling** — the suite/test counts above are the
  only quantitative signal available; there's no way to see what fraction
  of either codebase's logic is actually exercised.
- **`expo export -p web`'s clean-route-render check is manual**, run by
  hand after changes in this release's process, not a CI step. A route that
  fails to statically render would not currently be caught automatically
  before merge.
- **The manual QA pass is run once, by hand, per release** — it is not
  repeated automatically on every future deploy (see
  [DEPLOYMENT.md](DEPLOYMENT.md) for the production smoke test, which is a
  subset of this checklist and is also manual).
- **No staging environment** — the manual QA pass above runs against a
  local stack; nothing currently repeats it against the real production
  Render/Vercel pair before real users see a change.
