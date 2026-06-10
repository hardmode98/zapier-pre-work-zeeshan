# Design

One page covering how the service is put together, the API contract, and the
notable decisions (and their tradeoffs).

## Project layout

```
src/
├── server.ts          # entrypoint: load env, connect DB, seed, listen, safety nets
├── app.ts             # Express app: middleware, mounts routers, 404, error handler
├── db/                # MongoDB (Mongoose) connection setup
├── http/              # response envelope interfaces + ok()/fail() builders
├── errors/            # AppError + ValidationError / NotFoundError
├── middleware/        # asyncHandler, global error handler, custom 404
├── modules/
│   └── deployments/   # model, domain constants, zod schemas, service, controller, routes
└── seed/              # mock deployment events + idempotent seeder
tests/                 # Vitest unit + supertest API tests (in-memory MongoDB)
docs/                  # design.md — architecture, API, decisions
```

### Routing & wiring

Each module exposes a ready-to-mount router, so `app.ts` adds one line per module
and its signature never grows:

```ts
app.use('/deployments', deploymentsRouter);
// app.use('/incidents', incidentsRouter);   // adding a module = one line
```

Service functions reach the Mongoose model directly (the model wraps the single
shared connection), so there is no wiring or dependency injection to thread through.
Once there are several modules, the natural next step is a small route collator —
intentionally deferred here.

## Layers

A request flows through separated layers, each with one job:

```
HTTP request
   │
   ▼
[ route ]          deployments.routes.ts — paths → handlers
   ▼
[ controller ]     deployments.controller.ts — req/res only: validate input (zod), shape the envelope
   ▼
[ service ]        deployments.service.ts — business logic; plain functions over the model
   ▼
[ model ]          deployment.model.ts — Mongoose schema (document shape + DB-level validation)
                   ↕
              MongoDB (in-memory via mongodb-memory-server)
```

The service is unit-tested against an in-memory MongoDB, and the model is the single
source of truth for the stored shape.

## Persistence (in-memory MongoDB, no setup)

The service talks to MongoDB through Mongoose. To keep it runnable on a clean
checkout, it starts an **ephemeral in-memory MongoDB** (`mongodb-memory-server`) at
startup — no Mongo install, no Docker, no connection string. `src/db/mongoose.ts`
owns this: `connectToDatabase()` boots the in-memory server and connects Mongoose;
`disconnectFromDatabase()` tears both down on shutdown. It is the only place that
knows the database is in-memory — everything else just imports the model.

Because Mongoose keeps one global connection, services need no dependency injection:
they import `DeploymentModel` and call it. Data is ephemeral and re-seeded on each
start — `seedIfEmpty()` inserts the mock events when the collection is empty.

## Validation (two layers)

Input is validated twice, on purpose:

- **Request boundary (zod)** — `deployments.schema.ts` validates query params and the
  `POST` body, rejecting malformed input with a `400` before it reaches the DB.
- **DB layer (Mongoose)** — the schema enforces required fields, the status enum, and
  a non-negative duration on write.

Both a `ZodError` and a Mongoose `ValidationError` are mapped by the global error
handler to the same `400 VALIDATION_ERROR` envelope (with field-level `details`).

## Request lifecycle & error handling

Middleware order in [app.ts](../src/app.ts): morgan → JSON body parser → feature
routes → custom 404 → global error handler (always last).

- Async controllers are wrapped in `asyncHandler` so a rejected promise (or a thrown
  `ZodError` / `AppError`) is forwarded to the error handler.
- `AppError`s (`ValidationError` 400, `NotFoundError` 404) carry their own status and
  code; `ZodError` and Mongoose `ValidationError` map to `400 VALIDATION_ERROR`.
- Any other thrown value → unexpected `500`: logged in full server-side, returned
  with a generic message (plus a stack trace outside production).
- Unmatched routes hit `notFound`, producing the same JSON envelope as every other
  error — never Express's default HTML page.

Process-level: [server.ts](../src/server.ts) installs `unhandledRejection` /
`uncaughtException` handlers and graceful shutdown on `SIGINT` / `SIGTERM` (drain the
HTTP server, then disconnect Mongo and stop the in-memory server). There is
intentionally no immediate "poison pill" force-shutdown for now — only a last-resort
failsafe timeout.

## Configuration

There are only two settings, read directly from `process.env` (with defaults) where
they are used — no config module. `dotenv` is loaded once in
[server.ts](../src/server.ts) so a local `.env` can set them (see
[.env.example](../.env.example)). There is **no database connection string** —
MongoDB is always in-memory.

| Variable   | Default       | Purpose                                              |
| ---------- | ------------- | --------------------------------------------------- |
| `NODE_ENV` | `development` | Toggles prod behavior (hides error stacks); `test` silences request logging |
| `PORT`     | `3000`        | HTTP port                                           |

Override inline too: `PORT=4000 npm run dev`. The test run sets `NODE_ENV=test` via
[vitest.config.ts](../vitest.config.ts).

## Data model

| Field        | Type     | Notes                                            |
| ------------ | -------- | ------------------------------------------------ |
| `_id`        | ObjectId | Identifier, assigned by MongoDB                  |
| `service`    | string   | Service name (`billing-api`)                     |
| `status`     | enum     | `success` \| `failed` \| `in_progress` \| `rolled_back` \| `pending` |
| `duration`   | number   | Seconds (≥ 0)                                    |
| `timestamp`  | Date     | ISO-8601 on the wire                             |
| `commit_sha` | string   | Short commit hash                               |

Responses follow Mongoose's default JSON shape, so each document includes its `_id`
(the version key `__v` is disabled). The seed set
([seed/deployments.seed.ts](../src/seed/deployments.seed.ts))
spans five services, all statuses, and several weeks.

## API

Base URL (local): `http://localhost:3000`. Every response uses one envelope.

**Success** — `{ success: true, message, data, meta? }`. `meta` appears only on
list endpoints: `{ count, filters: { service, status } }`.

**Error** — `{ success: false, message, error: { code, details?, stack? } }`.
`stack` is included only outside production. Codes: `VALIDATION_ERROR` (400),
`NOT_FOUND` (404), `INTERNAL_ERROR` (500).

### `GET /deployments`

List deployments, optionally filtered.

| Query param | Notes                                                  |
| ----------- | ------------------------------------------------------ |
| `service`   | Exact match. Empty/whitespace → `400`.                |
| `status`    | Must be a valid status, else `400`.                   |

Unknown params are ignored; filters combine with AND. → `200` with
`data: Deployment[]`, `meta: { count, filters }`.

### `POST /deployments`

Ingest a new deployment. JSON body: `service`, `status`, `duration`, `timestamp`
(ISO-8601), `commit_sha` — validated by zod, then by Mongoose on write. → `201` with
the created document (including its new `_id`), or `400` (`VALIDATION_ERROR`).

### `GET /deployments/:id`

→ `200` with `data: Deployment`, or `404` (`NOT_FOUND`) if the id is unknown or
malformed.

### `GET /health`

→ `200` with `data: { status: "ok", db, uptime }` (`db` is `"up"` / `"down"`).
