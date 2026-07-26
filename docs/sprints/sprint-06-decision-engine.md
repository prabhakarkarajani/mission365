# Sprint 6 — Decision Engine v1

**Status:** Implemented — 2026-07-21, on `sprint-6-decision-engine`
(branched from `main` after fast-forwarding Sprints 1-5 into it)

## Objective

When a user opens Today, Mission365 recommends exactly one mission to
start first, and explains why - deterministically, explainably, without
AI.

## Why this sprint's scope changed twice before any code was written

The original brief assumed a Habit↔Goal relationship and asked for an
Impact Report before coding. Two rounds of re-audit found:

1. **The relationship already exists, on an unmerged branch.** `main` was
   13 commits behind `sprint-5-habit-goal-linkage-frontend` (Sprints 1-5,
   ADR-001/002/003) - a pure fast-forward, zero divergence. That branch's
   own history shows this engine was **already scoped once**, as
   "Sprint 5 — Prioritization Engine v1," and deliberately deferred
   because Goal Importance/Target Date had no real data behind them yet
   (see `docs/adr/0003-habit-goal-milestone-linkage.md`). Sprint 5 built
   the relationship; this sprint is the deferred engine.
2. **`Goal.importance` and `Goal.deadline` are real fields with no real
   data.** Both are accepted by the backend API (`importance` 1-5,
   default 3), but no frontend UI - not `app/goals/new.tsx`, not the
   `Goal` domain type - ever collects them. Every goal that exists in the
   real app has `importance === 3` and `deadline === null`. Scoring by
   them would add the same number to every mission linked to any goal,
   which is false precision, not a signal. Excluded from v1 for that
   reason, not because they're unimportant.

Per-input classification (real user data vs. dormant schema) is in the
PR description / conversation Impact Report, not duplicated here.

## What shipped

**`src/features/decision-engine/`** (own feature, not nested under
`home` or `missions` - Home/Today consume it, and it's the shared seam
future consumers like Maya/Journey/Recovery/Notifications would use):

- `domain/types.ts` - `DecisionReason` (`code` + `weight` + optional
  `data`, no UI strings) and `DecisionResult` (`mission | null`, `score`,
  `reasons[]`).
- `domain/decisionEngine.ts` - `pickFirstMission(missions, activeGoals,
  now)`. Reasons are derived first; `score` is always the sum of the
  returned reasons' weights, never a separate calculation. Depends only
  on real, populated inputs: `Mission.priority` (from the habit's chosen
  category), `reminderTime`, `currentStreak`, and a real `goalId` link
  resolved against currently-active goals. Deterministic tie-break:
  score desc → earliest `reminderTime` → mission id.
- `domain/decisionEngine.test.ts` - 14 cases: empty state, completed/
  skipped exclusion, each reason firing and *not* firing (including the
  goalId-points-nowhere case), the streak cap, both tie-break levels, and
  score-equals-sum-of-reasons as its own invariant.
- `presentation/reasonCopy.ts` - the one place a `DecisionReason` becomes
  a sentence; the engine itself never returns UI strings.

**`Mission` projection extended** (additive, same pattern Sprint 5 used
for `goalId`/`milestoneId`): `priority`, `reminderTime`, `currentStreak`,
computed in `habitToMission()` via the existing `missionPresentation.ts`
heuristic - not a new one. This also makes `Mission.priority` genuinely
real for the first time; ADR-002 had noted the old scaffold's `priority`
was always a hardcoded `'MEDIUM'` placeholder.

**Frontend**: `app/today/index.tsx` (Sprint 4's Mission-projection
screen) gains a "Recommended First Mission" card above the list, with a
"Why this first?" disclosure listing the translated reasons. Not added
to the Home tab - Home still renders its own independent "today's
missions" view via `useHomeBrief`, and Sprint 4's retrospective already
flagged that duplication as something Sprint 8's nav cutover resolves,
not this one.

**Test infra (frontend, net-new)**: root `jest.config.js` +
`tsconfig.jest.json` (ts-jest, scoped to `src/**/domain/**/*.test.ts` -
pure logic only, no RN/component transform set up yet), `test` script,
CI's frontend job renamed to `typecheck, lint, test` with a `npm test`
step. Root `tsconfig.json` now excludes `**/*.test.ts` from the main app
compile - Expo's `moduleResolution: "bundler"` couldn't see Jest's
ambient globals in the same pass, and app bundle code has no reason to
depend on test-only types anyway; ts-jest typechecks test files itself
via the separate config.

## Real findings this sprint

- **`main` was stale by 13 commits**, discovered only because the user
  asked for a re-audit rather than accepting the first Impact Report's
  (wrong) premise that the linkage didn't exist. Fast-forwarded, not
  merged - it was a strict ancestor, so no conflict resolution was
  possible or needed.
- **A dormant field is worse than a missing one for an explainable
  engine.** `Goal.importance` passing backend validation made it look
  available; only checking whether any UI actually varies it revealed it
  never does. The same check should be applied to any future factor
  before it's wired into scoring.

## What was deliberately not built

GPT/Maya/OpenAI, Recovery, Weekly Review, Notifications, adaptive/learned
weights (all explicitly out of scope per the brief). Also **not** built,
classified rather than skipped: scoring by `Goal.importance`/`deadline`
or `Milestone.targetDate` (dormant - see above); a "scarcity" reason for
weekly/custom-frequency missions (would misrepresent real behavior, since
`getTodayOverview` doesn't actually filter by `daysOfWeek` - pre-existing
gap, not this sprint's to fix); reconciling Home's independent mission
list with Today's (Sprint 8's job per Sprint 4's own retrospective).

## Demo checklist

1. Create a Goal, then a Habit linked to it via the "Goal (optional)"
   picker (Sprint 5), with a `health`/`morning` category, a reminder time
   in the near future, and let it build a streak.
2. Create a second, unlinked, `other`-category habit with no reminder.
3. Open Settings → Daily → Today - confirm the "Recommended First
   Mission" card shows the linked habit above the list.
4. Tap "Why this first?" - confirm the reasons read as real sentences
   (priority tier, streak, reminder timing, linked goal by name) with no
   raw codes visible.
5. Complete or skip every mission - confirm the card disappears (no
   mission to recommend).
6. `npm test` (root) - 14/14 passing. `npm run typecheck` / `npm run
   lint` (root and `backend/`) clean. `npx expo export -p web` renders
   all routes including `/today`.

## Test evidence

Root: `npm run typecheck`, `npm run lint` (2 pre-existing unrelated
warnings, same ones Sprint 5 reported), `npm test` - 1 suite, 14 tests,
all passing (net-new - frontend had no test runner before this sprint).
Backend: `npm run typecheck` / `npm run lint` / `npm test` - 7 suites, 64
tests, all passing, unchanged from Sprint 5 (backend was not touched).
`npx expo export -p web` - all 44 routes render, including the modified
`/today`.

## Retrospective

- **Went well:** the re-audit habit paid for itself twice in one
  conversation - first catching that `main` was behind a fully-built
  relationship, then catching that the relationship's own fields
  (`importance`/`deadline`) were real-but-dormant despite being
  API-accepted. Neither would have surfaced from reading `main` alone.
- **Classified, not built:** Goal-importance/deadline weighting and
  Milestone-linkage weighting are **Future Sprint**, unblocked the moment
  a real UI sets `Goal.importance`/`deadline` or ships the milestone
  picker - not silently dropped.
- **Watch for next sprint:** Home (tab) and Today (buried in Settings)
  still render two independent "today" views; this sprint added a third
  thing (the recommendation) to only one of them. Sprint 8's nav cutover
  is the named point where this should resolve, not before.
- **See the regression audit below** - four live bugs were found testing
  the Coach screen during Sprint 7 kickoff. Two turned out to be isolated;
  two were one instance of a systemic pattern each, and every other
  instance has now been fixed in the same pass, not left for later.

## Regression audit (performed before Sprint 7 kickoff)

Triggered by a user bug report against the live Coach screen (chat text
cut off, "Generate Roadmap" replying with a generic greeting). Both were
fixed, then per this doc's own governing rule (never fix only the
reproduced case if the pattern could recur), every other screen in the
repo was audited for the same root cause before Sprint 7 started. Two of
the four fixes below surfaced a second, non-obvious instance beyond the
one originally reported.

### Fix 1: Chat bubble text overflowing off-screen on web

- **Root cause:** react-native-web's `View` defaults to `flexShrink: 0`
  (unlike plain CSS, where the default is `1`). A flex-row child wrapping
  non-truncated text with no explicit `flex-1`/`shrink`+`min-w-0` refuses
  to shrink to the row's width and overflows past it instead of wrapping.
  `ChatBubble`'s message container (`app/(tabs)/coach.tsx`) hit this
  exactly: an avatar (fixed width) next to a bubble `View` with no flex
  classes at all.
- **Affected files:** only `app/(tabs)/coach.tsx`. All 49 files containing
  `flex-row` across `app/` and `src/` were audited (every Home card,
  achievements, journal, dreams, goal-builder roadmap, weekly review,
  upcoming reminders, achievement toast, offline banner, mission/habit
  list rows). Every other instance already used `flex-1` on the
  text-wrapping container, truncated via `numberOfLines`, or placed the
  text outside any row entirely - the Coach bubble was the one place that
  broke that existing convention, not a systemic pattern.
- **Fix:** added `min-w-0 shrink` to the bubble `View` and `flex-shrink`
  to its `Text`.
- **Prevention strategy:** no shared "wrapping row + fixed sibling"
  component exists to enforce this by construction. Documented here as
  the convention every future flex-row-with-wrapping-text needs to follow
  by hand: the text-bearing child must carry `flex-1` (or explicit
  `shrink`+`min-w-0`) - RN-Web will not shrink it for you.
- **Regression test coverage: none possible with current infra.** This
  repo's Jest setup (`jest.config.js`) is `ts-jest` on `testEnvironment:
  node` - pure logic only, no DOM/RN renderer, no visual/snapshot tooling.
  A real regression test would need React Native Testing Library (or
  Playwright screenshot diffing, as used manually to verify this fix) -
  neither exists in this repo yet. Flagged as a genuine coverage gap, not
  silently skipped - see the health report's Testing Coverage section.

### Fix 2: "Generate Roadmap" quick action falling back to a generic greeting

- **Root cause:** `mock.provider.ts`'s `generateMockChatReply` matches
  user text against a fixed list of keyword substrings; no branch existed
  for `'roadmap'`, so the exact text `app/(tabs)/coach.tsx`'s "Generate
  Roadmap" quick action sends fell through every check to the generic
  `fallbackReply`.
- **Affected files:** only `src/ai/providers/mock/mock.provider.ts`. All
  six `SUGGESTED_PROMPTS` entries in `app/(tabs)/coach.tsx` were audited:
  four (`Plan My Day`, `Review Goals`, `Generate Roadmap`, `Motivate Me`)
  send chat text and now all match a real branch; the other two
  (`Weekly Review`, `Reschedule Mission`) `router.push` directly and never
  reach this function, so they were never at risk.
- **Fix:** added `generateRoadmapReply()` + a `text.includes('roadmap')`
  branch - reports no-active-goal honestly, or the real current goal's
  title/progress/deadline when one exists.
- **Prevention strategy:** the new test below (one case per chat-producing
  quick action) means adding a seventh quick action, or renaming an
  existing one, without a matching keyword branch now fails CI instead of
  silently degrading to the generic greeting in production.
- **Regression test coverage: 8 new tests**,
  `src/ai/providers/mock/mock.provider.test.ts` - the exact roadmap
  regression string, the no-goal and has-goal roadmap replies, one
  `it.each` case per chat-producing quick action asserting none fall back
  to the generic greeting, and one case confirming genuinely unrecognized
  text still does fall back (protects the fallback path itself from
  being accidentally deleted). `jest.config.js`'s `testMatch` was widened
  from `src/**/domain/**/*.test.ts` to also include
  `src/ai/providers/**/*.test.ts`, since the mock provider is the same
  category of pure, RN-free, deterministic logic as the `domain/` layer -
  documented inline in the config, not a silent scope change.

### Fix 3: Dark Mode preference reverting to light on reload

- **Root cause:** Settings' toggle (`app/settings/index.tsx`) calls
  NativeWind's `setColorScheme()`, which only affects the current
  in-memory session, and separately persists the choice to the backend
  (`user.appearance.colorScheme`) - but nothing ever read that persisted
  value back and re-applied it on the next app boot/reload, so the theme
  silently reverted to NativeWind's system default every time.
- **Affected files - two instances of the same shape found, both fixed:**
  - `app/_layout.tsx` (Dark Mode) - the one originally reported.
  - `app/_layout.tsx` (Daily Reminder notification) - found by auditing
    for the same shape ("a Settings toggle applies a client/device-side
    effect, but nothing reconciles the persisted preference on boot").
    `Goal`-adjacent but unrelated feature: the backend defaults
    `notificationPreferences.dailyReminder` to `true` for every new user,
    but `scheduleDailyReminder()` was only ever called from the Settings
    toggle handler - meaning **no user who hadn't manually toggled the
    switch off and back on ever actually got the notification scheduled
    on-device**, despite the switch showing "on" and the backend
    recording it as enabled. Habit-level reminders were already correctly
    reconciled on boot via `useSyncHabitReminders` (mounted from
    `app/(tabs)/habits.tsx`) - only this user-level preference was missed.
- **Fix:** two `useEffect`s in `app/_layout.tsx`, both keyed off fields of
  the already-rehydrated `useAuthStore` user: one calls
  `setColorScheme(user.appearance.colorScheme)`, the other calls
  `scheduleDailyReminder()`/`cancelDailyReminder()` based on
  `user.notificationPreferences.dailyReminder` (checking
  `hasNotificationPermission()` first, never proactively prompting -
  matching `useSyncHabitReminders`' existing policy).
- **Prevention strategy:** documented as a general rule at the fix site -
  any persisted user preference that implies a client- or device-side
  effect must be reconciled once at boot in `app/_layout.tsx`, not only
  applied reactively inside whichever Settings handler toggles it. The
  next preference added to Settings should be checked against this rule
  before shipping, not after a bug report.
- **Regression test coverage: none possible with current infra.** Both
  fixes live in a root layout component wired to `expo-splash-screen`,
  `expo-router`'s `Stack`, font loading, and `expo-notifications` - none
  mockable without React Native Testing Library (component tests) and
  native-module mocks, neither of which exist in this repo yet. Verified
  manually instead: Playwright driving a local dev build confirmed the
  Dark Mode toggle now survives navigation and reload across five tabs,
  two viewport widths, and light/dark. Flagged as a coverage gap, not
  silently skipped.

### Fix 4: Query errors silently rendered as empty states

- **Root cause:** screens destructured only `isLoading` (never `isError`)
  from their React Query hooks. On a failed request, `isLoading` becomes
  `false` and `data` stays `undefined` - indistinguishable, in every one
  of these screens' own logic, from a genuinely empty account. A fully
  built `ErrorState` component (`src/shared/ui/ErrorState.tsx`, complete
  with a Retry button) already existed in the shared UI kit and was wired
  into **zero** screens app-wide before this audit.
- **Affected files - 10 screens fixed** (found by grepping every `app/`
  screen using `isLoading` or a data-fetching hook, then checking each for
  `isError`; `app/goal-builder/roadmap.tsx` already handled this
  correctly and needed no change):
  - `app/(tabs)/goals.tsx` - the one originally reported.
  - `app/(tabs)/habits.tsx`, `app/achievements/index.tsx`,
    `app/dreams/index.tsx`, `app/journal/index.tsx`,
    `app/today/index.tsx` - same list-screen shape, same fix (an
    `isError` branch rendering `ErrorState` + retry before the
    empty-state check).
  - `app/analytics/index.tsx`, `app/weekly-review/index.tsx` - a related
    but distinct shape: a full-screen `isLoading || !data` gate that, on
    error, showed "Loading..." **forever** rather than a masked empty
    state - arguably worse, since it never resolves into anything
    actionable. Both now branch on `isError` first.
  - `app/trackers/index.tsx`, `app/calendar/index.tsx` - the mildest
    variant: no loading state either, just `?? 0`/`?? '–'` fallbacks, so
    a failed request silently displayed fabricated zero values (e.g. "0ml
    water today") with no indication anything had gone wrong. Both now
    show a non-blocking `ErrorState` banner above the existing content
    rather than a full-screen replacement, since the rest of each screen
    (grid, log-entry forms) doesn't strictly require the failed query.
  - `app/(tabs)/home.tsx` + `src/features/home/application/useHomeBrief.ts`
    - the hook itself had no `isError` at all, and its exposed `refetch`
      silently only refetched the missions query, never goals - meaning
      pull-to-refresh on Home could never actually recover from a stale
      or failed goals fetch. Added `isError` (combining both underlying
      queries) and made `refetch` await both.
- **Prevention strategy:** no lint rule or shared hook currently enforces
  "every screen consuming a query must handle `isError`" - that's the
  real systemic gap this pattern exposes, and it's why it reached 10
  screens instead of 1. Recommended in the health report below
  (Testing/Code-quality sections) rather than built now, since adding a
  custom ESLint rule or a `useQueryState`-style wrapper hook is new
  infrastructure, not a bug fix, and is exactly the kind of unrequested-
  but-good idea this project's workflow says to classify and flag rather
  than build inline.
- **Regression test coverage: none possible with current infra**, same
  reason as Fixes 1 and 3 - these are all React Native screen components
  needing React Native Testing Library to render and assert against,
  which isn't set up. Verified manually instead: Playwright against a
  local dev backend, forcing `GET /goals` to `500` via request
  interception, confirmed `ErrorState` + working Retry renders in place
  of the old false-empty state. Flagged as a coverage gap.

### Updated test evidence

Frontend: `npm run typecheck`, `npm run lint` (still the same 2
pre-existing unrelated warnings), `npm test` - **2 suites, 28 tests**, up
from 1 suite/14 tests (14 original + 6 added for Sprint 7's `GOAL_URGENCY`
+ 8 new for this audit's Fix 2). Backend unchanged, 7 suites/64 tests.
`npx expo export -p web` - all 44 routes still render.
