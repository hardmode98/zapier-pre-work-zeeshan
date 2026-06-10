# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # watch mode: nodemon (SIGTERM restarts) + tsx, port 3000
npm test             # full Vitest suite
npx vitest run tests/deployments.api.test.ts        # one test file
npx vitest run -t "filters by status"               # tests matching a name
npm run typecheck    # tsc --noEmit (tsconfig excludes tests/)
npm run build && npm start                          # compile to dist/ and run
```

The first-ever test or dev run downloads the in-memory MongoDB binary, which can be
slow — test timeouts are already raised for this in `vitest.config.ts`. There is no
linter configured.

## Architecture

A TypeScript + Express + Mongoose service exposing `GET/POST /deployments`,
`GET /deployments/:id`, and `GET /health`. `docs/design.md` is the canonical design
doc (API contract, data model, decisions + tradeoffs) — keep it in sync when
changing behavior.

**The database is always in-memory** (`mongodb-memory-server`) — there is no
connection string, no Docker, and data is ephemeral, re-seeded from
`src/seed/deployments.seed.ts` on every start. `src/db/mongoose.ts` is the only
file that knows this; everything else imports Mongoose models, which use the single
global connection (hence no dependency injection anywhere).

### Request flow

`server.ts` (entrypoint, process safety nets, graceful shutdown) → `app.ts`
(middleware order is load-bearing: morgan → JSON parser → feature routers → custom
404 → global error handler last) → per-module layers:

```
routes → controller (zod parse, response envelope only)
       → service    (business logic, plain functions over the model)
       → model      (Mongoose schema = source of truth for the stored shape)
```

Adding a module = one `app.use()` line in `app.ts`; modules wire their own
dependencies.

### Error handling — everything funnels to one place

Controllers are wrapped in `asyncHandler` (Express 4 does not catch async
rejections). The global error handler (`src/middleware/error-handler.ts`) maps:
`AppError` subclasses → their own status/code; `ZodError` and Mongoose
`ValidationError` → `400 VALIDATION_ERROR`; anything else → generic `500` (logged
in full server-side; stack included in the response only outside production).
Throw `NotFoundError` / `ValidationError` from `src/errors/app-error.ts` rather
than handling errors in routes.

Every response — success or error — uses the envelope from `src/http/response.ts`
via `ok()` / `fail()`. Never shape response objects by hand.

### Validation is deliberately two-layer

Zod schemas (`deployments.schema.ts`) enforce the HTTP contract and are stricter
than Mongoose (no type coercion, ISO-8601 timestamps, trimmed non-empty strings);
the Mongoose schema guards the DB for any code path. The status enum lives in
`deployment.types.ts` precisely so both layers can import it — don't collapse these
files into each other. Note: Mongoose `CastError` is *not* mapped by the error
handler (it would surface as a 500); Zod's type guarantees are what keep that path
unreachable, so don't bypass the zod parse.

### Deliberate decisions (don't "fix" these)

- A malformed ObjectId returns **404, not 400** — ids are opaque to clients
  (`getDeploymentById` checks validity to avoid the CastError→500 path).
- The schema sets `versionKey: false`; API documents carry `_id` but no `__v`.
- Graceful shutdown has no immediate force-exit, only a 10s failsafe timeout.
- Only two env vars exist (`PORT`, `NODE_ENV`), read inline with defaults — no
  config module. No env setup is required to run anything.


### Plans → Principal Engineer Review (ask first)
After creating an implementation plan, **ask the user** whether to have it reviewed by the `principal-reviewer` agent (use AskUserQuestion). If they say yes, spawn the agent to review the plan for edge cases, failure modes, security gaps, and scalability issues, and address any critical findings before coding. If they say no, proceed without the review. Do not run the review unprompted.

### Lessons log (`lessons.md`)
`lessons.md` at the repo root is the project's running lessons log, and a SessionStart hook injects it into context automatically. When the user says "note this down" / "note that" / "add to lessons", append a dated entry there (format is documented at the top of the file) — don't put the content anywhere else. Honor the lessons it contains when working.

## Bug Fixes & Errors

When fixing a bug or resolving an error, **always explain**:
1. **What the error was** — the actual symptom and TypeScript/runtime message
2. **Why it happened** — the root cause, not just "it was broken"
3. **What you fixed** — the specific change and why this approach works
4. **What the tradeoff is** — if the fix isn't the "textbook" approach, explain what was tried first and why the pragmatic fix was chosen instead

Never silently fix an error and move on. Every bug is a teaching moment.

### Tests

Tests use the real stack — no mocks. `tests/setup.ts` boots an in-memory MongoDB
per test file and re-seeds the fixture before *every* test, so tests can mutate
data freely. API tests drive `createApp()` through supertest without binding a
port. `NODE_ENV=test` (set in `vitest.config.ts`) silences request logging.
