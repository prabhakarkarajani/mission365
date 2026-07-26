# RC1 Deployment Checklist

**Status:** Final artifact before public deployment. Do not edit code from this
document - if a step here turns up a problem, fix it through the normal
process and re-issue this checklist, don't patch code inline while deploying.

**Prerequisite:** RC1 sign-off. Every Release Gate in the RC1 report (backend
tests, frontend typecheck/lint, security, regression, performance, manual QA)
passed. This checklist assumes that report's fixes (B1 production-config
validation, B2 HTTP integration tests, B3 query-error CI guard) are the exact
commits being deployed.

---

## 1. Render Deployment (Backend API)

Render project already exists (`mission365-api.onrender.com`) — no
`render.yaml` is committed, so these settings live in the Render dashboard.
Verify, don't recreate:

- [ ] **Root directory:** `backend`
- [ ] **Build command:** `npm ci && npm run build` (compiles `src/` →
      `dist/` via `tsc`; `npm ci`, not `npm install`, so the deploy uses
      exactly what's in `package-lock.json`, including this release's new
      `supertest`/`@types/supertest` devDependencies — devDependencies don't
      ship in the built output, only used during the build/test step, so
      confirm Render isn't set to `--omit=dev` in a way that would also skip
      the build step's own tooling)
- [ ] **Start command:** `npm start` (runs `node dist/server.js`)
- [ ] **Node version:** 22, matching `.github/workflows/ci.yml`'s
      `actions/setup-node` version — confirm Render's Node version setting
      matches, since a mismatch is a plausible source of a build that passes
      in CI but fails on Render
- [ ] **Health check path:** `/health` (route confirmed in
      `backend/src/app.ts`; returns `{"success":true,"data":{"status":"ok",...}}`
      with HTTP 200 and requires no auth)
- [ ] **Auto-deploy branch:** confirm it's watching `main` (or whichever
      branch RC1 merges into) and not left pointed at a stale branch
- [ ] **No Dockerfile exists** — this deploy relies on Render's native
      Node buildpack. If Render's dashboard shows a Docker-based service
      instead, that's a configuration drift to resolve before deploying,
      not something to silently work around.

## 2. Vercel Deployment (Frontend Web)

Vercel project already linked (`.vercel/project.json`,
`projectId: prj_lBL188I2D6XXoGavYKPn84bNftVN`). `vercel.json` (committed,
verified this session) defines:

```json
{
  "buildCommand": "npx expo export -p web",
  "outputDirectory": "dist",
  "framework": null,
  "cleanUrls": true,
  "rewrites": [{ "source": "/:path*", "destination": "/" }]
}
```

- [ ] **No `app.config.js`/`app.config.ts` exists in this repo** — confirmed
      this session. This means `app.json`'s `extra.apiUrl` is a **static
      value baked into the build**, not something Vercel's dashboard
      environment variables can override. There is currently no dynamic
      env-based mechanism for this.
- [ ] **Critical manual step:** before triggering the Vercel build, confirm
      `app.json` → `expo.extra.apiUrl` is set to the real production backend
      URL (`https://mission365-api.onrender.com/api/v1` as of this session -
      re-verify it hasn't changed). If Render's URL ever changes, this file
      must be updated and committed *before* the next Vercel deploy - Vercel
      has no way to inject a different value at build time today.
- [ ] Confirm the rewrite rule (`/:path*` → `/`) is intentional for every
      route Expo Router generates - this is what makes client-side routing
      work on a static host; a misconfigured rewrite would 404 on direct
      navigation to any non-root URL (e.g. a shared link to `/goals/new`).
- [ ] Confirm the Vercel project's Node version for the build step is
      compatible with the Expo SDK in use (matches what CI's frontend job
      uses: Node 22).

## 3. Required Environment Variables

### Render (backend) — validated at boot by `backend/src/config/env.ts`

| Variable | Required | Production constraint |
|---|---|---|
| `NODE_ENV` | Yes (Render should set `production`) | Enables all production-only checks below |
| `PORT` | No | Render injects this automatically; the app already reads `process.env.PORT` |
| `MONGODB_URI` | Yes | Must start with `mongodb://` or `mongodb+srv://` |
| `JWT_ACCESS_SECRET` | Yes | ≥16 chars; must not equal `JWT_REFRESH_SECRET`; must not contain a placeholder marker (`replace-with`, `change-me`, `your-secret`, `example`) |
| `JWT_REFRESH_SECRET` | Yes | Same constraints as above |
| `JWT_ACCESS_EXPIRES_IN` | No (defaults `15m`) | — |
| `JWT_REFRESH_EXPIRES_IN` | No (defaults `30d`) | — |
| `CORS_ORIGIN` | Yes in production | **Must be the real Vercel production origin. `*` is now rejected at boot in production** (this is RC1's B1 fix) |

- [ ] **Verify the real value of `CORS_ORIGIN` in the Render dashboard now**,
      before deploying — this was flagged as an unverified risk in the RC1
      report. If it's currently unset or `*`, this deploy will refuse to
      boot (by design) until it's corrected to the real Vercel origin.
- [ ] Verify `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` in the live Render
      dashboard are real generated values, not literal copies of
      `.env.example`'s placeholder text — same reasoning, now enforced at
      boot rather than just recommended.

### Vercel (frontend)

- [ ] **None currently consumed** — the frontend has no build-time or
      runtime environment variable dependency (see `app.config.js` note
      above). Don't add one without also adding the `app.config.js` plumbing
      to actually read it; setting a Vercel env var today would silently do
      nothing.

## 4. Deployment Order

Order matters here specifically because of the static-`apiUrl` limitation
above — the frontend build bakes in a backend URL, so the backend's public
URL and CORS configuration must be correct *before* the frontend is built.

1. **Confirm/update Render environment variables** (`CORS_ORIGIN` especially)
   for the target Vercel production origin. Do this before step 2 - if the
   backend isn't correctly configured yet, redeploying it next will simply
   surface that immediately (see Rollback, below), which is preferable to
   discovering it after the frontend is already live pointing at it.
2. **Deploy backend to Render.** Wait for the deploy to go healthy (Render's
   own health check against `/health`, plus the manual smoke test in
   Section 5 below).
3. **Confirm the backend is reachable and CORS is correct** — a real
   cross-origin request from the actual Vercel origin should succeed;
   confirm via the browser network tab or a manual `curl -H "Origin:
   https://<vercel-domain>"` against a real endpoint, checking for the
   `Access-Control-Allow-Origin` header.
4. **Confirm `app.json`'s `extra.apiUrl`** still points at the correct,
   now-verified backend URL. Update and commit first if it changed.
5. **Deploy frontend to Vercel**, building from the commit with the
   confirmed `app.json`.
6. **Run the full smoke test checklist (Section 5)** against the live
   frontend + backend pair, not just the backend in isolation.

Do not deploy frontend and backend simultaneously/out of order - the
frontend's `apiUrl` is fixed at its build time, so a frontend built before
a backend URL or CORS change will be silently stale until rebuilt.

## 5. Smoke Test Checklist

Run against the live production URLs after both deploys, not against a
local/dev stack.

- [ ] `GET https://mission365-api.onrender.com/health` returns `200` with
      `{"success":true,...}`
- [ ] Load the production Vercel URL — page renders, no blank screen, no
      console errors about failed API calls or CORS rejections
- [ ] **Register** a real (or clearly-marked test) account through the UI
- [ ] **Login** with that account
- [ ] **Create a goal** (manual flow, `/goals/new`) — confirm Importance and
      Deadline fields are present and submit succeeds
- [ ] **Create a habit** linked to that goal
- [ ] **Today screen** — confirm the Decision Engine's "Recommended First
      Mission" card appears and "Why this first?" expands with real reason
      text (regression check: Sprint 6/7's core feature)
- [ ] **Coach screen** — send "Plan My Day" and tap the "Generate Roadmap"
      quick action; confirm neither produces the generic fallback greeting,
      and confirm long replies wrap inside their chat bubble instead of
      overflowing (regression check: both Sprint 6 bubble-overflow and
      roadmap-fallback fixes)
- [ ] **Dark Mode** — toggle it on in Settings, reload the page/app; confirm
      it's still dark after reload (regression check: the boot-rehydration
      fix)
- [ ] **Force an error state** if feasible (e.g. toggle airplane mode
      briefly on a real device, or throttle network in devtools) on the
      Goals tab — confirm a retriable `ErrorState` appears rather than a
      false "no goals yet" empty state (regression check: the isError-
      masking fix and its CI guard)
- [ ] No unexpected 401s on any of the above — a wave of 401s immediately
      after deploy is the signature of a `JWT_ACCESS_SECRET`/
      `JWT_REFRESH_SECRET` value having changed under already-issued tokens

## 6. Rollback Procedure

**Render (backend):**
- [ ] Render's dashboard keeps deploy history — use "Rollback" / redeploy
      the last known-good commit from the Deploys tab. This is a redeploy
      of previous code, not a data change - no database rollback is implied
      or needed for this release (RC1 introduced no schema/migration
      changes).
- [ ] If the *new* deploy fails to boot because of the stricter B1
      validation (e.g. `CORS_ORIGIN` really was `*` in production and this
      is the first time that's been caught), the fix is to **correct the
      environment variable**, not to roll back the code — rolling back would
      silently restore the old, insecure default rather than fix the actual
      problem. Only roll back the code if the new code itself is broken,
      not if it's correctly refusing to run with bad config.

**Vercel (frontend):**
- [ ] Vercel keeps every deployment and supports instant promotion of a
      previous deployment back to production, with no rebuild required —
      use the Deployments list, select the last known-good deployment, and
      "Promote to Production."

**Order:** if both need rolling back, roll back frontend first (fast,
instant) to stop new traffic from hitting a possibly-broken flow, then
address the backend at whatever pace the investigation needs — the previous
frontend build's baked-in `apiUrl` still points at the same backend host, so
a frontend-only rollback doesn't strand it.

## 7. Success Criteria

RC1 is considered successfully deployed when, for at least 30 minutes
post-deploy:

- [ ] Render health check is green continuously (no restart loop)
- [ ] Every item in Section 5's smoke test checklist passes
- [ ] No sustained increase in 5xx responses in Render's logs versus the
      pre-deploy baseline
- [ ] No sustained increase in 401 responses on auth-protected endpoints
      versus baseline (would indicate a secret/token mismatch)
- [ ] No CORS-rejection errors appearing in the browser console for real
      user traffic
- [ ] Vercel build completed without errors and serves all routes (spot-check
      a few beyond `/` given the SPA rewrite rule)
- [ ] Cold start / Home / Coach load times are in the same order of
      magnitude as this session's local measurements (~2-3s first paint,
      ~300-400ms subsequent screen loads) — a large regression here would
      indicate a production-specific issue (CDN, cold Render instance, etc.)
      not caught by local testing

## 8. Known Limitations

Carried forward from the RC1 report, plus deployment-specific ones found
while writing this checklist:

- **`app.json`'s `apiUrl` is static, not environment-driven.** Any future
  backend URL change requires a code commit + Vercel rebuild, not just a
  dashboard environment variable change. This is a real deployment
  fragility, not fixed as part of RC1 (would require adding
  `app.config.js`, which is a code change outside this checklist's scope).
- **`CORS_ORIGIN`'s and the JWT secrets' actual current production values
  were not independently verified** by the engineering work behind RC1 -
  only the validation logic that will now enforce them correctly going
  forward. This checklist's Section 3 is where that gets closed out.
- **The query-error CI guard (`scripts/check-query-error-handling.js`) is a
  heuristic**, not a type-aware check - it cannot catch every possible
  variant of the masking bug, only the specific `isLoading`-without-
  `isError` shape it was written against.
- **No cookie-based session handling exists**, so no cookie security
  hardening (SameSite/Secure/HttpOnly) applies to this deployment - auth is
  fully stateless/header-based.
- **`app/today/index.tsx`'s secondary `useGoals('active')` call still has no
  `isError` handling** — classified as a Beta Improvement in the RC1 report,
  not a release blocker (missions still error-handle correctly; only the
  Decision Engine's goal-linked reasoning silently degrades).
- **No staging environment** — this deployment is going directly to the
  same production Render/Vercel targets already serving real traffic. There
  is no intermediate environment to catch a production-only failure mode
  before real users see it.
- **No automated E2E test suite** — this session's manual QA (register →
  goal → habit → Today → Coach) was run once, by hand, against a local
  stack. It is not repeated automatically on every future deploy.

## 9. Production Monitoring Checklist

**Immediately after deploy (first 30 minutes):**
- [ ] Watch Render's deploy log for a successful boot message
      (`Mission365 API listening on port ... [production]`) rather than an
      immediate crash — with B1's stricter validation, a bad production
      config now shows up here as an instant crash-loop instead of a
      silently-insecure running server, so this log is more informative
      than before and worth watching closely on this specific deploy
- [ ] Watch Render's request logs for a spike in `4xx`/`5xx` responses
- [ ] Watch for repeated `401` responses specifically (secret/token mismatch
      signature, see Section 5)
- [ ] Watch Vercel's build/deploy log for a clean completion
- [ ] Manually load the production frontend and check the browser console
      for CORS errors on the very first real page load

**Ongoing:**
- [ ] `/health` endpoint uptime/response time, if an external uptime monitor
      is configured against it
- [ ] Render's resource metrics (memory/CPU) for the backend instance,
      watching for any unexpected drift versus pre-deploy baseline
- [ ] MongoDB connection stability — whatever host `MONGODB_URI` actually
      points to in production should be checked directly (its own
      dashboard/monitoring), since this checklist's local verification used
      an in-memory substitute and can't speak to the real production
      database's health
- [ ] Auth endpoint latency (`/auth/register`, `/auth/login`) - bcrypt at 12
      salt rounds is deliberately slow (~400-500ms observed locally); a
      significant deviation from that baseline in either direction is worth
      investigating
- [ ] Rate-limit rejections (the global 300 req/15min limiter) - a spike
      would indicate either abuse or a legitimate traffic pattern the
      current limit doesn't account for (the RC1 report flagged auth-route-
      specific rate limiting as a Should-Fix-before-beta item, not yet built)

---

Do not consider RC1 launched until every checkbox above is either checked or
explicitly deferred with a named owner and reason - this document has no
implicit "good enough" state.
