# All Topics & Sub-topics

A complete, granular list of everything covered on this site — every topic and its
sub-topics, in the order they're taught. Use it as a checklist.

- For the shorter narrative version, see the **[Course Outline](outline.md)**.
- For the original 9-section syllabus mapped to steps, see **[Syllabus Coverage](checklist.md)**.

---

# Phase 1 · In-memory API

## Step 1 — [Project Setup](guide/01-project-setup.md)

- **How the course works**
  - [ ] The 4 phases, each phase a runnable program
  - [ ] The 3 runnable snapshots (end of Steps 5, 8, 12)
- **What we're building**
  - [ ] The finished endpoint list (public vs protected)
  - [ ] When each endpoint is built / becomes protected
- **What is Express.js**
  - [ ] Node's built-in `http` module and its boilerplate
  - [ ] Express vs raw `http` (routing, middleware, helpers)
  - [ ] What Express does *not* do for you
- **Prerequisites**
  - [ ] Node.js 18+, npm
  - [ ] PostgreSQL (only from Step 7)
  - [ ] JavaScript basics assumed
  - [ ] An HTTP client: `curl` / Postman / Insomnia
- **Creating the project**
  - [ ] `mkdir` + `npm init -y`
  - [ ] `package.json` — what it records
- **Installing the first dependencies**
  - [ ] `npm install express`
  - [ ] `npm install --save-dev nodemon` (why dev-only)
  - [ ] Every other package installed in the step that uses it
- **Folder structure**
  - [ ] Start with just `src/server.js` + `src/app.js`
  - [ ] Why split `app.js` (build) from `server.js` (listen) — testability
  - [ ] Folders added later, per step
- **npm scripts**
  - [ ] `start` → `node src/server.js`
  - [ ] `dev` → `nodemon src/server.js`
- **`.gitignore`**
  - [ ] `node_modules/`, `.env`, `.env.*`, `!.env.example`, `*.log`

## Step 2 — [Your First Server](guide/02-first-server.md)

- **Create the Express app — `src/app.js`**
  - [ ] `require('express')`
  - [ ] `express()` returns the application object (`app`)
  - [ ] `module.exports = app`
- **Start the server — `src/server.js`**
  - [ ] `app.listen(port, callback)`
  - [ ] The callback runs once when ready
  - [ ] Choosing a port: `process.env.PORT || 3000`
- **Run it**
  - [ ] `npm run dev`
  - [ ] Expected startup log
- **Test that it works**
  - [ ] In a browser
  - [ ] With `curl`
  - [ ] `curl -i` — status line + headers
- **nodemon — automatic restarts**
  - [ ] Watches files, restarts on save
  - [ ] Force a restart with `rs` + Enter
  - [ ] `npm start` vs `npm run dev`
- **Understanding routing**
  - [ ] A route = HTTP method + path + handler
  - [ ] `app.get / post / put / patch / delete`
  - [ ] What each HTTP method means in a REST API
- **The `(req, res)` handler**
  - [ ] `req`: `params`, `query`, `body`, `headers`, `method`, `path`
  - [ ] `res`: `send`, `json`, `status`, `set`
  - [ ] The third parameter `next` (preview)
  - [ ] Exactly one response per request (`ERR_HTTP_HEADERS_SENT`)
- **`res.send()` vs `res.status()`**
  - [ ] `res.send()` guesses `Content-Type`
  - [ ] `res.status(code)` is chainable; default is `200`
  - [ ] `res.status(204).end()`
- **Add a health check**
  - [ ] `GET /health` → `{ status: 'ok' }`
  - [ ] Why hosting platforms ping it

## Step 3 — [JSON & Middleware](guide/03-json-and-middleware.md)

- **What is middleware**
  - [ ] A function that runs on a request before/instead of the handler
  - [ ] The request flows through a stack, in registration order
  - [ ] A middleware can: run code, mutate `req`/`res`, end the request, or call `next()`
  - [ ] Forgetting both → the request hangs forever
- **The `(req, res, next)` signature**
  - [ ] `next()` continues the chain
  - [ ] `next(err)` jumps to the error handler
  - [ ] A route handler is just the last middleware
- **`app.use()`**
  - [ ] `app.use(fn)` — every request
  - [ ] `app.use('/path', fn)` — path-prefixed
  - [ ] `app.use('/path', router)` — mount a router
  - [ ] Registration order = execution order
- **Turn on JSON parsing — `express.json()`**
  - [ ] `req.body` is `undefined` by default
  - [ ] What `express.json()` does (checks `Content-Type`, reads stream, `JSON.parse`, sets `req.body`)
  - [ ] Register once, before the routes
  - [ ] Missing `Content-Type` → body not parsed (`{}`)
- **Sending JSON — `res.json()`**
  - [ ] Objects, arrays, with a status code
  - [ ] Serializes, sets `Content-Type`, sends
  - [ ] Why `res.json()` over `res.send()`
- **The Content-Type header**
  - [ ] Client → server requirement
  - [ ] Server → client (set automatically)
  - [ ] `req.get('Content-Type')`
  - [ ] A correct browser `fetch`
- **Middleware order matters**
  - [ ] Parser before routes ✅ / after ❌
  - [ ] The general order for our app (logging → cors → json → routes → 404 → error handler)
- **Request logging with `morgan`**
  - [ ] `npm install morgan`
  - [ ] `'dev'` vs `'combined'` formats
- **`cors`**
  - [ ] Why browsers block cross-origin requests
  - [ ] `cors()` (allow all) vs locked-down options
  - [ ] When you don't need it
- **Custom middleware (preview)**
  - [ ] Example: attach a request id
  - [ ] `requireAuth` preview (Step 11)
- **Built-in vs third-party vs custom** (table)
- **`express.static()`** (aside — not used in a pure JSON API)

## Step 4 — [In-Memory Tasks CRUD](guide/04-tasks-crud-in-memory.md)

- **The store — `src/store.js`**
  - [ ] `const tasks = []`
  - [ ] `nextId()` counter
  - [ ] Data is wiped on restart (fixed in Step 8)
- **`express.Router()` — why**
  - [ ] A Router is a mini-app with its own `.get/.post/.use`
  - [ ] Route file ("which URL → which function") vs controller file ("what it does")
- **The controller — `src/controllers/tasks.controller.js`**
  - [ ] `findTask(id)` helper
  - [ ] `list` — `GET /api/tasks`, `?done=true|false` filter
  - [ ] `getOne` — `GET /api/tasks/:id`, 404
  - [ ] `create` — `POST /api/tasks`, inline title validation, 201
  - [ ] `update` — `PATCH /api/tasks/:id`, apply only sent fields
  - [ ] `remove` — `DELETE /api/tasks/:id`, 204
  - [ ] `req.params.id` is a string → `Number(...)`
  - [ ] `req.query.done` is a string → compare to `'true'`
  - [ ] `req.body` available thanks to `express.json()`
- **The route file — `src/routes/tasks.routes.js`**
  - [ ] `express.Router()`, five routes
  - [ ] Paths are relative to the mount point
- **Mount it — `src/app.js`**
  - [ ] `app.use('/api/tasks', require('./routes/tasks.routes'))`
  - [ ] Request flow trace
- **Test every endpoint** (curl for each)
  - [ ] Restart → list is empty (in-memory proof)
- **PATCH vs PUT**
  - [ ] PATCH = partial; PUT = full replace
  - [ ] Why PATCH fits task editing
- **Status code summary** (table per operation)

## Step 5 — [Validation & Error Handling](guide/05-validation-and-errors.md)

- **The idea: throw, don't hand-write every response**
  - [ ] Problem: response formatting spread across every function
  - [ ] Plan: `HttpError` → `throw` → one handler
  - [ ] Express 4 auto-catches *synchronous* throws (async wrapper comes in Step 8)
- **An error class — `src/errors/HttpError.js`**
  - [ ] `class HttpError extends Error` with a `status`
- **Validation — one reusable function**
  - [ ] `validateTaskInput(body, { partial })`
  - [ ] `title` required on create, optional-but-valid on PATCH
  - [ ] `description` must be a string
  - [ ] `is_done` must be a boolean (maps to `isDone`)
  - [ ] Returns exactly the fields to apply
  - [ ] Schema-library note (zod / joi / express-validator)
- **The updated controller**
  - [ ] Handlers shrink to `throw` + happy path
  - [ ] `Object.assign(task, data)` for PATCH
  - [ ] "No updatable fields provided" → 400
- **404 for unknown routes**
  - [ ] A path-less `app.use()` after all routes
- **The central error handler — `src/middleware/errorHandler.js`**
  - [ ] Recognised by its **four** parameters `(err, req, res, next)`
  - [ ] `err.type === 'entity.parse.failed'` → 400 (malformed JSON)
  - [ ] `err.status || 500`
  - [ ] Log real 500s server-side
  - [ ] Stack trace only outside production
- **Wire it into `src/app.js`**
  - [ ] 404 handler then `app.use(errorHandler)` **last**
- **Test the failure paths** (missing title, malformed JSON, unknown route, unknown task)
- **End of the in-memory phase** → `examples/01-in-memory-crud/`

---

# Phase 2 · Add a database

## Step 6 — [Config & Environment Variables](guide/06-config-and-env.md)

- **Why environment variables**
  - [ ] Same code, different machines → different values
  - [ ] Never commit secrets
- **`process.env`**
  - [ ] Values are always strings (or `undefined`)
  - [ ] Setting inline (macOS/Linux vs PowerShell) and why it's tedious
- **The `.env` file**
  - [ ] `NODE_ENV`, `PORT` for now
  - [ ] Format rules (`KEY=value`, no spaces, `#` comments, one per line)
- **`dotenv` — load the file**
  - [ ] `npm install dotenv`
  - [ ] Must load before anything reads `process.env`
  - [ ] Node's built-in `--env-file` alternative
- **`config.js` — one place for all config**
  - [ ] `require('dotenv').config()` at the top
  - [ ] `required(key)` helper (used from Step 7)
  - [ ] `env`, `isProd`, `port` (typed)
  - [ ] Fail fast · types & defaults in one place · nothing else touches `process.env`
- **Use `config` in `server.js`**
- **Make `morgan` environment-aware in `app.js`**
  - [ ] `morgan(config.isProd ? 'combined' : 'dev')`
  - [ ] Optionally route the error handler's prod check through `config.isProd`
- **`.env.example` — commit this one**
  - [ ] Template with blank/dummy values; grows each step
  - [ ] `cp .env.example .env`
- **`.gitignore` — confirm `.env` is ignored**
  - [ ] `git status --ignored`
  - [ ] Recovering a committed `.env` (`git rm --cached`, rotate secrets)
- **dev vs production config**
  - [ ] `config.isProd` one-liners
  - [ ] Multiple `.env.<NODE_ENV>` files (optional)

## Step 7 — [Connecting to PostgreSQL with TypeORM](guide/07-postgresql-connection.md)

- **Why a database instead of an in-memory array**
  - [ ] The restart problem you already hit
  - [ ] Persistence, shared source of truth, querying, transactions, backups (table)
- **Why an ORM (and why TypeORM)**
  - [ ] Objects & methods vs SQL strings
  - [ ] Describe a table once; automatic parameterization; connection pool; `synchronize` in dev
  - [ ] `EntitySchema` API (plain JS, no decorators)
- **Install**
  - [ ] `typeorm`, `pg`, `reflect-metadata` — what each is
- **Create the database**
  - [ ] `psql -U postgres` → `CREATE DATABASE task_manager`
- **Add `DATABASE_URL` to config**
  - [ ] Add to `.env` **and** `.env.example`
  - [ ] Connection-string anatomy
  - [ ] `databaseUrl: required('DATABASE_URL')` → first *required* variable
  - [ ] Demonstrate fail-fast by removing it
- **Describe the table — `src/entities/Task.js`**
  - [ ] `id` (`primary`, `generated`)
  - [ ] `title`, `description` (default `''`)
  - [ ] `isDone` → `is_done` (default `false`)
  - [ ] `createdAt` / `updatedAt` (`createDate` / `updateDate`)
  - [ ] camelCase property ↔ snake_case column via `name`
  - [ ] No `user` relation yet (Step 11)
- **Open the connection — `src/data-source.js`**
  - [ ] `require('reflect-metadata')`
  - [ ] `new DataSource({ type, url, entities, synchronize, logging, ssl })`
  - [ ] `synchronize: !config.isProd` — dev only, never prod (migrations instead)
- **Initialize before the server starts — `src/server.js`**
  - [ ] `await AppDataSource.initialize()`
  - [ ] Fail fast → `process.exit(1)`
  - [ ] `app.listen` inside the async `start()`
  - [ ] Graceful shutdown on `SIGINT` (`AppDataSource.destroy()`)
  - [ ] First run: `CREATE TABLE` in the logs; verify with `\dt`
- **Wire the database into `/health`**
  - [ ] `await AppDataSource.query('SELECT 1')` → `{ status: 'ok', db: 'up' }`
  - [ ] `503` on failure
- **The repository — a preview**
  - [ ] `getRepository(Task)` → `find`, `findOneBy`, `save`, `remove`

## Step 8 — [Moving the CRUD to the Database](guide/08-tasks-crud-database.md)

- **The repository**
  - [ ] `const taskRepo = () => AppDataSource.getRepository(Task)`
  - [ ] `find` / `findOne` / `create` / `save` / `remove` and the SQL each runs (table)
  - [ ] Automatic parameterization — no query strings
- **Async controllers need a catch — `asyncHandler`**
  - [ ] Express 4 doesn't catch rejected promises in `async` handlers
  - [ ] `src/middleware/asyncHandler.js` — `Promise.resolve(fn(...)).catch(next)`
  - [ ] Express 5 / `express-async-errors` alternatives
- **The route file — wrap each handler in `asyncHandler`**
- **The controller — same structure, repository instead of the array**
  - [ ] `validateTaskInput` copied across unchanged
  - [ ] `list` — build a `where`, `find({ where, order })`
  - [ ] `getOne` / `update` / `remove` — `findOne({ where: { id } })`
  - [ ] `create` — `repo.create(data)` then `repo.save(task)`
  - [ ] `update` — mutate loaded entity, `save`
  - [ ] What changed from Step 5 (comparison table)
  - [ ] Delete `src/store.js`
- **Add the duplicate-key branch to the error handler**
  - [ ] `err.code === '23505'` → `409` (matters for user emails in Step 9)
- **Test every endpoint** — same curl calls as Step 4
  - [ ] Stop/start → data persists; verify in `psql`
- **End of Phase 2** → `examples/02-database-crud/`

---

# Phase 3 · Add authentication

## Step 9 — [Password Hashing & Registration](guide/09-password-hashing-register.md)

- **What is password hashing**
  - [ ] One-way function; you compare hashes, never un-hash
  - [ ] Register vs login flow
  - [ ] Hashing ≠ encryption
- **Why plain-text passwords are unsafe**
  - [ ] DB leak = every account gone
  - [ ] Password reuse
  - [ ] Staff / backups / logs
  - [ ] Never store, log, email, or return a plain password
- **Why bcrypt (not `crypto` / SHA-256)**
  - [ ] Must be slow/expensive
  - [ ] Must be salted
  - [ ] `bcrypt` (native) vs `bcryptjs` (pure JS, drop-in)
- **Salt rounds / cost factor**
  - [ ] Rounds → iterations → time (table)
  - [ ] 10–12 normal range
  - [ ] `BCRYPT_SALT_ROUNDS` in `.env` + `.env.example` + `config.js`
  - [ ] bcrypt stores the salt *inside* the hash string
- **The `User` entity — `src/entities/User.js`**
  - [ ] `id`, `email` (`unique`), `passwordHash` → `password_hash` (`select: false`), `createdAt`
  - [ ] Register it with the DataSource (`entities: [User, Task]`, export `User`)
  - [ ] `synchronize` creates the `users` table
  - [ ] `select: false` — hash never returned by a normal `find`
- **The auth controller — `src/controllers/auth.controller.js`**
  - [ ] `register`: validate email (`EMAIL_RE`) + password length
  - [ ] Normalize email to lowercase
  - [ ] Duplicate pre-check → `409` (+ DB `UNIQUE` as backstop, `23505`)
  - [ ] `bcrypt.hash(password, config.bcryptSaltRounds)`
  - [ ] `create` + `save`
  - [ ] Respond with an explicit `{ id, email, createdAt }` — never spread `user`
- **Routers — combine `auth` and `tasks`**
  - [ ] `src/routes/auth.routes.js` — `POST /register`
  - [ ] `src/routes/index.js` — `router.use('/auth', ...)` + `router.use('/tasks', ...)`
  - [ ] Nesting routers
- **Mount it — `src/app.js`**
  - [ ] `app.use('/api', require('./routes'))`
  - [ ] Full path = `/api` + `/auth` + `/register`
- **Test it** — 201, duplicate 409, weak password 400
  - [ ] Inspect the bcrypt hash in `psql`

## Step 10 — [Login & JWT](guide/10-login-and-jwt.md)

- **Comparing a hashed password on login**
  - [ ] `bcrypt.compare(submitted, storedHash)` → boolean
  - [ ] Reads salt+cost from the hash; constant-time
  - [ ] Never hash the input and `===` it
- **JWT basics**
  - [ ] `header.payload.signature`
  - [ ] header = algorithm (`HS256`)
  - [ ] payload = claims (`sub`, `iat`, `exp`) — Base64, **not encrypted**
  - [ ] signature = `HMAC-SHA256(header+payload, JWT_SECRET)`
  - [ ] Stateless auth — no server-side sessions
  - [ ] `npm install jsonwebtoken`
- **Config**
  - [ ] `JWT_SECRET`, `JWT_EXPIRES_IN` in `.env` + `.env.example`
  - [ ] `jwt: { secret: required('JWT_SECRET'), expiresIn }` in `config.js`
  - [ ] Generating a secret (`openssl rand -hex 32`)
- **Signing a token**
  - [ ] `jwt.sign(payload, secret, { expiresIn })`
  - [ ] Small, non-sensitive payload
  - [ ] Always set `expiresIn`
- **Verifying a token**
  - [ ] `jwt.verify(token, secret)` → payload, or throws
  - [ ] `TokenExpiredError` vs `JsonWebTokenError`
- **A token helper — `src/auth/token.js`**
  - [ ] `signToken(user)` / `verifyToken(token)`
- **The login controller**
  - [ ] Validate `email` / `password` present
  - [ ] `findOne({ where: { email }, select: ['id','email','passwordHash'] })` — explicit select
  - [ ] One generic `401` for unknown email OR wrong password (no enumeration)
  - [ ] Return only `{ token }`
- **The login route** — add `POST /login`
- **Test it** — token, wrong password 401, unknown email 401
  - [ ] Decode a token at jwt.io (readable, not forgeable)
- **Storing the token (client side)**
  - [ ] `localStorage` + `Authorization: Bearer` (simple, XSS-exposed)
  - [ ] `httpOnly` cookie (XSS-safe, needs CSRF protection)

## Step 11 — [Protecting Routes](guide/11-protecting-routes.md)

- **Give `Task` an owner — the `user` relation**
  - [ ] `many-to-one` to `User`, `joinColumn: { name: 'user_id' }`, `nullable: false`, `onDelete: 'CASCADE'`
  - [ ] Optional inverse side on `User` (`one-to-many`)
  - [ ] Can't add a `NOT NULL` column to a table with rows → drop & recreate `tasks` in dev (migration in prod)
- **Custom middleware — `src/middleware/requireAuth.js`**
  - [ ] Read `Authorization`, split `Bearer <token>`
  - [ ] Reject missing/malformed → `next(new HttpError(401, ...))`
  - [ ] `verifyToken` → attach `req.user = { id: payload.sub, email }`
  - [ ] Catch verify failure → `401`
  - [ ] Pipeline diagram (allow vs deny)
- **Apply it to the task routes**
  - [ ] `router.use(requireAuth)` protects the whole router
  - [ ] `/api/auth/*` and `/health` stay public
  - [ ] Protecting a single route instead (`router.post('/', requireAuth, ...)`)
- **Scope every query to `req.user.id`**
  - [ ] `where: { user: { id: req.user.id } }` in `list` / `getOne` / `update` / `remove`
  - [ ] `create({ ...data, user: { id: req.user.id } })`
  - [ ] Why the ownership check lives in the **query**, not a separate `if` (guessing ids → 404)
- **401 vs 403**
  - [ ] 401 = "who are you?" (not authenticated)
  - [ ] 403 = "I know you, and no" (authenticated, not allowed)
  - [ ] `requireAdmin` example
- **Test the protection** — no token 401, valid token works, garbage token 401, second user sees `[]`
- **Final project structure** (full tree)
- **Feature-complete** → `examples/03-full-auth/`

---

# Phase 4 · Ship it

## Step 12 — [Review, Test & Deploy](guide/12-review-and-deploy.md)

- **Full end-to-end test**
  - [ ] Reset the DB (`TRUNCATE ... RESTART IDENTITY CASCADE`)
  - [ ] health → register → login (capture token) → create → list → update → filter → delete
  - [ ] Failure paths: 401 (no token), 404, 400
- **Every syllabus concept → where we built it** (mapping table)
- **Production checklist**
  - [ ] `NODE_ENV=production`
  - [ ] Real random `JWT_SECRET`
  - [ ] `DATABASE_URL` with SSL
  - [ ] `.env` not in the repo; secrets in the host dashboard
  - [ ] `BCRYPT_SALT_ROUNDS` ≥ 12
  - [ ] `helmet` for security headers
  - [ ] Rate-limit `/api/auth/login`
  - [ ] HTTPS in front
  - [ ] `npm start` (not nodemon)
  - [ ] `synchronize` off — use a migration
- **helmet + rate limit (quick add)**
  - [ ] `npm install helmet express-rate-limit`
  - [ ] `app.use(helmet())`, `rateLimit({ windowMs, max })` on the login route
- **Deploying the API**
  - [ ] Push to GitHub
  - [ ] Managed Postgres (Neon / Supabase / host)
  - [ ] Set env vars on the host (not `PORT`)
  - [ ] Start command `npm start`
  - [ ] Create prod tables: migration, or first-deploy `synchronize`
  - [ ] Verify `/health`
- **Where to go next**
  - [ ] PostgreSQL / TypeORM deep-dive (migrations, relations, query builder, transactions, indexes, seeding)
  - [ ] Refresh tokens
  - [ ] Automated tests (`jest` + `supertest` against `app`)
  - [ ] Pagination on `GET /api/tasks`
  - [ ] OpenAPI / Swagger

---

# Reference pages

## [Resources & Cheat Sheets](resources.md)

- [ ] Official docs (Express, TypeORM, PostgreSQL, MDN HTTP, jwt.io)
- [ ] Packages used in the project (table with step)
- [ ] Runnable examples (the 3 snapshots)
- [ ] HTTP status codes cheat sheet (2xx / 4xx / 5xx)
- [ ] `curl` cheat sheet (every endpoint)
- [ ] PostgreSQL cheat sheet (`psql`, reset data, drop tables)
- [ ] TypeORM cheat sheet (repository methods, `select` a hidden column, migrations)
- [ ] Generate a JWT secret
- [ ] Deploying this Docsify site to GitHub Pages
