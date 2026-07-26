# Deployment Guide — Mission365 RC1

Backend deploys to **Render**, frontend (web) deploys to **Vercel**. This
document is the operational summary; the fully-annotated version (with the
reasoning behind each check) is
[`docs/releases/RC1-deployment-checklist.md`](docs/releases/RC1-deployment-checklist.md)
— read that one before an actual deploy, use this one as the quick-reference
checklist.

**Before any of this applies:** `sprint-6-decision-engine` (the branch this
release package documents) is not committed or merged into `main`. Render
and Vercel both auto-deploy from `main`. Step 0 of every deploy is
committing and merging this branch — nothing below is reachable until then.

## Render deployment checklist (backend API)

Project already exists (`mission365-api.onrender.com`); no `render.yaml` is
committed, so these live in the Render dashboard — verify, don't recreate.

- [ ] Root directory: `backend`
- [ ] Build command: `npm ci && npm run build` (compiles `src/` → `dist/`)
- [ ] Start command: `npm start` (`node dist/server.js`)
- [ ] Node version: **22** (matches `.github/workflows/ci.yml`)
- [ ] Health check path: `/health` → `200`, `{"success":true,...}`, no auth
- [ ] Auto-deploy branch: `main`
- [ ] No Dockerfile — this relies on Render's native Node buildpack; if the
      dashboard shows a Docker-based service, that's drift to resolve first

## Vercel deployment checklist (frontend web)

Project already linked (`.vercel/project.json`,
`projectId: prj_lBL188I2D6XXoGavYKPn84bNftVN`). `vercel.json` (committed):

```json
{
  "buildCommand": "npx expo export -p web",
  "outputDirectory": "dist",
  "framework": null,
  "cleanUrls": true,
  "rewrites": [{ "source": "/:path*", "destination": "/" }]
}
```

- [ ] No `app.config.js`/`app.config.ts` exists — `app.json`'s
      `expo.extra.apiUrl` is a **static value baked into the build**, not
      something Vercel's dashboard env vars can override.
- [ ] **Before triggering the build:** confirm `app.json` →
      `expo.extra.apiUrl` is the real production backend URL
      (`https://mission365-api.onrender.com/api/v1` as of this release —
      re-verify). If Render's URL ever changes, this file must be updated
      and committed first.
- [ ] Confirm the `/:path*` → `/` rewrite is present — without it, direct
      navigation to any non-root route (e.g. a shared link to `/goals/new`)
      404s.
- [ ] Confirm the build's Node version is 22.

## Environment variables

### Render (backend) — validated at boot by `backend/src/config/env.ts`

| Variable | Required | Production constraint |
|---|---|---|
| `NODE_ENV` | Yes, set to `production` | Enables every check below |
| `PORT` | No | Render injects automatically |
| `MONGODB_URI` | Yes | Must start with `mongodb://` or `mongodb+srv://` |
| `JWT_ACCESS_SECRET` | Yes | ≥16 chars; must differ from `JWT_REFRESH_SECRET`; rejected outright if it contains `replace-with`, `change-me`, `your-secret`, or `example` |
| `JWT_REFRESH_SECRET` | Yes | Same constraints |
| `JWT_ACCESS_EXPIRES_IN` | No (default `15m`) | — |
| `JWT_REFRESH_EXPIRES_IN` | No (default `30d`) | — |
| `CORS_ORIGIN` | Yes in production | Must be the real Vercel origin — **`*` is rejected at boot in production** |

All of the above is enforced by code on this branch (`backend/src/config/env.ts`,
covered by `backend/src/config/env.test.ts`) — a misconfigured production
environment now fails to boot rather than running insecurely.

- [ ] Verify the live Render dashboard's `CORS_ORIGIN` is the real Vercel
      origin, not unset/`*`, before deploying — this deploy will refuse to
      boot otherwise (by design).
- [ ] Verify `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` in the live dashboard
      are real generated values, not `.env.example`'s placeholder text.

### Vercel (frontend)

- [ ] **None currently consumed.** No build-time or runtime env var
      dependency exists (see the static-`apiUrl` note above). Don't add one
      without also adding `app.config.js` to read it — a Vercel env var set
      today does nothing.

## Deployment order

The static `apiUrl` makes order non-negotiable: the frontend build bakes in
a backend URL, so the backend must be correct and reachable *before* the
frontend is built.

1. Commit and merge `sprint-6-decision-engine` into `main`.
2. Confirm/update Render's environment variables (`CORS_ORIGIN` especially)
   for the target Vercel production origin.
3. Deploy backend to Render; wait for it to go healthy (Render's own
   `/health` check, plus the smoke test below).
4. Confirm the backend is reachable and CORS is correct from the real
   Vercel origin (browser network tab, or `curl -H "Origin:
   https://<vercel-domain>"` against a real endpoint, checking for
   `Access-Control-Allow-Origin`).
5. Confirm `app.json`'s `expo.extra.apiUrl` still points at the verified
   backend URL. Update and commit first if it changed.
6. Deploy frontend to Vercel, building from the commit with the confirmed
   `app.json`.
7. Run the full smoke test below against the live frontend + backend pair.

Do not deploy frontend and backend out of order or simultaneously — a
frontend built before a backend URL/CORS change is silently stale until
rebuilt.

## Production smoke test

Run against live production URLs, not a local stack.

- [ ] `GET https://mission365-api.onrender.com/health` → `200`,
      `{"success":true,...}`
- [ ] Load the production Vercel URL — renders, no blank screen, no console
      errors about failed API calls or CORS
- [ ] **Register** a test account through the UI
- [ ] **Login** with that account
- [ ] **Create a Dream**, then **convert it to a Goal** (or create a Goal
      directly) — confirm Importance and Deadline fields are present
- [ ] **Create a Habit** linked to that Goal
- [ ] Reach **Today** via Home's Quick Actions (one tap — this release's
      fix) — confirm the "Recommended First Mission" card appears and "Why
      this first?" expands with real reason text
- [ ] **Complete a mission**, then **mark a different one "Not Today"**
      (with Undo) — confirm the achievement toast, if one fires, does not
      cover the Today header/progress row (this release's fix)
- [ ] **Coach screen** — confirm the suggested-prompt chips render as
      compact pills, not stretched ovals (this release's fix); send "Plan
      My Day" and tap "Generate Roadmap"; confirm neither produces the
      generic fallback greeting and replies wrap inside their bubble
- [ ] **Dreams** — reach it via Home's Quick Actions, confirm the back
      button is present (this release's fix)
- [ ] Create a Goal with no deadline — confirm it shows a neutral "Just
      getting started," not a red "behind" badge (this release's fix)
- [ ] **Dark Mode** — toggle on in Settings, reload; confirm it's still dark
- [ ] **Logout, then login again** — confirm re-auth works cleanly
- [ ] Force an error state if feasible (airplane mode briefly, or throttle
      network in devtools) on the Goals tab — confirm a retriable
      `ErrorState` appears, not a false "no goals yet" empty state
- [ ] No unexpected `401`s anywhere above — a wave of them right after
      deploy signals a JWT secret change under already-issued tokens

## Rollback steps

**This release introduced no database schema or migration changes** — every
field added across all sprints is additive. Rollback is a pure code
revert, no data migration involved.

**Vercel (frontend):** Deployments list → select the last known-good
deployment → "Promote to Production." Instant, no rebuild.

**Render (backend):** Deploys tab → "Rollback" / redeploy the last
known-good commit.

- If the *new* deploy fails to boot because of the stricter production
  validation (e.g. `CORS_ORIGIN` really was `*`) — **fix the environment
  variable, don't roll back the code.** Rolling back would silently restore
  the old, insecure default instead of fixing the actual problem. Only roll
  back code if the new code itself is broken.

**Order:** roll back frontend first (fast, instant) to stop new traffic
hitting a possibly-broken flow, then address the backend at whatever pace
the investigation needs — the previous frontend build's baked-in `apiUrl`
still points at the same backend host, so a frontend-only rollback doesn't
strand it.

## Post-deploy monitoring (first 30 minutes)

- [ ] Render deploy log shows a successful boot message (`Mission365 API
      listening on port ... [production]`), not a crash-loop
- [ ] Render request logs — no spike in `4xx`/`5xx`
- [ ] No repeated `401`s (secret/token mismatch signature)
- [ ] Vercel build/deploy log completes cleanly
- [ ] Browser console on first real page load — no CORS errors

Success criteria and ongoing monitoring (resource metrics, MongoDB
connection stability, auth endpoint latency baseline, rate-limit
rejections) are detailed in
[`docs/releases/RC1-deployment-checklist.md`](docs/releases/RC1-deployment-checklist.md#7-success-criteria).

## Known deployment limitations

- `app.json`'s `apiUrl` is static, not environment-driven — any backend URL
  change requires a code commit + Vercel rebuild.
- `CORS_ORIGIN` and the JWT secrets' actual live Render values were not
  independently re-verified as part of writing this document — only the
  validation logic that now enforces them is confirmed. Verify the live
  dashboard values before deploying.
- No staging environment — Render/Vercel production are the only deployed
  targets; nothing catches a production-only failure mode before real users
  see it.
- No automated E2E suite runs on every deploy — see
  [TESTING.md](TESTING.md) for what does and doesn't have coverage.
