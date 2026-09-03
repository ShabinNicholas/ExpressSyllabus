# Express.js Syllabus — Learn by Building

> The whole Express.js syllabus, taught as **one project you build from scratch**: a **Task Manager API** with CRUD, protected routes, password hashing, JWT auth, and PostgreSQL via TypeORM.

No isolated toy snippets. Every concept — routing, middleware, `req.body`, error handling, bcrypt, JWT — is introduced at the exact moment the project needs it.

## The climb

We start on the ground and add one layer at a time. **Each phase is a program that runs.**

| Phase | Steps | You end up with |
|---|---|---|
| **1 · In-memory API** | 1–5 | Full CRUD for `/api/tasks` in a plain array — routing, middleware, JSON, validation, one central error handler. No database, no login. |
| **2 · Add a database** | 6–8 | The same routes, now backed by **PostgreSQL** through **TypeORM**. Data survives restarts. |
| **3 · Add authentication** | 9–11 | Register, bcrypt‑hashed passwords, login for a **JWT**, and task routes **protected** per user. |
| **4 · Ship it** | 12 | End‑to‑end test, full concept recap, production checklist, deployment. |

## What you'll build

A REST API where a user registers, logs in to get a **JWT**, and then manages **their own** tasks. Passwords are **hashed with bcrypt**, task routes are **protected**, and all data lives in **PostgreSQL**, accessed through the **TypeORM** ORM.

| Method | Path | Protected |
|---|---|---|
| `GET` | `/health` | – |
| `POST` | `/api/auth/register` | – |
| `POST` | `/api/auth/login` | – |
| `GET` `POST` | `/api/tasks` | ✅ (from Step 11) |
| `GET` `PATCH` `DELETE` | `/api/tasks/:id` | ✅ (from Step 11) |

## The 12 build steps

| Step | Title | Concepts taught |
|---|---|---|
| 1 | [Project Setup](guide/01-project-setup.md) | What Express is · vs `http` · install · structure · nodemon |
| 2 | [Your First Server](guide/02-first-server.md) | `express()` · `app.listen()` · routing · `(req,res)` · `res.send/status` |
| 3 | [JSON & Middleware](guide/03-json-and-middleware.md) | middleware · `(req,res,next)` · `app.use()` · `express.json()` · `res.json()` · `morgan`/`cors` |
| 4 | [In-Memory Tasks CRUD](guide/04-tasks-crud-in-memory.md) | `express.Router()` · route/controller split · `req.params` · `req.query` · status codes · PATCH vs PUT |
| 5 | [Validation & Error Handling](guide/05-validation-and-errors.md) | `HttpError` · validation · 4‑arg error handler · 404 handler · central error handler |
| 6 | [Config & Environment Variables](guide/06-config-and-env.md) | `process.env` · `.env` · `dotenv` · config module · `.gitignore` |
| 7 | [Connecting to PostgreSQL](guide/07-postgresql-connection.md) | why a DB · what an ORM is · TypeORM entity · `DataSource` · `synchronize` · testing the connection |
| 8 | [Moving the CRUD to the Database](guide/08-tasks-crud-database.md) | the repository API · swapping storage without touching routes · `asyncHandler` · `23505` → 409 |
| 9 | [Password Hashing & Registration](guide/09-password-hashing-register.md) | hashing · why plain text is unsafe · bcrypt · salt rounds · `select:false` · nesting routers · register route |
| 10 | [Login & JWT](guide/10-login-and-jwt.md) | `bcrypt.compare` · JWT structure · signing · verifying · storing the token |
| 11 | [Protecting Routes](guide/11-protecting-routes.md) | relations / FK · custom middleware · `requireAuth` · `router.use()` · ownership checks · 401 vs 403 |
| 12 | [Review, Test & Deploy](guide/12-review-and-deploy.md) | end‑to‑end test · concept recap · production checklist · deployment |

Start at **[Step 1 →](guide/01-project-setup.md)**.

## Runnable code

Three snapshots you can `npm install && npm run dev` — one per phase plateau (end of Steps 5, 8, 12). See [Resources → Runnable examples](resources.md#runnable-examples). The full code for every step in between is in the step pages themselves.

## Prerequisites

- **Node.js 18+** (`node -v`)
- **PostgreSQL** — only needed from **Step 7** onward (`psql --version`)
- JavaScript basics: `const`/`let`, arrow functions, `async`/`await`, array methods
- A way to send HTTP requests: `curl` (used throughout), or [Postman](https://www.postman.com/) / [Insomnia](https://insomnia.rest/)

## How to use this site

- **Sidebar** — the 12 steps in order, grouped into 4 phases.
- **Search** — jump to a method (`res.json`) or topic (`salt rounds`).
- **Copy button** on every code block.
- **[Course Outline](outline.md)** — the narrative walk-through of all 12 steps.
- **[All Topics & Sub-topics](topics.md)** — the full granular checklist of every topic taught.
- **[Syllabus coverage](checklist.md)** — the original checklist, each item linked to the step that covers it.

> The detailed **PostgreSQL** checklist (migrations, JOINs, transactions, indexes) is a separate track — see the end of [Step 12](guide/12-review-and-deploy.md).
