# ADR-004: Maya (AI Coach) moves entirely server-side

**Status:** Accepted — 2026-07-26 (Phase 1 implemented; Phases 2-5 planned, not yet built)

## Context

Maya has never actually talked to a real AI model. `src/ai/core/adapters/createAIProvider.ts`
selected a provider (`mock`/`openai`/`claude`/`gemini`/`groq`/`ollama`) via
`process.env.EXPO_PUBLIC_AI_PROVIDER` — every real provider module was a
stub delegating straight to the mock, each tagged
`// TODO(Phase 4): replace with a real X SDK call once an API key is
configured.` Nothing had ever wired one up.

That wiring was also the wrong shape to finish. `EXPO_PUBLIC_*` variables
are compiled directly into the Expo client bundle (web and native). Filling
in a real adapter under the old architecture — the natural next step,
mechanically — would have shipped a vendor API key inside the app for
anyone to extract from the bundle or a device. The fix had to be
architectural before it could be a real integration: move every AI vendor
call to the backend, where a key can actually stay a secret, and make the
mobile/web app talk only to Mission365's own API.

## Decision

All AI provider integrations move to `backend/src/ai/`, mirroring the
shape the frontend's `src/ai/` used to have (an `AIProvider` interface, a
`createAIProvider()` factory, one module per vendor) so the pattern is
familiar, but keyed on a server-only `env.AI_PROVIDER` var — never an
`EXPO_PUBLIC_*` one. The mobile/web app calls a new `/api/v1/coach/*`
surface and never imports a vendor SDK or holds a vendor key.

Built in phases, shipping a real working integration first rather than
scaffolding every layer before anything actually talks to a model:

1. **Phase 1 (this ADR, implemented):** `AIProvider` interface, the
   factory, a ported `mock` provider (the CI/test default forever), and a
   real `openai` provider with timeout/retry/logging/graceful-fallback
   built in from the start — not added later. One endpoint,
   `POST /coach/chat`, with context assembled server-side but deliberately
   thin (`{user: {name, level, xp, currentStreak}}`) and no server-side
   conversation persistence yet (the client still holds/sends recent
   history, same as before). Proactive suggestion cards + a mood check-in
   sheet ship in this phase too, not later — cheap UI work that doesn't
   need context-awareness to be worth having.
2. **Phase 2 (planned):** `buildCoachContext()` grows to the full picture —
   Dreams, Goals (with a precomputed `behindPace` flag), today's missions,
   a ported Decision Engine recommendation, and recent activity — so
   replies are grounded in real, specific data instead of being generically
   helpful.
3. **Phase 3 (planned):** streaming (`chatStream`, SSE), additive to the
   interface.
4. **Phase 4 (planned):** conversation history moves server-side
   (`CoachMessage` model), replacing client-held state as the source of
   truth.
5. **Phase 5 (planned):** Claude, Gemini, and Ollama adapters, added behind
   the same interface with zero frontend changes — the point the whole
   architecture is built to prove.

## Decision Engine duplication (Phase 2)

The Decision Engine (`pickFirstMission`/`deriveReasons`,
`src/features/decision-engine/domain/decisionEngine.ts`) has no backend
counterpart today — it's a pure function over client-fetched `Mission[]`/
`Goal[]` invoked once, client-side, from `app/today/index.tsx`. Phase 2
ports it (weights copied verbatim) into `backend/src/domain/decisionEngine.ts`,
adapted to run over `getTodayOverview`'s habit/log data directly.

This is accepted, intentional duplication, not an oversight: the same
scoring logic is now hand-maintained in two places (frontend, for Today's
fast client-side render; backend, for Maya's context). A shared package is
explicitly out of scope until the weights actually drift in practice or a
third consumer appears — this repo has no monorepo/workspace
infrastructure today, and building one speculatively for a ~150-line,
already-tested pure function is disproportionate to the problem it would
solve. Each ported constant is commented `// mirrors
src/features/decision-engine/domain/decisionEngine.ts — keep in sync
manually`.

## Alternatives considered

**Keep provider selection client-side, only swap in real vendor calls.**
Rejected outright — this is the exact architecture that would leak a
vendor key into the shipped app the moment a real adapter was filled in.
Not a viable starting point at all, regardless of phasing.

**Client sends its own assembled context in the request body** (continuing
today's `useCoachContext()` pattern, just pointed at a new endpoint instead
of `createAIProvider()`). Rejected for Phase 2 onward: a client that
controls its own "context" could assert false things about its data, or
smuggle a prompt-injection payload disguised as a goal/mission title it
doesn't even own. Context is assembled server-side from `req.userId` from
Phase 1 onward, even while it's still thin — the trust boundary is
established before there's much to protect, not bolted on once there is.

**Ship every phase's scaffolding before any real vendor call** (mock
provider + full context + persistence + streaming seam, then finally wire
up OpenAI). Rejected per explicit direction: a working, secure,
real-AI-backed chat is more valuable to ship and validate first than a
complete but still-mocked pipeline. Richness (context, streaming, memory)
layers on afterward without changing the Phase 1 contract's shape.

**Silently fall back to the mock's keyword-matched reply when the real
vendor fails.** Rejected — a canned reply that sounds confident but isn't
grounded in what was actually asked is worse than an honest "having
trouble connecting" message. `openaiProvider.chat()` returns a friendly
static apology after retries are exhausted rather than a fabricated-sounding
answer.

## Consequences

- `src/ai/` (the entire old adapter layer, all provider stubs, the roadmap
  prompt builder) is deleted, not deprecated in place — it was the
  insecure pattern being replaced, so there was no reason to keep it
  running for even one more phase.
- Roadmap generation (`app/goal-builder/wizard.tsx` →
  `app/goal-builder/roadmap.tsx`) was **not** part of this migration — it's
  self-contained (no context/streaming/persistence dependency) and was
  already 100% deterministic client-side math with zero vendor involvement,
  so there was no security motivation to move it yet. Its types
  (`RoadmapGenerationInput`, `GeneratedRoadmap`, etc.) moved to
  `src/features/roadmaps/types/roadmap.types.ts` and its generation logic
  to `src/features/roadmaps/domain/generateRoadmapLocally.ts`, unchanged in
  behavior, so deleting `src/ai/` didn't break the goal-builder wizard. A
  real `POST /coach/roadmap` (backend-generated, same pattern as chat) is a
  named, scoped-but-not-built fast-follow.
- The Coach feature's request/response shape changes at every later phase
  (Phase 2 enriches `CoachContext`, Phase 4 simplifies the chat request
  body once the server holds history) — each change is additive to the
  existing contract, not a breaking rewrite, by design.
- First per-route rate limiter in this backend (`coachRouter`, 30 req/15min)
  — a new precedent, justified because AI calls are the only endpoints that
  are both slow (multi-second vendor round-trips) and directly cost money
  per call.
- `backend/src/config/env.ts` gains its first "conditionally required"
  validation rule (`OPENAI_API_KEY` required only when `AI_PROVIDER=openai`)
  — a new pattern in that file, not a copy of an existing one, since every
  prior secret was unconditionally required.

## Revisit at

Decision Engine duplication: if the two copies' weights actually drift, or
a third consumer needs the same scoring logic — extract a shared package
then, not speculatively now. Roadmap generation server-side: when wanted,
not blocking on anything else in this ADR. Streaming/conversation memory:
per the phase plan above, each independently shippable and verifiable.
